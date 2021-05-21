import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Autocomplete from "../components/Autocomplete";

class PageAdminFinances extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
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

    // If custmer is valid, set customer ID
    const staffId = Object.keys(users).find(
      (id) => users[id].displayName === newValue
    );
    if (staffId) {
      data.staffId = staffId;
    }

    this.setState(data);
  };

  render() {
    const { customers, users, finances } = this.props;
    const { typeSelect, customerName, customerId, staffName, staffId } =
      this.state;

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
                amount: finances.staff[staffId].transactions[key].amount * -1,
                payer: users[staffId].displayName,
                sortPriority: 0,
              };
            })
          );
        }
      } else {
        // "All Transactions"
        // TODO filter out staff payouts and customer payments (amount is negative) when rendering all results

        Object.keys(finances.staff).forEach((id) => {
          if (finances.staff[id].transactions)
            transactions.push(
              ...Object.keys(finances.staff[id].transactions).map((key) => {
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
              ...Object.keys(finances.customers[id].transactions).map((key) => {
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
        const { key, date, description, amount, payer } = transaction;
        runningBalance[index] = runningBalance[index - 1]
          ? runningBalance[index - 1] + amount
          : amount;
        return (
          <tr key={key}>
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
      <div className="float-header">Record Customer Payment Button</div>
    ) : staffId ? (
      <div className="float-header">Pay Staff Button</div>
    ) : (
      <div className="float-header">Add Transaction Button</div>
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
                <th>Payer</th>
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
