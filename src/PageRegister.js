import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {Link, Redirect} from 'react-router-dom';
import logo from './graphic.png';

class PageRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      displayName: '',
      phoneNumber: '',
    }
  }

  handleInputChange = event => {
    this.setState({[event.target.name]: event.target.value, error: ''});
  }

  register = async () => {
    const credentials = {
      email: this.state.email,
      password: this.state.password,
      displayName: this.state.displayName,
    }

    const profile = {
      email: this.state.email,
      displayName: this.state.displayName,
      phoneNumber: this.state.phoneNumber,
    }

    try {
      await this.props.firebase.createUser(credentials, profile);
    } catch (error) {
      this.setState({error: error.message});
    }
  };

  render() {
    if (this.props.isLoggedIn) {
      return <Redirect to="/dashboard"/>
    }

    const errorBar = this.state.error ? <div class="alert alert-danger" role="alert">{this.state.error}</div> : null;

    return (
      <div className="container" id="signin-container">
        <div className="form-signin">
          <img src={logo} alt=""/>
          <h2 className="form-signin-heading">Create Account</h2>
          {errorBar}
          <input name="displayName" className="form-control" onChange={this.handleInputChange} placeholder="Full Name" value={this.state.displayName}/>
          <input name="phoneNumber" className="form-control" onChange={this.handleInputChange} placeholder="Phone number" value={this.state.phoneNumber}/>
          <input name="email" className="form-control" onChange={this.handleInputChange} placeholder="Email address" value={this.state.email}/>
          <input name="password" className="form-control" type="password" onChange={this.handleInputChange} placeholder="Password" value={this.state.password}/>
          <button className="btn btn-lg btn-primary btn-block" disabled={!/^[a-zA-Z ]+$/.test(this.state.displayName.trim()) || !/^([0-9]{10})$/.test(this.state.phoneNumber)} onClick={this.register}>Register</button>
          <hr/>
          <Link to="/login">Already have an account? Login here</Link>
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
)(PageRegister);