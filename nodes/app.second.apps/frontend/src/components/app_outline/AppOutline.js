import React, { Component } from 'react';
import PropTypes from 'prop-types';
                        
import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

var objectPath = require("object-path");

class AppOutline extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {
      appNode: null,
      outline: null,
      outlinePath: [],
      commands: {}
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

    this.fetchOutline(appName);

    this.setState({
      loading: false,
      appNode: nodeResponse.data.data
    });

  }

  fetchOutline = async () => {

    let appName = this.props.match.params.name;

    this.setState({
      loading: true
    })

    let outlineResponse = await fetch('/ai',{
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
              path: 'frontend/outline.json'
            }
          }
        }
      })
    });
    let json = await outlineResponse.json();
    let outlineJson = JSON.parse(atob(json.data.data));
    console.log('outlineJson', outlineJson);
    
    this.setState({
      loading: false,
      outlineJson: outlineJson,
      outline: outlineJson.components,
      originalOutline: JSON.stringify(outlineJson.components)
    });
  }

  saveOutline = async () => {

    let { 
      outline,
      outlineJson
    } = this.state;

    outlineJson.components = outline;

    let outlineStringified = JSON.stringify(outlineJson,null,2);

    this.setState({
      isSavingOutline: true
    });

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
          actionPath: this.state.appNode.name,
          inputNode: {
            type: 'types.second.default....',
            data: {
              path: 'frontend/outline.json',
              text: outlineStringified
            }
          }
        }
      })
    });
    let putJson = await putResponse.json();
    let putOutput = putJson.data;
    console.log('putOutput', putOutput);

    let { finalResponse, errors } = await window.handleStreamingResponse(putJson.data);

    console.log('Saved respons:', finalResponse, errors);

    this.setState({
      isSavingOutline: false,
      originalOutline: JSON.stringify(outline)
    });

  }

  triggerAppRun = async (command) => {

    let appName = this.state.appNode.name;

    let commands = this.state.commands;
    commands[command] = commands[command] || {};
    commands[command].isRunning = true;
    commands[command].hasErrors = [];
    this.setState({
      commands
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
              target: 'frontend',
              opts: {
                command
              }
            }
          }
        }
      })
    });

    let json = await buildResponse.json();

    console.log('Build response:', json);

    let { finalResponse, errors } = await window.handleStreamingResponse(json.data);

    commands = this.state.commands;
    commands[command] = commands[command] || {};
    commands[command].isRunning = false;
    commands[command].hasErrors = errors;
    this.setState({
      commands
    })

    console.log('Built from outline');
    console.log('Outline build response:', finalResponse, errors);
    return;

  }

  updateVarVal = async (vKey) => {
    let outline = this.state.outline;

    let outlineVal = objectPath.get(outline, vKey);

    // console.log('updateVarVal outline:', vKey, outline, outlineVal);

    let val = window.prompt('Update:' + vKey[1], outlineVal); // ['vars',actualVar]
    if(val === null){
      return false;
    }

    // console.log('Val:', val);

    await this.handleVarChange(vKey, val);

  }

  updateOutlinePath = async (outlinePath) => {
    // console.log('updateOutlinePath. new:', outlinePath);
    this.setState({
      outlinePath,
      componentValue: null
    });
  }

  handleVarChange = async (vKey, val) => {

    // console.log('handleVarChange:', vKey, val);
    let outline = this.state.outline;
    objectPath.set(outline, vKey, val);

    // console.log('handleVarChange outline:', outline);

    this.setState({
      outline
    });

  }

  handleComponentChange = async (event) => {
    let componentValue = event.target.value;
    // console.log('componentValue:', componentValue);

    let outline = this.state.outline;
    objectPath.set(outline, this.state.outlinePath.concat(['name']), componentValue);

    // console.log('outline:', outline);

    this.setState({
      outline,
      componentValue
    });

  }

  renderOutlineObj = () => {

    let outlineObj = objectPath.get(this.state.outline || {}, this.state.outlinePath);
    // console.log('outlineObj:', outlineObj);
    if(!outlineObj || !outlineObj.name){
      return '';
    }

    // have object!

    let backPath = this.state.outlinePath.concat([]); // clone 
    if(backPath.length > 1){
      // need to go back twice, usually (breaks for arrays, etc?) 
      backPath.pop();
      backPath.pop();
    } else {
      backPath = false;
    }

    // console.log('path:', this.state.outlinePath, backPath);

    let components = [
      'second-components-react-left-right',
      './src/components/notes',
      './src/components/apps',
      'second-fe-component-react-note-search-v1',
      'second-fe-component-react-note-search-v2'
    ]

    return (
      <div>

        <div>
          {
            (backPath !== false) ? 
            <span className="button is-default" onClick={e=>this.updateOutlinePath(backPath)}>
              &lt;&lt; Back
            </span>
            :
            <span className="button" style={{opacity: '0.00001'}}>
              &nbsp;
            </span>
          }
        </div>


        <div className="var-item" style={{background:'#ededed'}}>
          <span>
            <strong>Key:</strong> {['root'].concat(this.state.outlinePath).filter(p=>{return p != 'vars'}).join('.') || 'root'} 
          </span>
        </div>
        

        <div className="var-item">
          <strong>Component:</strong> {outlineObj.name} 
        </div>

        <div style={{paddingLeft:'4px'}}>
          <div className="select">
            <select value={this.state.componentValue} onChange={this.handleComponentChange}>
              <option value={null} selected>Change Component</option>
              {
                components.map(c=>(
                  <option value={c}>{c}</option>
                ))
              }
            </select>
          </div>
        </div>

        <br />

        {
          Object.keys(outlineObj.vars || {}).map(vk=>{
            let theVar = outlineObj.vars[vk];
            let newPath = this.state.outlinePath.concat(['vars',vk]);
            if(vk.indexOf('Component') > -1){
              return (
                <div key={vk} onClick={e=>this.updateOutlinePath(newPath)} className="var-item">
                  <strong>{vk}:</strong> <span>{theVar ? theVar.name : '(none)'}</span>
                </div>
              )

            } else {
              return (
                <div key={vk} onClick={e=>this.updateVarVal(newPath)} className="var-item">
                  <strong>{vk}:</strong> {JSON.stringify(theVar)}
                </div>
              )
            }
          })
        }
        <br />

      </div>
    )
  }

  render(){
    // console.log('Apps props:', this.props);


    let app = this.state.appNode || {};

    let needsSave = (this.state.originalOutline != JSON.stringify(this.state.outline)) ? true:false

    var getCommand = (command) => {
      return this.state.commands[command] || {isRunning: false, hasErrors: [] }
    }

    let runButtons = [
      {
        name: 'Rebuild',
        command: 'build-src-and-outline'
      },
      {
        name: 'Upgrade Second Components',
        command: 'secondcomponents-upgrade'
      },
      {
        name: 'Install Deps',
        command: 'dependencies'
      },
      {
        name: 'Upgrade Deps',
        command: 'dependencies-upgrade'
      },

    ]

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


                    <button className={"button" + (needsSave ? ' is-success':'') + (this.state.isSavingOutline ? ' is-loading':'')} onClick={this.saveOutline}>
                      Save Outline
                    </button>


                    {
                      runButtons.map(button=>(
                        <button 
                          key={button.name} 
                          className={"button " + (getCommand(button.command).isRunning ? 'is-loading':'') + (getCommand(button.command).hasErrors.length ? 'is-danger':'')} 
                          onClick={e=>this.triggerAppRun(button.command)}>
                          {button.name}
                        </button>
                      ))
                    }

                  </div>



                  {
                    this.state.loading ? <div><span>Loading...</span></div>:''
                  }

                  <hr />

                  {
                    this.renderOutlineObj()
                  }

                  <hr />

                  {
                    this.state.outline ? 
                    <pre style={{overflowX:'scroll'}}>
                      <code>
                        {
                          JSON.stringify(this.state.outline,null,2)
                        }
                      </code>
                    </pre>
                    :''
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

AppOutline = GlobalState(AppOutline);

export default AppOutline;
