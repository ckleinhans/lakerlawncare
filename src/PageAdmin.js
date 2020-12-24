import React from 'react';
import { firebaseConnect } from 'react-redux-firebase';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class PageAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
    }
  }

  render() {
    return (
      <Row>
        <Col id="sidebar-wrapper">
          <Nav variant="pills" className="flex-column bg-light sidebar"
            activeKey="/home"
            onSelect={selectedKey => alert(`selected ${selectedKey}`)}
          >
            <div className="sidebar-sticky"></div>
            <Nav.Item>
              <Nav.Link disabled>
                Admin Panel
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link href="/home">Appointments</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="link-1">Customers</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="link-2">Finances</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="link-2">Staff</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col id="page-content-wrapper">
          <div className="spacer"/>
          Under construction. Will add diff pages for each sidebar choice.
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