import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Autosuggest from "react-autosuggest";
import ReactTags from "react-tag-autocomplete";
import DatePicker from "react-datepicker";

class PageAdminAppts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddModal: false,
      showEditModal: false,
      modalLoading: false,
      modalError: "",
      date: "",
      customerName: "",
      rate: "",
      rateType: "Select",
      numStaff: "",
      customerSuggestions: [],
      staffSuggestions: [],
    };
  }

  handleShowEditModal = (key) => {
    const { appointments, customers, users } = this.props;
    this.setState({
      showEditModal: true,
      modalError: "",
      date: new Date(appointments[key].date),
      customerName: customers[appointments[key].customer].name,
      rate: appointments[key].rate.amount,
      rateType: appointments[key].rate.type,
      numStaff: appointments[key].numStaff,
      staffSuggestions: appointments[key].staffAssigned
        ? appointments[key].staffAssigned.map((uid) => {
            return { id: uid, name: users[uid].displayName };
          })
        : [],
      key: key,
    });
  };

  editAppointment = (key) => {
    this.setState({ modalLoading: true });
    try {
      this.pushAppointment(key);
    } catch (error) {
      this.setState({ modalError: error.toString() });
    }
  };

  addAppointment = () => {
    this.setState({ modalLoading: true });
    const key = this.props.firebase.push("/appointments").key;
    try {
      this.pushAppointment(key);
    } catch (error) {
      this.setState({ modalError: error.toString() });
    }
  };

  pushAppointment = (key) => {
    const { customers, availableApptIds, assignedAppointments } = this.props;
    const {
      date,
      customerName,
      rate,
      numStaff,
      staffSuggestions,
      rateType,
    } = this.state;
    const customer = Object.keys(customers).find(
      (id) => customers[id].name === customerName
    );
    const staffAssigned = staffSuggestions.map((suggestion) => suggestion.id);

    if (!date) {
      return this.setState({
        modalError: "Date is required.",
        modalLoading: false,
      });
    }
    if (!customerName) {
      return this.setState({
        modalError: "Customer is required.",
        modalLoading: false,
      });
    }
    if (!/^([0-9.]+)$/.test(rate)) {
      return this.setState({
        modalError: "Rate must be a number.",
        modalLoading: false,
      });
    }
    if (rateType === "Select") {
      return this.setState({
        modalError: "Rate type is required.",
        modalLoading: false,
      });
    }
    if (!/^([0-9]+)$/.test(numStaff)) {
      return this.setState({
        modalError: "Number of staff must be a number.",
        modalLoading: false,
      });
    }
    if (staffAssigned.length > Number(numStaff)) {
      return this.setState({
        modalError: "Too many staff assigned!",
        modalLoading: false,
      });
    }

    const data = {
      date: date.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      customer,
      rate: {
        amount: Number(rate),
        type: rateType,
      },
      numStaff: Number(numStaff),
      staffAssigned,
    };

    // Decide if available status changed & compute potential new available list
    const availableChanged =
      availableApptIds && availableApptIds.includes(key)
        ? staffAssigned.length >= numStaff
        : staffAssigned.length < numStaff;

    const newAvailableApptIds = availableApptIds
      ? [].concat(availableApptIds)
      : [];
    if (newAvailableApptIds.includes(key)) {
      newAvailableApptIds.splice(newAvailableApptIds.indexOf(key), 1);
    } else {
      newAvailableApptIds.push(key);
    }

    // Search through new staff assigned to find any that didn't have appt before
    const newAssignedAppointments = {};
    staffAssigned.forEach((uid) => {
      // If didn't have appt before, push appt id to list of assigned appts
      if (
        !assignedAppointments ||
        !assignedAppointments[uid] ||
        !assignedAppointments[uid].includes(key)
      ) {
        newAssignedAppointments[uid] =
          assignedAppointments && assignedAppointments[uid]
            ? assignedAppointments[uid].concat([key])
            : [key];
      }
    });

    // Search for old assigned staff who are not in new staff list & remove appt from their list
    if (assignedAppointments)
      Object.keys(assignedAppointments).forEach((uid) => {
        if (
          assignedAppointments[uid].includes(key) &&
          !staffAssigned.includes(uid)
        ) {
          newAssignedAppointments[uid] = assignedAppointments[uid];
          newAssignedAppointments[uid].splice(
            newAssignedAppointments[uid].indexOf(key),
            1
          );
        }
      });

    // If staff assigned changed, update all of their appt lists within callback
    const newAssignedApptsCallback = newAssignedAppointments
      ? () => {
          this.props.firebase.update(
            "/assignedAppointments",
            newAssignedAppointments,
            () => {
              this.setState({
                modalLoading: false,
                modalError: "",
                showAddModal: false,
                showEditModal: false,
              });
            }
          );
        }
      : () => {
          this.setState({
            modalLoading: false,
            modalError: "",
            showAddModal: false,
            showEditModal: false,
          });
        };

    // Set the onUpdate callback based on if we also need to update available appointments or not
    const onUpdate = availableChanged
      ? () => {
          this.props.firebase.set(
            `/availableAppointments`,
            newAvailableApptIds,
            newAssignedApptsCallback
          );
        }
      : newAssignedApptsCallback;

    this.props.firebase.set(`/appointments/${key}`, data, onUpdate);
  };

  handleChange = (event) => {
    const { customers } = this.props;
    const { customerName } = this.state;
    const data = { [event.target.name]: event.target.value };

    // If user entered rate type as flat, populate rate with customer's rate
    if (
      event.target.name === "rateType" &&
      event.target.value === "flat" &&
      customerName
    ) {
      const customerId = Object.keys(customers).find(
        (id) => customers[id].name === customerName
      );
      data.rate = customers[customerId].rate;
    }

    this.setState(data);
  };

  handleAddClose = () => this.setState({ showAddModal: false });

  handleEditClose = () => this.setState({ showEditModal: false });

  getSuggestions = (value) => {
    const { customers } = this.props;
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : Object.values(customers)
          .map((customer) => customer.name)
          .filter(
            (name) => name.toLowerCase().slice(0, inputLength) === inputValue
          );
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      customerSuggestions: [],
    });
  };

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      customerSuggestions: this.getSuggestions(value),
    });
  };

  renderSuggestion = (suggestion) => <div>{suggestion}</div>;

  getSuggestionValue = (suggestion) => suggestion;

  // handles changes to customer autosuggest
  handleCustomerChange = (e, newValue) => {
    const { rateType } = this.state;
    const { customers } = this.props;
    const data = { customerName: newValue };

    // If rate is flat, populate rate with customer's rate
    if (rateType === "flat") {
      const customerId = Object.keys(customers).find(
        (id) => customers[id].name === newValue
      );
      if (customerId) {
        data.rate = customers[customerId].rate;
      }
    }

    this.setState(data);
  };

  // reset customer if invalid, called onBlur (when input loses focus)
  handleCustomerReset = () => {
    const { customers } = this.props;
    const { customerName } = this.state;

    // don't reset if valid name
    if (
      Object.values(customers)
        .map((customer) => customer.name)
        .includes(customerName)
    ) {
      return;
    }

    // clear input if invalid
    this.setState({
      customerName: "",
    });
  };

  addStaff = (tag) => {
    const staffSuggestions = [].concat(this.state.staffSuggestions, tag);
    this.setState({ staffSuggestions });
  };

  removeStaff = (i) => {
    const staffSuggestions = this.state.staffSuggestions.slice(0);
    staffSuggestions.splice(i, 1);
    this.setState({ staffSuggestions });
  };

  filterStaffNameSuggestions = (query, suggestions) => {
    const inputValue = query.trim().toLowerCase();
    const inputLength = query.length;
    const staffIds = this.state.staffSuggestions.map(
      (suggestion) => suggestion.id
    );

    return inputLength === 0
      ? []
      : suggestions.filter(
          (suggestion) =>
            suggestion.name.toLowerCase().slice(0, inputLength) ===
              inputValue && !staffIds.includes(suggestion.id)
        );
  };

  render() {
    const {
      modalError,
      modalLoading,
      showAddModal,
      showEditModal,
      date,
      customerName,
      rate,
      rateType,
      numStaff,
      customerSuggestions,
      staffSuggestions,
    } = this.state;
    const { appointments, customers, users } = this.props;

    // Conditionally render table if data loaded from Firebase
    let table;
    if (!isLoaded(appointments, customers, users)) {
      table = <div>Loading appointments...</div>;
    } else if (isEmpty(appointments)) {
      table = <div>No appointments in the database.</div>;
    } else {
      const keys = Object.keys(appointments);

      const tableContent = keys.map((key) => {
        const customer = customers[appointments[key].customer].name; // This is only uid need to populate the customer
        const date = appointments[key].date;
        const rate = `$${appointments[key].rate.amount} ${appointments[key].rate.type}`;
        const numStaff = appointments[key].numStaff;
        const staffAssigned = appointments[key].staffAssigned
          ? appointments[key].staffAssigned
              .map((uid) => {
                return users[uid].displayName;
              })
              .join(", ")
          : "None";
        const apptEditButton = (
          <Button
            variant="primary"
            onClick={() => this.handleShowEditModal(key)}
          >
            Edit
          </Button>
        );
        // TODO add ability to remove staff and assign to others

        return (
          <tr key={key}>
            <td>{date}</td>
            <td>{customer}</td>
            <td>{rate}</td>
            <td>{numStaff}</td>
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
              <th># Staff</th>
              <th>Staff</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>{tableContent}</tbody>
        </Table>
      );
    }

    const modalErrorBar = modalError ? (
      <div
        style={{ marginBottom: "-5px" }}
        className="alert alert-danger"
        role="alert"
      >
        {modalError}
      </div>
    ) : null;

    const customerSuggestInputProps = {
      placeholder: "Customer Name",
      value: customerName,
      name: "customerName",
      onBlur: () => this.handleCustomerReset(),
      onChange: (e, { newValue }) => this.handleCustomerChange(e, newValue),
    };

    const staffNameSuggestions = Object.keys(users).map((key) => {
      return { id: key, name: users[key].displayName };
    });

    const modalBody = (
      <Modal.Body>
        <Form.Label>Date</Form.Label>
        <DatePicker
          selected={date}
          onChange={(date) => this.setState({ date })}
          placeholderText="Appointment Date"
        />
        <br />
        <Form.Label>Customer Name</Form.Label>
        <Autosuggest
          suggestions={customerSuggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={customerSuggestInputProps}
        />
        <br />
        {/* TODO make rate 2 inputs for type and amount*/}
        <Form.Label>Rate</Form.Label>
        <Form.Row>
          <Col>
            <Form.Control
              name="rate"
              onChange={this.handleChange}
              placeholder="Amount ($)"
              value={rate}
            />
          </Col>
          <Col>
            <Form.Control
              as="select"
              name="rateType"
              onChange={this.handleChange}
              value={rateType}
            >
              <option disabled>Select</option>
              <option>flat</option>
              <option>hourly</option>
            </Form.Control>
          </Col>
        </Form.Row>
        <br />
        <Form.Label>Number of Staff</Form.Label>
        <Form.Control
          name="numStaff"
          onChange={this.handleChange}
          placeholder="# Staff"
          value={numStaff}
        />
        <br />
        <Form.Label>Staff Assigned</Form.Label>
        <ReactTags
          onAddition={this.addStaff}
          onDelete={this.removeStaff}
          placeholderText="Add Staff"
          suggestions={staffNameSuggestions}
          tags={staffSuggestions}
          minQueryLength={1}
          suggestionsTransform={this.filterStaffNameSuggestions}
        />
      </Modal.Body>
    );

    return (
      <div className="navbar-page">
        <div className="container" style={{ minWidth: 900 }}>
          <h2 className="inline-header">Appointment List</h2>
          <Button
            className="header-button"
            variant="success"
            onClick={() =>
              this.setState({
                showAddModal: true,
                modalError: "",
                date: "",
                customerName: "",
                rate: "",
                rateType: "Select",
                numStaff: "",
                staffSuggestions: [],
              })
            }
          >
            + Create Appointment
          </Button>
          {table}

          <Modal show={showAddModal} onHide={this.handleAddClose}>
            <Modal.Header closeButton>
              <Modal.Title>Create Appointment</Modal.Title>
            </Modal.Header>
            {modalErrorBar}
            {modalBody}
            <Modal.Footer>
              <Button
                variant="success"
                onClick={this.addAppointment}
                disabled={modalLoading}
              >
                Create Appointment
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showEditModal} onHide={this.handleEditClose}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Appointment</Modal.Title>
            </Modal.Header>
            {modalErrorBar}
            {modalBody}
            <Modal.Footer>
              <Button
                variant="primary"
                onClick={() => this.editAppointment(this.state.key)}
                disabled={modalLoading}
              >
                Save Changes
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
    appointments: state.firebase.data["appointments"],
    customers: state.firebase.data["customers"],
    assignedAppointments: state.firebase.data["assignedAppointments"],
  };
};

export default compose(
  firebaseConnect((props) => {
    return [
      { path: "/appointments", storeAs: "appointments" },
      { path: "/customers", storeAs: "customers" },
      { path: "/assignedAppointments", storeAs: "assignedAppointments" },
    ];
  }),
  connect(mapStateToProps)
)(PageAdminAppts);
