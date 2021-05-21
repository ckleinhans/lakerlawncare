import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { compose } from "redux";
import { Link, Redirect } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import logo from "../assets/graphic.png";

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
    const { displayName, email, phoneNumber, password } = this.state;
    const { firebase } = this.props;
    event.preventDefault();
    if (!/^[a-zA-Z ]+$/.test(displayName.trim())) {
      event.stopPropagation();
      this.setState({ error: "Name must only contain spaces and letters." });
      return;
    }
    if (!/^([0-9]{3}-[0-9]{3}-[0-9]{4})$/.test(phoneNumber)) {
      event.stopPropagation();
      this.setState({
        error: "Phone number must be formatted as 123-456-7890.",
      });
      return;
    }
    const credentials = {
      email: email.toLowerCase(),
      password,
    };

    const profile = {
      email: email.toLowerCase(),
      displayName,
      phoneNumber,
    };

    try {
      await firebase.createUser(credentials, profile);
    } catch (error) {
      this.setState({ error: error.message });
    }
  };

  render() {
    const { isLoggedIn } = this.props;
    const { error, displayName, email, phoneNumber, password } = this.state;
    if (isLoggedIn) {
      return <Redirect to="/dashboard" />;
    }

    const errorBar = error ? (
      <div class="alert alert-danger" role="alert">
        {error}
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
            value={displayName}
          />
          <Form.Control
            name="phoneNumber"
            onChange={this.handleInputChange}
            placeholder="Phone number"
            value={phoneNumber}
          />
          <Form.Control
            name="email"
            onChange={this.handleInputChange}
            placeholder="Email address"
            value={email}
          />
          <Form.Control
            name="password"
            type="password"
            onChange={this.handleInputChange}
            placeholder="Password"
            value={password}
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
