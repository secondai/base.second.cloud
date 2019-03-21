import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'components/hoc/globalstate/GlobalState';

class LeftRight extends Component {
  static propTypes = {
    leftComponent: PropTypes.func,
    rightComponent: PropTypes.func,
    title: PropTypes.string
  };

  constructor(props){
    super(props);
    
    this.state = {}
    
  }
  
  render(){
    console.log('props:', this.props);
    return (
      <div>
        <div className="columns">
          <div className="column">
            <this.props.leftComponent />
          </div>
          <div className="column">
            <this.props.rightComponent />
          </div>
        </div>
       </div>
    )
  }
}

LeftRight = GlobalState(LeftRight);

export default LeftRight;