import React from 'react';
import { firebaseConnect, isLoaded, isEmpty } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

class PageAdminStaff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      adminKeyLoading: '',
    }
  }

  setAdmin = async (uid) => {
    this.setState({loading: true, adminKeyLoading: uid});
    const addAdminRole = this.props.firebase.functions().httpsCallable('addAdminRole');
    try {
      const result = await addAdminRole({uid: uid});
      this.setState({result: result.message, loading: false, adminKeyLoading: ''});
    } catch (error) {
      this.setState({result: error.message, loading: false, adminKeyLoading: ''});
    }
  }

  removeAdmin = async (uid) => {
    this.setState({loading: true, adminKeyLoading: uid});
    const removeAdminRole = this.props.firebase.functions().httpsCallable('removeAdminRole');
    try {
      const result = await removeAdminRole({uid: uid});
      this.setState({result: result, loading: false, adminKeyLoading: ''});
    } catch (error) {
      this.setState({result: error, loading: false, adminKeyLoading: ''});
    }
  }

  render() {
    let table;
    if (!isLoaded(this.props.users, this.props.admins)) {
      table = <div>Loading staff...</div>
    } else if (isEmpty(this.props.users)) {
      table = <div>No registered staff found.</div>
    } else {
      const keys = Object.keys(this.props.users);

      const tableContent = keys.map(key => {
        const name = this.props.users[key].displayName;
        const email = this.props.users[key].email;
        const phoneNumber = this.props.users[key].phoneNumber;
        const adminButton = this.props.admins.includes(key) ? (
          <Button onClick={() => this.removeAdmin(key)} disabled={this.state.loading} variant="danger">
            {this.state.adminKeyLoading === key ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
            ) : (<span>Remove</span>)}
          </Button>
        ) : (
            <Button onClick={() => this.setAdmin(key)} disabled={this.state.loading} variant="success">
              {this.state.adminKeyLoading === key ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
            ) : (<span>Add</span>)}
            </Button>
          );
        
        return (
          <tr key={key}>
            <td>{name}</td><td>{email}</td><td>{phoneNumber}</td><td>{adminButton}</td>
          </tr>
        )
      });

      table = (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone #</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {tableContent}
          </tbody>
        </Table>
      );
    }

    return (
      <div>
        <h2>Staff List</h2>
        {table}
      </div>
    );
  };
}

const mapStateToProps = (state, props) => {
  return ({
    users: state.firebase.data['users'],
    admins: state.firebase.data['admins'],
  });
};

export default compose(
  firebaseConnect(props => {
    return [{ path: '/users', storeAs: 'users' }, { path: '/admins', storeAs: 'admins' }];
  }),
  connect(mapStateToProps)
)(PageAdminStaff);