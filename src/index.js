import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "firebase/functions";
import { FIREBASE_CONFIG } from "./FirebaseConfig";

import { Provider } from "react-redux";
import { createStore, combineReducers } from "redux";
import {
  ReactReduxFirebaseProvider,
  firebaseReducer,
} from "react-redux-firebase";

import { composeWithDevTools } from "redux-devtools-extension";

firebase.initializeApp(FIREBASE_CONFIG);
//firebase.functions().useEmulator("localhost", 5001); // Comment out before deploy
//firebase.database().useEmulator("localhost", 9000); // Comment out before deploy

const rootReducer = combineReducers({
  firebase: firebaseReducer,
  // firestore: firestoreReducer // <- needed if using firestore
});

// Create store with reducers and initial state
const store = createStore(rootReducer, composeWithDevTools());

// react-redux-firebase config
const rrfConfig = {
  userProfile: "users",
  enableClaims: true,
};

const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch,
  // createFirestoreInstance // <- needed if using firestore
};

ReactDOM.render(
  <Provider store={store}>
    <ReactReduxFirebaseProvider {...rrfProps}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ReactReduxFirebaseProvider>
  </Provider>,
  document.getElementById("root")
);
