import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {Helmet} from "react-helmet";

import GlobalState from 'components/hoc/globalstate/GlobalState';

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
    
    return (
      <div className="">

        <Helmet>
          <title>{this.props.title}</title>
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
