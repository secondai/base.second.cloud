import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {Helmet} from "react-helmet";

import GlobalState from 'second-fe-react-hoc-globalstate';

class Login extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    let urlParams = new URLSearchParams(window.location.search);
    let redirectTo = urlParams.get('redirect');

    console.log('redirect to:', redirectTo);
    
    this.state = {
      redirectTo,
      passphrase: ''
    }
    
  }

  handleSubmit = async ()=>{
    console.log('Trying login using passphrase');
    
    let { passphrase } = this.state;
    
    const rawResponse = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({passphrase})
    });
    const content = await rawResponse.json();

    console.log('Login response:', content);
    if(content.type.indexOf('error') === -1){
      window.location = this.state.redirectTo;
    } else {
      console.log('Not logged in');
      window.alert('Invalid passphrase');
    }
    
    return false;
  }

  handleKeyDown = (e) => {
    if(e.key.toLowerCase() == 'enter'){
      this.handleSubmit();
    }
  }

  render(){
    // console.log('Login props:', this.props);

    return (
      <section className="hero is-fullheight is-white has-background-info">

        <Helmet>
          <title>Login</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css" />
          <script defer src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"></script>
        </Helmet>

        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title">
                    Login Required
                  </h1>


                  <div className="field has-addons">
                    <div className="control is-expanded">
                      <input 
                        className="input" 
                        type="text" 
                        placeholder="passphrase"
                        onChange={e=>this.setState({passphrase:e.target.value})}
                        onKeyDown={this.handleKeyDown}
                        value={this.state.passphrase}
                      />
                    </div>
                    <div className="control">
                      <a className="button is-success" onClick={this.handleSubmit}>
                        Login
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

Login = GlobalState(Login);

export default Login;
