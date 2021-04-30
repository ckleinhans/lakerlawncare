import React from "react";
import Table from "react-bootstrap/Table";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";

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

      const newAssignedAppts =
        myApptIds && myApptIds.incomplete
          ? [key].concat(myApptIds.incomplete)
          : [key];

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
            `/assignedAppointments/${uid}/incomplete`,
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
        availableApptIds.filter(
          (key) =>
            !myApptIds ||
            !myApptIds.incomplete ||
            !myApptIds.incomplete.includes(key)
        )
      )
        ? Object.keys(appointments)
            .filter(
              (key) =>
                availableApptIds.includes(key) &&
                (!myApptIds ||
                  !myApptIds.incomplete ||
                  !myApptIds.incomplete.includes(key))
            )
            .sort((key1, key2) => {
              if (appointments[key1].complete && !appointments[key2].complete) {
                return 1;
              } else if (
                !appointments[key1].complete &&
                appointments[key2].complete
              ) {
                return -1;
              } else {
                return (
                  new Date(appointments[key1].date) -
                  new Date(appointments[key2].date)
                );
              }
            })
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
                  <td>{`$${rateCalc.toFixed(2)} ${rate.type}`}</td>
                  <td>{staffString || "None"}</td>
                </tr>
              );
            })
        : null;

    const table =
      !isLoaded(users, availableApptIds, myApptIds, customers) ||
      (!isLoaded(appointments) &&
        availableApptIds &&
        !isEmpty(
          availableApptIds.filter(
            (key) =>
              !myApptIds ||
              !myApptIds.incomplete ||
              !myApptIds.incomplete.includes(key)
          )
        )) ? (
        <div>Loading appointments...</div>
      ) : !availableApptIds ||
        isEmpty(
          availableApptIds.filter(
            (key) =>
              !myApptIds ||
              !myApptIds.incomplete ||
              !myApptIds.incomplete.includes(key)
          )
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
                  <th>Pay Rate</th>
                  <th>Staff Assigned</th>
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

    const address = selectedAppt
      ? customers[selectedAppt.customer].address
      : null;

    const modalBody = apptKey ? (
      <Modal.Body>
        <Form.Row>
          <Col className="label-column">Date:</Col>
          <Col>{selectedAppt.date}</Col>
        </Form.Row>
        <Form.Row>
          <Col className="label-column">Address:</Col>
          <Col>
            {address} (
            <a
              href={`http://maps.google.com/?q=${address + " MN"}`}
              target="_blank"
              rel="noreferrer"
            >
              Google Maps
            </a>
            )
          </Col>
        </Form.Row>
        <Form.Row>
          <Col className="label-column">Customer:</Col>
          <Col>{customers[selectedAppt.customer].name}</Col>
        </Form.Row>
        <Form.Row>
          <Col className="label-column">
            Pay Rate:
            <br />
            <br />
          </Col>
          <Col>
            ${rateCalc.toFixed(2)} {selectedAppt.rate.type}
          </Col>
        </Form.Row>
        <Form.Row>
          <Col className="label-column">Staff Assigned:</Col>
          <Col>{staffAssigned}</Col>
        </Form.Row>
        <Form.Row>
          <Col className="label-column">Number of Staff:</Col>
          <Col>{selectedAppt.numStaff}</Col>
        </Form.Row>
        <br />
        Notes: <br />
        {selectedAppt.notes || "None"}
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
    myApptIds: props.myApptIds,
    appointments: state.firebase.data.appointments,
  };
};

export default compose(
  firebaseConnect((props) =>
    isLoaded(props.availableApptIds, props.myApptIds) &&
    !isEmpty(props.availableApptIds)
      ? props.availableApptIds
          .filter(
            (apptId) =>
              !props.myApptIds ||
              !props.myApptIds.incomplete ||
              !props.myApptIds.incomplete.includes(apptId)
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
