import React from "react";
import Table from "react-bootstrap/Table";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";

class PageDash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  showDetails = (key) => {};

  render() {
    const { users, appointments, customers, myApptIds } = this.props;

    const tableContent =
      isLoaded(users, appointments, customers) && !isEmpty(appointments)
        ? Object.keys(appointments)
            .filter((key) => myApptIds && myApptIds.includes(key))
            .map((key) => {
              const { customer, date, staffAssigned } = appointments[key];
              const { address, name, phoneNumber } = customers[customer];
              const staffString = staffAssigned
                ? staffAssigned
                    .map((uid) => {
                      return users[uid].displayName;
                    })
                    .join(", ")
                : "None";
              return (
                <tr
                  key={key}
                  className="clickable-row"
                  onClick={() => this.showDetails(key)}
                >
                  <td>{date}</td>
                  <td>{address}</td>
                  <td>{name}</td>
                  <td>{phoneNumber}</td>
                  <td>{staffString || "None"}</td>
                </tr>
              );
            })
        : null;

    const table = !isLoaded(users, appointments, customers) ? (
      <div>Loading appointments...</div>
    ) : isEmpty(appointments) ? (
      <div>No appointments found. Go take some from the Appointments tab!</div>
    ) : (
      <div>
        Click an appointment to see details and actions.
        <div className="table-container">
          <Table striped bordered hover className="page-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Address</th>
                <th>Name</th>
                <th>Phone #</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>{tableContent}</tbody>
          </Table>
        </div>
      </div>
    );

    return (
      <div className="navbar-page">
        <div className="container">
          {!this.props.appts ? (
            <>
              <h2>Account Pending</h2>
              Thank you for signing up to work for Laker Lawn Care! Your account
              has been created and you will be given permission to start viewing
              and taking appointments soon.
            </>
          ) : (
            <>
              <h2>My Appointments</h2>
              {table}
            </>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    appointments:
      isLoaded(props.myApptIds) && !isEmpty(props.myApptIds)
        ? state.firebase.data.appointments
        : null,
  };
};

export default compose(
  firebaseConnect((props) =>
    isLoaded(props.myApptIds) && !isEmpty(props.myApptIds)
      ? props.myApptIds.map((apptId) => {
          return {
            path: `/appointments/${apptId}`,
          };
        })
      : null
  ),
  connect(mapStateToProps)
)(PageDash);
