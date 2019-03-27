import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {Helmet} from "react-helmet";

import GlobalState from 'second-fe-react-hoc-globalstate';

class Login extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {};
    
  }

  render(){
    // console.log('Login props:', this.props);
  

    return (
      <section className="hero is-fullheight is-white has-background-info">

        <Helmet>
          <title>Grant</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css" />
          <script defer src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"></script>
        </Helmet>

        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title">
                    Grant
                  </h1>


                  <form method="post">
                    <div className="field">
                      <div className="control">
                        <input className="button is-success is-fullwidth" type="submit" value="Grant Permissions" />
                      </div>
                    </div>
                  </form>

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
