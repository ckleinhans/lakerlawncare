import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {Redirect} from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import logo from './graphic.png';
import PageDash from './PageDash';
import PageAdmin from './PageAdmin';
import PageAvailable from './PageAvailable';
import PageProfile from './PageProfile';


class NavPageMaster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      navState: "dash",
    };
  };

  navUpdate = (eventKey) => {
    this.setState({navState: eventKey})
  };

  render() {
    if (!this.props.isLoggedIn) {
      return <Redirect to="/login"/>
    }

    let contentSwitch;
    switch (this.state.navState) {
      case 'profile':
        contentSwitch = <PageProfile />;
        break;
      case 'available':
        contentSwitch = <PageAvailable />;
        break;
      case 'admin':
        contentSwitch = <PageAdmin />;
        break;
      default: // "dash"
        contentSwitch = <PageDash />;
        break;
    }

    return (
      <div>
        <Navbar bg="dark" variant="dark" expand="md" fixed="top" collapseOnSelect="true">
          <Navbar.Brand>
            <img src={logo} height="40px" alt="" className="d-inline-block align-top"/>
            <span className="spacer">Laker Lawn Care Portal</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav onSelect={this.navUpdate} defaultActiveKey="dash" className="mr-auto">
              <Nav.Link eventKey="dash">Dashboard</Nav.Link>
              <Nav.Link eventKey="available">Appointments</Nav.Link>
              <Nav.Link eventKey="profile">Profile</Nav.Link>
              <Nav.Link eventKey="admin">Admin Panel</Nav.Link>
            </Nav>
            <Nav>
              <Button onClick={() => this.props.firebase.logout()} variant="danger">Logout</Button>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="navbar-body">
          {contentSwitch}
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
)(NavPageMaster);