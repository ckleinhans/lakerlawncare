import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Autocomplete from "../components/Autocomplete";

class PageAdminFinances extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCustomerModal: false,
      showStaffModal: false,
      showTransactionModal: false,
      modalError: "",
      modalLoading: false,
      checkboxes: {},
      typeSelect: "All Transactions",
      customerName: "",
      customerId: "",
      staffName: "",
      staffId: "",
    };
  }

  handleChange = (event) => {
    const data = { [event.target.name]: event.target.value };
    if (event.target.name === "typeSelect") {
      data.customerName = "";
      data.customerId = "";
      data.staffId = "";
      data.staffName = "";
    }
    this.setState(data);
  };

  handleCustomerChange = (newValue) => {
    const { customers } = this.props;
    const data = { customerName: newValue };

    // If custmer is valid, set customer ID
    const customerId = Object.keys(customers).find(
      (id) => customers[id].name === newValue
    );
    if (customerId) {
      data.customerId = customerId;
    }

    this.setState(data);
  };

  handleStaffChange = (newValue) => {
    const { users } = this.props;
    const data = { staffName: newValue };

    // If staff is valid, set staff ID
    const staffId = Object.keys(users).find(
      (id) => users[id].displayName === newValue
    );
    if (staffId) {
      data.staffId = staffId;
    }

    this.setState(data);
  };

  // closes all modals
  handleModalClose = () =>
    this.setState({
      showCustomerModal: false,
      showStaffModal: false,
      showTransactionModal: false,
    });

  addTransaction = () => {
    alert("Adding Transactions is still under construction.");
  };

  payStaff = () => {
    this.setState({ modalError: "Modal error test" });
  };

  customerPayment = () => {
    alert("Recording customer payments is still under construction.");
  };

  render() {
    const { customers, users, finances } = this.props;
    const {
      showCustomerModal,
      showStaffModal,
      showTransactionModal,
      modalError,
      modalLoading,
      checkboxes,
      typeSelect,
      customerName,
      customerId,
      staffName,
      staffId,
    } = this.state;

    const transactions = [];
    if (finances && finances.staff && finances.customers) {
      if (typeSelect === "Customers" && customerId) {
        if (
          finances.customers[customerId] &&
          finances.customers[customerId].transactions
        ) {
          transactions.push(
            ...Object.keys(finances.customers[customerId].transactions).map(
              (key) => {
                return {
                  ...finances.customers[customerId].transactions[key],
                  key: key,
                  payer: customers[customerId].name,
                  sortPriority: 1,
                };
              }
            )
          );
        }
      } else if (typeSelect === "Staff" && staffId) {
        if (finances.staff[staffId] && finances.staff[staffId].transactions) {
          transactions.push(
            ...Object.keys(finances.staff[staffId].transactions).map((key) => {
              return {
                ...finances.staff[staffId].transactions[key],
                key: key,
                payer: users[staffId].displayName,
                sortPriority: 0,
              };
            })
          );
        }
      } else {
        // "All Transactions"
        Object.keys(finances.staff).forEach((id) => {
          if (finances.staff[id].transactions)
            transactions.push(
              ...Object.keys(finances.staff[id].transactions)
                .filter(
                  (key) => finances.staff[id].transactions[key].amount > 0
                )
                .map((key) => {
                  return {
                    ...finances.staff[id].transactions[key],
                    key: key,
                    amount: finances.staff[id].transactions[key].amount * -1,
                    payer: users[id].displayName,
                    sortPriority: 0,
                  };
                })
            );
        });
        Object.keys(finances.customers).forEach((id) => {
          if (finances.customers[id].transactions)
            transactions.push(
              ...Object.keys(finances.customers[id].transactions)
                .filter(
                  (key) => finances.customers[id].transactions[key].amount > 0
                )
                .map((key) => {
                  return {
                    ...finances.customers[id].transactions[key],
                    key: key,
                    payer: customers[id].name,
                    sortPriority: 1,
                  };
                })
            );
        });
      }
    }

    const runningBalance = [];
    const tableContent = transactions
      .sort((transaction1, transaction2) => {
        if (transaction2.date === transaction1.date)
          return transaction2.sortPriority - transaction1.sortPriority;
        else return new Date(transaction1.date) - new Date(transaction2.date);
      })
      .map((transaction, index) => {
        const { key, date, description, amount, payer, complete } = transaction;
        runningBalance[index] = runningBalance[index - 1]
          ? runningBalance[index - 1] + amount
          : amount;
        const style = !complete ? { color: "#d20000" } : null;
        return (
          <tr key={key} style={style}>
            <td>{date}</td>
            <td>{payer}</td>
            <td>{description}</td>
            <td>{`$${amount.toFixed(2)}`}</td>
            <td>{`$${runningBalance[index].toFixed(2)}`}</td>
          </tr>
        );
      })
      .reverse();

    // conditionally render additional name input, default to nothing
    const nameInput =
      typeSelect === "Customers" ? (
        <div className="header-input">
          <Autocomplete
            valueArray={Object.values(customers).map(
              (customer) => customer.name
            )}
            onChange={this.handleCustomerChange}
            value={customerName}
            placeholder="Customer Name"
          />
        </div>
      ) : typeSelect === "Staff" ? (
        <div className="header-input">
          <Autocomplete
            valueArray={Object.values(users).map((user) => user.displayName)}
            onChange={this.handleStaffChange}
            value={staffName}
            placeholder="Staff Name"
          />
        </div>
      ) : null;

    // conditionally render right floating header block, default to all transactions view
    const floatHeaderBlock = customerId ? (
      <div className="float-header">
        <Button
          className="float-header"
          variant="primary"
          onClick={() => {
            const checkboxes = {};
            transactions
              .filter((transaction) => !transaction.complete)
              .forEach((transaction) => (checkboxes[transaction.key] = false));
            this.setState({
              showCustomerModal: true,
              checkboxes,
            });
          }}
        >
          Record Payment by {customers[customerId].name}
        </Button>
      </div>
    ) : staffId ? (
      <div className="float-header">
        <Button
          className="float-header"
          variant="primary"
          onClick={() => {
            const checkboxes = {};
            transactions
              .filter((transaction) => !transaction.complete)
              .forEach((transaction) => (checkboxes[transaction.key] = false));
            this.setState({
              showStaffModal: true,
              checkboxes,
            });
          }}
        >
          Pay {users[staffId].displayName}
        </Button>
      </div>
    ) : (
      <div className="float-header">
        <Button
          className="float-header"
          variant="success"
          onClick={() => this.setState({ showTransactionModal: true })}
        >
          + Add Transaction
        </Button>
      </div>
    );

    const table = !isLoaded(finances, customers, users) ? (
      <div>Loading finances...</div>
    ) : isEmpty(finances, customers, users, transactions) ? (
      <div>No transactions in the database.</div>
    ) : (
      <div>
        <div className="table-container">
          <Table striped bordered hover className="page-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payer/Payee</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Total</th>
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

    let totalSelected = 0;
    transactions
      .filter(
        (transaction) => !transaction.complete && checkboxes[transaction.key]
      )
      .forEach((transaction) => (totalSelected += transaction.amount));

    const modalBody = (
      <Modal.Body>
        <Table size="sm" hover>
          <thead>
            <tr>
              <th>
                {customerId
                  ? customers[customerId].name
                  : staffId
                  ? users[staffId].displayName
                  : null}
                <span style={{ float: "right" }}>Selected:</span>
              </th>
              <th>{`$${totalSelected.toFixed(2)}`}</th>
              <th>Check</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .filter((transaction) => !transaction.complete)
              .map((transaction) => {
                const { date, amount, key } = transaction;
                return (
                  <tr key={key}>
                    <td>{date}</td>
                    <td>{`$${amount.toFixed(2)}`}</td>
                    <td>Check</td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Modal.Body>
    );

    return (
      <div className="navbar-page">
        <div className="container">
          <h2>Finances</h2>
          <div className="inline-header">
            <Form.Control
              as="select"
              className="header-select"
              name="typeSelect"
              onChange={this.handleChange}
              value={typeSelect}
            >
              <option>All Transactions</option>
              <option>Customers</option>
              <option>Staff</option>
            </Form.Control>
            {nameInput}
          </div>
          {floatHeaderBlock}
          {table}

          <Modal show={showCustomerModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Record Payment</Modal.Title>
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
                onClick={this.recordPayment}
                disabled={modalLoading || !totalSelected}
              >
                Record Payment of {`$${totalSelected.toFixed(2)}`}
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showStaffModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Pay Staff</Modal.Title>
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
                onClick={this.payStaff}
                disabled={modalLoading || !totalSelected}
              >
                Pay Staff {`$${totalSelected.toFixed(2)}`}
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showTransactionModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Add Transaction</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Transaction modal body is under construction.
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
                variant="success"
                onClick={this.addTransaction}
                disabled={modalLoading}
              >
                Add Transaction
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
  };
};

export default compose(
  firebaseConnect((props) => {
    return [{ path: "/finances", storeAs: "finances" }];
  }),
  connect(mapStateToProps)
)(PageAdminFinances);
