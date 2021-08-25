import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { sendInvoice } from "../components/Utilities";

class PageAdminCustomers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddModal: false,
      showEditModal: false,
      showInvoiceModal: false,
      modalLoading: false,
      checkboxes: {},
      invoiceResults: {},
      modalError: "",
      name: "",
      email: "",
      address: "",
      phoneNumber: "",
      rate: "",
      frequency: "",
    };
  }

  handleShowEditModal = (key) => {
    const { customers } = this.props;
    this.setState({
      showEditModal: true,
      name: customers[key].name,
      email: customers[key].email || "",
      address: customers[key].address,
      phoneNumber: customers[key].phoneNumber || "",
      rate: customers[key].rate || "",
      frequency: customers[key].frequency || "",
      key: key,
    });
  };

  editCustomer = (key) => {
    this.setState({ modalLoading: true });
    try {
      this.pushCustomer(key);
    } catch (error) {
      this.setState({ modalError: error.toString(), modalLoading: false });
    }
  };

  addCustomer = () => {
    this.setState({ modalLoading: true });
    const key = this.props.firebase.push("/customers").key;
    try {
      this.pushCustomer(key);
    } catch (error) {
      this.setState({ modalError: error.toString(), modalLoading: false });
    }
  };

  pushCustomer = (key) => {
    const { name, email, address, phoneNumber, rate, frequency } = this.state;

    // Input validation
    if (!name) {
      return this.setState({
        modalError: "Customer name is required.",
        modalLoading: false,
      });
    }
    if (!address) {
      return this.setState({
        modalError: "Customer address is required.",
        modalLoading: false,
      });
    }
    if (!email && !phoneNumber) {
      return this.setState({
        modalError: "Customer email or phone number is required.",
        modalLoading: false,
      });
    }
    if (phoneNumber && !/^([0-9]{3}-[0-9]{3}-[0-9]{4})$/.test(phoneNumber)) {
      return this.setState({
        modalError: "Phone number must be formatted as 123-456-7890",
        modalLoading: false,
      });
    }
    if (rate && !/^([0-9.]+)$/.test(rate)) {
      return this.setState({
        modalError: "Rate must be a valid number.",
        modalLoading: false,
      });
    }
    if (frequency && !/^([0-9]+)$/.test(frequency)) {
      return this.setState({
        modalError: "Frequency must be an integer.",
        modalLoading: false,
      });
    }

    const data = {
      name,
      email: email.toLowerCase() || null,
      address,
      phoneNumber: phoneNumber || null,
      rate: rate || null,
      frequency: frequency || null,
    };

    const onUpdate = () => {
      this.setState({
        modalLoading: false,
        modalError: "",
        showAddModal: false,
        showEditModal: false,
      });
    };

    this.props.firebase.set(`/customers/${key}`, data, onUpdate);
  };

  sendInvoices = async () => {
    const { finances, customers, firebase, companyVenmo } = this.props;
    const checkboxes = { ...this.state.checkboxes };

    this.setState({ modalLoading: true });

    const invoiceResults = {};
    const keys = Object.keys(checkboxes).filter((key) => checkboxes[key]);
    for (var customerId of keys) {
      checkboxes[customerId] = false;
      this.setState({
        currentInvoiceKey: customerId,
        invoiceResults,
        checkboxes,
      });
      try {
        invoiceResults[customerId] = await sendInvoice(
          firebase,
          finances,
          customers,
          companyVenmo,
          customerId
        );
      } catch (error) {
        invoiceResults[customerId] = { error: true, message: error.message };
      }
    }
    this.setState({
      modalLoading: false,
      currentInvoiceKey: "",
      invoiceResults,
      checkboxes,
    });
  };

  handleCheckboxChange = (event) => {
    const checkboxes = this.state.checkboxes;
    checkboxes[event.target.name] = event.target.checked;
    this.setState({ checkboxes });
  };

  handleChange = (event) =>
    this.setState({ [event.target.name]: event.target.value });

  handleModalClose = () =>
    this.setState({
      showAddModal: false,
      showEditModal: false,
      showInvoiceModal: false,
      modalError: "",
      name: "",
      email: "",
      address: "",
      phoneNumber: "",
      rate: "",
      frequency: "",
    });

  render() {
    const {
      modalError,
      modalLoading,
      showAddModal,
      showEditModal,
      showInvoiceModal,
      checkboxes,
      invoiceResults,
      currentInvoiceKey,
      name,
      email,
      address,
      phoneNumber,
      rate,
      frequency,
    } = this.state;
    const { customers, finances } = this.props;
    const owed = {};
    const paid = {};

    let table;
    if (!isLoaded(customers, finances)) {
      table = <div>Loading customers...</div>;
    } else if (isEmpty(customers)) {
      table = <div>No customers in the database.</div>;
    } else {
      Object.keys(customers).forEach((key) => {
        owed[key] = finances.customers[key]
          ? Object.values(finances.customers[key].transactions).reduce(
              (total, current) => (total += current.amount),
              0
            )
          : 0.0;
        paid[key] = finances.customers[key]
          ? Object.values(finances.customers[key].transactions)
              .filter((transaction) => transaction.amount > 0)
              .reduce((total, current) => (total += current.amount), 0)
          : 0.0;
      });

      table = (
        <div>
          Click a customer to see details and actions.
          <div className="table-container">
            <Table striped bordered hover className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Email Address</th>
                  <th>Phone #</th>
                  <th>Rate</th>
                  <th>Freq.</th>
                  <th>Owed</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(customers)
                  .sort((key1, key2) =>
                    customers[key1].name.localeCompare(customers[key2].name)
                  )
                  .map((key) => (
                    <tr
                      key={key}
                      className="clickable-row"
                      onClick={() => this.handleShowEditModal(key)}
                    >
                      <td>{customers[key].name}</td>
                      <td>{customers[key].address}</td>
                      <td>{customers[key].email}</td>
                      <td className="nowrap">{customers[key].phoneNumber}</td>
                      <td className="nowrap">
                        {customers[key].rate
                          ? `$${customers[key].rate}`
                          : "None"}
                      </td>
                      <td className="nowrap">
                        {customers[key].frequency || "None"}
                      </td>
                      <td className="nowrap">
                        {finances.customers[key]
                          ? `$${owed[key].toFixed(2)}`
                          : "None"}
                      </td>
                      <td className="nowrap">
                        {finances.customers[key]
                          ? `$${paid[key].toFixed(2)}`
                          : "None"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </div>
        </div>
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

    const modalBody = (
      <Modal.Body>
        <Form.Label>Name</Form.Label>
        <Form.Control
          name="name"
          onChange={this.handleChange}
          placeholder="Customer Name"
          value={name}
        />
        <br />
        <Form.Label>Address</Form.Label>
        <Form.Control
          name="address"
          onChange={this.handleChange}
          placeholder="Address"
          value={address}
        />
        <br />
        <Form.Label>Email</Form.Label>
        <Form.Control
          name="email"
          onChange={this.handleChange}
          placeholder="Email"
          value={email}
        />
        <br />
        <Form.Label>Phone Number</Form.Label>
        <Form.Control
          name="phoneNumber"
          onChange={this.handleChange}
          placeholder="Phone Number"
          value={phoneNumber}
        />
        <br />
        <Form.Label>Rate ($)</Form.Label>
        <Form.Control
          name="rate"
          onChange={this.handleChange}
          placeholder="Rate ($)"
          value={rate}
        />
        <br />
        <Form.Label>Frequency</Form.Label>
        <Form.Control
          name="frequency"
          onChange={this.handleChange}
          placeholder="Mowing Frequency (Days)"
          value={frequency}
        />
      </Modal.Body>
    );

    const numInvoicesSelected = Object.values(checkboxes).filter(
      (value) => value
    ).length;

    return (
      <div className="navbar-page">
        <div className="container">
          <h2 className="inline-header">Customer List</h2>
          <Button
            className="float-header"
            variant="secondary"
            onClick={() => {
              const checkboxes = {};
              Object.keys(owed)
                .filter((key) => owed[key] !== 0)
                .forEach((key) => (checkboxes[key] = false));
              this.setState({
                showInvoiceModal: true,
                checkboxes,
              });
            }}
          >
            Send Invoices
          </Button>
          <Button
            className="float-header"
            variant="success"
            onClick={() =>
              this.setState({
                showAddModal: true,
              })
            }
          >
            + Add Customer
          </Button>
          {table}

          <Modal show={showAddModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Add Customer</Modal.Title>
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
              <Button
                variant="success"
                onClick={this.addCustomer}
                disabled={modalLoading}
              >
                Add Customer
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showEditModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Customer</Modal.Title>
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
              <Button
                variant="primary"
                onClick={() => this.editCustomer(this.state.key)}
                disabled={modalLoading}
              >
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showInvoiceModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Mass Send Invoices</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Select all customers you wish to send invoices to.
              <Table size="sm" hover>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Owed</th>
                    <th>
                      <Form.Check
                        type="checkbox"
                        name="selectAll"
                        checked={
                          !Object.keys(checkboxes).find(
                            (key) => !checkboxes[key]
                          )
                        }
                        disabled={modalLoading}
                        onChange={(event) => {
                          const { checkboxes } = this.state;
                          Object.keys(checkboxes).forEach(
                            (key) => (checkboxes[key] = event.target.checked)
                          );
                          this.setState({ checkboxes });
                        }}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(owed)
                    .filter((key) => owed[key] !== 0)
                    .map((key) => {
                      return (
                        <tr
                          title={
                            invoiceResults[key]
                              ? invoiceResults[key].message
                              : null
                          }
                          style={
                            invoiceResults[key]
                              ? invoiceResults[key].error
                                ? { background: "#ffa9a9" }
                                : { background: "#d9ead3" }
                              : null
                          }
                          key={key}
                        >
                          <td>{customers[key].name}</td>
                          <td>{`$${owed[key].toFixed(2)}`}</td>
                          <td>
                            {currentInvoiceKey === key ? (
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                              />
                            ) : (
                              <Form.Check
                                type="checkbox"
                                name={key}
                                checked={checkboxes[key]}
                                disabled={modalLoading}
                                onChange={this.handleCheckboxChange}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
            </Modal.Body>
            {modalErrorBar}
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={this.handleModalClose}
                disabled={modalLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={this.sendInvoices}
                disabled={modalLoading || numInvoicesSelected === 0}
              >
                Send {numInvoicesSelected} Invoices
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
    finances: state.firebase.data.finances,
  };
};

export default compose(
  firebaseConnect((props) => {
    return [{ path: "/finances/customers" }];
  }),
  connect(mapStateToProps)
)(PageAdminCustomers);
