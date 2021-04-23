import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

class PageProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: this.props.profile.email,
      displayName: this.props.profile.displayName,
      phoneNumber: this.props.profile.phoneNumber,
      newPassword: "",
      oldPassword: "",
      profileUpdated: false,
      loading: false,
    };
  }

  updateProfile = async (event) => {
    event.preventDefault();
    if (!/^[a-zA-Z ]+$/.test(this.state.displayName.trim())) {
      event.stopPropagation();
      this.setState({ error: "Name must only contain spaces and letters." });
      return;
    }
    if (!/^([0-9]{10})$/.test(this.state.phoneNumber)) {
      event.stopPropagation();
      this.setState({ error: "Phone number must only contain numbers." });
      return;
    }
    this.setState({ loading: true });

    const user = this.props.firebase.auth().currentUser;
    const credential = this.props.firebase.auth.EmailAuthProvider.credential(
      this.props.profile.email,
      this.state.oldPassword
    );
    try {
      await user.reauthenticateWithCredential(credential);
      // User re-authenticated.
    } catch (error) {
      this.setState({ error: error.message, loading: false });
      return;
    }

    const updates = {};
    updates[`/users/${user.uid}`] = {
      displayName: this.state.displayName,
      email: this.state.email,
      phoneNumber: this.state.phoneNumber,
    };

    this.props.firebase.update("/", updates, async (error) => {
      if (error) {
        this.setState({ error: error.message, loading: false });
      } else {
        try {
          if (this.state.email !== this.props.profile.email) {
            await user.updateEmail("user@example.com");
          }
          if (this.state.newPassword !== "") {
            await user.updatePassword(this.state.newPassword);
          }
          this.setState({ profileUpdated: true, loading: false });
        } catch (error) {
          this.setState({ error: error.message, loading: false });
        }
      }
    });
  };

  handleInputChange = (event) => {
    this.setState({ [event.target.id]: event.target.value, error: "" });
  };

  render() {
    const disable = !this.state.oldPassword.trim();

    const errorBar = this.state.error ? (
      <Alert variant="danger">{this.state.error}</Alert>
    ) : null;

    const buttonContent = this.state.loading ? (
      <Button variant="primary" size="md" disabled>
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
      </Button>
    ) : (
      <Button variant="primary" size="md" type="submit" disabled={disable}>
        Update Profile
      </Button>
    );

    const formContent = this.state.profileUpdated ? (
      <div>Profile successfully updated.</div>
    ) : (
      <div>
        <Form.Group controlId="oldPassword">
          <Form.Label>Enter current password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Current password"
            onChange={this.handleInputChange}
            value={this.state.oldPassword}
          />
        </Form.Group>
        <Form.Group controlId="displayName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Full Name"
            disabled={disable}
            onChange={this.handleInputChange}
            value={this.state.displayName}
          />
        </Form.Group>
        <Form.Group controlId="phoneNumber">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="tel"
            placeholder="Full Name"
            disabled={disable}
            onChange={this.handleInputChange}
            value={this.state.phoneNumber}
          />
        </Form.Group>
        <Form.Group controlId="email">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Email address"
            disabled={disable}
            onChange={this.handleInputChange}
            value={this.state.email}
          />
        </Form.Group>
        <Form.Group controlId="newPassword">
          <Form.Label>New Password (Optional)</Form.Label>
          <Form.Control
            type="password"
            placeholder="New Password"
            disabled={disable}
            onChange={this.handleInputChange}
            value={this.state.newPassword}
          />
          <Form.Text className="text-muted">
            Leave this blank to keep your old password.
          </Form.Text>
        </Form.Group>
        {buttonContent}
      </div>
    );

    return (
      <div className="navbar-page">
        <div className="container">
          <h2>My Profile</h2>
          Name: {this.props.profile.displayName}
          <br />
          Email address: {this.props.profile.email}
          <br />
          Phone number: {this.props.profile.phoneNumber}
          <br />
          <br />
          <Form onSubmit={this.updateProfile}>
            <h4>Update Profile Info</h4>
            {errorBar}
            {formContent}
          </Form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return { profile: state.firebase.profile };
};

export default compose(
  firebaseConnect(),
  connect(mapStateToProps)
)(PageProfile);
