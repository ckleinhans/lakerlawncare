import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {withRouter} from 'react-router-dom';

class PageAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
    }
  }

  render() {
    return (
      <div>
        <div className="spacer"/>
        <div className="container">
          This dashboard is for admin use only.
        </div>
      </div>
    );
  }
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
)(PageAdmin);