import React from 'react';
import { firebaseConnect } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose } from 'redux';
import construction from './under-construction.gif';

class PageDash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="navbar-page">
        <div className="container">
          {!this.props.appts ? (
            <>
              <h2>Account Pending</h2>
              Thank you for signing up to work for Laker Lawn Care! Your account has been created and you will be given permission to start viewing and taking appointments soon.
            </>
          ) : (
              <>
                <h2>My Appointments</h2>
              Under construction...<br />
                <img src={construction} alt="" />
              </>
            )}
        </div>
      </div>
    );
  }
};

const mapStateToProps = (state, props) => {
  return ({});
}

export default compose(
  firebaseConnect(),
  connect(mapStateToProps)
)(PageDash);