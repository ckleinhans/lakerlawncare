import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { compose } from "redux";
import { connect } from "react-redux";
import Table from "react-bootstrap/Table";

class PageBalance extends React.Component {
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

  //handleModalClose = () => this.setState({ showModal: false });

  render() {
    const { transactions } = this.props;

    const runningBalance = [];

    const tableContent =
      isLoaded(transactions) && !isEmpty(transactions)
        ? Object.keys(transactions)
            .sort(
              (key1, key2) =>
                new Date(transactions[key1].date) -
                new Date(transactions[key2].date)
            )
            .map((key, index) => {
              const { amount, description, date } = transactions[key];
              runningBalance[index] = amount + (runningBalance[index - 1] || 0);
              return (
                <tr
                  key={key}
                  //className="clickable-row"
                  onClick={() => this.showDetails(key)}
                >
                  <td>{date}</td>
                  <td>{description}</td>
                  <td>{`$${amount.toFixed(2)}`}</td>
                  <td>{`$${runningBalance[index].toFixed(2)}`}</td>
                </tr>
              );
            })
        : null;

    const table = !isLoaded(transactions) ? (
      <div>Loading transactions...</div>
    ) : isEmpty(transactions) ? (
      <div>
        No transactions found. Get some appointments and start making money!
      </div>
    ) : (
      <div>
        Click a transaction to see details (work in progress).
        <div className="table-container">
          <Table striped bordered hover className="page-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Running Total</th>
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
          <h2>My Transactions</h2>
          {table}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    transactions: state.firebase.data.transactions,
  };
};

export default compose(
  firebaseConnect((props) => [
    { path: `/finances/staff/${props.uid}/transactions`, storeAs: "transactions" },
  ]),
  connect(mapStateToProps)
)(PageBalance);
