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
    const {
      displayName,
      phoneNumber,
      oldPassword,
      email,
      newPassword,
    } = this.state;
    const { firebase, profile } = this.props;
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
    this.setState({ loading: true });

    const user = firebase.auth().currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(
      profile.email,
      oldPassword
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
      displayName,
      email,
      phoneNumber,
    };

    firebase.update("/", updates, async (error) => {
      if (error) {
        this.setState({ error: error.message, loading: false });
      } else {
        try {
          if (email !== profile.email) {
            await user.updateEmail("user@example.com");
          }
          if (newPassword !== "") {
            await user.updatePassword(newPassword);
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
    const { profile } = this.props;
    const {
      displayName,
      phoneNumber,
      oldPassword,
      email,
      newPassword,
      error,
      loading,
      profileUpdated,
    } = this.state;

    const disable = !oldPassword.trim();

    const errorBar = error ? <Alert variant="danger">{error}</Alert> : null;

    const buttonContent = loading ? (
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

    const formContent = profileUpdated ? (
      <div>Profile successfully updated.</div>
    ) : (
      <div>
        <Form.Group controlId="oldPassword">
          <Form.Label>Enter current password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Current password"
            onChange={this.handleInputChange}
            value={oldPassword}
          />
        </Form.Group>
        <Form.Group controlId="displayName">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Full Name"
            disabled={disable}
            onChange={this.handleInputChange}
            value={displayName}
          />
        </Form.Group>
        <Form.Group controlId="phoneNumber">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="tel"
            placeholder="Full Name"
            disabled={disable}
            onChange={this.handleInputChange}
            value={phoneNumber}
          />
        </Form.Group>
        <Form.Group controlId="email">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Email address"
            disabled={disable}
            onChange={this.handleInputChange}
            value={email}
          />
        </Form.Group>
        <Form.Group controlId="newPassword">
          <Form.Label>New Password (Optional)</Form.Label>
          <Form.Control
            type="password"
            placeholder="New Password"
            disabled={disable}
            onChange={this.handleInputChange}
            value={newPassword}
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
          Name: {profile.displayName}
          <br />
          Email address: {profile.email}
          <br />
          Phone number: {profile.phoneNumber}
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
