import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GlobalState from 'second-fe-react-hoc-globalstate';

import './styles.css'

import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import AppList from '../apps/Apps';
import AppView from '../app_view/AppView';
import AppOutline from '../app_outline/AppOutline';

window.handleStreamingResponse = async (responseNode) => {
  // input is a node that we are expecting to be a streaming/long-running identifier w/ token for follow-up 

  console.log('Handling streaming response');

  if(responseNode.type != 'types.second.default.response.streaming'){
    return responseNode;
  }

  let streamId = responseNode.data.streamId;

  let finalResponse = null;
  let errors = [];

  // is a streaming response 
  let lastIdx = 0;
  function checkAgain(){
    return new Promise(async (resolve) => {
      let streamUpdateResponse;
      let lastEntry;
      let streamArray;
      let streamArrayNode;
      try {
        streamUpdateResponse = await fetch('/ai',{
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'types.second.default.request.input',
            data: {
              auth: window.localStorage.getItem('token'),
              serviceName: 'services.second.default.streaming_update',
              actionPath: 'builtin-input', // TODO: use a path instead of a uuid? 
              inputNode: {
                type: 'types.second.default.stream_id',
                data: {
                  streamId,
                  sliceStart: lastIdx,
                  // sliceStart: lastIdx
                }
              }
            }
          })
        });

        let jsonResponse = await streamUpdateResponse.json();
        console.log('streaming update response:', jsonResponse);
        streamArrayNode = jsonResponse.data;
        streamArray = streamArrayNode.data;

        if(streamArrayNode.type.indexOf('error') > -1){
          finalResponse = streamArrayNode;
          errors.push(streamArrayNode);
          resolve();
          return;
        }

        console.log('new entries from array:', streamArray);

        lastEntry = streamArray[streamArray.length - 1];
        console.log('lastEntry:', lastEntry);
      }catch(err){
        // failed
        console.error('Failed request (timeout?)');
        setTimeout(()=>{
          checkAgain().then(resolve);
        }, 5 * 1000)
        return;
      }

      // iterate through, looking for errors 
      streamArray.forEach(arrEntry=>{
        console.log('stream:', arrEntry);
        if(arrEntry.type == 'update-exit' &&
           arrEntry.data &&
           arrEntry.data.code != 0){
          errors.push(arrEntry);
        }
      })

      if(lastEntry && lastEntry.type == 'complete'){
        console.log('Completed streaming response!');
        finalResponse = lastEntry.data;
        resolve();
      } else {
        // increment the lastIdx according to results returned! 
        lastIdx += streamArray.length;
        setTimeout(()=>{
          checkAgain().then(resolve)
        }, 5 * 1000);
      }
    });
  }
  await checkAgain();

  return {
    finalResponse,
    errors
  }

}



class Main extends Component {
  static propTypes = {
  };

  constructor(props){
    super(props);
    
    this.state = {}
    
  }

  render(){
    console.log('Basename:', process.env.PUBLIC_URL);
    return (
      <Router basename={process.env.PUBLIC_URL}>
        <Route path="/" exact component={AppList} />
        <Route path="/view/:name" component={AppView} />
        <Route path="/outline/:name" component={AppOutline} />
      </Router>
    )
  }
}

Main = GlobalState(Main);

export default Main;
