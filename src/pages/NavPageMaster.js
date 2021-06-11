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
      navExpanded: false,
    };
  }

  render() {
    const {
      companyVenmo,
      uid,
      profile,
      users,
      customers,
      myApptIds,
      availableApptIds,
      adminPercentage,
      firebase,
      location,
    } = this.props;

    if (!uid) {
      return <Redirect to="/login" />;
    }

    const { admin, appointments, finances } = profile.token.claims;
    const { navExpanded, showDropdown } = this.state;

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
              {appointments ? (
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
              {admin ? (
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
              takeAppts={appointments}
              adminPercentage={adminPercentage}
            />
          </Route>
          <Route exact path="/app/available">
            {appointments ? (
              <PageAvailable
                uid={uid}
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
            <PageBalance uid={uid} />;
          </Route>
          <Route exact path="/app/profile">
            <PageProfile
              profile={profile}
              users={users}
              companyVenmo={companyVenmo}
            />
          </Route>

          <Route path="/app/admin">
            {admin ? (
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
                    financeAccess={finances}
                    companyVenmo={companyVenmo}
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
    companyVenmo: state.firebase.data.companyVenmo,
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
    { path: `/companyVenmo`, storeAs: "companyVenmo" },
    { path: `/users`, storeAs: "users" },
    { path: `/customers`, storeAs: "customers" },
    {
      path: `/assignedAppointments/${props.uid}`,
      storeAs: "myApptIds",
    },
    { path: `/availableAppointments`, storeAs: "availableApptIds" },
    { path: `/finances/adminPercentage`, storeAs: "adminPercentage" },
  ]),
  connect(mapStateToProps)
)(NavPageMaster);
