import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Create.css';

import PartialAfterCreateComponent from 'partial-after-create/PartialAfterCreate'

import PartialCreateComponent from 'partial-create/PartialCreate'
import PartialLoginComponent from 'partial-login/PartialLogin'

import GlobalState from 'components/hoc/globalstate/GlobalState';

class Create extends Component {
  constructor(props){
    super(props);
    this.state = {}
  }

  handleAfterCreateContinue = async () => {
    
  }

  handleAfterCreateSuccess = async () => {
    
  }
  
  render(){
    
    return (
  
      <div className="section">
        <div className="container">
          
          <div className="columns">
            <div className="column is-5 is-offset-2">
              <h2 className="title is-3">
                Second: <span style={{fontWeight:'normal'}}>Identity and Routing</span>
              </h2>
            </div>
          </div>
          
          <br />
          
          {
            this.props.state.renderAfterCreate ?
            
              <div className="columns">
                <div className="column is-8 is-offset-2">
                  
                  <PartialAfterCreateComponent 
                    onContinue={this.handleAfterCreateContinue}
                  />
                  
                </div>
                
              </div>
            :
              <div className="columns">
                <div className="column is-5 is-offset-2" style={{borderRight:'1px solid #ccc'}}>
                  
                  <PartialLoginComponent />
                  
                </div>
                
                <div className="column is-3">
                  <PartialCreateComponent
                    onAfterCreate={this.handleAfterCreateSuccess}
                  />
                </div>
                
              </div>
            
          }
          
          <br />
          <br />
          
          <div className="has-text-centered">
            <a href="/about">
              About Second (how it works)
            </a>
          </div>
          
        </div>
      </div>
      
    )
  }
}

Create = GlobalState(Create);


export default Create;
