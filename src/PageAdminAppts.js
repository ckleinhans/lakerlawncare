import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Autosuggest from "react-autosuggest";
import ReactTags from "react-tag-autocomplete";

class PageAdminStaff extends React.Component {
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
      date: appointments[key].date,
      customerName: customers[appointments[key].customer].name,
      rate: `$${appointments[key].rate.amount} ${appointments[key].rate.type}`,
      numStaff: appointments[key].numStaff,
      staffSuggestions: appointments[key].staffAssigned.map((uid) => {
        return { id: uid, name: users[uid].displayName };
      }),
      key: key,
    });
  };

  editAppointment = (key) => {
    this.setState({ modalLoading: true });
    this.pushAppointment(key);
  };

  addAppointment = () => {
    this.setState({ modalLoading: true });
    const key = this.props.firebase.push("/appointments").key;
    this.pushAppointment(key);
  };

  pushAppointment = (key) => {
    // TODO input validation

    const { customers, availableApptIds } = this.props;
    const { date, customerName, rate, numStaff, staffSuggestions } = this.state;
    const customer = Object.keys(customers).find(
      (id) => customers[id].name === customerName
    );

    const staffAssigned = staffSuggestions.map((suggestion) => suggestion.id);

    const data = {
      date,
      customer,
      rate,
      numStaff,
      staffAssigned,
    };

    // TODO replace staff assigned in available check with new updated assigned staff
    const availableChanged = availableApptIds.includes(key)
      ? staffAssigned.length >= numStaff
      : staffAssigned.length < numStaff;
    console.log(availableChanged);

    // Set the onUpdate callback based on if we also need to update available appointments or not
    const onUpdate = availableChanged
      ? () => {
          // Add/remove appt id from available list depending on if it is full ot not
          const newAvailableApptIds = availableApptIds.includes(key)
            ? availableApptIds.splice(availableApptIds.indexOf(key), 1)
            : availableApptIds.push(key);

          this.props.firebase.set(
            `/availableAppointments`,
            newAvailableApptIds,
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
          // Available appts dont need to be changed, just set state
          this.setState({
            modalLoading: false,
            modalError: "",
            showAddModal: false,
            showEditModal: false,
          });
        };

    this.props.firebase.set(`/appointments/${key}`, data, onUpdate);
  };

  handleChange = (event) =>
    this.setState({ [event.target.name]: event.target.value });

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
  handleCustomerChange = (_e, newValue) => {
    this.setState({
      customerName: newValue,
    });
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
      numStaff,
      customerSuggestions,
      staffSuggestions,
    } = this.state;
    const { appointments, customers, users } = this.props;

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
          .map((uid) => {
            return users[uid].displayName;
          })
          .join(", "); // string of all assigned uids
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
      <div class="alert alert-danger" role="alert">
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
        {modalErrorBar}
        <Form.Label>Date</Form.Label>
        <Form.Control
          name="date"
          onChange={this.handleChange}
          placeholder="Appointment Date"
          value={date}
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
        <Form.Control
          name="rate"
          onChange={this.handleChange}
          placeholder="Rate"
          value={rate}
        />
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
