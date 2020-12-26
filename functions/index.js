const functions = require('firebase-functions');
const admin = require('firebase-admin');
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
      // get admin list in database
      const admins = await (await admin.database().ref('/admins/').get()).val();
      // add new uid to list
      admins.push(user.uid);
      // set admin user claim
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      // update admins array in database
      await admin.database().ref('/admins/').set(admins);
      // return success message
      return { error: false, message: `Successfully gave ${user.email} admin privileges.` };
    } else {
      // return insufficient permission message
      return { error: true, message: 'Error: You must be an admin to make other users admins.' }
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
      if (user.email === 'calexk@live.com') {
        return { error: true, message: `Cannot remove admin permissions from ${user.email}`};
      }
      // get admin list in database
      const admins = await (await admin.database().ref('/admins/').get()).val();
      // add new uid to list
      admins.splice(admins.indexOf(user.uid), 1);
      // set admin user claim
      await admin.auth().setCustomUserClaims(user.uid, { admin: false });
      // update admins array in database
      await admin.database().ref('/admins/').set(admins);
      // return success message
      return { error: false, message: `Successfully removed admin privileges from ${user.email}.` };
    } else {
      // return insufficient permission message
      return { error: true, message: 'Error: You must be an admin to remove other admins.' }
    }
  } catch (error) {
    return error;
  }
});