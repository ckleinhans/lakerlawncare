import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { compose } from "redux";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import logo from "./graphic.png";
import PageDash from "./PageDash";
import PageAdminStaff from "./PageAdminStaff";
import PageAvailable from "./PageAvailable";
import PageBalance from "./PageBalance";
import PageProfile from "./PageProfile";
import PageAdminAppts from "./PageAdminAppts";
import PageAdminCustomers from "./PageAdminCustomers";
import PageAdminFinances from "./PageAdminFinances";

class NavPageMaster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      navState: "dash",
      isAdmin: false,
      takeAppts: false,
    };
    props.firebase
      .auth()
      .currentUser.getIdTokenResult(true)
      .then((idTokenResult) => {
        // Confirm the user is an Admin.
        if (idTokenResult.claims && idTokenResult.claims.admin === true) {
          this.setState({ isAdmin: true });
        }
        if (
          idTokenResult.claims &&
          idTokenResult.claims.appointments === true
        ) {
          this.setState({ takeAppts: true });
        }
      });
  }

  navUpdate = (eventKey) => {
    this.setState({ navState: eventKey });
  };

  render() {
    const {
      isLoggedIn,
      users,
      customers,
      myApptIds,
      availableApptIds,
      adminPercentage,
      firebase,
    } = this.props;
    const { navState, takeAppts, isAdmin } = this.state;

    if (!isLoggedIn) {
      return <Redirect to="/login" />;
    }

    let contentSwitch;
    switch (navState) {
      case "profile":
        contentSwitch = <PageProfile />;
        break;
      case "balance":
        contentSwitch = <PageBalance uid={isLoggedIn}/>;
        break;
      case "available":
        contentSwitch = (
          <PageAvailable
            uid={isLoggedIn}
            users={users}
            customers={customers}
            availableApptIds={availableApptIds}
            myApptIds={myApptIds}
            adminPercentage={adminPercentage}
          />
        );
        break;
      case "admin-staff":
        contentSwitch = <PageAdminStaff users={users} />;
        break;
      case "admin-appts":
        contentSwitch = (
          <PageAdminAppts
            users={users}
            customers={customers}
            availableApptIds={availableApptIds}
          />
        );
        break;
      case "admin-customers":
        contentSwitch = <PageAdminCustomers customers={customers} />;
        break;
      case "admin-finances":
        contentSwitch = (
          <PageAdminFinances users={users} customers={customers} />
        );
        break;
      default:
        // "dash"
        contentSwitch = (
          <PageDash
            users={users}
            customers={customers}
            myApptIds={myApptIds}
            takeAppts={takeAppts}
            adminPercentage={adminPercentage}
          />
        );
        break;
    }

    return (
      <div>
        <Navbar
          bg="dark"
          variant="dark"
          expand="md"
          fixed="top"
          collapseOnSelect="true"
        >
          <Navbar.Brand>
            <img
              src={logo}
              height="40px"
              alt=""
              className="d-inline-block align-top"
            />
            <span className="spacer">Laker Lawn Care Portal</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav
              onSelect={this.navUpdate}
              activeKey={navState}
              className="mr-auto"
            >
              <Nav.Link eventKey="dash">Dashboard</Nav.Link>
              {takeAppts ? (
                <Nav.Link eventKey="available">Available</Nav.Link>
              ) : null}
              <Nav.Link eventKey="balance">Balance</Nav.Link>
              <Nav.Link eventKey="profile">Profile</Nav.Link>
              {isAdmin ? (
                <NavDropdown title="Admin Panel" id="basic-nav-dropdown">
                  <NavDropdown.Item eventKey="admin-staff">
                    Staff List
                  </NavDropdown.Item>
                  <NavDropdown.Item eventKey="admin-appts">
                    Appointments
                  </NavDropdown.Item>
                  <NavDropdown.Item eventKey="admin-customers">
                    Customers
                  </NavDropdown.Item>
                  <NavDropdown.Item eventKey="admin-finances">
                    Finances
                  </NavDropdown.Item>
                </NavDropdown>
              ) : null}
            </Nav>
            <Nav>
              <Button onClick={() => firebase.logout()} variant="danger">
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        {contentSwitch}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    users: state.firebase.data.users,
    customers: state.firebase.data.customers,
    myApptIds: state.firebase.data.myApptIds,
    availableApptIds: state.firebase.data.availableApptIds,
    adminPercentage: state.firebase.data.adminPercentage,
  };
};

export default compose(
  firebaseConnect((props) => [
    { path: `/users`, storeAs: "users" },
    { path: `/customers`, storeAs: "customers" },
    {
      path: `/assignedAppointments/${props.isLoggedIn}`,
      storeAs: "myApptIds",
    },
    { path: `/availableAppointments`, storeAs: "availableApptIds" },
    { path: `/finances/adminPercentage`, storeAs: "adminPercentage" },
  ]),
  connect(mapStateToProps)
)(NavPageMaster);
