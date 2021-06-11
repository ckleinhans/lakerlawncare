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
      // get user & custom claims if they exist
      const user = await admin.auth().getUser(data.uid);
      const claims = user.customClaims ? user.customClaims : {};

      // set admin custom claim to true & add user to admin list
      claims.admin = true;
      const admins = (await admin.database().ref("/admins/").get()).val();
      admins.push(user.uid);
      await admin.auth().setCustomUserClaims(user.uid, claims);
      await admin.database().ref("/admins/").set(admins);

      // update user's refresh token to random string to push updated claims to client
      admin
        .database()
        .ref(`/users/${user.uid}/refreshToken`)
        .set(Math.random().toString(16).substr(2, 8));

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
      // get user & custom claims if they exist
      const user = await admin.auth().getUser(data.uid);
      const claims = user.customClaims ? user.customClaims : {};
      // if user is financial manager, prevent removing admin
      if (user.customClaims && user.customClaims.finances) {
        return {
          error: true,
          message:
            "Cannot remove admin permissions from the financial manager.",
        };
      }

      // remove admin custom claim & remove from admin list
      claims.admin = false;
      const admins = (await admin.database().ref("/admins/").get()).val();
      admins.splice(admins.indexOf(user.uid), 1);
      await admin.auth().setCustomUserClaims(user.uid, claims);
      await admin.database().ref("/admins/").set(admins);

      // update user's refresh token to random string to push updated claims to client
      admin
        .database()
        .ref(`/users/${user.uid}/refreshToken`)
        .set(Math.random().toString(16).substr(2, 8));

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
      // get user & custom claims if they exist
      const user = await admin.auth().getUser(data.uid);
      const claims = user.customClaims ? user.customClaims : {};

      // set admin custom claim to true & add uid to appt user list
      claims.appointments = true;
      const appointmentUsers = await (
        await admin.database().ref("/appointmentUsers/").get()
      ).val();
      appointmentUsers.push(user.uid);
      await admin.auth().setCustomUserClaims(user.uid, claims);
      await admin.database().ref("/appointmentUsers/").set(appointmentUsers);

      // update user's refresh token to random string to push updated claims to client
      admin
        .database()
        .ref(`/users/${user.uid}/refreshToken`)
        .set(Math.random().toString(16).substr(2, 8));

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

        // get user & custom claims (if they exist)
        const user = await admin.auth().getUser(data.uid);
        const claims = user.customClaims ? user.customClaims : {};

        // remove appt custom claim to true & remove from appt users list
        claims.appointments = false;
        appointmentUsers.splice(appointmentUsers.indexOf(user.uid), 1);
        await admin.auth().setCustomUserClaims(user.uid, claims);
        await admin.database().ref("/appointmentUsers/").set(appointmentUsers);

        // update user's refresh token to random string to push updated claims to client
        admin
          .database()
          .ref(`/users/${user.uid}/refreshToken`)
          .set(Math.random().toString(16).substr(2, 8));

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

// TODO remove company venmo integration when finance person changed
exports.setFinanceRole = functions.https.onCall(async (data, context) => {
  try {
    // check calling user is current finance manager
    const caller = await admin.auth().getUser(context.auth.uid);
    if (caller.customClaims && caller.customClaims.finances) {
      // get user & check they are an admin
      const user = await admin.auth().getUser(data.uid);
      const claims = user.customClaims ? user.customClaims : {};
      if (!claims.admin) {
        return {
          error: true,
          message: `To make ${user.email} the new financial manager, they must be an administrator.`,
        };
      }

      // Update user & caller finances permissions
      claims.finances = true;
      caller.customClaims.finances = false;

      // push updated user & caller claims
      await admin.auth().setCustomUserClaims(user.uid, claims);
      await admin.auth().setCustomUserClaims(caller.uid, caller.customClaims);

      // update new manager's refresh token to random string to push updated claims to client
      admin
        .database()
        .ref(`/users/${user.uid}/refreshToken`)
        .set(Math.random().toString(16).substr(2, 8));

      // return success message
      return {
        error: false,
        message: `Successfully switched financial manager to ${user.email}.`,
      };
    } else {
      // return insufficient permission message
      return {
        error: true,
        message:
          "Error: You must be the current financial manager to switch who is the financial manager.",
      };
    }
  } catch (error) {
    return error;
  }
});

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

    // Had date check before, but dates weren't lining up correctly for some reason
    // Date is now checked on PageDash before function call

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

    // Write customer finance transaction they owe
    const custFinanceRef = admin
      .database()
      .ref(`/finances/customers/${appt.customer}`);
    custFinanceRef.child("transactions").push({
      date: data.date,
      amount,
      appointment: data.apptKey,
      description: `Owed from appointment for with rate $${appt.rate.amount.toFixed(
        2
      )} ${appt.rate.type}.`,
      complete: false,
    });

    // Update total customer owes
    const customerOwed = (await custFinanceRef.child("owed").get()).val();
    await custFinanceRef
      .child("owed")
      .set(customerOwed ? customerOwed + amount : amount);

    // Compute staff rate using numStaff and the admin percentage
    const adminPercentage = (
      await admin.database().ref("/finances/adminPercentage").get()
    ).val();
    const staffAmount =
      appt.rate.type === "hourly"
        ? appt.rate.amount * data.hours * (1 - adminPercentage)
        : (appt.rate.amount / newNumStaff) * (1 - adminPercentage);
    const customerName = (
      await admin.database().ref(`/customers/${appt.customer}/name`).get()
    ).val();

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
      staffFinanceRef.child("transactions").push({
        date: data.date,
        amount: staffAmount,
        appointment: data.apptKey,
        description: `Owed from appointment for ${customerName} with pay $${(
          appt.rate.amount *
          (1 - adminPercentage)
        ).toFixed(2)} ${appt.rate.type}.`,
        complete: false,
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
        await admin
          .database()
          .ref(`/customers/${appt.customer}/frequency`)
          .get()
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

    return { error: false };
  } catch (error) {
    return {
      error: true,
      message: error.toString(),
    };
  }
});
