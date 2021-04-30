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
      const admins = await (await admin.database().ref("/admins/").get()).val();
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
      const admins = await (await admin.database().ref("/admins/").get()).val();
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
        const appointmentUsers = await (
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
    // Get user
    const caller = await admin.auth().getUser(context.auth.uid);
    // Get appointment
    const apptRef = admin.database.ref(`/appointments/${data.apptKey}`);
    const appt = await (await apptRef.get()).val();
    // If user not assigned to appt, return error
    if (!appt.staffAssigned.includes(context.auth.uid)) {
      return {
        error: true,
        message: "Error: You are not assigned to this appointment.",
      };
    }
    // If appt not todays date, return error
    if (new Date(appt.date) !== new Date().setHours(0, 0, 0, 0)) {
      return {
        error: true,
        message: "Error: This appointment is not scheduled for today.",
      };
    }

    // Change appt status to complete
    await apptRef.set({ ...appt, completed: true });

    // For each staff, move appt from incomplete to complete
    appt.staffAssigned.array.forEach(staffId => {
      const assignedApptRef = admin.database.ref(`/assignedAppointments/${staffId}`);
      const assignedAppts = await (await assignedApptRef.get()).val();
      assignedAppts.incomplete.splice(assignedAppts.incomplete.indexOf(data.apptKey), 1);
      if (assignedAppts.complete) {
        assignedAppts.complete.push(data.apptKey)
      } else {
        assignedAppts.complete = [data.apptKey];
      }
      await assignedApptRef.set(assignedAppts);
    });

    // Write customer finances they owe
    const custfinanceRef = admin.database.ref(`/finances/${appt.customer}`);

  } catch (error) {
    return error;
  }
});
