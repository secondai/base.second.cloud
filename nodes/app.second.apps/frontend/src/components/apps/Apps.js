import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

import { BrowserRouter as Router, Route, Link } from "react-router-dom";


class Apps extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {
      urlVal: 'github.com/secondai/app.second.sample_install',
      apps: [],
      loading: true
    }
    
  }
  
  componentDidMount(){
    this.fetchApps();
  }

  fetchApps = async () => {
    
    // let response = await fetch('/api/get_for_pattern',{
    //   method: 'POST',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     pattern: 'app.*.*',
    //     excludeData: true
    //   })
    // });

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
          serviceName: 'services.second.default.get_for_pattern',
          actionPath: 'builtin-input',
          inputNode: {
            type: '...',
            data: {
              pattern: 'app.*.*',
              opts: {
                excludeData: true
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

    console.log('Nodes/Apps:', nodes);
    // return false;
    
    this.setState({
      apps: nodes, 
      loading:false
    })
    
  }

  render(){
    console.log('Apps props:', this.props);
    
    return (
      <section className="hero is-fullheight is-white has-background-info">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title" onClick={this.fetchApps} style={{borderBottom:'2px solid #ddd', paddingBottom:'24px'}}>
                    Apps
                  </h1>

                  {
                    this.state.apps.map((app,i)=>
                      <div key={i} className="row-item">
                        <Link to={'/view/' + app.name}>
                          {app.name}
                        </Link>
                      </div>
                    )
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

Apps = GlobalState(Apps);

export default Apps;
