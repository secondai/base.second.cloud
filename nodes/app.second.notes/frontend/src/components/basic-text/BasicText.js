import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'second-fe-react-hoc-globalstate';


class BasicText extends Component {
  static propTypes = {
    text: PropTypes.string,
  };

  constructor(props){
    super(props);
    
    this.state = {}
    
  }
  
  render(){
    
    return (
      <span>{this.props.text}</span>
    )
  }
}

BasicText = GlobalState(BasicText);

export default BasicText;
