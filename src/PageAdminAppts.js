import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";

class PageAdminStaff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  editAppt = (key) => {
    alert("Editing appt with id " + key); // TODO maybe render new component that is Modal?
  };

  render() {
    const { appointments, customers, users } = this.props;

    let table;
    if (
      !isLoaded(appointments, customers, users)
    ) {
      table = <div>Loading appointments...</div>;
    } else if (isEmpty(appointments)) {
      table = <div>No appointments in the database.</div>;
    } else {
      const keys = Object.keys(appointments);

      const tableContent = keys.map((key) => {
        const customer = customers[
          appointments[key].customer
        ].name; // This is only uid need to populate the customer
        const date = appointments[key].date;
        const rate =
          appointments[key].rate.type === "hourly"
            ? `$${appointments[key].rate.amount}/hr`
            : `$${appointments[key].rate.amount}`; // rate object
        const staffAssigned = appointments[key].staffAssigned
          .map((uid) => {
            return users[uid].displayName;
          })
          .join(", "); // string of all assigned uids
        const apptEditButton = (
          <Button variant="primary" onClick={() => this.editAppt(key)}>
            Edit
          </Button>
        );
        // TODO add ability to remove staff and assign to others

        return (
          <tr key={key}>
            <td>{date}</td>
            <td>{customer}</td>
            <td>{rate}</td>
            <td>{staffAssigned}</td>
            <td>{apptEditButton}</td>
          </tr>
        );
      });

      table = (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Rate</th>
              <th>Assigned Staff</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>{tableContent}</tbody>
        </Table>
      );
    }

    return (
      <div className="navbar-page">
        <div className="container">
          <h2 className="inline-header">Appointment List</h2> <br/>{/*Button before break*/}
          {table}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    appointments: state.firebase.data["appointments"],
    customers: state.firebase.data["customers"],
  };
};

export default compose(
  firebaseConnect((props) => {
    return [
      { path: "/appointments", storeAs: "appointments" },
      { path: "/customers", storeAs: "customers" },
    ];
  }),
  connect(mapStateToProps)
)(PageAdminStaff);
