import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { isLoaded } from 'react-redux-firebase';

import PageHome from './PageHome';
import PageLogin from './PageLogin';
import PageRegister from './PageRegister';
import PageRecover from './PageRecover';
import PageDashboard from './PageDashboard';

function App(props) {
  if (!isLoaded(props.auth, props.profile)) {
    return <div>Authentication loading...</div>
  }

  return (
    <Switch>
      <Route exact path="/">
        <PageHome />
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
      <Route exact path="/dashboard">
        <PageDashboard />
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