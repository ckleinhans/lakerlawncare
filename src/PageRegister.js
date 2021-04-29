import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { compose } from "redux";
import { Link, Redirect } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import logo from "./graphic.png";

class PageRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      displayName: "",
      phoneNumber: "",
    };
  }

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, error: "" });
  };

  register = async (event) => {
    event.preventDefault();
    if (!/^[a-zA-Z ]+$/.test(this.state.displayName.trim())) {
      event.stopPropagation();
      this.setState({ error: "Name must only contain spaces and letters." });
      return;
    }
    if (!/^([0-9]{3}-[0-9]{3}-[0-9]{4})$/.test(this.state.phoneNumber)) {
      event.stopPropagation();
      this.setState({ error: "Phone number must be formatted as 123-456-7890." });
      return;
    }
    const credentials = {
      email: this.state.email,
      password: this.state.password,
    };

    const profile = {
      email: this.state.email,
      displayName: this.state.displayName,
      phoneNumber: this.state.phoneNumber,
      appointments: [],
    };

    try {
      await this.props.firebase.createUser(credentials, profile);
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

    return (
      <div className="container" id="signin-container">
        <Form noValidate className="form-signin" onSubmit={this.register}>
          <img src={logo} alt="" />
          <h2 className="form-signin-heading">Create Account</h2>
          {errorBar}
          <Form.Control
            name="displayName"
            onChange={this.handleInputChange}
            placeholder="Full Name"
            value={this.state.displayName}
          />
          <Form.Control
            name="phoneNumber"
            onChange={this.handleInputChange}
            placeholder="Phone number"
            value={this.state.phoneNumber}
          />
          <Form.Control
            name="email"
            onChange={this.handleInputChange}
            placeholder="Email address"
            value={this.state.email}
          />
          <Form.Control
            name="password"
            type="password"
            onChange={this.handleInputChange}
            placeholder="Password"
            value={this.state.password}
          />
          <Button variant="primary" size="lg" block type="submit">
            Register
          </Button>
          <hr />
          <Link to="/login">Already have an account? Login here</Link>
        </Form>
      </div>
    );
  }
}

export default compose(firebaseConnect())(PageRegister);
