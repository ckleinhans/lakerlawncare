import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { connect } from "react-redux";
import { isLoaded } from "react-redux-firebase";

import "./App.css";
import PageLogin from "./PageLogin";
import PageRegister from "./PageRegister";
import PageRecover from "./PageRecover";
import NavPageMaster from "./NavPageMaster";
import PageLoadAuth from "./PageLoadAuth";
import PageNotFound from "./PageNotFound";

function App(props) {
  if (!isLoaded(props.auth, props.profile)) {
    return <PageLoadAuth />;
  }

  return (
    <Switch>
      <Route exact path="/">
        {props.auth.uid ? (
          <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route exact path="/login">
        <PageLogin isLoggedIn={props.auth.uid} />
      </Route>
      <Route exact path="/register">
        <PageRegister isLoggedIn={props.auth.uid} />
      </Route>
      <Route exact path="/recover">
        <PageRecover isLoggedIn={props.auth.uid} />
      </Route>
      <Route exact path="/dashboard">
        <NavPageMaster isLoggedIn={props.auth.uid} />
      </Route>
      <Route>
        <PageNotFound />
      </Route>
    </Switch>
  );
}

const mapStateToProps = (state) => {
  return { auth: state.firebase.auth, profile: state.firebase.profile };
};

export default connect(mapStateToProps)(App);
