import React from "react";
import Form from "react-bootstrap/Form";
import logo from "../assets/graphic.png";
import error from "../assets/error.png";
import { Link } from "react-router-dom";

function PageLoadAuth(props) {
  return (
    <div className="container" id="signin-container">
      <Form
        className="form-signin"
        onSubmit={(event) => event.preventDefault()}
      >
        <img src={logo} alt="" />
        <h2 className="form-signin-heading" id="auth-load">
          Page not found
        </h2>
        <div className="spacer" />
        <img src={error} id="page-not-found" alt="" />
        <Link to="/dashboard">Back to dashboard</Link>
      </Form>
    </div>
  );
}

export default PageLoadAuth;
