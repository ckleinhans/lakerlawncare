import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";

class PageAdminCustomers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddModal: false,
      showEditModal: false,
      modalLoading: false,
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
      modalError: "",
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

  handleChange = (event) =>
    this.setState({ [event.target.name]: event.target.value });

  handleAddClose = () => this.setState({ showAddModal: false });

  handleEditClose = () => this.setState({ showEditModal: false });

  render() {
    const {
      modalError,
      modalLoading,
      showAddModal,
      showEditModal,
      name,
      email,
      address,
      phoneNumber,
      rate,
      frequency,
    } = this.state;
    const { customers, finances } = this.props;

    let table;
    if (!isLoaded(customers, finances)) {
      table = <div>Loading customers...</div>;
    } else if (isEmpty(customers)) {
      table = <div>No customers in the database.</div>;
    } else {
      const tableContent = Object.keys(customers)
        .sort((key1, key2) =>
          customers[key1].name.localeCompare(customers[key2].name)
        )
        .map((key) => {
          const name = customers[key].name;
          const address = customers[key].address;
          const email = customers[key].email;
          const phoneNumber = customers[key].phoneNumber;
          const rate = customers[key].rate ? `$${customers[key].rate}` : "None";
          const frequency = customers[key].frequency || "None";
          const amountOwed = isLoaded(finances.customers[key]) ? (
            `$${finances.customers[key].owed || 0}`
          ) : (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          );
          const amountPaid = isLoaded(finances.customers[key]) ? (
            `$${finances.customers[key].paid || 0}`
          ) : (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          );

          return (
            <tr
              key={key}
              className="clickable-row"
              onClick={() => this.handleShowEditModal(key)}
            >
              <td>{name}</td>
              <td>{address}</td>
              <td>{email}</td>
              <td>{phoneNumber}</td>
              <td>{rate}</td>
              <td>{frequency}</td>
              <td>{amountOwed}</td>
              <td>{amountPaid}</td>
            </tr>
          );
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
              <tbody>{tableContent}</tbody>
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

    return (
      <div className="navbar-page">
        <div className="container">
          <h2 className="inline-header">Customer List</h2>
          <Button
            className="float-header"
            variant="success"
            onClick={() =>
              this.setState({
                showAddModal: true,
                modalError: "",
                name: "",
                email: "",
                address: "",
                phoneNumber: "",
                rate: "",
                frequency: "",
              })
            }
          >
            + Add Customer
          </Button>
          {table}

          <Modal show={showAddModal} onHide={this.handleAddClose}>
            <Modal.Header closeButton>
              <Modal.Title>Add Customer</Modal.Title>
            </Modal.Header>
            {modalBody}
            {modalErrorBar}
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={this.handleAddClose}
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

          <Modal show={showEditModal} onHide={this.handleEditClose}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Customer</Modal.Title>
            </Modal.Header>
            {modalBody}
            {modalErrorBar}
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={this.handleEditClose}
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
    const paths = [];
    if (props.customers) {
      Object.keys(props.customers).forEach((id) => {
        paths.push(
          ...[
            {
              path: `/finances/customers/${id}/owed`,
            },
            {
              path: `/finances/customers/${id}/paid`,
            },
          ]
        );
      });
    }
    return paths;
  }),
  connect(mapStateToProps)
)(PageAdminCustomers);
