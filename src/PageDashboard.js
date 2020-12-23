import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {Redirect, withRouter} from 'react-router-dom';

class PageDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
    }
  }

  render() {
    if (!this.props.isLoggedIn) {
      return <Redirect to="/login"/>
    }
    return (
      <div><button onClick={() => this.props.firebase.logout()}>Logout</button></div>
    );
  };
};

const mapStateToProps = (state, props) => {
  return({
    email: state.firebase.auth.email,
    isLoggedIn: state.firebase.auth.uid,
  });
}

export default compose(
  withRouter,
  firebaseConnect(),
  connect(mapStateToProps)
)(PageDashboard);