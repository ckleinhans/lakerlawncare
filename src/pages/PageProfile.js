import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

class PageProfile extends React.Component {
  constructor(props) {
    super(props);
    const { profile } = this.props;
    this.state = {
      email: profile.email,
      displayName: profile.displayName,
      phoneNumber: profile.phoneNumber,
      newPassword: "",
      oldPassword: "",
      venmo: profile.venmo || "",
      profileUpdated: false,
      loading: false,
      financialManagerName: profile.displayName,
    };
  }

  updateProfile = async (event) => {
    const { displayName, phoneNumber, oldPassword, email, newPassword, venmo } =
      this.state;
    const { firebase, profile } = this.props;
    event.preventDefault();
    if (!/^[a-zA-Z ]+$/.test(displayName.trim())) {
      event.stopPropagation();
      return this.setState({
        error: "Name must only contain spaces and letters.",
      });
    }
    if (!/^([0-9]{3}-[0-9]{3}-[0-9]{4})$/.test(phoneNumber)) {
      event.stopPropagation();
      return this.setState({
        error: "Phone number must be formatted as 123-456-7890.",
      });
    }
    if (venmo.includes(" ")) {
      event.stopPropagation();
      return this.setState({ error: "Venmo username cannot contain spaces." });
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

    const updates = {
      displayName,
      email: email.toLowerCase(),
      phoneNumber,
      venmo,
    };

    firebase.update(`/users/${user.uid}`, updates, async (error) => {
      if (error) {
        this.setState({ error: error.message, loading: false });
      } else {
        try {
          if (email !== profile.email) {
            await user.updateEmail(email);
          }
          if (newPassword) {
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

  setFinancialManager = async () => {
    this.setState({ loading: true });
    const { financialManagerName } = this.state;
    const { users } = this.props;
    const uid = Object.keys(users).find(
      (key) => users[key].displayName === financialManagerName
    );
    const setFinanceRole = this.props.firebase
      .functions()
      .httpsCallable("setFinanceRole");
    try {
      const result = await setFinanceRole({ uid });
      this.setState({
        functionResult: result.data.message,
        loading: false,
        functionError: result.data.error,
      });
    } catch (error) {
      this.setState({
        functionResult: error.message,
        loading: false,
        functionError: true,
      });
    }
  };

  render() {
    const { profile, users } = this.props;
    const {
      displayName,
      phoneNumber,
      oldPassword,
      email,
      newPassword,
      error,
      loading,
      profileUpdated,
      financialManagerName,
      functionResult,
      functionError,
      venmo,
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
        <Form.Group controlId="venmo">
          <Form.Label>Venmo Username</Form.Label>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>@</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              type="text"
              placeholder="Username"
              onChange={this.handleInputChange}
              disabled={disable}
              value={venmo}
            />
          </InputGroup>
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

    const messageBox = functionResult ? (
      functionError ? (
        <div>
          <Alert variant="danger">{functionResult}</Alert>
        </div>
      ) : (
        <div>
          <Alert variant="success">{functionResult}</Alert>
        </div>
      )
    ) : null;

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
          {venmo ? (
            <span>
              Linked Venmo Account:{" "}
              <a
                href={`https://venmo.com/${venmo}`}
                target="_blank"
                rel="noreferrer"
              >{`@${venmo}`}</a>
            </span>
          ) : (
            <span style={{ color: "#c70000" }}>
              Venmo account not linked! Enter username below to link.
            </span>
          )}
          <br />
          <br />
          <Form onSubmit={this.updateProfile}>
            <h4>Update Profile Info</h4>
            {errorBar}
            {formContent}
          </Form>
          {profile.token.claims.finances ? (
            <div>
              <br />
              <h4>Financial Manager Options</h4>
              <Form.Label>Change Financial Manager</Form.Label>
              <br />
              <Form.Control
                as="select"
                className="header-select"
                id="financialManagerName"
                onChange={this.handleInputChange}
                value={financialManagerName}
              >
                {users &&
                  Object.keys(users).map((key) => (
                    <option key={key}>{users[key].displayName}</option>
                  ))}
              </Form.Control>
              <Button
                className="inline-button"
                onClick={this.setFinancialManager}
                disabled={
                  loading || financialManagerName === profile.displayName
                }
                variant="primary"
                size="sm"
              >
                {loading ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  "Set New Manager"
                )}
              </Button>
              <br />
              {messageBox}
            </div>
          ) : null}
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
