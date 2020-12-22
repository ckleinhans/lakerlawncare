import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {Link, Redirect} from 'react-router-dom';
import logo from './graphic.png';

class PageLogin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
    }
  }

  handleInputChange = event => {
    this.setState({[event.target.name]: event.target.value, error: ''});
  }

  login = async () => {
    const credentials = {
      email: this.state.email,
      password: this.state.password,
    }
    try {
      await this.props.firebase.login(credentials);
    } catch (error) {
      this.setState({error: typeof error.message == 'string' ? error.message : 'error'});
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
          <h2 className="form-signin-heading">Sign in</h2>
          {errorBar}
          <input name="email" type="email" className="form-control" onChange={this.handleInputChange} placeholder="Email address" value={this.state.email}/>
          <input name="password" type="password" className="form-control" onChange={this.handleInputChange} placeholder="Password" value={this.state.password}/>
          <button className="btn btn-lg btn-primary btn-block" onClick={this.login}>Login</button>
          <hr/>
          <Link to="/register">Don't have an account? Register</Link>
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
)(PageLogin);