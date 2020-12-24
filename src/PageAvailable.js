import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {withRouter} from 'react-router-dom';

class PageAvailable extends React.Component {
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
          <h2>Available Appointments</h2>
          Under construction...
        </div>
      </div>
    );
  }
};

const mapStateToProps = (state, props) => {
  return({});
}

export default compose(
  withRouter,
  firebaseConnect(),
  connect(mapStateToProps)
)(PageAvailable);