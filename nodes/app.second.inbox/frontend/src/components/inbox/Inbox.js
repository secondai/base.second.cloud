import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

class Inbox extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {
      messages: [],
      loading: true
    }
    
  }
  
  componentDidMount(){
    this.fetchMessages();
  }

  fetchMessages = async () => {

    const rawResponse = await fetch('/ai', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: {
            token: window.localStorage.getItem('token')
          },
          serviceName: 'services.second.default.query_using_template',
          actionPath: 'sqltemplates.second.default.search_messages',
          inputNode: {
            type: '...',
            data: {
              replacements: {
                LISTPATH: 'data.second.messages.message_list'
              }
            }
          },
          extras: {}
        }
      })
    });
    const nodeResponse = await rawResponse.json(); // should be returned in data?

    // response.data, nodelist.data = array 
    let nodes = nodeResponse.data.data;

    console.log('Nodes/messages:', nodes);
    // return false;
    
    this.setState({
      messages: nodes, 
      loading:false
    })
    
  }

  render(){
    console.log('Inbox props:', this.props);
    
    return (
      <section className="hero is-fullheight is-white has-background-info">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title" onClick={this.fetchMessages} style={{borderBottom:'2px solid #ddd', paddingBottom:'24px'}}>
                    Messages
                  </h1>

                  {
                    this.state.messages.map(message=>{
                      return (
                        <div className="row-item">
                          <a href={'/message/' + message.name} target="_blank">
                            {message.name}
                          </a>
                        </div>
                      )
                    })
                  }
                  {
                    this.state.loading ? <span>Loading...</span>:''
                  }

                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

Inbox = GlobalState(Inbox);

export default Inbox;
