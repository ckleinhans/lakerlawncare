import React from 'react';
import { firebaseConnect, isLoaded, isEmpty } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose } from 'redux';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/esm/Alert';

class PageAdminStaff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      adminKeyLoading: '',
    }
  }

  setAdmin = async (uid) => {
    this.setState({ loading: true, adminKeyLoading: uid });
    const addAdminRole = this.props.firebase.functions().httpsCallable('addAdminRole');
    try {
      const result = await addAdminRole({ uid: uid });
      this.setState({ result: result.data.message, loading: false, adminKeyLoading: '', error: result.data.error });
    } catch (error) {
      this.setState({ result: error.message, loading: false, adminKeyLoading: '', error: true });
    }
  }

  removeAdmin = async (uid) => {
    this.setState({ loading: true, adminKeyLoading: uid });
    const removeAdminRole = this.props.firebase.functions().httpsCallable('removeAdminRole');
    try {
      const result = await removeAdminRole({ uid: uid });
      this.setState({ result: result.data.message, loading: false, adminKeyLoading: '', error: result.data.error });
    } catch (error) {
      this.setState({ result: error.message, loading: false, adminKeyLoading: '', error: true });
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
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (<span>Remove</span>)}
          </Button>
        ) : (
            <Button onClick={() => this.setAdmin(key)} disabled={this.state.loading} variant="success">
              {this.state.adminKeyLoading === key ? (
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
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
    };

    const messageBox = this.state.result ? (this.state.error ? (
      <Alert variant="danger">
        {this.state.result}
      </Alert>
    ) : (
      <Alert variant="success">
        {this.state.result}
      </Alert>
    )) : null;

    return (
      <div>
        <h2>Staff List</h2>
        {messageBox}
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