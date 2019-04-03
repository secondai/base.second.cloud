
const path = require('path');
const fs = require('fs-extra');
const lodash = require('lodash');
const ipfsClient = require('ipfs-http-client')


const inputFunc = async function({universe, SELF, INPUT, PATH}){

  console.log('--Service:', SELF.name);
  
  console.log('Adding files via ipfs-api');

  var ipfs;
  var ipfsPort = 5001, //process.env.IPFS_PORT || 5010
    ipfsProtocol = 'http', //process.env.IPFS_PROTOCOL || 'http',
    ipfsHost = 'ipfs'; //process.env.IPFS_HOST || process.env.DOCKHERO_HOST,
    // ipfsUsername = process.env.IPFS_USER || 'testuser0',
    // ipfsPassword = process.env.IPFS_PASSWORD || 'testpass0';
  try {
    // console.log('IPFS Connection Params:', ipfsProtocol, ipfsHost, ipfsPort, ipfsUsername, ipfsPassword)
    ipfs = ipfsClient(ipfsHost, ipfsPort, {
      protocol: ipfsProtocol,
      headers: {
        // 'Authorization': 'Basic ' + Buffer.from(ipfsUsername + ':' + ipfsPassword).toString('base64')
      }
    }) // leaving out the arguments will default to these values
    // universe.sharedServices.ipfs = ipfs;
    
    console.log('Testing connection...should be almost instant');
    
    var ipfsid = await ipfs.id();
    console.log('ipfsid:', ipfsid);
  }catch(err){
    console.error('Failed ipfsid:', err);
    return false;
  }

  if(!ipfs){
    console.error('Missing ipfs');
    return false;
  }
  
  console.log('INPUT:', INPUT);
  
  // TODO: 
  // - verify INPUT.type 
  
  let fileValue = INPUT.data.fileValue;
  let pin = INPUT.data.pin ? true:false;

  // ADD
  // expecting utf8 input? 
  let bufferData = new Buffer(fileValue, 'utf8'); // expecting type:file_as_string
  
  let addResult;
  try {
    console.log('Adding to ipfs');
    addResult = await ipfs.add(bufferData, { pin })
  }catch(err){
    console.error('Failed adding to IPFS:', err);
    return {
      type: 'types.second.default.boolean',
      data: false
    };
  }
  
  console.log('addResult:', addResult);
  
  // let newHash = addResult[0].hash;
  
  
    
  //   console.log('Added to IPFS!');
    
  //   let newHash = addResult[0].hash;
    
  //   // also pin?
  //   var pinResult;
  //   try {
  //     if(inputOpts.data.options && inputOpts.data.options.pin){
  //       pinResult = await ipfs.pin.add(newHash);
  //     }
  //   }catch(err){
  //     console.error('inputOpts.data.options.pin eRoRoR:', err);
  //   }
      
  //   return resolve({
  //     type: 'added_file:..',
  //     data: {
  //       hash: newHash,
  //       pinResult
  //     }
  //   })
    
  //   break;
    
  // case 'pin.add':
  //   // Pin an already-added file 
  //   var pinResult;
  //   try {
  //     pinResult = await ipfs.pin.add(INPUT.data.hash)
  //   }catch(err){
  //     console.error('Failed ipfs pin:', err);
  //     return resolve({
  //       type: 'boolean:..',
  //       data: false
  //     });
  //   }
    
  //   return resolve({
  //     type: 'pin_result:..',
  //     data: pinResult
  //   })
    
  //   break;
    
  // case 'pin.rm':
  //   // Remove a pin for a file 
    
  //   // get all pins 
  //   console.log('Getting ID, Pinset');
  //   // console.log('PINSET:', universe.IPFS.ipfs.id())
  //   let removedPin = await ipfs.pin.rm(INPUT.data.hash);
    
  //   return resolve({
  //     type: 'pin_result:..',
  //     data: removedPin
  //   })
    
  //   break;
    
  return {
    type: 'types.second.default.response.ipfs.files.add',
    data: addResult[0]
  }
      
  return {
    type: 'testing_response',
    data: {
      test: true
    }
  }

 }


module.exports = inputFunc;

