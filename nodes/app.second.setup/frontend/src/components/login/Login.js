import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {Helmet} from "react-helmet";

import GlobalState from 'second-fe-react-hoc-globalstate';

class Login extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {
    }
    
  }


  render(){
    console.log('Login props:', this.props);
    
    return (
      <section className="hero is-fullheight is-white has-background-info">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title">
                    Login Required
                  </h1>

                  <a href={"/auth/grant?redirect=" + window.location}>Click to login</a>

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
