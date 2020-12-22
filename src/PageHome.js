import React from 'react';
import { Redirect } from 'react-router-dom';
import { firebaseConnect } from 'react-redux-firebase';
import { compose } from 'redux';
import {connect} from 'react-redux';

function PageHome(props) {
    if (!props.isLoggedIn) {
      return <Redirect to='/login'/>
    } else {
      return <Redirect to='/dashboard'/>
    };
  };

const mapStateToProps = state => {
  return {isLoggedIn: state.firebase.auth.uid};
}

export default compose(firebaseConnect(), connect(mapStateToProps))(PageHome);