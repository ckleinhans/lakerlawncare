import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import DatePicker from "react-datepicker";
import Autocomplete from "../components/Autocomplete";
import { Link } from "react-router-dom";
import Invoice from "../components/Invoice";
import {
  getTransactions,
  getDateString,
  sendInvoice,
} from "../components/Utilities";

class PageAdminFinances extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: "",
      transactionMethod: "Transaction Method",
      description: "",
      showCustomerModal: false,
      showStaffModal: false,
      showTransactionModal: false,
      showInvoiceModal: false,
      showEditModal: false,
      modalError: "",
      modalLoading: false,
      payLinkClicked: false,
      checkboxes: {},
      modalTypeSelect: "Payer/Payee",
      modalCustomerName: "",
      modalCustomerId: "",
      modalStaffName: "",
      modalStaffId: "",
      modalTransactionAmount: "",
      modalComplete: false,
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
    } else if (event.target.name === "modalTypeSelect") {
      data.modalCustomerName = "";
      data.modalCustomerId = "";
      data.modalStaffId = "";
      data.modalStaffName = "";
    }
    this.setState(data);
  };

  handleCheckboxChange = (event) => {
    const checkboxes = this.state.checkboxes;
    checkboxes[event.target.name] = event.target.checked;
    this.setState({ checkboxes });
  };

  handleCustomerChange = (newValue, propertyName) => {
    const { customers } = this.props;
    const data = {};
    data[`${propertyName}Name`] = newValue;

    // If custmer is valid, set customer ID
    const customerId = Object.keys(customers).find(
      (id) => customers[id].name === newValue
    );
    data[`${propertyName}Id`] = customerId || "";

    this.setState(data);
  };

  handleStaffChange = (newValue, propertyName) => {
    const { users } = this.props;
    const data = {};
    data[`${propertyName}Name`] = newValue;

    // If staff is valid, set staff ID
    const staffId = Object.keys(users).find(
      (id) => users[id].displayName === newValue
    );
    data[`${propertyName}Id`] = staffId || "";

    this.setState(data);
  };

  // closes all modals
  handleModalClose = () =>
    this.setState({
      showCustomerModal: false,
      showStaffModal: false,
      showTransactionModal: false,
      showInvoiceModal: false,
      showEditModal: false,
      date: "",
      transactionMethod: "Transaction Method",
      description: "",
      modalError: "",
      modalLoading: false,
      payLinkClicked: false,
      modalTypeSelect: "Payer/Payee",
      modalCustomerName: "",
      modalCustomerId: "",
      modalStaffName: "",
      modalStaffId: "",
      modalTransactionAmount: "",
      modalKey: "",
      modalComplete: false,
    });

  pushTransaction = () => {
    const { firebase, financeAccess } = this.props;
    const {
      modalCustomerId,
      modalStaffId,
      modalTransactionAmount,
      modalTypeSelect,
      description,
      date,
      transactionMethod,
      modalComplete,
      modalKey,
    } = this.state;

    if (!financeAccess) {
      return this.setState({
        modalLoading: false,
        modalError: "You do not have permission to edit financial data.",
      });
    }
    if (!date) {
      return this.setState({
        modalLoading: false,
        modalError: "Transaction date is required.",
      });
    }
    if (
      modalTypeSelect === "Payer/Payee" ||
      (modalTypeSelect === "Customer" && !modalCustomerId) ||
      (modalTypeSelect === "Staff" && !modalStaffId)
    ) {
      return this.setState({
        modalLoading: false,
        modalError: "Payer/Payee is required.",
      });
    }
    if (
      (modalTypeSelect === "Company" || modalComplete) &&
      transactionMethod === "Transaction Method"
    ) {
      return this.setState({
        modalLoading: false,
        modalError: "Transaction method is required for complete transactions.",
      });
    }
    if (
      !modalTransactionAmount ||
      !/^([0-9.-]+)$/.test(modalTransactionAmount)
    ) {
      return this.setState({
        modalLoading: false,
        modalError: "Transaction amount must be a valid number.",
      });
    }
    if (!description) {
      return this.setState({
        modalLoading: false,
        modalError: "Description is required.",
      });
    }

    const dataPath =
      modalTypeSelect === "Staff"
        ? `/finances/staff/${modalStaffId}/transactions`
        : modalTypeSelect === "Customer"
        ? `/finances/customers/${modalCustomerId}/transactions`
        : "/finances/company/transactions";

    const data = {
      amount:
        modalTypeSelect === "Staff"
          ? Number(modalTransactionAmount) * -1
          : Number(modalTransactionAmount),
      date: getDateString(date, false, true),
      complete: modalTypeSelect === "Company" || modalComplete,
      method:
        transactionMethod !== "Transaction Method" ? transactionMethod : null,
      description,
    };

    if (modalKey) {
      firebase.ref(`${dataPath}/${modalKey}`).set(data, this.handleModalClose);
    } else firebase.ref(dataPath).push(data, this.handleModalClose);
  };

  payStaff = () => {
    this.setState({ modalLoading: true });
    const { firebase, finances, financeAccess } = this.props;
    const { staffId, checkboxes, description } = this.state;

    if (!financeAccess) {
      return this.setState({
        modalLoading: false,
        modalError: "You do not have permission to edit financial data.",
      });
    }
    if (!description) {
      return this.setState({
        modalLoading: false,
        modalError: "Description is required.",
      });
    }

    const date = new Date();

    const transactions = { ...finances.staff[staffId].transactions };

    let totalAmount = 0;
    Object.keys(checkboxes)
      .filter((key) => checkboxes[key])
      .forEach((key) => {
        totalAmount += transactions[key].amount;
        transactions[key].complete = true;
      });

    firebase.ref(`/finances/staff/${staffId}/transactions`).push(
      {
        amount: totalAmount * -1,
        date: getDateString(date, false, true),
        complete: true,
        method: "Venmo",
        description,
      },
      this.handleModalClose
    );
  };

  customerPayment = () => {
    this.setState({ modalLoading: true });
    const { firebase, finances, financeAccess } = this.props;
    const { customerId, checkboxes, date, description, transactionMethod } =
      this.state;

    if (!financeAccess) {
      return this.setState({
        modalLoading: false,
        modalError: "You do not have permission to edit financial data.",
      });
    }
    if (!description || !date || transactionMethod === "Transaction Method") {
      return this.setState({
        modalLoading: false,
        modalError: "All fields are required.",
      });
    }

    const transactions = { ...finances.customers[customerId].transactions };

    let totalAmount = 0;
    Object.keys(checkboxes)
      .filter((key) => checkboxes[key])
      .forEach((key) => {
        totalAmount += transactions[key].amount;
        transactions[key].complete = true;
      });

    const key = firebase.push(
      `/finances/customers/${customerId}/transactions`
    ).key;
    transactions[key] = {
      amount: totalAmount * -1,
      date: getDateString(date, false, true),
      complete: true,
      method: transactionMethod,
      description,
    };

    firebase
      .ref(`/finances/customers/${customerId}/transactions`)
      .update(transactions, this.handleModalClose);
  };

  handleSendInvoice = async () => {
    const { customers, companyVenmo, firebase, finances } = this.props;
    const { customerId } = this.state;

    this.setState({ modalLoading: true });
    
    try {
      await sendInvoice(
        firebase,
        finances,
        customers,
        companyVenmo,
        customerId
      );
      this.handleModalClose();
    } catch (error) {
      this.setState({
        modalError: error.message,
        modalLoading: false,
      });
    }
  };

  render() {
    const { customers, users, finances, companyVenmo } = this.props;
    const {
      date,
      transactionMethod,
      description,
      showCustomerModal,
      showStaffModal,
      showTransactionModal,
      showInvoiceModal,
      showEditModal,
      modalError,
      modalLoading,
      checkboxes,
      typeSelect,
      customerName,
      customerId,
      staffName,
      staffId,
      payLinkClicked,
      modalTypeSelect,
      modalCustomerName,
      modalStaffName,
      modalTransactionAmount,
      modalComplete,
      modalKey,
    } = this.state;

    const transactions = isLoaded(finances, customers, users)
      ? getTransactions(
          finances,
          customers,
          users,
          typeSelect,
          customerId || staffId,
          customerName || staffName
        )
      : [];

    const runningBalance = [];
    const tableContent = transactions
      .map((transaction, index) => {
        const {
          key,
          date,
          description,
          amount,
          payer,
          payerType,
          complete,
          method,
        } = transaction;
        runningBalance[index] = runningBalance[index - 1]
          ? runningBalance[index - 1] + amount
          : amount;
        return (
          <tr
            className="clickable-row"
            key={key}
            style={!complete ? { color: "#d20000" } : null}
            onClick={() =>
              this.setState({
                showEditModal: true,
                date: new Date(date),
                modalTypeSelect: payerType,
                modalComplete: complete,
                modalCustomerName: payerType === "Customer" ? payer : "",
                modalCustomerId:
                  payerType === "Customer"
                    ? Object.keys(customers).find(
                        (key) => customers[key].name === payer
                      )
                    : "",
                modalStaffName: payerType === "Staff" ? payer : "",
                modalStaffId:
                  payerType === "Staff"
                    ? Object.keys(users).find(
                        (key) => users[key].displayName === payer
                      )
                    : "",
                transactionMethod: method ? method : "Transaction Method",
                modalTransactionAmount:
                  typeSelect === "Staff" ? amount * -1 : amount,
                modalKey: key,
                description,
              })
            }
          >
            <td className="nowrap">{date}</td>
            <td className="nowrap">{payer}</td>
            <td>
              {method && method !== "Owed"
                ? `${description} (${method})`
                : description}
            </td>
            <td className="nowrap">{`$${amount.toFixed(2)}`}</td>
            <td className="nowrap">{`$${runningBalance[index].toFixed(2)}`}</td>
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
            onChange={(newValue) =>
              this.handleCustomerChange(newValue, "customer")
            }
            value={customerName}
            placeholder="Customer Name"
          />
        </div>
      ) : typeSelect === "Staff" ? (
        <div className="header-input">
          <Autocomplete
            valueArray={Object.values(users).map((user) => user.displayName)}
            onChange={(newValue) => this.handleStaffChange(newValue, "staff")}
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
          Record Payment
        </Button>
        <Button
          className="float-header"
          variant="secondary"
          disabled={!transactions.find((transaction) => !transaction.complete)}
          onClick={() => {
            const checkboxes = {};
            transactions
              .filter((transaction) => !transaction.complete)
              .forEach((transaction) => (checkboxes[transaction.key] = true));
            this.setState({
              showInvoiceModal: true,
              checkboxes,
            });
          }}
        >
          Generate Invoice
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

    const paymentModalBody = (
      <Modal.Body>
        {typeSelect === "Customers" ? (
          <div>
            <DatePicker
              selected={date}
              onChange={(date) => this.setState({ date })}
              placeholderText="Transaction Date"
              showTimeSelect
              dateFormat="MM/dd/yyyy h:mm aa"
            />
            <br />
            <Form.Control
              as="select"
              name="transactionMethod"
              onChange={this.handleChange}
              value={transactionMethod}
            >
              <option disabled>Transaction Method</option>
              <option>Venmo</option>
              <option>Check</option>
              <option>Cash</option>
              <option>Zelle</option>
            </Form.Control>
            <br />
          </div>
        ) : null}
        <Form.Control
          as="textarea"
          name="description"
          placeholder="Write a brief transaction description"
          onChange={this.handleChange}
          value={description}
          disabled={payLinkClicked}
          rows={2}
        />
        <br />
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
              <th>
                <Form.Check
                  type="checkbox"
                  name="selectAll"
                  checked={
                    !Object.keys(checkboxes).find((key) => !checkboxes[key])
                  }
                  disabled={payLinkClicked}
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
            {transactions
              .filter((transaction) => !transaction.complete)
              .map((transaction) => {
                const { date, amount, key } = transaction;
                return (
                  <tr key={key}>
                    <td>{date}</td>
                    <td>{`$${amount.toFixed(2)}`}</td>
                    <td>
                      <Form.Check
                        type="checkbox"
                        name={key}
                        checked={checkboxes[key]}
                        disabled={payLinkClicked}
                        onChange={this.handleCheckboxChange}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
        {typeSelect === "Staff" ? (
          <div>
            <br />
            {staffId && users[staffId].venmo ? (
              !payLinkClicked ? (
                <a
                  href={`https://venmo.com/${
                    users[staffId].venmo
                  }?txn=pay&amount=${totalSelected}&audience=private&note=${encodeURIComponent(
                    description
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => this.setState({ payLinkClicked: true })}
                  style={{ textAlign: "center", display: "block" }}
                >
                  Click to complete Venmo transaction, then return to submit
                  transaction.
                </a>
              ) : (
                <div style={{ textAlign: "center" }}>
                  Link clicked, confirm transaction success and click button
                  below.
                </div>
              )
            ) : (
              <div style={{ color: "#c70000", textAlign: "center" }}>
                User has not linked their Venmo account!
              </div>
            )}
            <br />
          </div>
        ) : null}
      </Modal.Body>
    );

    const transactionModalBody = (
      <Modal.Body>
        <DatePicker
          selected={date}
          onChange={(date) => this.setState({ date })}
          placeholderText="Transaction Date"
          showTimeSelect
          dateFormat="MM/dd/yyyy h:mm aa"
        />
        <br />
        <Form.Control
          as="select"
          className="header-select"
          name="modalTypeSelect"
          disabled={modalKey}
          onChange={this.handleChange}
          value={modalTypeSelect}
        >
          <option disabled>Payer/Payee</option>
          <option>Company</option>
          <option>Customer</option>
          <option>Staff</option>
        </Form.Control>
        {modalTypeSelect === "Customer" ? (
          <div className="header-input">
            <Autocomplete
              valueArray={Object.values(customers).map(
                (customer) => customer.name
              )}
              onChange={(newValue) =>
                this.handleCustomerChange(newValue, "modalCustomer")
              }
              disabled={!!modalKey}
              value={modalCustomerName}
              placeholder="Customer Name"
            />
          </div>
        ) : modalTypeSelect === "Staff" ? (
          <div className="header-input">
            <Autocomplete
              valueArray={Object.values(users).map((user) => user.displayName)}
              onChange={(newValue) =>
                this.handleStaffChange(newValue, "modalStaff")
              }
              disabled={!!modalKey}
              value={modalStaffName}
              placeholder="Staff Name"
            />
          </div>
        ) : null}
        <br />
        <br />
        {modalTypeSelect === "Customer" || modalTypeSelect === "Staff" ? (
          <div>
            <Form.Check
              type="checkbox"
              name="modalComplete"
              label="Transaction completed?"
              checked={modalComplete}
              onChange={(event) =>
                this.setState({ modalComplete: event.target.checked })
              }
            />
            <br />
          </div>
        ) : null}
        {modalTypeSelect === "Company" || modalComplete ? (
          <div>
            <Form.Control
              as="select"
              name="transactionMethod"
              onChange={this.handleChange}
              value={transactionMethod}
            >
              <option disabled>Transaction Method</option>
              <option>Venmo</option>
              <option>Check</option>
              <option>Cash</option>
              <option>Owed</option>
            </Form.Control>
            <Form.Text muted>
              For transactions that are not paid directly using a listed
              transaction method, use the "Owed" designation.
            </Form.Text>
            <br />
          </div>
        ) : null}
        <Form.Control
          name="modalTransactionAmount"
          onChange={this.handleChange}
          placeholder="Amount ($)"
          value={modalTransactionAmount}
        />
        <Form.Text muted>
          Enter positive numbers for company revenue, negative for company
          expenses.
        </Form.Text>
        <br />
        <Form.Control
          as="textarea"
          name="description"
          placeholder="Write a brief transaction description"
          onChange={this.handleChange}
          value={description}
          disabled={payLinkClicked}
          rows={2}
        />
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
            {paymentModalBody}
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
                onClick={this.customerPayment}
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
            {paymentModalBody}
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
                disabled={modalLoading || !totalSelected || !payLinkClicked}
              >
                Log Payment of {`$${totalSelected.toFixed(2)}`}
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showTransactionModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Add Transaction</Modal.Title>
            </Modal.Header>
            {transactionModalBody}
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
                onClick={this.pushTransaction}
                disabled={modalLoading}
              >
                Add Transaction
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showEditModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Transaction</Modal.Title>
            </Modal.Header>
            {transactionModalBody}
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
                onClick={this.pushTransaction}
                disabled={modalLoading}
              >
                Save Transaction
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showInvoiceModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>
                Invoice for {customerId && customers[customerId].name}
              </Modal.Title>
            </Modal.Header>
            {companyVenmo ? (
              <Modal.Body style={{ overflowX: "auto" }}>
                <Invoice
                  customerName={customerId && customers[customerId].name}
                  transactions={transactions}
                  companyVenmo={companyVenmo}
                />
              </Modal.Body>
            ) : (
              <Modal.Body style={{ color: "#c70000" }}>
                The financial manager must link a company Venmo account from the{" "}
                <Link to="/app/profile">Profile Page</Link> before generating
                invoices.
              </Modal.Body>
            )}

            {modalErrorBar}
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={this.handleModalClose}
                disabled={modalLoading}
              >
                Close
              </Button>
              {companyVenmo && customerId && customers[customerId].email ? (
                <Button
                  variant="primary"
                  onClick={this.handleSendInvoice}
                  disabled={modalLoading}
                >
                  Send to {customers[customerId].email}
                </Button>
              ) : null}
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
    return [{ path: "/finances", storeAs: "finances" }];
  }),
  connect(mapStateToProps)
)(PageAdminFinances);
