import React from 'react';
import { firebaseConnect } from 'react-redux-firebase';
import { compose } from 'redux';
import { Redirect } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import logo from './graphic.png';
import PageDash from './PageDash';
import PageAdminStaff from './PageAdminStaff';
import PageAvailable from './PageAvailable';
import PageProfile from './PageProfile';
import PageAdminAppts from './PageAdminAppts';
import PageAdminCustomers from './PageAdminCustomers';
import PageAdminFinances from './PageAdminFinances';


class NavPageMaster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      navState: "dash",
      isAdmin: false,
      appts: false,
    };
    props.firebase.auth().currentUser.getIdTokenResult(true).then((idTokenResult) => {
      // Confirm the user is an Admin.
      if (idTokenResult.claims && idTokenResult.claims.admin === true) {
        this.setState({ isAdmin: true });
      };
      if (idTokenResult.claims && idTokenResult.claims.appointments === true) {
        this.setState({ appts: true });
      };
    });
  };

  navUpdate = (eventKey) => {
    this.setState({ navState: eventKey })
  };

  render() {
    if (!this.props.isLoggedIn) {
      return <Redirect to="/login" />
    }

    let contentSwitch;
    switch (this.state.navState) {
      case 'profile':
        contentSwitch = <PageProfile />;
        break;
      case 'available':
        contentSwitch = <PageAvailable />;
        break;
      case 'admin-staff':
        contentSwitch = <PageAdminStaff />;
        break;
      case 'admin-appts':
        contentSwitch = <PageAdminAppts />;
        break;
      case 'admin-customers':
        contentSwitch = <PageAdminCustomers />;
        break;
        case 'admin-finances':
          contentSwitch = <PageAdminFinances />;
          break;
      default: // "dash"
        contentSwitch = <PageDash appts={this.state.appts} />;
        break;
    }

    return (
      <div>
        <Navbar bg="dark" variant="dark" expand="md" fixed="top" collapseOnSelect="true">
          <Navbar.Brand>
            <img src={logo} height="40px" alt="" className="d-inline-block align-top" />
            <span className="spacer">Laker Lawn Care Portal</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav onSelect={this.navUpdate} activeKey={this.state.navState} className="mr-auto">
              <Nav.Link eventKey="dash">Dashboard</Nav.Link>
              {this.state.appts ? (<Nav.Link eventKey="available">Appointments</Nav.Link>) : null}
              <Nav.Link eventKey="profile">Profile</Nav.Link>
              {this.state.isAdmin ? (
                <NavDropdown title="Admin Panel" id="basic-nav-dropdown">
                  <NavDropdown.Item eventKey="admin-staff">Staff List</NavDropdown.Item>
                  <NavDropdown.Item eventKey="admin-appts">Appointments</NavDropdown.Item>
                  <NavDropdown.Item eventKey="admin-customers">Customers</NavDropdown.Item>
                  <NavDropdown.Item eventKey="admin-finances">Finances</NavDropdown.Item>
                </NavDropdown>
              ) : null}
            </Nav>
            <Nav>
              <Button onClick={() => this.props.firebase.logout()} variant="danger">Logout</Button>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        {contentSwitch}
      </div>
    );
  }
};

export default compose(
  firebaseConnect(),
)(NavPageMaster);