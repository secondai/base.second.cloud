import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {Helmet} from "react-helmet";

import GlobalState from 'second-fe-react-hoc-globalstate';

function parseQueryString( queryString ) {
    var params = {}, queries, temp, i, l;
    // Split into key/value pairs
    queries = queryString.split("&");
    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
    return params;
};


class Layout extends Component {
  // static propTypes = {
  //   state: PropTypes.any,
  //   title: PropTypes.string,
  //   loginComponent: PropTypes.func,
  //   mainComponent: PropTypes.func,
  // };

  constructor(props){
    super(props);
    
    this.state = {
      checkedLogin: false
    }

    setTimeout(()=>{
      this.startup();
    },1);
    
  }

  componentWillReceiveProps(nextProps){
    console.log('nextProps', nextProps);
  }
  
  componentDidMount(){
    console.log('Mounted');
    // this.checkLogin();
  }

  startup = async () =>{
    await this.checkLogin();
  }

  checkLogin = async () => {
    
    // TODO: check for update to auth 
    console.log('Hash:', window.location.hash);
    
    let hashQs = parseQueryString(window.location.hash.substring(1));
    
    console.log('hashQs:', hashQs);
    
    let token,
      authInfo;
    
    if(hashQs.token){
      // set token 
      token = hashQs.token;
      window.localStorage.setItem('token', token);
      
      // // RELOAD PAGE (without hash) 
      window.location.hash = '';
      // window.location = window.location.href.split('#')[0];
      // return;
    } else {
      token = window.localStorage.getItem('token');
      if(token){
        try {
          authInfo = window.localStorage.getItem('authInfo');
          authInfo = JSON.parse(authInfo);
        }catch(err){
          console.error('failed loading authInfo:', err);
          token = null;
        }
      }
    }
    
    console.log('Auth Token:', token);
    this.setState({checkedLogin: true});
    this.props.setState({token});

    
  }

  handleTouches = (e) => {
    // alert('reloading');
    if(e.touches.length == 3){
      if(window.confirm('Reload/Refresh?')){
        window.location.reload();
      }
    }
  }

  render(){
    console.log('--RENDERING--');
    console.log('Layout props:', this.props);
    console.log('PropsState:', this.props.state);
    window.propsstate = this.props.state;
    console.log('Token:', this.props.state.token);

    return (
      <div className="" onTouchStart={this.handleTouches}>

        <Helmet>
          <title>{this.props.pageTitle}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css" />
          <script defer src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"></script>
        </Helmet>

        <div className="mainwrapper">
          {
            this.state.checkedLogin ? 
              this.props.state.token ? 
              <this.props.mainComponent />:
              <this.props.loginComponent />
            :
              <section className="hero is-fullheight is-white has-background-primary">
                <div className="hero-body">
                  <div className="container">
                    <div className="columns is-centered">
                      <div className="column is-6">

                        <div className="box" style={{background:'white'}}>

                          <h1 className="title">
                            Checking login...
                          </h1>

                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </section>
          }
        </div>
      </div>
    )
  }
}

Layout = GlobalState(Layout);

export default Layout;
