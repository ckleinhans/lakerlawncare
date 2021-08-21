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
      financialManagerName: profile.displayName,
      companyVenmoInput: companyVenmo || "",
      adminEmailInput: "",
      adminEmailPassword: "",
    };
  }

  updateProfile = async (event) => {
    this.setState({ loading: "profile" });

    const { displayName, phoneNumber, oldPassword, email, newPassword, venmo } =
      this.state;
    const { firebase, profile } = this.props;
    event.preventDefault();
    if (!/^[a-zA-Z ]+$/.test(displayName.trim())) {
      event.stopPropagation();
      return this.setState({
        error: "Name must only contain spaces and letters.",
        loading: "",
      });
    }
    if (!/^([0-9]{3}-[0-9]{3}-[0-9]{4})$/.test(phoneNumber)) {
      event.stopPropagation();
      return this.setState({
        error: "Phone number must be formatted as 123-456-7890.",
        loading: "",
      });
    }
    if (venmo.includes(" ")) {
      event.stopPropagation();
      return this.setState({
        error: "Venmo username cannot contain spaces.",
        loading: "",
      });
    }

    const user = firebase.auth().currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(
      profile.email,
      oldPassword
    );
    try {
      await user.reauthenticateWithCredential(credential);
      // User re-authenticated.
    } catch (error) {
      this.setState({ error: error.message, loading: "" });
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
        this.setState({ error: error.message, loading: "" });
      } else {
        try {
          if (email !== profile.email) {
            await user.updateEmail(email);
          }
          if (newPassword) {
            await user.updatePassword(newPassword);
          }
          this.setState({ profileUpdated: true, loading: "" });
        } catch (error) {
          this.setState({ error: error.message, loading: "" });
        }
      }
    });
  };

  handleInputChange = (event) => {
    this.setState({ [event.target.id]: event.target.value, error: "" });
  };

  setFinancialManager = async () => {
    this.setState({ loading: "financialManager" });
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
        financeResult: result.data.message,
        loading: "",
        functionError: false,
      });
    } catch (error) {
      this.setState({
        financeResult: error.message,
        loading: "",
        functionError: true,
      });
    }
  };

  setAdminEmail = async () => {
    this.setState({ loading: "adminEmail" });
    const { adminEmailInput, adminEmailPassword } = this.state;
    const { firebase } = this.props;

    if (
      !/^[A-Za-z0-9](\.?[A-Za-z0-9]){5,}@gmail\.com$/.test(adminEmailInput) ||
      !adminEmailPassword
    )
      return this.setState({
        emailResult: "A valid Gmail address and password are required.",
        loading: "",
        functionError: true,
      });

    try {
      firebase.update(
        "/adminEmail",
        {
          username: adminEmailInput.toLowerCase(),
          password: adminEmailPassword,
        },
        async (error) => {
          if (error)
            return this.setState({
              emailResult: error.message,
              loading: "",
              functionError: true,
            });

          const sendEmail = this.props.firebase
            .functions()
            .httpsCallable("sendEmail");
          try {
            const result = await sendEmail({
              email: adminEmailInput,
              subject: "Email Integration Activation",
              text: "This is an email confirming this email address is set up to use the Laker Lawn Care company email integration.",
            });
            this.setState({
              emailResult: result.data.message,
              loading: "",
              functionError: result.data.error,
            });
          } catch (error) {
            this.setState({
              emailResult: error.message,
              loading: "",
              functionError: true,
            });
          }
        }
      );
    } catch (error) {
      this.setState({
        emailResult: error.message,
        loading: "",
        functionError: true,
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
      loading,
      profileUpdated,
      financialManagerName,
      financeResult,
      emailResult,
      functionError,
      venmo,
      companyVenmoInput,
      adminEmailInput,
      adminEmailPassword,
    } = this.state;

    const disable = loading || !oldPassword.trim();

    const errorBar = error ? <Alert variant="danger">{error}</Alert> : null;

    const formContent = profileUpdated ? (
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
        <Button variant="primary" size="md" type="submit" disabled={disable}>
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
    );

    const financeMessageBox = financeResult ? (
      functionError ? (
        <div>
          <Alert variant="danger">{financeResult}</Alert>
        </div>
      ) : (
        <div>
          <Alert variant="success">{financeResult}</Alert>
        </div>
      )
    ) : null;

    const emailMessageBox = emailResult ? (
      functionError ? (
        <div>
          <Alert variant="danger">{emailResult}</Alert>
        </div>
      ) : (
        <div>
          <Alert variant="success">{emailResult}</Alert>
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
          <Form onSubmit={this.updateProfile}>
            <h4>Update Profile Info</h4>
            {errorBar}
            {formContent}
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
              {emailMessageBox}
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
              {financeMessageBox}
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
