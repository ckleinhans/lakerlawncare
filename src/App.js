import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { connect } from "react-redux";

import "./App.css";
import PageLogin from "./pages/PageLogin";
import PageRegister from "./pages/PageRegister";
import PageRecover from "./pages/PageRecover";
import NavPageMaster from "./pages/NavPageMaster";
import PageLoadAuth from "./pages/PageLoadAuth";
import PageNotFound from "./pages/PageNotFound";

function App(props) {
  if (!props.isLoaded) {
    return <PageLoadAuth />;
  }

  const { auth, profile } = props;

  return (
    <Switch>
      <Route exact path="/">
        {auth.uid ? <Redirect to="/app/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route exact path="/login">
        <PageLogin isLoggedIn={!!auth.uid} />
      </Route>
      <Route exact path="/register">
        <PageRegister isLoggedIn={!!auth.uid} />
      </Route>
      <Route exact path="/recover">
        <PageRecover isLoggedIn={!!auth.uid} />
      </Route>
      <Route path="/app">
        <NavPageMaster uid={auth.uid} profile={profile} />
      </Route>
      <Route>
        <PageNotFound />
      </Route>
    </Switch>
  );
}

const mapStateToProps = (state) => {
  const { auth, profile } = state.firebase;
  return {
    auth: state.firebase.auth,
    profile: state.firebase.profile,
    isLoaded: auth.isLoaded && profile.isLoaded,
  };
};

export default connect(mapStateToProps)(App);
