import React from 'react';
import { firebaseConnect } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import PageAdminStaff from './PageAdminStaff';

class PageAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarState: 'appointments',
    }
  }

  sidebarUpdate = (eventKey) => {
    this.setState({sidebarState: eventKey})
  };

  render() {
    let pageContent;
    switch (this.state.sidebarState) {
      case 'customers':
        pageContent = null;
        break;
      case 'staff':
        pageContent = <PageAdminStaff />;
        break;
      default: // Appointments
        pageContent = null;
        break;
    }

    return (
      <Row id="admin-page-row">
        <Col id="sidebar-wrapper">
          <Nav variant="pills" className="flex-column bg-light sidebar" activeKey={this.state.sidebarState} onSelect={this.sidebarUpdate}>
            <div className="sidebar-sticky"></div>
            <Nav.Item>
              <Nav.Link disabled>
                <span className="sidebar-heading">Admin Panel</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="appointments">Appointments</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="customers">Customers</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="finances">Finances</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="staff">Staff</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col id="page-content-wrapper">
          {pageContent}
        </Col>
      </Row>
    );
  }
};

const mapStateToProps = (state, props) => {
  return ({
    email: state.firebase.auth.email,
    isLoggedIn: state.firebase.auth.uid,
  });
}

export default compose(
  withRouter,
  firebaseConnect(),
  connect(mapStateToProps)
)(PageAdmin);