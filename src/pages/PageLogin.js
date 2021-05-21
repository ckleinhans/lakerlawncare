import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { compose } from "redux";
import { Link, Redirect } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import logo from "../assets/graphic.png";

class PageLogin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
    };
  }

  handleInputChange = (event) => {
    this.setState({ [event.target.name]: event.target.value, error: "" });
  };

  login = async (event) => {
    event.preventDefault();
    const credentials = {
      email: this.state.email,
      password: this.state.password,
    };
    try {
      await this.props.firebase.login(credentials);
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
        <Form className="form-signin" onSubmit={this.login}>
          <img src={logo} alt="" />
          <h2 className="form-signin-heading">Sign in</h2>
          {errorBar}
          <Form.Control
            name="email"
            type="email"
            placeholder="Email address"
            value={this.state.email}
            onChange={this.handleInputChange}
          />
          <Form.Control
            name="password"
            type="password"
            placeholder="Password"
            onChange={this.handleInputChange}
            value={this.state.password}
          />
          <Button variant="primary" size="lg" block type="submit">
            Login
          </Button>
          <hr />
          <Link to="/register">Don't have an account? Register here</Link>
          <div className="spacer"></div>
          <Link to="/recover">Forgot password? Recover account</Link>
        </Form>
      </div>
    );
  }
}

export default compose(firebaseConnect())(PageLogin);
