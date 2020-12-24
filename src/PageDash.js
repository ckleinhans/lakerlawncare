import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';

class PageDash extends React.Component {
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
          <h2>My Appointments</h2>
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
  firebaseConnect(),
  connect(mapStateToProps)
)(PageDash);