const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

function verifyContext(context, requiredClaims) {
  // Check function being called from App Check verified client.
  // context.app will be undefined if the request doesn't include a valid App Check token.s
  if (context.app === undefined) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Functions must be called from an App Check verified app."
    );
  }

  // Check all claims passed to requiredClaims
  if (requiredClaims)
    requiredClaims.forEach((claim) => {
      if (!context.auth.token[claim]) {
        throw new functions.https.HttpsError(
          "permission-denied",
          `You do not have the required ${claim} permission to run this function.`
        );
      }
    });
}

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  verifyContext(context, ["admin"]);

  // get user & custom claims if they exist
  const user = await admin.auth().getUser(data.id);
  const claims = user.customClaims ? user.customClaims : {};

  // if user is financial manager, prevent removing admin
  if (claims.finances && !data.toggle) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Cannot remove admin permissions from the financial manager."
    );
  }

  // set admin custom claim to passed value & add/remove user from admin list
  claims.admin = data.toggle;
  const admins = (await admin.database().ref("/admins/").get()).val() || [];
  if (data.toggle) admins.push(user.uid);
  else admins.splice(admins.indexOf(user.uid), 1);

  // push changes
  await admin.auth().setCustomUserClaims(user.uid, claims);
  await admin.database().ref("/admins/").set(admins);

  // update user's refresh token to random string to push updated claims to client
  admin
    .database()
    .ref(`/users/${user.uid}/refreshToken`)
    .set(Math.random().toString(16).substr(2, 8));

  // return success message
  return {
    message: data.toggle
      ? `Successfully gave ${user.email} admin privileges.`
      : `Successfully removed admin privileges from ${user.email}.`,
  };
});

exports.setAppointmentRole = functions.https.onCall(async (data, context) => {
  verifyContext(context, ["admin"]);

  // get user & custom claims if they exist
  const user = await admin.auth().getUser(data.id);
  const claims = user.customClaims ? user.customClaims : {};

  // set appointments custom claim to passed value & add/remove user from appt user list
  claims.appointments = data.toggle;
  const appointmentUsers =
    (await (await admin.database().ref("/appointmentUsers/").get()).val()) ||
    [];
  if (data.toggle) appointmentUsers.push(user.uid);
  else appointmentUsers.splice(appointmentUsers.indexOf(user.uid), 1);

  // push updates
  await admin.auth().setCustomUserClaims(user.uid, claims);
  await admin.database().ref("/appointmentUsers/").set(appointmentUsers);

  // update user's refresh token to random string to push updated claims to client
  admin
    .database()
    .ref(`/users/${user.uid}/refreshToken`)
    .set(Math.random().toString(16).substr(2, 8));

  // return success message
  return {
    message: data.toggle
      ? `Successfully gave ${user.email} appointment privileges.`
      : `Successfully removed appointment privileges from ${user.email}.`,
  };
});

exports.setFinanceRole = functions.https.onCall(async (data, context) => {
  verifyContext(context, ["finances"]);

  // get user & check they are an admin
  const user = await admin.auth().getUser(data.uid);
  const claims = user.customClaims ? user.customClaims : {};
  if (!claims.admin) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `${user.email} must be an administrator to make them financial manager.`
    );
  }

  // Get caller custom claims
  const caller = await admin.auth().getUser(context.auth.uid);

  // Update user & caller finances permissions
  claims.finances = true;
  caller.customClaims.finances = false;

  // remove current company venmo account
  await admin.database().ref("/companyVenmo").remove();

  // push updated user & caller claims
  await admin.auth().setCustomUserClaims(user.uid, claims);
  await admin.auth().setCustomUserClaims(caller.uid, caller.customClaims);

  // update both refresh tokens to random string to push updated claims to client
  admin
    .database()
    .ref(`/users/${user.uid}/refreshToken`)
    .set(Math.random().toString(16).substr(2, 8));
  admin
    .database()
    .ref(`/users/${caller.uid}/refreshToken`)
    .set(Math.random().toString(16).substr(2, 8));

  // return success message
  return {
    message: `Successfully switched financial manager to ${user.email}.`,
  };
});

exports.completeAppointment = functions.https.onCall(async (data, context) => {
  verifyContext(context);

  // Get appointment
  const apptRef = admin.database().ref(`/appointments/${data.apptKey}`);
  const appt = (await apptRef.get()).val();

  // If user not assigned to appt, return error
  if (!appt.staffAssigned.includes(context.auth.uid)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "You must be assigned to an appointment to complete it."
    );
  }

  // If appt already complete, return error
  if (appt.complete) {
    throw new functions.https.HttpsError(
      "already-exists",
      "Appointment has already been completed."
    );
  }

  // Update appointment properties
  const newNumStaff = appt.staffAssigned.length;
  const numHours = data.hours;
  const reportNotes = data.reportNotes;

  const amount =
    appt.rate.type === "hourly"
      ? appt.rate.amount * newNumStaff * data.hours
      : appt.rate.amount;

  const customerName = (
    await admin.database().ref(`/customers/${appt.customer}/name`).get()
  ).val();

  // Write customer finance transaction they owe
  const custFinanceRef = admin
    .database()
    .ref(`/finances/customers/${appt.customer}`);
  custFinanceRef.child("transactions").push({
    date: data.date,
    amount,
    appointment: data.apptKey,
    description: `Owed from appointment with rate $${appt.rate.amount.toFixed(
      2
    )} ${appt.rate.type}.`,
    complete: false,
    method: "Owed",
  });

  // Compute staff rate using numStaff and the admin percentage
  const adminPercentage = (
    await admin.database().ref("/finances/adminPercentage").get()
  ).val();
  const staffAmount =
    appt.rate.type === "hourly"
      ? appt.rate.amount * data.hours * (1 - adminPercentage)
      : (appt.rate.amount / newNumStaff) * (1 - adminPercentage);

  // For each staff, move appt from incomplete to complete and write amount they are owed in finances
  appt.staffAssigned.forEach(async (staffId) => {
    const assignedApptRef = admin
      .database()
      .ref(`/assignedAppointments/${staffId}`);
    const assignedAppts = (await assignedApptRef.get()).val();

    assignedAppts.incomplete.splice(
      assignedAppts.incomplete.indexOf(data.apptKey),
      1
    );
    if (assignedAppts.complete) {
      assignedAppts.complete.push(data.apptKey);
    } else {
      assignedAppts.complete = [data.apptKey];
    }
    assignedApptRef.set(assignedAppts);

    const staffFinanceRef = admin.database().ref(`/finances/staff/${staffId}`);
    staffFinanceRef.child("transactions").push({
      date: data.date,
      amount: staffAmount,
      appointment: data.apptKey,
      description: `Owed from appointment for ${customerName} with pay $${(
        appt.rate.amount *
        (1 - adminPercentage)
      ).toFixed(2)} ${appt.rate.type}.`,
      complete: false,
      method: "Owed",
    });
  });

  // If appt is listed as available, remove it from available list
  const availableApptsRef = admin.database().ref("/availableAppointments");
  let availableAppts = (await availableApptsRef.get()).val();
  if (availableAppts && availableAppts.includes(data.apptKey)) {
    availableAppts.splice(availableAppts.indexOf(data.apptKey), 1);
    await availableApptsRef.set(availableAppts);
  }

  // Change appt status to complete
  await apptRef.update({
    numStaff: newNumStaff,
    numHours,
    reportNotes,
    complete: true,
  });

  // Create new appt if repeat flag is set
  if (appt.repeat) {
    const custFreq = (
      await admin.database().ref(`/customers/${appt.customer}/frequency`).get()
    ).val();
    if (custFreq) {
      // Update appt date using customer frequency & clear assigned staff
      const apptDate = new Date(appt.date);
      apptDate.setDate(apptDate.getDate() + Number(custFreq));
      const newDateString = apptDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      appt.date = newDateString;
      appt.originalDate = newDateString;
      appt.staffAssigned = null;
      const apptsRef = admin.database().ref("/appointments");
      const newApptKey = (await apptsRef.push()).key;
      // Push the new appt
      apptsRef.child(newApptKey).set({ ...appt });

      // Add the new appt to the list of available appts
      if (availableAppts) {
        availableAppts.push(newApptKey);
      } else {
        availableAppts = [newApptKey];
      }
      await availableApptsRef.set(availableAppts);
    }
  }

  return { message: `Appointment ${data.apptKey} successfully completed.` };
});

exports.sendEmail = functions.https.onCall(async (data, context) => {
  verifyContext(context, ["admin"]);

  // Get company email information from database
  const { username, password } = (
    await admin.database().ref("/adminEmail/").get()
  ).val();

  const mailOptions = {
    from: username,
    to: data.email,
    subject: data.subject,
    text: data.text, // plain text body
    html: data.html, // html body
  };

  try {
    // Set up nodemailer transporter using company email account
    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: username,
        pass: password,
      },
    });

    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new functions.https.HttpsError("unknown", error.message);
  }

  return {
    message: `Successfully sent email to ${data.email} with subject ${data.subject}`,
  };
});
