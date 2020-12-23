import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {Link, Redirect} from 'react-router-dom';
import logo from './graphic.png';

class PageRecover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      emailSent: false,
    }
  }

  handleInputChange = event => {
    this.setState({[event.target.name]: event.target.value, error: ''});
  }

  sendRecoveryEmail = async () => {
    try {
      await this.props.firebase.auth().sendPasswordResetEmail(this.state.email, {url: 'http://lakerlawncare-portal.web.app/login'}); // TODO change
      this.setState({emailSent: true});
    } catch (error) {
      this.setState({error: error.message});
    }
  };

  render() {
    if (this.props.isLoggedIn) {
      return <Redirect to="/dashboard"/>
    }

    const errorBar = this.state.error ? <div class="alert alert-danger" role="alert">{this.state.error}</div> : null;

    const formContent = this.state.emailSent ? (
      <div>
        Recovery email successfully sent. Check your inbox for a link to reset your password.
      </div>
    ) : (
      <div>
        <input name="email" type="email" className="form-control" onChange={this.handleInputChange} placeholder="Email address" value={this.state.email}/>
        <button className="btn btn-lg btn-primary btn-block" onClick={this.sendRecoveryEmail}>Send Reset Email</button>
      </div>
    );
    

    return (
      <div className="container" id="signin-container">
        <div className="form-signin">
          <img src={logo} alt=""/>
          <h2 className="form-signin-heading">Recover Account</h2>
          {errorBar}
          {formContent}
          <hr/>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {isLoggedIn: state.firebase.auth.uid};
}

export default compose(
  firebaseConnect(),
  connect(mapStateToProps),
)(PageRecover);