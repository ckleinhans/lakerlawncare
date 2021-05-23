import React from "react";
import Table from "react-bootstrap/Table";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Spinner from "react-bootstrap/Spinner";

class PageDash extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalError: "",
      modalLoading: false,
      showApptModal: false,
      selectedAppt: null,
      selectedDate: "",
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
      selectedDate: this.props.appointments[key].date,
      reportNotes: "",
      checkbox: false,
      hours: "",
    });
  };

  completeAppointment = async () => {
    const { apptKey, hours, reportNotes, checkbox } = this.state;
    const { appointments } = this.props;
    this.setState({ modalLoading: true, modalError: "" });

    // input validation
    if (!/^([0-9.]+)$/.test(hours)) {
      return this.setState({
        modalError: "Hours worked must be a number.",
        modalLoading: false,
      });
    }
    if (!checkbox) {
      return this.setState({
        modalError:
          "You must confirm the information by checking the checkbox.",
        modalLoading: false,
      });
    }
    if (
      appointments[apptKey].date !==
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    ) {
      return this.setState({
        modalError: "Error: This appointment is not scheduled for today.",
        modalLoading: false,
      });
    }

    const date = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const completeAppointment = this.props.firebase
      .functions()
      .httpsCallable("completeAppointment");
    try {
      const result = await completeAppointment({
        apptKey,
        hours,
        reportNotes,
        date,
      });
      if (result.data.error) {
        this.setState({
          modalLoading: false,
          modalError: result.data.message,
        });
      } else {
        this.setState({
          modalLoading: false,
          showApptModal: false,
        });
      }
    } catch (error) {
      this.setState({
        modalLoading: false,
        modalError: error.toString(),
      });
    }
  };

  updateDate = () => {
    const { apptKey, selectedDate } = this.state;
    const { firebase } = this.props;
    this.setState({ modalLoading: true, modalError: "" });
    try {
      firebase.set(`/appointments/${apptKey}/date`, selectedDate, () => {
        this.setState({
          modalLoading: false,
          modalError: "",
          showApptModal: false,
        });
      });
    } catch (error) {
      this.setState({ modalLoading: false, modalError: error.toString() });
    }
  };

  handleModalClose = () => this.setState({ showApptModal: false });

  render() {
    const {
      modalError,
      modalLoading,
      showApptModal,
      selectedAppt,
      selectedDate,
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
            .filter(
              (key) =>
                myApptIds &&
                myApptIds.incomplete &&
                myApptIds.incomplete.includes(key)
            )
            .sort(
              (key1, key2) =>
                new Date(appointments[key1].date) -
                new Date(appointments[key2].date)
            )
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

    const table =
      !isLoaded(users, customers, myApptIds) ||
      (!isLoaded(appointments) &&
        myApptIds &&
        !isEmpty(myApptIds.incomplete)) ? (
        <div>Loading appointments...</div>
      ) : !myApptIds || isEmpty(myApptIds.incomplete) ? (
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
      new Date().toLocaleDateString("en-US", {
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

    const dateOptions = selectedAppt
      ? [
          new Date(selectedAppt.originalDate),
          new Date(selectedAppt.originalDate),
          new Date(selectedAppt.originalDate),
        ]
      : null;
    if (dateOptions) {
      dateOptions[0].setDate(dateOptions[1].getDate() - 1);
      dateOptions[2].setDate(dateOptions[1].getDate() + 1);
    }

    const modalBody = selectedAppt ? (
      <Modal.Body>
        <Form.Row>
          <Col className="label-column">Date:</Col>
          <Col>
            <Form.Control
              className="inline-dropdown"
              as="select"
              name="selectedDate"
              size="sm"
              onChange={this.handleChange}
              value={selectedDate}
            >
              {dateOptions.map((dateOption, index) => (
                <option key={index}>
                  {dateOption.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </Form.Control>
            <Button
              className="inline-button"
              variant="primary"
              size="sm"
              onClick={this.updateDate}
              disabled={selectedDate === selectedAppt.date || modalLoading}
            >
              Update Date
            </Button>
          </Col>
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
                {modalBody}
                {modalErrorBar}
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
                      onClick={this.completeAppointment}
                      disabled={modalLoading}
                    >
                      {modalLoading ? (
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                      ) : (
                        "Submit Report"
                      )}
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
    myApptIds: props.myApptIds,
    appointments: state.firebase.data.appointments,
  };
};

export default compose(
  firebaseConnect((props) =>
    isLoaded(props.myApptIds) &&
    !isEmpty(props.myApptIds) &&
    !isEmpty(props.myApptIds.incomplete)
      ? props.myApptIds.incomplete.map((apptId) => {
          return {
            path: `/appointments/${apptId}`,
          };
        })
      : null
  ),
  connect(mapStateToProps)
)(PageDash);
