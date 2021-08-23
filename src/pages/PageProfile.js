import React from "react";
import { firebaseConnect } from "react-redux-firebase";
import { connect } from "react-redux";
import { compose } from "redux";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import Popup from "../components/Popup";

class PageProfile extends React.Component {
  constructor(props) {
    super(props);
    const { profile, companyVenmo } = this.props;
    this.state = {
      email: profile.email,
      displayName: profile.displayName,
      phoneNumber: profile.phoneNumber,
      newPassword: "",
      oldPassword: "",
      venmo: profile.venmo || "",
      profileUpdated: false,
      loading: "",
      error: false,
      message: "",
      financialManagerName: profile.displayName,
      companyVenmoInput: companyVenmo || "",
      adminEmailInput: "",
      adminEmailPassword: "",
    };
  }

  updateProfile = async (event) => {
    this.setState({ loading: "profile" });
    event.preventDefault();

    const { displayName, phoneNumber, oldPassword, email, newPassword, venmo } =
      this.state;
    const { firebase, profile } = this.props;

    if (!/^[a-zA-Z]+ [a-zA-Z-]+$/.test(displayName.trim()))
      return this.setState({
        message:
          "You must enter your first and last name separated by a space.",
        error: true,
        loading: "",
      });
    if (!/^([0-9]{3}-[0-9]{3}-[0-9]{4})$/.test(phoneNumber))
      return this.setState({
        message: "Phone number must be formatted as 123-456-7890.",
        error: true,
        loading: "",
      });
    if (!/^[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+$/.test(email))
      return this.setState({
        message: "Please enter a valid email address.",
        error: true,
        loading: "",
      });
    if (venmo.includes(" "))
      return this.setState({
        message: "Venmo username cannot contain spaces.",
        error: true,
        loading: "",
      });

    const user = firebase.auth().currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(
      profile.email,
      oldPassword
    );
    try {
      await user.reauthenticateWithCredential(credential);
      // User re-authenticated.

      const updates = {
        displayName: displayName.trim(),
        email: email.toLowerCase(),
        phoneNumber,
        venmo,
      };

      await firebase.update(`/users/${user.uid}`, updates);
      if (email !== profile.email) {
        await user.updateEmail(email);
      }
      if (newPassword) {
        await user.updatePassword(newPassword);
      }
      this.setState({ profileUpdated: true, loading: "" });
    } catch (error) {
      this.setState({
        message: error.message,
        error: true,
        loading: "",
      });
    }
  };

  handleInputChange = (event) => {
    this.setState({ [event.target.id]: event.target.value });
  };

  setFinancialManager = async () => {
    this.setState({ loading: "financialManager" });
    const { financialManagerName } = this.state;
    const { users } = this.props;
    const uid = Object.keys(users).find(
      (key) => users[key].displayName === financialManagerName
    );
    try {
      const result = await this.props.firebase
        .functions()
        .httpsCallable("setFinanceRole")({ uid });
      this.setState({
        message: result.data.message,
        loading: "",
      });
    } catch (error) {
      this.setState({
        message: error.message,
        error: true,
        loading: "",
      });
    }
  };

  setAdminEmail = async () => {
    this.setState({ loading: "adminEmail" });
    const { adminEmailInput, adminEmailPassword } = this.state;
    const { firebase } = this.props;

    if (
      !/^[a-z0-9](\.?[a-z0-9]){5,}@gmail\.com$/i.test(adminEmailInput) ||
      !adminEmailPassword
    )
      return this.setState({
        error: true,
        message: "A valid Gmail address and password are required.",
        loading: "",
      });

    try {
      await firebase.update("/adminEmail", {
        username: adminEmailInput.toLowerCase(),
        password: adminEmailPassword,
      });
      const result = await this.props.firebase
        .functions()
        .httpsCallable("sendEmail")({
        email: adminEmailInput,
        subject: "Email Integration Activation",
        text: "This is an email confirming this email address is set up to use the Laker Lawn Care company email integration.",
      });
      this.setState({
        message: result.data.message,
        loading: "",
      });
    } catch (error) {
      this.setState({
        error: true,
        message: error.message,
        loading: "",
      });
    }
  };

  setVenmoAccount = async () => {
    this.setState({ loading: "companyVenmo" });
    this.props.firebase.set("/companyVenmo", this.state.companyVenmoInput, () =>
      this.setState({ loading: "" })
    );
  };

  render() {
    const { profile, users, companyVenmo, adminEmail, firebase } = this.props;
    const {
      displayName,
      phoneNumber,
      oldPassword,
      email,
      newPassword,
      error,
      message,
      loading,
      profileUpdated,
      financialManagerName,
      venmo,
      companyVenmoInput,
      adminEmailInput,
      adminEmailPassword,
    } = this.state;

    const disable = loading || !oldPassword.trim();

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
          {profile.venmo ? (
            <span>
              Linked Venmo Account:{" "}
              <a
                href={`https://venmo.com/${profile.venmo}`}
                target="_blank"
                rel="noreferrer"
              >{`@${profile.venmo}`}</a>
            </span>
          ) : (
            <span style={{ color: "#c70000" }}>
              Venmo account not linked! Enter username below to link.
            </span>
          )}
          <br />
          <br />
          <Form noValidate onSubmit={this.updateProfile}>
            <h4>Update Profile Info</h4>
            {profileUpdated ? (
              <div>Profile successfully updated.</div>
            ) : (
              <div>
                <Form.Group controlId="oldPassword">
                  <Form.Label>Enter current password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Current password"
                    disabled={loading}
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
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={disable}
                >
                  {loading === "profile" ? (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </div>
            )}
          </Form>
          {profile.token.claims.admin ? (
            <div>
              <br />
              <h3>Administrator Options</h3>
              {adminEmail ? (
                <Form.Label>
                  Linked Company Email Account: {adminEmail}
                </Form.Label>
              ) : (
                <Form.Label style={{ color: "#c70000" }}>
                  Email account not linked! Enter credentials below to link.
                </Form.Label>
              )}
              <br />
              <Form.Control
                placeholder="Email Address"
                id="adminEmailInput"
                className="dynamic-input"
                disabled={loading}
                onChange={this.handleInputChange}
                value={adminEmailInput}
              />
              <Form.Control
                type="password"
                placeholder="Password"
                id="adminEmailPassword"
                className="dynamic-input"
                disabled={loading}
                onChange={this.handleInputChange}
                value={adminEmailPassword}
              />
              {adminEmailInput || !adminEmail ? (
                <Button
                  className="dynamic-button"
                  onClick={this.setAdminEmail}
                  disabled={loading || !adminEmailInput}
                  variant="primary"
                  size="sm"
                >
                  {loading === "adminEmail" ? (
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                  ) : (
                    "Update Company Email"
                  )}
                </Button>
              ) : (
                <Button
                  className="dynamic-button"
                  onClick={() => firebase.remove("/adminEmail")}
                  disabled={loading}
                  variant="danger"
                  size="sm"
                >
                  Remove Company Email
                </Button>
              )}
            </div>
          ) : null}
          {profile.token.claims.finances ? (
            <div>
              <h3>Financial Manager Options</h3>
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
                {loading === "financialManager" ? (
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
              {companyVenmo ? (
                <Form.Label style={{ marginTop: "8px" }}>
                  Linked Company Venmo Account:{" "}
                  <a
                    href={`https://venmo.com/${companyVenmo}`}
                    target="_blank"
                    rel="noreferrer"
                  >{`@${companyVenmo}`}</a>
                </Form.Label>
              ) : (
                <Form.Label style={{ marginTop: "8px", color: "#c70000" }}>
                  Company Venmo account not linked! Enter username below to
                  link.
                </Form.Label>
              )}
              <br />
              <Form.Group
                className="header-select"
                controlId="companyVenmoInput"
              >
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>@</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    type="text"
                    placeholder="Username"
                    disabled={loading}
                    onChange={this.handleInputChange}
                    value={companyVenmoInput}
                  />
                </InputGroup>
              </Form.Group>
              <Button
                className="inline-button"
                onClick={this.setVenmoAccount}
                disabled={
                  loading ||
                  !companyVenmoInput ||
                  companyVenmoInput === companyVenmo
                }
                variant="primary"
                size="sm"
              >
                {loading === "companyVenmo" ? (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          ) : null}
          <Popup
            show={message}
            isError={error}
            message={message}
            onClose={() => this.setState({ message: "", error: false })}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    profile: state.firebase.profile,
    adminEmail: state.firebase.data.adminEmail,
  };
};

export default compose(
  firebaseConnect((props) => {
    return [{ path: "/adminEmail/username", storeAs: "adminEmail" }];
  }),
  connect(mapStateToProps)
)(PageProfile);
