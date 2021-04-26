import React from "react";
import Table from "react-bootstrap/Table";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";

class PageAvailable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
    };
  }

  showDetails = (key) => {};

  render() {
    const {
      customers,
      users,
      availableAppts,
      availableApptIds,
      adminPercentage,
    } = this.props;

    const tableContent =
      isLoaded(users, availableAppts, availableApptIds, customers) &&
      !isEmpty(availableAppts)
        ? Object.keys(availableAppts).map((key) => {
            const { customer, date, rate, staffAssigned } = availableAppts[key];
            const { address, name } = customers[customer];
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
                <td>{staffString || "None"}</td>
                <td>{`$${rate.amount * (1 - adminPercentage)} ${
                  rate.type
                }`}</td>
              </tr>
            );
          })
        : null;

    const table = !isLoaded(users, availableAppts, customers) ? (
      <div>Loading appointments...</div>
    ) : isEmpty(availableAppts) ? (
      <div>
        No available appointments found. Stay tuned for future appointments!
      </div>
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
                <th>Staff</th>
                <th>Rate</th>
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
          <h2>Available Appointments</h2>
          {table}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    availableAppts:
      isLoaded(props.availableApptIds) &&
      !isEmpty(props.availableApptIds) &&
      props.availableApptIds.find(
        (apptId) => !props.myApptIds || !props.myApptIds.includes(apptId)
      )
        ? state.firebase.data.appointments
        : null,
  };
};

export default compose(
  firebaseConnect((props) =>
    isLoaded(props.availableApptIds) && !isEmpty(props.availableApptIds)
      ? props.availableApptIds
          .filter(
            (apptId) => !props.myApptIds || !props.myApptIds.includes(apptId)
          )
          .map((apptId) => {
            return {
              path: `/appointments/${apptId}`,
            };
          })
      : null
  ),
  connect(mapStateToProps)
)(PageAvailable);
