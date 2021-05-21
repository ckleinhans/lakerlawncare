import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { compose } from "redux";
import { Link, Redirect } from "react-router-dom";
import Form from "react-bootstrap/Form";
import logo from "../assets/graphic.png";
import Button from "react-bootstrap/Button";

class PageRecover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      emailSent: false,
    };
  }

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, error: "" });
  };

  sendRecoveryEmail = async (event) => {
    event.preventDefault();
    try {
      await this.props.firebase
        .auth()
        .sendPasswordResetEmail(this.state.email, {
          url: "http://lakerlawncare-portal.web.app/login",
        }); // TODO change
      this.setState({ emailSent: true });
    } catch (error) {
      this.setState({ error: error.message });
    }
  };

  render() {
    if (this.props.isLoggedIn) {
      return <Redirect to="/dashboard" />;
    }

    const errorBar = this.state.error ? (
      <div class="alert alert-danger" role="alert">
        {this.state.error}
      </div>
    ) : null;

    const formContent = this.state.emailSent ? (
      <div>
        Recovery email successfully sent. Check your inbox for a link to reset
        your password.
      </div>
    ) : (
      <Form onSubmit={this.sendRecoveryEmail}>
        <Form.Control
          name="email"
          type="email"
          onChange={this.handleInputChange}
          placeholder="Email address"
          value={this.state.email}
        />
        <Button variant="primary" size="lg" block type="submit">
          Send Reset Email
        </Button>
      </Form>
    );

    return (
      <div className="container" id="signin-container">
        <div className="form-signin">
          <img src={logo} alt="" />
          <h2 className="form-signin-heading">Recover Account</h2>
          {errorBar}
          {formContent}
          <hr />
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    );
  }
}

export default compose(firebaseConnect())(PageRecover);
