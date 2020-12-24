import React from 'react';
import Form from 'react-bootstrap/Form';
import logo from './graphic.png';
import Spinner from 'react-bootstrap/Spinner'

function PageLoadAuth(props) {

  return (
    <div className="container" id="signin-container">
      <Form className="form-signin" onSubmit={(event) => event.preventDefault()}>
        <img src={logo} alt="" />
        <h2 className="form-signin-heading" id="auth-load">Loading authentication...</h2>
        <div className="spacer"/>
        <Spinner animation="border" variant="primary" />
      </Form>
    </div>
  );
}

export default (PageLoadAuth);