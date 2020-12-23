import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { isLoaded } from 'react-redux-firebase';

import './App.css';
import PageLogin from './PageLogin';
import PageRegister from './PageRegister';
import PageRecover from './PageRecover';
import NavPageMaster from './NavPageMaster';

function App(props) {
  if (!isLoaded(props.auth, props.profile)) {
    return <div>Authentication loading...</div>
  }

  return (
    <Switch>
      <Route exact path="/">
        {props.auth.uid ? <Redirect to="/dash"/> : <Redirect to="/login"/>}
      </Route>
      <Route exact path="/login">
        <PageLogin />
      </Route>
      <Route exact path="/register">
        <PageRegister />
      </Route>
      <Route exact path="/recover">
        <PageRecover />
      </Route>
      <Route exact path="/dash">
        <NavPageMaster />
      </Route>
      <Route>
        <div>Page not found</div>
      </Route>
    </Switch>
  );
}

const mapStateToProps = state => {
  return {auth: state.firebase.auth, profile: state.firebase.profile};
}

export default connect(mapStateToProps)(App);