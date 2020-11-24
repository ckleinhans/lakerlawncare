import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import firebase from "firebase/app";

import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import {
  ReactReduxFirebaseProvider,
  firebaseReducer
} from 'react-redux-firebase';

import { composeWithDevTools } from 'redux-devtools-extension';

const firebaseConfig = {
  apiKey: "AIzaSyCIJc2GQ4w78fWnNgfS2qXygNa4J2yrOMw",
  authDomain: "lakerlawncare-portal.firebaseapp.com",
  databaseURL: "https://lakerlawncare-portal.firebaseio.com",
  projectId: "lakerlawncare-portal",
  storageBucket: "lakerlawncare-portal.appspot.com",
  messagingSenderId: "871507676040",
  appId: "1:871507676040:web:912e51d8308abb513b883d",
  measurementId: "G-3VWM5B25NE"
};

firebase.initializeApp(firebaseConfig);

const rootReducer = combineReducers({
  firebase: firebaseReducer
  // firestore: firestoreReducer // <- needed if using firestore
})

// Create store with reducers and initial state
const store = createStore(rootReducer, composeWithDevTools())

// react-redux-firebase config
const rrfConfig = {
  userProfile: 'users'
  // useFirestoreForProfile: true // Firestore for Profile instead of Realtime DB
  // enableClaims: true // Get custom claims along with the profile
}

const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch
  // createFirestoreInstance // <- needed if using firestore
}

ReactDOM.render(
  <Provider store={store}>
    <ReactReduxFirebaseProvider {...rrfProps}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ReactReduxFirebaseProvider>
  </Provider>,
  document.getElementById('root')
);
