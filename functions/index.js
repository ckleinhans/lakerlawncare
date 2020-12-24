const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.addAdminRole = functions.https.onCall((data, context) => {
  // get user
  return admin.auth().getUserByEmail(data.email).then(user => {
    // set admin user claim
    return admin.auth().setCustomUserClaims(user.uid, {admin: true});
  }).then(() => {
    return {message: `Successfully gave ${data.email} admin privileges.`};
  }).catch(error => {
    return error;
  });
});