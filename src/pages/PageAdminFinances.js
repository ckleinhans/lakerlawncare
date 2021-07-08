import React from "react";
import ReactDOMServer from "react-dom/server";
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
      date: "",
      transactionMethod: "Transaction Method",
      description: "",
      modalLoading: false,
      payLinkClicked: false,
      modalTypeSelect: "Payer/Payee",
      modalCustomerName: "",
      modalCustomerId: "",
      modalStaffName: "",
      modalStaffId: "",
      modalTransactionAmount: "",
      modalComplete: false,
    });

  addTransaction = () => {
    this.setState({ modalLoading: true });
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

    firebase.ref(dataPath).push(
      {
        amount:
          modalTypeSelect === "Staff"
            ? Number(modalTransactionAmount) * -1
            : Number(modalTransactionAmount),
        date: date.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        complete: modalTypeSelect === "Company" || modalComplete,
        method: transactionMethod,
        description:
          modalTypeSelect === "Company" || modalComplete
            ? `(${transactionMethod}) ${description}`
            : description,
      },
      this.handleModalClose
    );
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

    const key = firebase.push(`/finances/staff/${staffId}/transactions`).key;
    transactions[key] = {
      amount: totalAmount * -1,
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      complete: true,
      method: "Venmo",
      description: `${description}`,
    };

    const data = { transactions };

    firebase.update(`/finances/staff/${staffId}`, data, this.handleModalClose);
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

    let owed = finances.customers[customerId].owed || 0;
    let paid = finances.customers[customerId].paid || 0;
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
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      complete: true,
      method: transactionMethod,
      description: `(${transactionMethod}) ${description}`,
    };

    owed -= totalAmount;
    paid += totalAmount;

    const data = { owed, paid, transactions };

    firebase.update(
      `/finances/customers/${customerId}`,
      data,
      this.handleModalClose
    );
  };

  sendInvoice = async () => {
    const { customers, companyVenmo, firebase } = this.props;
    const { customerId } = this.state;

    this.setState({ modalLoading: true });

    // check date of last invoice sent to customer to prevent duplicate sending
    const prevInvoice = new Date(customers[customerId].invoiceSendDate);
    prevInvoice.setHours(prevInvoice.getHours() + 36);
    if (prevInvoice >= new Date()) {
      return this.setState({
        modalError: `Invoice was sent in last 36 hours: ${customers[customerId].invoiceSendDate}`,
        modalLoading: false,
      });
    }

    const transactions = this.getTransactions();
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    const html = ReactDOMServer.renderToStaticMarkup(
      <Invoice
        customerName={customerId && customers[customerId].name}
        transactions={transactions}
        companyVenmo={companyVenmo}
      />
    );

    const sendEmail = this.props.firebase
      .functions()
      .httpsCallable("sendEmail");

    try {
      await sendEmail({
        email: customers[customerId].email,
        subject: `Laker Lawn Care ${date} Invoice`,
        html,
      });
      firebase.set(
        `/customers/${customerId}/invoiceSendDate`,
        new Date().toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        this.handleModalClose
      );
    } catch (error) {
      this.setState({
        modalError: error.message,
        modalLoading: false,
      });
    }
  };

  getTransactions = () => {
    const { finances, customers, users } = this.props;
    const { customerId, typeSelect, staffId } = this.state;

    const transactions = [];
    if (finances) {
      if (typeSelect !== "Staff" && customers && finances.customers) {
        Object.keys(finances.customers)
          .filter((id) => !customerId || customerId === id)
          .forEach((id) => {
            if (finances.customers[id].transactions)
              transactions.push(
                ...Object.keys(finances.customers[id].transactions)
                  .filter(
                    (key) =>
                      customerId ||
                      finances.customers[id].transactions[key].amount > 0
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
      if (typeSelect !== "Customers" && users && finances.staff) {
        Object.keys(finances.staff)
          .filter((id) => !staffId || staffId === id)
          .forEach((id) => {
            if (finances.staff[id].transactions)
              transactions.push(
                ...Object.keys(finances.staff[id].transactions)
                  .filter(
                    (key) =>
                      staffId || finances.staff[id].transactions[key].amount > 0
                  )
                  .map((key) => {
                    const amount =
                      typeSelect === "All Transactions"
                        ? finances.staff[id].transactions[key].amount * -1
                        : finances.staff[id].transactions[key].amount;
                    return {
                      ...finances.staff[id].transactions[key],
                      key: key,
                      amount,
                      payer: users[id].displayName,
                      sortPriority: 0,
                    };
                  })
              );
          });
      }
      if (
        typeSelect === "All Transactions" &&
        finances.company &&
        finances.company.transactions
      ) {
        transactions.push(
          ...Object.keys(finances.company.transactions).map((key) => {
            return {
              ...finances.company.transactions[key],
              key: key,
              payer: "COMPANY",
              sortPriority: 0,
            };
          })
        );
      }
    }

    return transactions.sort((transaction1, transaction2) => {
      if (transaction2.date === transaction1.date)
        return transaction2.sortPriority - transaction1.sortPriority;
      else return new Date(transaction1.date) - new Date(transaction2.date);
    });
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
    } = this.state;

    const transactions = this.getTransactions();

    const runningBalance = [];
    const tableContent = transactions
      .map((transaction, index) => {
        const { key, date, description, amount, payer, complete } = transaction;
        runningBalance[index] = runningBalance[index - 1]
          ? runningBalance[index - 1] + amount
          : amount;
        const style = !complete ? { color: "#d20000" } : null;
        return (
          <tr key={key} style={style}>
            <td style={{ whiteSpace: "nowrap" }}>{date}</td>
            <td style={{ whiteSpace: "nowrap" }}>{payer}</td>
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

    const modalBody = (
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
                    value={modalCustomerName}
                    placeholder="Customer Name"
                  />
                </div>
              ) : modalTypeSelect === "Staff" ? (
                <div className="inline-header">
                  <Autocomplete
                    valueArray={Object.values(users).map(
                      (user) => user.displayName
                    )}
                    onChange={(newValue) =>
                      this.handleStaffChange(newValue, "modalStaff")
                    }
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
                  </Form.Control>
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
                  onClick={this.sendInvoice}
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
