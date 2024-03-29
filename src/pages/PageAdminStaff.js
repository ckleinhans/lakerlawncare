import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Switch from "react-switch";
import Table from "react-bootstrap/Table";
import { getDateString } from "../components/Utilities";
import Popup from "../components/Popup";

class PageAdminStaff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: "",
    };
  }

  setAdmin = async (toggle, event, id) => {
    this.setState({ loading: `admin${id}`, toggle });
    const adminFunction = this.props.firebase
      .functions()
      .httpsCallable("setAdminRole");
    try {
      await adminFunction({ toggle, id });
      this.setState({ loading: "" });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: "",
      });
    }
  };

  setApptUser = async (toggle, event, id) => {
    this.setState({ loading: `appt${id}`, toggle });
    const apptFunction = this.props.firebase
      .functions()
      .httpsCallable("setAppointmentRole");
    try {
      await apptFunction({ toggle, id });
      this.setState({
        loading: "",
      });
    } catch (error) {
      this.setState({
        error: error.message,
        loading: "",
      });
    }
  };

  render() {
    const { users, admins, appointmentUsers } = this.props;
    const { error, loading, toggle } = this.state;
    let table;
    if (!isLoaded(users, admins, appointmentUsers)) {
      table = <div>Loading staff...</div>;
    } else if (isEmpty(users)) {
      table = <div>No registered staff found.</div>;
    } else {
      const tableContent = Object.keys(users)
        .sort((key1, key2) =>
          users[key1].displayName.localeCompare(users[key2].displayName)
        )
        .map((key) => {
          const name = users[key].displayName;
          const email = users[key].email;
          const phoneNumber = users[key].phoneNumber;
          const lastLogin = users[key].lastLogin
            ? getDateString(users[key].lastLogin, false, true)
            : "Never";

          return (
            <tr key={key}>
              <td>{name}</td>
              <td>{email}</td>
              <td className="nowrap">{phoneNumber}</td>
              <td className="nowrap">{lastLogin}</td>
              <td style={{ textAlign: "center" }}>
                <Switch
                  onChange={this.setApptUser}
                  checked={
                    loading === `appt${key}`
                      ? toggle
                      : appointmentUsers.includes(key)
                  }
                  disabled={!!loading}
                  id={key}
                  height={21}
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <Switch
                  onChange={this.setAdmin}
                  checked={
                    loading === `admin${key}` ? toggle : admins.includes(key)
                  }
                  disabled={!!loading}
                  id={key}
                  height={21}
                />
              </td>
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
                  <th>Last Login</th>
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

    return (
      <div className="navbar-page">
        <div className="container">
          <h2>Staff List</h2>
          {table}
          <Popup
            show={error}
            isError
            message={error}
            onClose={() => this.setState({ error: "" })}
          />
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
