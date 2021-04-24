import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
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
      email: customers[key].email,
      address: customers[key].address,
      phoneNumber: customers[key].phoneNumber,
      rate: customers[key].rate,
      frequency: customers[key].frequency || "None",
      key: key,
    });
  };

  editCustomer = (key) => {
    this.setState({ modalLoading: true });
    this.pushCustomer(key);
  };

  addCustomer = () => {
    this.setState({ modalLoading: true });
    const key = this.props.firebase.push("/customers").key;
    this.pushCustomer(key);
  };

  pushCustomer = (key) => {
    const { name, email, address, phoneNumber, rate, frequency } = this.state;
    const data = {
      name,
      email,
      address,
      phoneNumber,
      rate,
      frequency,
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
      const keys = Object.keys(customers);

      const tableContent = keys.map((key) => {
        const name = customers[key].name;
        const address = customers[key].address;
        const email = customers[key].email;
        const phoneNumber = customers[key].phoneNumber;
        const rate = customers[key].rate;
        const frequency = customers[key].frequency || "None";
        const amountOwed = finances[key] ? finances[key].owed : 0;
        const amountPaid = finances[key] ? finances[key].paid : 0;
        const editButton = (
          <Button
            variant="primary"
            onClick={() => this.handleShowEditModal(key)}
          >
            Edit
          </Button>
        );

        return (
          <tr key={key}>
            <td>{name}</td>
            <td>{address}</td>
            <td>{email}</td>
            <td>{phoneNumber}</td>
            <td>{rate}</td>
            <td>{frequency}</td>
            <td>{amountOwed}</td>
            <td>{amountPaid}</td>
            <td>{editButton}</td>
          </tr>
        );
      });

      table = (
        <Table striped bordered hover>
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

    const modalBody = (
      <Modal.Body>
        {modalErrorBar}
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
          placeholder="Mowing Frequency"
          value={frequency}
        />
      </Modal.Body>
    );

    return (
      <div className="navbar-page">
        <div className="container" style={{ minWidth: 900 }}>
          <h2 className="inline-header">Customer List</h2>
          <Button
            className="header-button"
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
            <Modal.Footer>
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
            <Modal.Footer>
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
    finances: state.firebase.data["finances"],
    customers: state.firebase.data["customers"],
  };
};

export default compose(
  firebaseConnect((props) => {
    return [
      { path: "/finances/customers", storeAs: "finances" },
      { path: "/customers", storeAs: "customers" },
    ];
  }),
  connect(mapStateToProps)
)(PageAdminCustomers);
