import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link } from "react-router-dom";

import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

class AppView extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {
      copyable: false
    }
    
  }

  componentDidMount(){
    this.fetchApp();
  }

  componentWillReceiveProps(nextProps, nextState){
    // reload 
    this.fetchApp();
  }

  fetchApp = async () => {

    let appName = this.props.match.params.name;

    this.setState({
      loading: true
    })

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
          serviceName: 'services.second.default.get',
          actionPath: appName,
          inputNode: {},
          extras: {}
        }
      })
    });
    const nodeResponse = await rawResponse.json(); // should be returned in data?

    console.log('nodeResponse', nodeResponse);

    this.checkAppMeetsStandards(appName);

    this.setState({
      loading: false,
      appNode: nodeResponse.data.data
    });

  }

  handleDuplicate = async () => {

    if(!this.state.copyable){
      window.alert('Unable to duplicate app');
      return;
    }

    let app = this.props.app;

    let fromName = this.state.appNode.name;
    let toName;

    toName = fromName.split('.').slice(0,1).join('.');

    toName = window.prompt('New app:', toName);
    if(!toName){
      return false;
    }

    toName = toName.toLowerCase();

    // Make request to second to copy all the stuff! 
    let response = await fetch('/ai',{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: window.localStorage.getItem('token'),
          serviceName: 'services.second.default.copy',
          actionPath: 'builtin-input',
          inputNode: {
            type: 'types.second.default.copy_options',
            data: {
              from: fromName,
              to: toName,
              includeFiles: true,
              includeChildren: true,
              fileExcludePatterns: [], //['**/node_modules'] // everything! (including node_modules, faster than re-installing) 
            }
          }
        }
      })
    });

    // Update package.json 
    await this.updatePackageJsonNewName(toName);

    // Trigger rebuild 
    await this.triggerAppBuild(toName);

    // trigger data refresh via events 
    // - go back? 


  }

  checkAppMeetsStandards = async () => {

    // appName => app.second.xyz
    let appName = this.props.match.params.name;

    // get package.json
    let pkgResponse = await fetch('/ai',{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: window.localStorage.getItem('token'),
          serviceName: 'services.second.default.fs.get',
          actionPath: appName,
          inputNode: {
            type: 'types.second.default....',
            data: {
              path: 'frontend/package.json'
            }
          }
        }
      })
    });
    let json = await pkgResponse.json();
    let packageJson = JSON.parse(atob(json.data.data));
    console.log('packageJson', packageJson);

    // expect homepage to be "/app/app.name.xyz" 
    if(packageJson.homepage != `/app/${appName}`){
      console.error('Mismatched package.json homepage, not allowing to duplicate');
      this.setState(state=>({
        copyable: false
      }))
      return;
    }

    this.setState(state=>({
      copyable: true
    }))
    return;

  }

  updatePackageJsonNewName = async (newName) => {

    // get package.json
    let pkgResponse = await fetch('/ai',{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: window.localStorage.getItem('token'),
          serviceName: 'services.second.default.fs.get',
          actionPath: newName,
          inputNode: {
            type: 'types.second.default....',
            data: {
              path: 'frontend/package.json'
            }
          }
        }
      })
    });
    let json = await pkgResponse.json();
    let packageJson = JSON.parse(atob(json.data.data));
    console.log('packageJson', packageJson);

    // homepage should already exist!

    // update .homepage entry 
    packageJson.homepage = `/app/${newName}`;
    packageJson = JSON.stringify(packageJson,null,2);

    // putText 
    let putResponse = await fetch('/ai',{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: window.localStorage.getItem('token'),
          serviceName: 'services.second.default.fs.put_text',
          actionPath: newName,
          inputNode: {
            type: 'types.second.default....',
            data: {
              path: 'frontend/package.json',
              text: packageJson
            }
          }
        }
      })
    });
    let putJson = await putResponse.json();
    let putOutput = putJson.data;
    console.log('putOutput', putOutput);


  }

  triggerAppBuild = async (appName) => {

    this.setState({
      isBuilding: true
    })

    // This rebuilds the app 
    // - required because we changed the root 

    // bin.run: install command (rebuild) 

    // appName => app.second.xyz

    // TODO: expect a long-running/streaming response 
    // - conduct queries accordingly 

    let buildResponse = await fetch('/ai',{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'types.second.default.request.input',
        data: {
          auth: window.localStorage.getItem('token'),
          serviceName: 'services.second.default.bin.run',
          actionPath: appName,
          inputNode: {
            type: 'types.second.default....',
            data: {
              target: 'all',
              opts: {
                command: 'install'
              }
            }
          }
        }
      })
    });

    let json = await buildResponse.json();

    console.log('Build response:', json);

    let { finalResponse, errors } = await window.handleStreamingResponse(json.data);

    this.setState({
      isBuilding: false
    })

    console.log('Rebuild all (installed)');
    console.log('Rebuild result:', finalResponse);
    return;

  }

  render(){
    console.log('Apps props:', this.props);


    let app = this.state.appNode || {};
    
    return (
      <section className="hero is-fullheight is-white has-background-info">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h1 className="title" onClick={this.fetchApp} style={{borderBottom:'2px solid #ddd', paddingBottom:'24px'}}>
                    {app.name}
                  </h1>

                  <div className="buttons">

                    <a className="button is-info" href={'/app/' + app.name} target="_blank">
                      Visit App
                    </a>

                    <button className={"button " + (this.state.isBuilding ? 'is-loading':'')} onClick={e=>this.triggerAppBuild(app.name)}>
                      Install
                    </button>

                    <Link className="button" to={'/outline/' + app.name}>
                      View Outline
                    </Link>

                    <button className="button" onClick={this.handleDuplicate}>
                      Duplicate App
                    </button>

                  </div>



                  {
                    this.state.loading ? <div><span>Loading...</span></div>:''
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

AppView = GlobalState(AppView);

export default AppView;
