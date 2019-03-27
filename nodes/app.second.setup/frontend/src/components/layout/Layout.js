import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {Helmet} from "react-helmet";

import GlobalState from 'second-fe-react-hoc-globalstate';

class Layout extends Component {
  static propTypes = {
    title: PropTypes.string,
    childComponents: PropTypes.arrayOf(PropTypes.func)
  };

  constructor(props){
    super(props);
    
    this.state = {}
    
  }
  
  render(){
    console.log('Layout props:', this.props);
    return (
      <div className="">

        <Helmet>
          <title>{this.props.title}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css" />
          <script defer src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"></script>
        </Helmet>

        <div>
          {this.props.childComponents.map((Component,k)=>{
            return (<Component key={k} title="THIS SHOULD DISAPPEAR" />)
          })}
        </div>
        <div>
          Footer
        </div>
      </div>
    )
  }
}

Layout = GlobalState(Layout);

export default Layout;
