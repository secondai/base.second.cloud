import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class extends Component {
  static propTypes = {
    leftComponent: PropTypes.element,
    rightComponent: PropTypes.element,
    title: PropTypes.string
  };

  constructor(props){
    super(props);
    
    this.state = {}
    
  }
  
  render(){
    
    return (
    	<div>
    		{this.props.title}
	      <div className="columns">
	        <div className="column">
	          {this.props.leftComponent}
	        </div>
	        <div className="column">
	          {this.props.rightComponent}
	        </div>
	      </div>
	     </div>
    )
  }
}

