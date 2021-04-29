import React from "react";
import Table from "react-bootstrap/Table";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";

class PageDash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalError: "",
      modalLoading: false,
      showApptModal: false,
      selectedAppt: null,
      apptKey: "",
      reportNotes: "",
      checkbox: false,
      hours: "",
    };
  }

  handleChange = (event) =>
    this.setState({ [event.target.name]: event.target.value });

  handleCheckboxChange = (event) =>
    this.setState({ [event.target.name]: event.target.checked });

  showDetails = (key) => {
    this.setState({
      showApptModal: true,
      apptKey: key,
      modalError: "",
      selectedAppt: this.props.appointments[key],
      reportNotes: "",
      checkbox: false,
      hours: "",
    });
  };

  // TODO
  completeAppointment = () => {};

  handleModalClose = () => this.setState({ showApptModal: false });

  render() {
    const {
      modalError,
      modalLoading,
      showApptModal,
      selectedAppt,
      apptKey,
      hours,
      reportNotes,
      checkbox,
    } = this.state;
    const {
      users,
      appointments,
      customers,
      myApptIds,
      adminPercentage,
      takeAppts,
    } = this.props;

    const tableContent =
      isLoaded(users, appointments, customers) && !isEmpty(appointments)
        ? Object.keys(appointments)
            .filter((key) => myApptIds && myApptIds.includes(key))
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
      <div>No appointments found. Go take some from the Available tab!</div>
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

    const apptDateMatch =
      selectedAppt &&
      new Date().toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }) === selectedAppt.date;

    const reportForm = apptDateMatch ? (
      <div>
        <h6 style={{ textAlign: "center" }}>
          Complete the form below once you have finished the appointment.
        </h6>
        <Form.Label>Hours Worked</Form.Label>
        <Form.Control
          name="hours"
          onChange={this.handleChange}
          placeholder="e.g. 1.25"
          value={hours}
        />
        <br />
        <Form.Label>Report Notes</Form.Label>
        <Form.Control
          as="textarea"
          name="reportNotes"
          placeholder="Add any information or notes about the appointment or customer here."
          onChange={this.handleChange}
          value={reportNotes}
          rows={2}
        />
        <br />
        <Form.Check
          type="checkbox"
          name="checkbox"
          checked={checkbox}
          onChange={this.handleCheckboxChange}
          label="I confirm all staff listed above were present and each worked the number of hours entered above."
        />
      </div>
    ) : null;

    const address = selectedAppt
      ? customers[selectedAppt.customer].address
      : null;

    const phoneNumber = selectedAppt
      ? customers[selectedAppt.customer].phoneNumber
      : null;

    const modalBody = selectedAppt ? (
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
          <Col className="label-column">Phone Number:</Col>
          <Col>
            <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
          </Col>
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
        <br />
        <br />
        {reportForm}
      </Modal.Body>
    ) : null;

    return (
      <div className="navbar-page">
        <div className="container">
          {!takeAppts ? (
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

              <Modal show={showApptModal} onHide={this.handleModalClose}>
                <Modal.Header closeButton>
                  <Modal.Title>Appointment Report</Modal.Title>
                </Modal.Header>
                {modalErrorBar}
                {modalBody}
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    onClick={this.handleModalClose}
                    disabled={modalLoading}
                  >
                    Cancel
                  </Button>
                  {apptDateMatch ? (
                    <Button
                      variant="success"
                      onClick={() => this.completeAppointment(apptKey)}
                      disabled={modalLoading}
                    >
                      Submit Report
                    </Button>
                  ) : null}
                </Modal.Footer>
              </Modal>
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
