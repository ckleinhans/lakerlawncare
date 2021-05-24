import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { compose } from "redux";
import { connect } from "react-redux";
import { Redirect, Route, NavLink, Switch, withRouter } from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Button from "react-bootstrap/Button";
import logo from "../assets/graphic.png";
import PageDash from "./PageDash";
import PageAdminStaff from "./PageAdminStaff";
import PageAvailable from "./PageAvailable";
import PageBalance from "./PageBalance";
import PageProfile from "./PageProfile";
import PageAdminAppts from "./PageAdminAppts";
import PageAdminCustomers from "./PageAdminCustomers";
import PageAdminFinances from "./PageAdminFinances";
import PageNotFound from "./PageNotFound";

class NavPageMaster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAdmin: false,
      takeAppts: false,
      financeAccess: false,
      navExpanded: false,
    };
    props.firebase
      .auth()
      .currentUser.getIdTokenResult(true)
      .then((idTokenResult) => {
        const permissions = {};
        // Check if user has been approved
        if (idTokenResult.claims && idTokenResult.claims.appointments) {
          permissions.takeAppts = true;
        }
        // Check if the user is an Admin.
        if (idTokenResult.claims && idTokenResult.claims.admin) {
          permissions.isAdmin = true;
        }
        // Check if user can edit finances
        if (idTokenResult.claims && idTokenResult.claims.finances) {
          permissions.financeAccess = true;
        }
        this.setState(permissions);
      });
  }

  render() {
    const {
      isLoggedIn,
      users,
      customers,
      myApptIds,
      availableApptIds,
      adminPercentage,
      firebase,
      location,
    } = this.props;
    const { takeAppts, isAdmin, financeAccess, navExpanded, showDropdown } =
      this.state;

    if (!isLoggedIn) {
      return <Redirect to="/login" />;
    }

    return (
      <div>
        <Navbar
          bg="dark"
          variant="dark"
          expand="md"
          fixed="top"
          expanded={navExpanded}
          onToggle={(navExpanded) => this.setState({ navExpanded })}
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
            <Nav className="mr-auto">
              <NavLink
                className="nav-link"
                to="/app/dashboard"
                onClick={() => this.setState({ navExpanded: false })}
              >
                Dashboard
              </NavLink>
              {takeAppts ? (
                <NavLink
                  className="nav-link"
                  to="/app/available"
                  onClick={() => this.setState({ navExpanded: false })}
                >
                  Available
                </NavLink>
              ) : null}
              <NavLink
                className="nav-link"
                to="/app/balance"
                onClick={() => this.setState({ navExpanded: false })}
              >
                Balance
              </NavLink>
              <NavLink
                className="nav-link"
                to="/app/profile"
                onClick={() => this.setState({ navExpanded: false })}
              >
                Profile
              </NavLink>
              {isAdmin ? (
                <NavDropdown
                  show={showDropdown}
                  active={location.pathname.includes("/app/admin")}
                  onToggle={(showDropdown) => this.setState({ showDropdown })}
                  title="Admin Panel"
                  id="basic-nav-dropdown"
                >
                  <NavLink
                    className="dropdown-item"
                    to="/app/admin/staff"
                    onClick={() =>
                      this.setState({ navExpanded: false, showDropdown: false })
                    }
                  >
                    Staff List
                  </NavLink>
                  <NavLink
                    className="dropdown-item"
                    to="/app/admin/appointments"
                    onClick={() =>
                      this.setState({ navExpanded: false, showDropdown: false })
                    }
                  >
                    Appointments
                  </NavLink>
                  <NavLink
                    className="dropdown-item"
                    to="/app/admin/customers"
                    onClick={() =>
                      this.setState({ navExpanded: false, showDropdown: false })
                    }
                  >
                    Customers
                  </NavLink>
                  <NavLink
                    className="dropdown-item"
                    to="/app/admin/finances"
                    onClick={() =>
                      this.setState({ navExpanded: false, showDropdown: false })
                    }
                  >
                    Finances
                  </NavLink>
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
        <Switch>
          <Route exact path="/app/dashboard">
            <PageDash
              users={users}
              customers={customers}
              myApptIds={myApptIds}
              takeAppts={takeAppts}
              adminPercentage={adminPercentage}
            />
          </Route>
          <Route exact path="/app/available">
            {takeAppts ? (
              <PageAvailable
                uid={isLoggedIn}
                users={users}
                customers={customers}
                availableApptIds={availableApptIds}
                myApptIds={myApptIds}
                adminPercentage={adminPercentage}
              />
            ) : (
              <Redirect to="/app/dashboard" />
            )}
          </Route>
          <Route exact path="/app/balance">
            <PageBalance uid={isLoggedIn} />;
          </Route>
          <Route path="/app/profile">
            <PageProfile financeAccess={financeAccess} users={users} />
          </Route>

          <Route path="/app/admin">
            {isAdmin ? (
              <Switch>
                <Route exact path="/app/admin/staff">
                  <PageAdminStaff users={users} />
                </Route>
                <Route exact path="/app/admin/appointments">
                  <PageAdminAppts
                    users={users}
                    customers={customers}
                    availableApptIds={availableApptIds}
                  />
                </Route>
                <Route exact path="/app/admin/customers">
                  <PageAdminCustomers customers={customers} />
                </Route>
                <Route exact path="/app/admin/finances">
                  <PageAdminFinances
                    users={users}
                    customers={customers}
                    financeAccess={financeAccess}
                  />
                </Route>
              </Switch>
            ) : (
              <Redirect to="/app/dashboard" />
            )}
          </Route>
          <Route>
            <PageNotFound />
          </Route>
        </Switch>
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
  withRouter,
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
