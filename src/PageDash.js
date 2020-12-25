import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import construction from './under-construction.gif';

class PageDash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    return (
      <div className="navbar-page">
        <div className="container">
          <h2>My Appointments</h2>
          Under construction...<br/>
          <img src={construction} alt="" />
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