import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import Button from 'react-bootstrap/Button';

class PageProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    return (
      <div>
        <div className="spacer"/>
        <div className="container">
          <h2>My Profile</h2>
          Under construction
          <br/>
          <Button onClick={() => this.props.firebase.logout()} variant="danger">Logout</Button>
        </div>
      </div>
    );
  }
};

const mapStateToProps = (state, props) => {
  return({
    isLoggedIn: state.firebase.auth.uid,
  });
}

export default compose(
  firebaseConnect(),
  connect(mapStateToProps)
)(PageProfile);