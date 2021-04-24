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

  render() {
    const { customers, users, availableAppts } = this.props;

    const tableContent =
      isLoaded(users, availableAppts, customers) && !isEmpty(availableAppts)
        ? Object.keys(availableAppts).map((key) => {
            const { customer, date, rate, staffAssigned } = availableAppts[key];
            const { address, name } = customers[customer];
            const staffString = staffAssigned
              .map((uid) => {
                return users[uid].displayName;
              })
              .join(", "); // string of all assigned uids
            return (
              <tr key={key}>
                <td>{date}</td>
                <td>{address}</td>
                <td>{name}</td>
                <td>{staffString || "None"}</td>
                <td>{`${rate.amount} ${rate.type}`}</td>
                <td>{"Button Here"}</td>
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
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Address</th>
            <th>Name</th>
            <th>Staff</th>
            <th>Rate</th>
            <th>Take</th>
          </tr>
        </thead>
        <tbody>{tableContent}</tbody>
      </Table>
    );

    return (
      <div className="navbar-page">
        <div className="container" style={{ minWidth: 900 }}>
          <h2>Available Appointments</h2>
          {table}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    availableAppts: state.firebase.data.appointments,
  };
};

export default compose(
  firebaseConnect((props) =>
    isLoaded(props.availableApptIds) && !isEmpty(props.availableApptIds)
      ? props.availableApptIds.map((apptId) => {
          return {
            path: `/appointments/${apptId}`,
          };
        })
      : null
  ),
  connect(mapStateToProps)
)(PageAvailable);
