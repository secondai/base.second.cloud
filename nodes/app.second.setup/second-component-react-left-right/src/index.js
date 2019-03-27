import React, { Component } from 'react';
import PropTypes from 'prop-types';

class LeftRight extends Component {
  static propTypes = {
    leftComponent: PropTypes.func,
    rightComponent: PropTypes.func,
  };

  constructor(props){
    super(props);
    
    this.state = {}
    
  }
  
  render(){
    return (
      <div className="columns">
        <div className="column">
          <this.props.leftComponent />
        </div>
        <div className="column">
          <this.props.rightComponent />
        </div>
      </div>
    )
  }
}

export default LeftRight;