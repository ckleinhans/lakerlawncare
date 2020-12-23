import React from 'react';
import {firebaseConnect} from 'react-redux-firebase';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {Link, Redirect} from 'react-router-dom';
import Button from 'react-bootstrap/Button';
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
      this.setState({error: error.message});
    }
  };

  render() {
    if (this.props.isLoggedIn) {
      return <Redirect to="/"/>
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
          <Button variant="primary" size="lg" block onClick={this.login}>Login</Button>
          <hr/>
          <Link to="/register">Don't have an account? Register here</Link>
          <div className="spacer"></div>
          <Link to="/recover">Forgot password? Recover account</Link>
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