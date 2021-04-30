const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.addAdminRole = functions.https.onCall(async (data, context) => {
  try {
    // check calling user is admin
    const caller = await admin.auth().getUser(context.auth.uid);
    if (caller.customClaims && caller.customClaims.admin === true) {
      // get user
      const user = await admin.auth().getUser(data.uid);
      // get user's custom claims or create empty object if none
      const claims = user.customClaims ? user.customClaims : {};
      // set admin custom claim to true
      claims.admin = true;
      // get admin list in database
      const admins = (await admin.database().ref("/admins/").get()).val();
      // add new uid to list
      admins.push(user.uid);
      // push updated user claims
      await admin.auth().setCustomUserClaims(user.uid, claims);
      // update admins array in database
      await admin.database().ref("/admins/").set(admins);
      // return success message
      return {
        error: false,
        message: `Successfully gave ${user.email} admin privileges.`,
      };
    } else {
      // return insufficient permission message
      return {
        error: true,
        message: "Error: You must be an admin to make other users admins.",
      };
    }
  } catch (error) {
    return error;
  }
});

exports.removeAdminRole = functions.https.onCall(async (data, context) => {
  try {
    // check calling user is admin
    const caller = await admin.auth().getUser(context.auth.uid);
    if (caller.customClaims && caller.customClaims.admin === true) {
      // get user
      const user = await admin.auth().getUser(data.uid);
      // if user is Caelan, prevent removing admin
      if (user.email === "calexk@live.com") {
        return {
          error: true,
          message: `Cannot remove admin permissions from ${user.email}`,
        };
      }
      // get user's custom claims or create empty object if none
      const claims = user.customClaims ? user.customClaims : {};
      // set admin custom claim to true
      claims.admin = false;
      // get admin list in database
      const admins = (await admin.database().ref("/admins/").get()).val();
      // add new uid to list
      admins.splice(admins.indexOf(user.uid), 1);
      // set admin user claim
      await admin.auth().setCustomUserClaims(user.uid, claims);
      // update admins array in database
      await admin.database().ref("/admins/").set(admins);
      // return success message
      return {
        error: false,
        message: `Successfully removed admin privileges from ${user.email}.`,
      };
    } else {
      // return insufficient permission message
      return {
        error: true,
        message: "Error: You must be an admin to remove other admins.",
      };
    }
  } catch (error) {
    return error;
  }
});

exports.addAppointmentsRole = functions.https.onCall(async (data, context) => {
  try {
    // check calling user is admin
    const caller = await admin.auth().getUser(context.auth.uid);
    if (caller.customClaims && caller.customClaims.admin === true) {
      // get user
      const user = await admin.auth().getUser(data.uid);
      // get user's custom claims or create empty object if none
      const claims = user.customClaims ? user.customClaims : {};
      // set admin custom claim to true
      claims.appointments = true;
      // get admin list in database
      const appointmentUsers = await (
        await admin.database().ref("/appointmentUsers/").get()
      ).val();
      // add new uid to list
      appointmentUsers.push(user.uid);
      // push updated user claims
      await admin.auth().setCustomUserClaims(user.uid, claims);
      // update admins array in database
      await admin.database().ref("/appointmentUsers/").set(appointmentUsers);
      // return success message
      return {
        error: false,
        message: `Successfully gave ${user.email} appointment privileges.`,
      };
    } else {
      // return insufficient permission message
      return {
        error: true,
        message:
          "Error: You must be an admin to give other users appointment privileges.",
      };
    }
  } catch (error) {
    return error;
  }
});

exports.removeAppointmentsRole = functions.https.onCall(
  async (data, context) => {
    try {
      // check calling user is admin
      const caller = await admin.auth().getUser(context.auth.uid);
      if (caller.customClaims && caller.customClaims.admin === true) {
        // get admin list in database, if last user, prevent removal
        const appointmentUsers = (
          await admin.database().ref("/appointmentUsers/").get()
        ).val();
        if (appointmentUsers.length <= 1) {
          return {
            error: true,
            message:
              "Error: Cannot remove last user with appointment privileges.",
          };
        }
        // get user
        const user = await admin.auth().getUser(data.uid);
        // get user's custom claims or create empty object if none
        const claims = user.customClaims ? user.customClaims : {};
        // set admin custom claim to true
        claims.appointments = false;
        // add new uid to list
        appointmentUsers.splice(appointmentUsers.indexOf(user.uid), 1);
        // set admin user claim
        await admin.auth().setCustomUserClaims(user.uid, claims);
        // update admins array in database
        await admin.database().ref("/appointmentUsers/").set(appointmentUsers);
        // return success message
        return {
          error: false,
          message: `Successfully removed appointment privileges from ${user.email}.`,
        };
      } else {
        // return insufficient permission message
        return {
          error: true,
          message:
            "Error: You must be an admin to remove appointment privileges.",
        };
      }
    } catch (error) {
      return error;
    }
  }
);

exports.completeAppointment = functions.https.onCall(async (data, context) => {
  try {
    // Get appointment
    const apptRef = admin.database().ref(`/appointments/${data.apptKey}`);
    const appt = (await apptRef.get()).val();

    // Update numStaff to current num assigned staff & add reportNotes
    const newNumStaff = appt.staffAssigned.length;
    const numHours = data.hours;
    const reportNotes = data.reportNotes;

    // If user not assigned to appt, return error
    if (!appt.staffAssigned.includes(context.auth.uid)) {
      return {
        error: true,
        message: "Error: You are not assigned to this appointment.",
      };
    }
    // If appt not todays date, return error
    if (
      appt.date !==
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    ) {
      return {
        error: true,
        message: "Error: This appointment is not scheduled for today.",
      };
    }
    // If appt already complete, return error
    if (appt.complete) {
      return {
        error: true,
        message: "Error: This appointment has already been completed.",
      };
    }

    const amount =
      appt.rate.type === "hourly"
        ? appt.rate.amount * newNumStaff * data.hours
        : appt.rate.amount;

    const date = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    // Write customer finance transaction they owe
    const custFinanceRef = admin
      .database()
      .ref(`/finances/customers/${appt.customer}`);
    custFinanceRef.push({
      date,
      amount,
      appointment: data.apptKey,
      description: `Owed from appointment with rate $${appt.rate.amount} ${appt.rate.type}.`,
      complete: false,
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
    await appt.staffAssigned.forEach(async (staffId) => {
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
      await assignedApptRef.set(assignedAppts);

      const staffFinanceRef = admin
        .database()
        .ref(`/finances/staff/${staffId}`);
      staffFinanceRef.push({
        date,
        amount: staffAmount,
        appointment: data.apptKey,
        description: `Owed from appointment with rate $${appt.rate.amount} ${appt.rate.type}.`,
        complete: false,
      });
    });

    // If appt is listed as available, remove it from available list
    const availableApptsRef = admin.database().ref("/availableAppointments");
    const availableAppts = (await availableApptsRef.get()).val();
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
        await admin
          .database()
          .ref(`/customers/${appt.customer}/frequency`)
          .get()
      ).val();
      if (custFreq) {
        // Update appt date using customer frequency & clear assigned staff
        const apptDate = new Date(appt.date);
        apptDate.setDate(apptDate.getDate() + Number(custFreq));
        appt.date = apptDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        appt.staffAssigned = null;
        const apptsRef = admin.database().ref("/appointments");
        const newApptKey = (await apptsRef.push()).key;
        // Push the new appt
        apptsRef.child(newApptKey).set({ ...appt });

        // Add the new appt to the list of available appts
        availableAppts.push(newApptKey);
        await availableApptsRef.set(availableAppts);
      }
    }

    return { error: false };
  } catch (error) {
    return {
      error: true,
      message: error.toString(),
    };
  }
});
