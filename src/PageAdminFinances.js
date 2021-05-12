import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Table from "react-bootstrap/Table";
// import Button from 'react-bootstrap/Button';

class PageAdminFinances extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      selectedAppt: null,
      apptKey: "",
    };
  }

  // TODO add modal to display appointment information?

  showDetails = (key) => {
    this.setState({
      showModal: true,
      apptKey: key,
      // selectedAppt: this.props.appointments[key],
    });
  };

  render() {
    const { customers, users, finances } = this.props;

    // TODO add way to display individual customer or staff transactions

    // TODO filter out staff payouts and customer payments (amount is negative) when rendering all results
    const transactions = [];
    if (finances) {
      Object.keys(finances.staff).forEach((id) => {
        transactions.push(
          ...Object.keys(finances.staff[id]).map((key) => {
            return {
              ...finances.staff[id][key],
              key: key,
              amount: finances.staff[id][key].amount * -1,
              payer: users[id].displayName,
              sortPriority: 0,
            };
          })
        );
      });
      Object.keys(finances.customers).forEach((id) => {
        transactions.push(
          ...Object.keys(finances.customers[id]).map((key) => {
            return {
              ...finances.customers[id][key],
              key: key,
              payer: customers[id].name,
              sortPriority: 1,
            };
          })
        );
      });
    }

    const runningBalance = [];
    const tableContent = transactions
      .sort((transaction1, transaction2) => {
        if (transaction2.date === transaction1.date)
          return transaction2.sortPriority - transaction1.sortPriority;
        else return new Date(transaction2.date) - new Date(transaction1.date);
      })
      .map((transaction, index) => {
        const { key, date, description, amount, payer } = transaction;
        runningBalance[index] = runningBalance[index - 1]
          ? runningBalance[index - 1] + amount
          : amount;
        return (
          <tr
            key={key}
            //className="clickable-row"
            onClick={() => this.showDetails(key)}
          >
            <td>{date}</td>
            <td>{payer}</td>
            <td>{description}</td>
            <td>{`$${amount.toFixed(2)}`}</td>
            <td>{`$${runningBalance[index].toFixed(2)}`}</td>
          </tr>
        );
      });

    const table = !isLoaded(finances, customers, users) ? (
      <div>Loading finances...</div>
    ) : isEmpty(finances, customers, users) ? (
      <div>No transactions in the database.</div>
    ) : (
      <div>
        Click a transaction to see details (work in progress).
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
