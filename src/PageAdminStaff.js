import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/esm/Alert";

class PageAdminStaff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      adminKeyLoading: "",
      apptUsersKeyLoading: "",
    };
  }

  setAdmin = async (uid) => {
    this.setState({ loading: true, adminKeyLoading: uid });
    const addAdminRole = this.props.firebase
      .functions()
      .httpsCallable("addAdminRole");
    try {
      const result = await addAdminRole({ uid: uid });
      this.setState({
        result: result.data.message,
        loading: false,
        adminKeyLoading: "",
        error: result.data.error,
      });
    } catch (error) {
      this.setState({
        result: error.message,
        loading: false,
        adminKeyLoading: "",
        error: true,
      });
    }
  };

  removeAdmin = async (uid) => {
    this.setState({ loading: true, adminKeyLoading: uid });
    const removeAdminRole = this.props.firebase
      .functions()
      .httpsCallable("removeAdminRole");
    try {
      const result = await removeAdminRole({ uid: uid });
      this.setState({
        result: result.data.message,
        loading: false,
        adminKeyLoading: "",
        error: result.data.error,
      });
    } catch (error) {
      this.setState({
        result: error.message,
        loading: false,
        adminKeyLoading: "",
        error: true,
      });
    }
  };

  setApptUser = async (uid) => {
    this.setState({ loading: true, apptUsersKeyLoading: uid });
    const addAdminRole = this.props.firebase
      .functions()
      .httpsCallable("addAppointmentsRole");
    try {
      const result = await addAdminRole({ uid: uid });
      this.setState({
        result: result.data.message,
        loading: false,
        apptUsersKeyLoading: "",
        error: result.data.error,
      });
    } catch (error) {
      this.setState({
        result: error.message,
        loading: false,
        apptUsersKeyLoading: "",
        error: true,
      });
    }
  };

  removeApptUser = async (uid) => {
    this.setState({ loading: true, apptUsersKeyLoading: uid });
    const removeAdminRole = this.props.firebase
      .functions()
      .httpsCallable("removeAppointmentsRole");
    try {
      const result = await removeAdminRole({ uid: uid });
      this.setState({
        result: result.data.message,
        loading: false,
        apptUsersKeyLoading: "",
        error: result.data.error,
      });
    } catch (error) {
      this.setState({
        result: error.message,
        loading: false,
        apptUsersKeyLoading: "",
        error: true,
      });
    }
  };

  render() {
    const { users, admins, appointmentUsers } = this.props;
    let table;
    if (!isLoaded(users, admins, appointmentUsers)) {
      table = <div>Loading staff...</div>;
    } else if (isEmpty(users)) {
      table = <div>No registered staff found.</div>;
    } else {
      const tableContent = Object.keys(users)
        .sort((key1, key2) => {
          if (admins.includes(key1) && !admins.includes(key2)) {
            return 1;
          } else if (!admins.includes(key1) && admins.includes(key2)) {
            return -1;
          } else if (
            appointmentUsers.includes(key1) &&
            !appointmentUsers.includes(key2)
          ) {
            return 1;
          } else if (
            !appointmentUsers.includes(key1) &&
            appointmentUsers.includes(key2)
          ) {
            return -1;
          } else return key1.localeCompare(key2);
        })
        .map((key) => {
          const name = users[key].displayName;
          const email = users[key].email;
          const phoneNumber = users[key].phoneNumber;
          const adminButton = admins.includes(key) ? (
            <Button
              onClick={() => this.removeAdmin(key)}
              disabled={this.state.loading}
              variant="danger"
              size="sm"
            >
              {this.state.adminKeyLoading === key ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <span>Remove</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => this.setAdmin(key)}
              disabled={this.state.loading}
              variant="success"
              size="sm"
            >
              {this.state.adminKeyLoading === key ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <span>Give</span>
              )}
            </Button>
          );

          const apptUserButton = appointmentUsers.includes(key) ? (
            <Button
              onClick={() => this.removeApptUser(key)}
              disabled={this.state.loading}
              variant="danger"
              size="sm"
            >
              {this.state.apptUsersKeyLoading === key ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <span>Undo</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => this.setApptUser(key)}
              disabled={this.state.loading}
              variant="success"
              size="sm"
            >
              {this.state.apptUsersKeyLoading === key ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <span>Approve</span>
              )}
            </Button>
          );

          return (
            <tr key={key}>
              <td>{name}</td>
              <td>{email}</td>
              <td>{phoneNumber}</td>
              <td style={{ textAlign: "center" }}>{apptUserButton}</td>
              <td style={{ textAlign: "center" }}>{adminButton}</td>
            </tr>
          );
        });

      table = (
        <div>
          View staff and manage permissions below.
          <div className="table-container">
            <Table striped bordered hover className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone #</th>
                  <th>Approve</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>{tableContent}</tbody>
            </Table>
          </div>
        </div>
      );
    }

    const messageBox = this.state.result ? (
      this.state.error ? (
        <Alert variant="danger">{this.state.result}</Alert>
      ) : (
        <Alert variant="success">{this.state.result}</Alert>
      )
    ) : null;

    return (
      <div className="navbar-page">
        <div className="container">
          <h2>Staff List</h2>
          {messageBox}
          {table}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    admins: state.firebase.data["admins"],
    appointmentUsers: state.firebase.data["appointmentUsers"],
  };
};

export default compose(
  firebaseConnect((props) => {
    return [
      { path: "/admins", storeAs: "admins" },
      { path: "/appointmentUsers", storeAs: "appointmentUsers" },
    ];
  }),
  connect(mapStateToProps)
)(PageAdminStaff);
