import React from "react";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
// import Table from 'react-bootstrap/Table';
// import Button from 'react-bootstrap/Button';
import construction from "./under-construction.gif";

class PageAdminFinances extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let table;
    if (!isLoaded(this.props.finances)) {
      table = <div>Loading finances...</div>;
    } else if (isEmpty(this.props.finances)) {
      table = <div>No finances in the database.</div>;
    } else {
      table = (
        <>
          Under Construction
          <br />
          <img src={construction} alt="" />
        </>
      );

      //   const keys = Object.keys(this.props.customers);

      //   const tableContent = keys.map(key => {
      //     const name = this.props.customers[key].name;
      //     const address = this.props.customers[key].address;
      //     const email = this.props.customers[key].email;
      //     const phoneNumber = this.props.customers[key].phoneNumber;
      //     const rate = this.props.customers[key].rate;
      //     const amountOwed = this.props.finances[key].owed;
      //     const amountPaid = this.props.finances[key].paid;
      //     const editButton = (
      //       <Button variant="primary" onClick={() => this.editCustomer(key)}>Edit</Button>
      //     )
      //     // TODO add ability to remove staff and assign to others

      //     return (
      //       <tr key={key}>
      //         <td>{name}</td><td>{address}</td><td>{email}</td><td>{phoneNumber}</td>
      //         <td>{rate}</td><td>{amountOwed}</td><td>{amountPaid}</td><td>{editButton}</td>
      //       </tr>
      //     )
      //   });

      //   table = (
      //     <Table striped bordered hover>
      //       <thead>
      //         <tr>
      //           <th>Name</th>
      //           <th>Address</th>
      //           <th>Email Address</th>
      //           <th>Phone #</th>
      //           <th>Rate</th>
      //           <th>Owed</th>
      //           <th>Paid</th>
      //           <th>Edit</th>
      //         </tr>
      //       </thead>
      //       <tbody>
      //         {tableContent}
      //       </tbody>
      //     </Table>
      //   );
    }

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
