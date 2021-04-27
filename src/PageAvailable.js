import React from "react";
import Table from "react-bootstrap/Table";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

class PageAvailable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      apptKey: "",
      showApptModal: false,
      modalError: "",
      modalLoading: false,
      selectedAppt: null,
    };
  }

  showDetails = (key) => {
    this.setState({
      showApptModal: true,
      apptKey: key,
      modalError: "",
      selectedAppt: this.props.appointments[key],
    });
  };

  claimAppointment = (key) => {
    try {
      this.setState({ modalLoading: true });
      const {
        appointments,
        uid,
        myApptIds,
        firebase,
        availableApptIds,
      } = this.props;
      const appt = appointments[key];
      const newAssignedStaff = appt.staffAssigned
        ? [uid].concat(appt.staffAssigned)
        : [uid];

      const newAssignedAppts = myApptIds ? [key].concat(myApptIds) : [key];

      const updateAvailableCallback =
        newAssignedStaff.length < appt.numStaff
          ? () => {
              this.setState({
                modalLoading: false,
                modalError: "",
                showApptModal: false,
              });
            }
          : () => {
              const newAvailableApptIds = [].concat(availableApptIds);
              newAvailableApptIds.splice(newAvailableApptIds.indexOf(key), 1);

              firebase.set(
                "/availableAppointments",
                newAvailableApptIds,
                () => {
                  this.setState({
                    modalLoading: false,
                    modalError: "",
                    showApptModal: false,
                  });
                }
              );
            };

      firebase.set(
        `/appointments/${key}/staffAssigned`,
        newAssignedStaff,
        () => {
          firebase.set(
            `/assignedAppointments/${uid}`,
            newAssignedAppts,
            updateAvailableCallback
          );
        }
      );
    } catch (error) {
      this.setState({ modalLoading: false, modalError: error.toString() });
    }
  };

  handleModalClose = () => this.setState({ showApptModal: false });

  render() {
    const {
      apptKey,
      selectedAppt,
      showApptModal,
      modalError,
      modalLoading,
    } = this.state;
    const {
      customers,
      users,
      myApptIds,
      appointments,
      availableApptIds,
      adminPercentage,
    } = this.props;

    const tableContent =
      isLoaded(users, appointments, availableApptIds, myApptIds, customers) &&
      availableApptIds &&
      !isEmpty(
        availableApptIds.filter((key) => !myApptIds || !myApptIds.includes(key))
      )
        ? Object.keys(appointments)
            .filter((key) => !myApptIds || !myApptIds.includes(key))
            .map((key) => {
              const {
                customer,
                date,
                rate,
                staffAssigned,
                numStaff,
              } = appointments[key];
              const { address, name } = customers[customer];
              const staffString = staffAssigned
                ? staffAssigned
                    .map((uid) => {
                      return users[uid].displayName;
                    })
                    .join(", ")
                : "None";
              const rateCalc =
                rate.type === "flat"
                  ? (rate.amount * (1 - adminPercentage)) / numStaff
                  : rate.amount * (1 - adminPercentage);
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
                  <td>{`$${rateCalc.toFixed(2)} ${rate.type}`}</td>
                </tr>
              );
            })
        : null;

    const table = !isLoaded(
      users,
      appointments,
      availableApptIds,
      myApptIds,
      customers
    ) ? (
      <div>Loading appointments...</div>
    ) : !availableApptIds ||
      isEmpty(
        availableApptIds.filter((key) => !myApptIds || !myApptIds.includes(key))
      ) ? (
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

    const modalErrorBar = modalError ? (
      <div
        style={{ marginBottom: "-5px" }}
        className="alert alert-danger"
        role="alert"
      >
        {modalError}
      </div>
    ) : null;

    const rateCalc = selectedAppt
      ? selectedAppt.rate.type === "flat"
        ? (selectedAppt.rate.amount * (1 - adminPercentage)) /
          selectedAppt.numStaff
        : selectedAppt.rate.amount * (1 - adminPercentage)
      : null;

    const staffAssigned =
      selectedAppt && selectedAppt.staffAssigned
        ? selectedAppt.staffAssigned
            .map((uid) => {
              return users[uid].displayName;
            })
            .join(", ")
        : "None";

    const modalBody = apptKey ? (
      <Modal.Body>
        <b>Date:</b> {selectedAppt.date}
        <br />
        <b>Address:</b> {customers[selectedAppt.customer].address}
        <br />
        <b>Customer:</b> {customers[selectedAppt.customer].name}
        <br />
        <b>Pay Rate:</b> ${rateCalc.toFixed(2)} {selectedAppt.rate.type}
        <br />
        <br />
        <b>Staff Assigned:</b> {staffAssigned}
        <br />
        <b>Number of Staff:</b> {selectedAppt.numStaff}
        <br />
        <br />
        <b>Notes:</b> <br />
        {selectedAppt.notes}
      </Modal.Body>
    ) : null;

    return (
      <div className="navbar-page">
        <div className="container">
          <h2>Available Appointments</h2>
          {table}

          <Modal show={showApptModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Appointment Details</Modal.Title>
            </Modal.Header>
            {modalErrorBar}
            {modalBody}
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={this.handleModalClose}
                disabled={modalLoading}
              >
                Close
              </Button>
              <Button
                variant="success"
                onClick={() => this.claimAppointment(apptKey)}
                disabled={modalLoading}
              >
                Claim Appointment
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    appointments: state.firebase.data.appointments,
  };
};

export default compose(
  firebaseConnect((props) =>
    isLoaded(props.availableApptIds, props.myApptIds) &&
    !isEmpty(props.availableApptIds)
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
