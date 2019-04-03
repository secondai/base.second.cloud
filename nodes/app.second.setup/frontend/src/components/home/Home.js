import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import './Home.css';

// for multihashing 
import {default as Unixfs} from 'ipfs-unixfs'
import {DAGNode} from 'ipld-dag-pb'

import GlobalState from 'second-fe-react-hoc-globalstate';

// import Create from 'create/Create'

var keypair = require('keypair');

const { URL } = require('url');

const StellarSdk = require('stellar-sdk');
const crypto = require('crypto');
const jsSHA256 = require('js-sha256');
const Buffer = require('buffer/').Buffer; // trailing slash is important! 

let fundingBalance = '5.0';

class MultiHash {
  static getMultiHash(buffer) {
    const unixFs = new Unixfs("file", buffer)
    return new Promise((resolve, reject) => {
      DAGNode.create(unixFs.marshal(), (err, dagNode) => {
        if(err) reject(err)
        else resolve(dagNode.toJSON().multihash)
      })
    })
  }
}

let sharedServices = {};

let horizonPossible = {
  'idtest:': 'https://horizon-testnet.stellar.org',
  'test:': 'https://horizon-testnet.stellar.org',
  'id:': 'https://horizon.stellar.org',
  'second:': 'https://horizon.stellar.org'
}

function getIpfsHash(str){
  // Not used, using createIpfsHash instead 
  return new Promise(async (resolve,reject)=>{
    
    let buf = Buffer.from(str,'utf8');
    let mhash = await MultiHash.getMultiHash(buf);
    
    resolve(mhash);
    
    // let thisIpfs = window.existingIpfs;
    // if(!thisIpfs){
    //   thisIpfs = new window.Ipfs();
    //   window.existingIpfs = thisIpfs;
    // }
    
    // try {
    //   thisIpfs.files.add(new thisIpfs.types.Buffer(str, 'utf8'), {
    //     onlyHash: true
    //   }, (err, res)=>{
    //     console.log('localIpfsHash result:', err, res);
    //     console.log('Hash:', res[0].hash);
    //     resolve(res[0].hash);
    //   });
    // }catch(err){
    //   console.error('ipfs buffer failure:', err)
    //   reject();
    // }
    
  });
}

function getIpfsValue(hash){
  console.log('getIpfsValue:', hash);
  
  return new Promise(async (resolve,reject)=>{
    
    console.log('fetching ipfs hash:', hash); 
    
    // just use ipfs.io 
    fetch('https://ipfs.io/ipfs/' + hash)
    .then(function(res){
      console.log('from IPFS.io:', res);
      return res.text();
    })
    .then(function(textResult){
      resolve(textResult);
    })
    .catch(function(){
      console.error('Failed loading IPFS hash from ipfs.io');
      reject();
    })
    
    
    // let thisIpfs = window.existingIpfs;
    // if(!thisIpfs){
    //   thisIpfs = new window.Ipfs();
    //   window.existingIpfs = thisIpfs;
    // }
    
    // try {
    //   thisIpfs.files.cat(hash, (err, res)=>{
    //     console.log('localIpfsValue result:', err, res);
    //     // console.log('Hash:', res[0].hash);
    //     resolve(res.toString());
    //   });
    // }catch(err){
    //   console.error('ipfs value failure:', err)
    //   reject();
    // }
    
  });
}

      
// https://lollyrock.com/articles/nodejs-encryption/
function encryptToString(text, password){
  return new Promise(async (resolve,reject)=>{
    var algorithm = 'aes-256-ctr';
    var cipher = crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    console.log('crypted', text, crypted);
    resolve(crypted);
  });
}
function decryptToString(text, password){
  return new Promise(async (resolve,reject)=>{
    var algorithm = 'aes-256-ctr';
    var decipher = crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    resolve(dec);
  });
}


function getStellarServer(network){
  
  network = network || 'test';
  
  /// setup stellar connection 
  let horizonPossible = {
    public: {
      name: 'PubNet',
      address: 'https://horizon.stellar.org',
      network: 'public'
    },
    test: {
      name: 'TestNet',
      address: 'https://horizon-testnet.stellar.org',
      network: 'test'
    }
  };

  let stellarInfo = horizonPossible[network];
  switch(stellarInfo.network){
    case 'public':
      StellarSdk.Network.usePublicNetwork();
      break;
    case 'test':
      StellarSdk.Network.useTestNetwork();
      break;
    default:
      break;
  }
  
  window.lastStellarInfo = stellarInfo;
  let stellarServer = new StellarSdk.Server(stellarInfo.address);
  return stellarServer;
  
}

class Home extends Component {
  constructor(props){
    super(props);
    
    this.state = {
      username: '', // will be normalized
      stellarSeed: '',
      statusMsg: '',
      claimingUsername: false,
      purchaseInfo: null
    }
    
    this.usernameCheck = 0;
    
  }
  
  componentDidMount(){
    this.fetchIdentity();
  }

  fetchIdentity = async () => {
    
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
          serviceName: 'services.second.default.get',
          actionPath: 'private.identity.owner',
          inputNode: {},
          extras: {}
        }
      })
    });
    const nodeResponse = await rawResponse.json(); // should be returned in data?

    // response.data, nodelist.data = array 
    let node = nodeResponse.data.data;

    console.log('Owner Node', node);
    // return false;
    
    this.setState({
      ownerNode: node,
      loading:false
    })
    
  }
  
  handleKeyDown = (e) => {
    if(e.key && e.key.toLowerCase() == 'enter'){
      this.processClaimUsername();
    } 
  }
  
  handlePurchaseClick = () => {
    alert('Purchase link here');
  }
  
  handleClaimClick = () => {
    this.processClaimUsername();
  }
  
  handleChangeUsername = (e) => {
    
    let username = e.target.value;
    
    this.setState({
      username
    })
    
    setTimeout(()=>{
      if(this.state.username == username){  
        this.checkUsername();
      } else {
        console.log('skip check');
      }
    },500)
    
  }
  
  checkUsername = () => {
    
    return new Promise(async (resolve,reject)=>{
      
      console.log('checking username');
      
      this.usernameCheck++;
      let thisUsernameCheck = this.usernameCheck;
      
      this.setState({
        checkedUsername: true,
        checkingUsername: true,
        usernameAvailable: false,
        purchaseInfo: null
      });
      
      
      // see if username is available 
      let username = this.state.username;
      let network = 'public';
      
      if(username.substring(0,7) == 'test://'){
        username = username.substring(7);
        network = 'test';
      }
      
      if(username.substring(0,5) == 'test:'){
        username = username.substring(5);
        network = 'test';
      }
      username = username.normalize('NFKC').toLowerCase();
      
      let stellarServer = getStellarServer(network); 
    
      let userTargetSeed = jsSHA256.array(username);
      var pairUsername = StellarSdk.Keypair.fromRawEd25519Seed(userTargetSeed);
  
      console.log('Network:', network);
      console.log('Username:', username);
      
      // Load source account
      let usernameAccount;
      try {
        usernameAccount = await stellarServer.loadAccount(pairUsername.publicKey())
        console.error('Found username account (already taken)');
        // window.alert('Username already taken');
        
        // lookup purchase or rentlink/contract 
        let purchaseInfo = await this.loadPurchaseInfo(usernameAccount);
        
        if(purchaseInfo){
          console.log('purchase info:', purchaseInfo);
          try {
            purchaseInfo = JSON.parse(purchaseInfo);
            purchaseInfo = `Purchase Info: ${purchaseInfo.data.note}`;
          }catch(err){
            purchaseInfo = null;
          }
        }
        
        if(this.usernameCheck != thisUsernameCheck){
          // changed
          console.log('changed mid-check1');
          return;
        }
      
        this.setState({
          checkingUsername: false,
          usernameAvailable: false,
          purchaseInfo
        });
        
        return;
      }catch(err){
        console.log('Failed loading username account, good!', username);
        
        if(this.usernameCheck != thisUsernameCheck){
          // changed
          console.log('changed mid-check2');
          return;
        }
      
        console.log('usernameAvailable: true', username);
        
        this.setState({
          checkingUsername: false,
          usernameAvailable: true,
          purchaseInfo: null
        });
        
      }
      
    });
    
  }
  
  processClaimUsername = () => {
    
    return new Promise(async (resolve,reject)=>{
      
      // if(this.state.claimingUsername){
      //   return resolve(false);
      // }
      
      this.setState({
        claimingUsername: true,
        purchaseInfo: null
      });
      
      
      // see if username is available 
      let usernameInfo = await this.parseRoute(this.state.username);
      
      let username = usernameInfo.baseIdentity;

      let stellarServer = getStellarServer(usernameInfo.network); 
    
      var pairUsername = usernameInfo.pairForIdentity; 
  
      console.log('Network:', usernameInfo.network);
      console.log('Username:', username);
      
      this.setState({
        statusMsg: 'Checking Availability'
      });
      
      // Load source account
      let usernameAccount;
      try {
        usernameAccount = await stellarServer.loadAccount(pairUsername.publicKey())
        console.error('Found username account (already taken)');
        // window.alert('Username already taken');
        
        // lookup purchase or rentlink/contract 
        let purchaseInfo = await this.loadPurchaseInfo(usernameAccount);
        
        if(purchaseInfo){
          console.log('purchase info:', purchaseInfo);
          try {
            purchaseInfo = JSON.parse(purchaseInfo);
            purchaseInfo = `Purchase Info: ${purchaseInfo.data.note}`;
          }catch(err){
            purchaseInfo = null;
          }
        }
        
        this.setState({
          statusMsg: 'Username already taken',
          purchaseInfo,
          claimingUsername: false
        });
        return;
      }catch(err){
        console.log('Failed loading username account, good!');
      }
      
      let ownerNode = this.state.ownerNode;
      if(!ownerNode){
        console.info('Creating new ownerNode');
        ownerNode = {
          type: 'types.second.default.identity',
          data: {
            username: null,
            publicKey: null,
            privateKey: null,
            addresses: [{
              type: 'types.second.default.identity_http_connection_address',
              data: {
                url: window.location.hostname + '/ai',
                root: window.location.hostname,
              }
            }]
          }
        }
      }

      ownerNode.data.username = usernameInfo.nameWithProtocol; // "second://sub@name" or "test://sub@name" or "second://name"

      if(!ownerNode.data.publicKey){
        var newPair = keypair();
        console.log(newPair);
        ownerNode.data.publicKey = newPair.public;
        ownerNode.data.privateKey = newPair.private;
      }


      // Get the IPFS value/data that we'll pin after saving to Stellar 
      let hostfile = {
        type: 'types.second.default.hostfile',
        data: {
          publicKey: ownerNode.data.publicKey, // plural, for rotation/forward-secrecy? 
          addresses: ownerNode.data.addresses
        }
      }
      console.log('hostfile:', hostfile);
      // let ipfsHash, ipfsData;
      let ipfsDataString = JSON.stringify(hostfile);
      let ipfsHashOfData = await this.createIpfsHashOnSecond(ipfsDataString);
      // let ipfsHashOfData = 'testing';
      if(!ipfsHashOfData){
        this.setState({
          statusMsg: 'Failed creating ipfs hash',
          claimingUsername: false
        });
      }
      


      // Claim the username and save the IPFS hash 
      // - all in one transaction? (not currently, uses 2) 

      // target account for passphrase (if we were just being told what to lock it with, vs locking on-page) 
      // - difference of who is funding the username 
      // var passphraseKeypair = StellarSdk.Keypair.random(); 
      var pairInputSeed = StellarSdk.Keypair.fromSecret(this.state.stellarSeed);
      
      // let pubKey = passphraseKeypair.publicKey();
      // let secretKey = passphraseKeypair.secret();

      this.setState({
        statusMsg: 'Claiming Username'
      });

      // Claim Username 
      // - register account (and setup multisig) if I have a balance in my sourceAccount 
      let claimedUsername = await this.claimUsername();
      if(!claimedUsername){
        // failed (printed status message)
        this.setState({
          claimingUsername: false
        });
        return;
      }

      this.setState({
        statusMsg: 'Adding route to Stellar'
      });

      // Add IPFS data to route
      let addedRouteToStellar = await this.addRouteData(ipfsHashOfData, ''); // adds to base
      if(!addedRouteToStellar){
        this.setState({
          statusMsg: 'Failed adding to stellar',
          claimingUsername: false
        });
        return
      }

      // Update ownerNode on server 
      const putRawResponse = await fetch('/ai', {
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
            serviceName: 'services.second.default.put',
            actionPath: 'private.identity.owner',
            inputNode: ownerNode,
            extras: {}
          }
        })
      });
      const putResponse = await putRawResponse.json(); // should be returned in data?
      console.log('putResponse:', putResponse);

      this.fetchIdentity();

      console.log('Done');
      this.setState({
        statusMsg: 'Success!',
        claimingUsername: false
      });
      
    });
    
  }

  parseRoute = async (routeUrl) => {
    
    // parse route 
    // - if no ":" then assume PubNet 
    
    // default to this route
    if(routeUrl.indexOf(':') === -1){
      routeUrl = 'second://' + routeUrl;
    }
    
    let parser;
    if(typeof window != 'undefined'){
      parser = window.document.createElement('a');
      parser.href = routeUrl; 
    } else {
      parser = new URL(routeUrl);
    }
    
    let protocol = parser.protocol.toLowerCase();
    switch(protocol){
      case 'http:':
      case 'https:':
      case 'id:':
        protocol = 'second:'; 
        // no break!! 
      case 'idtest:':
      case 'test:':
      case 'second:':
        parser.protocol = 'http:';
        break;
      
      default:
        window.alert('Invalid protocol. please use id:// or idtest:// or second://');
        console.error('protocol:', parser.protocol);
        return false;
    }
    
    let baseIdentity = parser.host.normalize('NFKC').toLowerCase();;
    let subName = (parser.username || '').normalize('NFKC').toLowerCase();;
    let fullName = subName.length ? `${subName}@${baseIdentity}` : baseIdentity;
    let password = parser.password.length ? parser.password : '';
    let routePath = parser.pathname || '/'; // parser.pathname ? parser.pathname.slice(1) : ''; // OLD removed leading slash! 
    let network = 'public';
    
    console.log('Parsed route:', {baseIdentity, subName, password, routePath});
  
    switch(protocol){
      case 'id:':
      case 'second:':
        StellarSdk.Network.usePublicNetwork();
        break;
      case 'idtest:':
      case 'test:':
        StellarSdk.Network.useTestNetwork();
        network = 'test';
        break;
      default:
        console.error('Invalid protocol');
        return;
    }
    
    let usernameSeed = crypto.createHash('sha256').update(baseIdentity).digest(); //returns a buffer
    console.log('usernameSeed', usernameSeed);
    
    var pairForIdentity = StellarSdk.Keypair.fromRawEd25519Seed(usernameSeed);
    
    // // route path ALWAYS starts with a slash 
    // // - reserving non-slash for zone-like files 
    // if(routePath.length == 0){
    //   routePath = '/';
    // }
    
    let lookupPath = baseIdentity + '|' + subName + '|' + password + '|' + routePath;
    
    let lookupPathHash = crypto.createHash('sha256').update(lookupPath).digest('hex'); 

    let nameWithProtocol = [protocol, '//', fullName].join('');
    
    return {
      nameWithProtocol,
      pairForIdentity,
      parser,
      protocol,
      baseIdentity,
      subName,
      fullName,
      password,
      routePath,
      lookupPath,
      lookupPathHash,
      network
    }
    
  }

  addRouteData = async (ipfsHashOfData, routePath) => {
    
    // stellar key should be pasted in 
    let stellarKey = this.state.stellarKey;
    
    this.setState({
      isSaving: true,
      failedSaving: false
    });
    
    try {
        
      let routeInfo = await this.parseRoute(this.state.username + routePath);
      console.log('routeInfo:', routeInfo);
          
      let username = this.state.username;
      let passphrase = this.state.stellarSeed;
      let network = 'public';
      if(username.substring(0,7) == 'test://'){
        username = username.substring(7);
        network = 'test';
      }
      if(username.substring(0,5) == 'test:'){
        username = username.substring(5);
        network = 'test';
      }
      username = username.normalize('NFKC').toLowerCase();
      
      let stellarServer = getStellarServer(network); 

      // multi-sig address for updating 
      let userTargetSeed = jsSHA256.array(username);
      var pairUsername = StellarSdk.Keypair.fromRawEd25519Seed(userTargetSeed);
      var pairForWrite = StellarSdk.Keypair.fromSecret(passphrase);
      
      let identityAccount;
      try {
        identityAccount = await stellarServer.loadAccount(pairUsername.publicKey())
        console.log('identityAccount:', identityAccount);
      }catch(err){
        console.error('Failed getting identityAccount', err);
        window.alert('failed loading idenity');
        throw 'Failed loading identity'
      }
      
      // write the new data value 
      console.log('writing ipfs values to ipfs');
       
      let value = ipfsHashOfData; //ipfsHashOfEncryptedData || ipfsHashOfData;
      let name = routeInfo.lookupPathHash;
      
      console.log('name, value:', name, value);
      
      // Start building the transaction for manageData update
      let transaction = new StellarSdk.TransactionBuilder(identityAccount,{
        fee: StellarSdk.BASE_FEE
      })
      
      .addOperation(StellarSdk.Operation.manageData({
        name, // just use /path ? 
        value // encrypted, if exists 
      }))
      // .addMemo(StellarSdk.Memo.hash(b32))
      .setTimeout(1000)
      .build();

      // Sign the transaction to prove you are actually the person sending it.
      transaction.sign(pairUsername); // targetKeys
      transaction.sign(pairForWrite); // sourceKeys

      // send to stellar network
      let stellarResult = await stellarServer.submitTransaction(transaction)
      .then(function(result) {
        console.log('Stellar manageData Success! Results:'); //, result);
        return result;
      })
      .catch(function(error) {
        console.error('Stellar Something went wrong (failed updating data)!', error);
        // If the result is unknown (no response body, timeout etc.) we simply resubmit
        // already built transaction:
        // server.submitTransaction(transaction);
        return null;
      });

      // console.log('stellarResult', stellarResult);

      if(!stellarResult){
        console.error('Failed stellar manageData');
        throw 'Failed stellar manageData'
      }

      console.log('stellarResult succeeded! (manageData)');
      
      console.log('stellarResult', stellarResult);
      return true;
      
    }catch(err){
      // failed finding route data 
      console.error('Failed saving route', err);
      
      this.setState({
        failedSaving: 'Failed saving route'
      })
      return false;
    
    }
    
    this.setState({isSaving: false});
    
  }
  

  createIpfsHashOnSecond = (fileValue) => {
    // shared_node
    // 
    return new Promise(async (resolve,reject)=>{
        
      try {
        
        this.setState({
          isCreating: true
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
              serviceName: 'services.second.default.capability.ipfs.files.add',
              actionPath: 'builtin-input',
              inputNode: {
                type: '',
                data: {
                  pin: true,
                  fileValue: fileValue
                }
              },
              extras: {}
            }
          })
        });
        const nodeResponse = await rawResponse.json(); // should be returned in data?

        // response.data, nodelist.data = array 
        let hashResponse = nodeResponse.data.data;
        let ipfsHash = hashResponse.hash;

        this.setState({
          isCreating: false
        })
        
        return resolve(ipfsHash);
        
      } catch(err){
        console.error('Failed createIpfsHashOnSecond request', err);
        reject();
      }
    
      this.setState({
        isCreating: false
      })
      
      
      return;
      
    });
    
  }

  handleSearch = async () => {

    console.log('searching');
    
    // stellar key should be pasted in 
    let stellarKey = this.state.stellarSeed;
    
    // let routeText = this.state.routeText;
    let routeFullPath = this.state.username + '/';
    
    this.setState({
      isSearching: true,
      failedSearch: false
    });
    
    try {
      
      // Load message-input node for username 
      let routeInfo = await this.parseRoute(routeFullPath);
      if(!routeInfo){
        this.setState({
          isSearching: false,
          failedSearch: 'Invalid route'
        });
        return false;
      }
      
      // Check username 
      let stellarServer = getStellarServer(routeInfo.network)
      
      this.setState({
        usernameClaimable: false,
        usernameOwnedByMe: false
      });
      
      let identityAccount;
      try {
        identityAccount = await stellarServer.loadAccount(routeInfo.pairForIdentity.publicKey())
        console.log('identityAccount:', identityAccount);
      }catch(err){
        console.error('Failed getting identityAccount', err);
        // WINDOW.alert('failed loading idenity');
        
        this.setState({
          usernameClaimable: true
        });
      
        throw 'Failed loading identity'
      }
      
      // // owned by me? 
      // var pairSource = StellarSdk.Keypair.fromSecret(this.state.stellarKey);
      // var pairSourcePublicKey = pairSource.publicKey();
      // for(let signer of identityAccount.signers){
      //   if(signer.public_key == pairSourcePublicKey){
      //     this.setState({
      //       usernameOwnedByMe: true
      //     })
      //   }
      // }
      
      
      // Load route data 
      let ipfsData = await this.loadIdentityRoute(routeInfo.network, routeInfo.pairForIdentity.publicKey(), routeInfo.lookupPath);
      
      if(!ipfsData){
        // Unable to find valid 
        console.error('Failed to lookup connection info');
        this.setState({
          isSearching: false,
          failedSearch: 'Failed to find user connection info (1)'
        })
        return false;
      }
      
      console.log('ipfsData:', ipfsData);
      
      // TODO: handle decryption automatically with passwords? 
      
      let dec = ipfsData;
      let actualValue = dec;
      if(routeInfo.password){
        console.log('had password'); 
        dec = await decryptToString(ipfsData, routeInfo.password + routeInfo.routePath);
        console.log('decrypted1:', dec);
        actualValue = await getIpfsValue(dec);
        dec = await decryptToString(actualValue, routeInfo.password + routeInfo.routePath);
        actualValue = dec;
      }
      
      console.log('decrypted-same:', dec == actualValue ? true:false, dec, actualValue);
      
      
      // expecting a Node type to be returned 
      let nodeData;
      let prettyData = actualValue;
      try {
        nodeData = JSON.parse(actualValue);
        prettyData = JSON.stringify(nodeData, null, 2);
      }catch(err){
        console.error('unable to parse nodedata');
      }
      
      console.log('Final nodeData:', nodeData);
      
      this.setState({
        dataValue: prettyData
      });
      
    }catch(err){
      // failed finding route data 
      console.error('Failed searching', err);
      
      this.setState({
        failedSearch: true
      })
    
    }
    
    this.setState({isSearching: false});
    
  }
  
  loadIdentityRoute = async (network, pubKey, route) => {
    
    try {
        
      let stellarServer = getStellarServer(network);
        
      let identityAccount;
      try {
        identityAccount = await stellarServer.loadAccount(pubKey)
        console.log('identityAccount:', identityAccount);
      }catch(err){
        console.error('Failed getting identityAccount', err);
        return false;
      }
      
      let lookupPathHash = crypto.createHash('sha256').update(route).digest('hex'); 
      
      console.log('lookupPathHash', lookupPathHash);

      // get the ipfs value 
      let valueIpfsHash = await identityAccount.data({key: lookupPathHash})
      .then(function(dataValue) {
        let decoded = atob(dataValue.value);
        return decoded;
      })
      .catch(function (err) {
        console.error('ipfs error', err);
        return null;
      })
      
      console.log('Data Result:', valueIpfsHash);
      if(!valueIpfsHash){
        // throw 'Missing data result'
        console.error('Missing data result');
        return undefined;
      }
      
      // Load IPFS data 
      let ipfsData;
      try {
        ipfsData = await getIpfsValue(valueIpfsHash);
      } catch(err){
        console.error('Failed to find default ipfsData for proxy route');
        ipfsData = undefined;
      }
      
      console.log('ipfsData:', ipfsData);
      
      return ipfsData;
      
    }catch(err){
      console.error('Failed loadIdentityRoute:', err);
      return undefined;
    }
    
  }
  

  loadPurchaseInfo = (identityAccount) => {
    
    return new Promise(async (resolve,reject)=>{
      
      let subName = '';
      let lookupPath = subName + '|' + 'purchase-info';
      let lookupPathHash = crypto.createHash('sha256').update(lookupPath).digest('hex'); 
      
      console.log('lookupPathHash', lookupPathHash);

      // get the ipfs value 
      let valueIpfsHash = await identityAccount.data({key: lookupPathHash})
      .then(function(dataValue) {
        let decoded = atob(dataValue.value);
        return decoded;
      })
      .catch(function (err) {
        console.error('ipfs error', err);
        return null;
      })
      
      console.log('Data Result:', valueIpfsHash);
      if(!valueIpfsHash){
        return resolve(null);
      }
      
      // Load IPFS data 
      let ipfsData = await getIpfsValue(valueIpfsHash);
      
      return resolve(ipfsData);
      
    });
      
  }

  generateStellarSeed = () => {
    // creates the Stellar seed for your controlling account (NOT identity, for creating identity from this) 
    // - makes the testnet "give me 1000 Lumens" request 

    let stellarServer = getStellarServer('test'); 

    this.setState({
      generatingLumens: true,
      lumensMessage: null
    });

    // // let pkSeed = crypto.createHash('sha256').update('blah blah this is my custom account').digest(); //returns a buffer
    // let pkSeed = SHA256('testing this out');
    // console.log('pkSeed:', pkSeed);
    // var pair = StellarSdk.Keypair.fromRawEd25519Seed(pkSeed);
    var pair = StellarSdk.Keypair.random(); //fromRawEd25519Seed(pkSeed);

    this.setState({
      stellarSeed: pair.secret()
    });

    // let stellarKeys = {
    //   private: pair.secret(),
    //   public: pair.publicKey()
    // }
    // console.log('stellarKeys',stellarKeys);
    var url = new window.URL('https://friendbot.stellar.org/'),
      params = { addr: pair.publicKey() };
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))


    fetch(url)
    .then(response=>{
      console.log('Response1:', response);
      if(response.status == 200){
        return response;
      }
      // failed!
      this.setState({
        generatingLumens: false,
        lumensMessage: 'Failed populating seed wallet'
      })
      throw "Failed populating seed wallet with Friendbot lumens"
    })
    .then(response=>response.json())
    .then(response=>{
      console.log('Friendbot Response:', response);

      prompt('Funded on TestNet. Copy this Seed/Secret value (it will only be shown once!)',pair.secret());

      this.setState({
        generatingLumens: false
      });

      // this.getBalance();

    })
    .catch(err=>{
      console.error('Failed Response', err);
    })



    // }, function(error, response, body) {
    //   if (error || response.statusCode !== 200) {
    //     console.error('ERROR!', error || body);
    //   }
    //   else {
    //     console.log('SUCCESS! You have a new account :)\n', body);
    //   }


    //   this.setState({
    //     generatingLumens: false
    //   });

    // });


    // // the JS SDK uses promises for most actions, such as retrieving an account
    // stellarServer.loadAccount(stellarKeys.public)
    // .catch(StellarSdk.NotFoundError, function (error) {
    //   throw new Error('The destination account does not exist!');
    // })
    // .then(function(account) {
    //   console.log('Balances for account: ' + stellarKeys.public);
    //   account.balances.forEach(function(balance) {
    //     console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
    //   });
    // });


    // // // Run a transaction FROM the target (needs to be sent money, then send money out?) 
    // let pkTargetSeed = crypto.createHash('sha256').update('testing103').digest(); //returns a buffer
    // var pairTarget = StellarSdk.Keypair.fromRawEd25519Seed(pkTargetSeed);

    // let stellarKeysTarget = {
    //   private: pairTarget.secret(),
    //   public: pairTarget.publicKey()
    // }

    // console.log('stellarKeysTarget',stellarKeysTarget);

    // // get transactions for Target

    // var destinationId = stellarKeysTarget.public;

    // // Transaction will hold a built transaction we can resubmit if the result is unknown.
    // var transaction;


    // // // the JS SDK uses promises for most actions, such as retrieving an account
    // // stellarServer.loadAccount(destinationId)
    // // .catch(StellarSdk.NotFoundError, function (error) {
    // //   console.error('The destination account does not exist! (expected when creating new identity!)');
    // // })
    // // .then(function(account) {
    // //   console.log('Balances for account: ' + stellarKeys.public);
    // //   account.balances.forEach(function(balance) {
    // //     console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
    // //   });
    // // });


    // // First, check to make sure that the destination account exists.

    // const ipfsHashTo32ByteBuffer = function(ipfsHash) {
    //   let buf = multihash.fromB58String(ipfsHash)
    //   let digest = multihash.decode(buf).digest
    //   return digest;
    // }

    // let b32 = ipfsHashTo32ByteBuffer('Qmf4437bCR2cwwpPh6dChwMSe5wuLJz32caf2aZP3xxtNR');

    // let tmp1 = new Buffer('+FYuRGmZIz/e/T0UungCrIbiMCwukMFzPJWAHzsLH84=','base64'); //.toString('hex');
    // console.log('Qmf4437bCR2cwwpPh6dChwMSe5wuLJz32caf2aZP3xxtNR');
    // let digest1 = multihash.encode(tmp1, 'sha2-256');
    // let hash1 = multihash.toB58String(digest1);
    // console.log(hash1);

    // // let b32 = crypto.createHash('sha256').update('test').digest(); //returns a buffer
    // // console.log('b32:', b32.toString('hex'));
    // // let str2 = new Buffer('n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=','base64').toString('hex')
    // // console.log('same?:', str2); //bs58.decode(str2).toString('hex'));

    // // stellarServer.loadAccount(stellarKeys.public)
    // //   // // If the account is not found, surface a nicer error message for logging.
    // //   // .catch(StellarSdk.NotFoundError, function (error) {
    // //   //   throw new Error('The destination account does not exist!');
    // //   // })
    // //   // If there was no error, load up-to-date information on your account.
    // //   // .then(function() {
    // //   //   return stellarServer.loadAccount(stellarKeys.public);
    // //   // })
    // //   .then(function(sourceAccount) {
    // //     // Start building the transaction.
    // //     transaction = new StellarSdk.TransactionBuilder(sourceAccount)
          
    // //       .addOperation(StellarSdk.Operation.createAccount({
    // //         destination: pairTarget.publicKey(),
    // //         startingBalance: "10"
    // //         // source: pair
    // //       }))

    // //       // A memo allows you to add your own metadata to a transaction. It's
    // //       // optional and does not affect how Stellar treats the transaction.
    // //       // .addMemo(StellarSdk.Memo.text('Qmf4437bCR2cwwpPh6dChwMSe5wuLJz32caf2aZP3xxtNR'))
    // //       .addMemo(StellarSdk.Memo.hash(b32))
    // //       .build();
    // //     // Sign the transaction to prove you are actually the person sending it.
    // //     transaction.sign(pair); // sourceKeys
    // //     // send to stellar network
    // //     return stellarServer.submitTransaction(transaction);
    // //   })
    // //   .then(function(result) {
    // //     console.log('Stellar Success! Results:', result);
    // //   })
    // //   .catch(function(error) {
    // //     console.error('Stellar Something went wrong!', error);
    // //     // If the result is unknown (no response body, timeout etc.) we simply resubmit
    // //     // already built transaction:
    // //     // server.submitTransaction(transaction);
    // //   });




    // // // Get the 1st (on page 1 only!) transaction where the memo is an ipfs hash 
    // // stellarServer.transactions()
    // //   .forAccount(destinationId)
    // //   .call()
    // //   .then(function (page) {
    // //     console.log('Page 1: ', page.records.length);
    // //     console.log(JSON.stringify(page.records,null,2));
    // //     // console.log(page.records.length);
    // //   })


  }

  claimUsername = async () => {
    // sets up the identity
    // - assuming NOT setup at all yet 
    // - error if already created 

    // also sets up multi-sig control over data! 
    
        
    let username = this.state.username;
    let passphrase = this.state.stellarSeed;
    let network = 'public';
    
    if(username.substring(0,7) == 'test://'){
      username = username.substring(7);
      network = 'test';
    }
    
    if(username.substring(0,5) == 'test:'){
      username = username.substring(5);
      network = 'test';
    }
    username = username.normalize('NFKC').toLowerCase();
    
    let stellarServer = getStellarServer(network); 

    // validate stellar seed 
    // - an account with enough Lumens in it 

    this.setState({
      claimingUsername: true // probably already true! 
    });

    var pairSource = StellarSdk.Keypair.fromSecret(passphrase);

    let errors = [];

    this.setState({
      statusMsg: 'Rechecking Username'
    });
    
    // Load source account
    let sourceAccount;
    try {
      sourceAccount = await stellarServer.loadAccount(pairSource.publicKey())
    }catch(err){
      // problem with account 
      // window.alert('The seed stellar account does not exist!');

      this.setState({
        statusMsg: 'Failed creating account, please try again',
        claimingUsername: false
      });
      return false;
    }

    // get source balance 
    if(sourceAccount){
      let balance = 0;
      balance = sourceAccount.balances[0].balance;

      console.log('Balance:', balance);

      balance = parseFloat(balance);
      if(balance < parseFloat(fundingBalance)){
        
        this.setState({
          statusMsg: 'Insufficient balance in source account (need 6+ lumens). Please try again',
          claimingUsername: false
        });

        return false;
      }
    }

    // validate that Identity is available (or already owned)
    // - should be a nonexistant account (or have my sourcePublicKey as a signer) 
    // - TODO: "rent" via smart contracts 

    let pkTargetSeed = jsSHA256.array(username);
    var pairTarget = StellarSdk.Keypair.fromRawEd25519Seed(pkTargetSeed);

    let targetAccount;
    try {
      targetAccount = await stellarServer.loadAccount(pairTarget.publicKey())
      console.log('targetAccount:', targetAccount);
      
      this.setState({
        statusMsg: 'Username already exists, cant claim',
        claimingUsername: false
      });

      return false;
    }catch(err){

    }


    this.setState({
      statusMsg: 'Claiming Username'
    });

    // Start building the transaction.
    // - fees: https://www.stellar.org/developers/guides/concepts/fees.html
    // - starting balance: (2 + # of entries) × base reserve
    //   - 2 signers (original, my secret) 
    //   - 1 Data entry 
    let transaction = new StellarSdk.TransactionBuilder(sourceAccount,{
      fee: StellarSdk.BASE_FEE
    })
    .addOperation(StellarSdk.Operation.createAccount({
      destination: pairTarget.publicKey(),
      startingBalance: fundingBalance // 2.5 is required, 2.5 extra for manageData entries (allows for 4 entries? second, nodechain, ...) 
      // source: pair
    }))

    // A memo allows you to add your own metadata to a transaction. It's
    // optional and does not affect how Stellar treats the transaction.
    // .addMemo(StellarSdk.Memo.text('Qmf4437bCR2cwwpPh6dChwMSe5wuLJz32caf2aZP3xxtNR'))
    // .addMemo(StellarSdk.Memo.hash(b32))
    .setTimeout(1000)
    .build();

    // Sign the transaction to prove you are actually the person sending it.
    transaction.sign(pairSource); // sourceKeys

    // send to stellar network
    let stellarResult = await stellarServer.submitTransaction(transaction)
    .then(function(result) {
      console.log('Stellar Success! Results:', result);
      return result;
    })
    .catch(function(error) {
      console.error('Stellar Something went wrong!', error);
      // If the result is unknown (no response body, timeout etc.) we simply resubmit
      // already built transaction:
      // server.submitTransaction(transaction);
      
      return null;
    });

    console.log('stellarResult', stellarResult);
    if(!stellarResult){
      // window.alert('Failed claiming account');

      this.setState({
        statusMsg: 'Failed claiming account at funding stage',
        claimingUsername: false
      });

      return false;
    }


    targetAccount = await stellarServer.loadAccount(pairTarget.publicKey())

    // Add multisig 
    console.log('adding multisig', targetAccount);

    // set multi-sig on this account 
    // - will fail if I am unable to "claim" 

    // Start building the transaction.
    let transaction2 = new StellarSdk.TransactionBuilder(targetAccount,{
      fee: StellarSdk.BASE_FEE
    })

    // .addOperation(StellarSdk.Operation.manageData({
    //   name: '|second',
    //   value: '-'
    // }))

    .addOperation(StellarSdk.Operation.setOptions({
      signer: {
        ed25519PublicKey: pairSource.publicKey(),
        weight: 1
      }
    }))
    .addOperation(StellarSdk.Operation.setOptions({
      masterWeight: 1, // set master key weight (should really be nothing, and controlled by this other key?) 
      lowThreshold: 2, // trustlines
      medThreshold: 2, // manageData
      highThreshold: 2  // setOptions (multi-sig)
    }))
    .setTimeout(1000)
    .build();

    // Sign the transaction to prove you are actually the person sending it.
    transaction2.sign(pairTarget); // sourceKeys
    // transaction2.sign(pairSource); // sourceKeys

    // send to stellar network
    let stellarResult2 = await stellarServer.submitTransaction(transaction2)
    .then(function(result) {
      console.log('Stellar MultiSig Setup Success! Results:', result);
      return result
    })
    .catch(function(error) {
      console.error('Stellar Something went wrong (failed multisig)!', error);
      // If the result is unknown (no response body, timeout etc.) we simply resubmit
      // already built transaction:
      // server.submitTransaction(transaction);
      return null;
    });

    console.log('Multisig result:', stellarResult2);

    if(!stellarResult2){
      // window.alert('Failed multisig setup');

      this.setState({
        statusMsg: 'Failed claiming username at multisig setup',
        claimingUsername: false
      });

      return false;
    }

    // window.alert('Claimed Username');
    this.setState({
      statusMsg: 'Claimed Username'
    });

    // // re-run validation (to verify changes worked!) 
    // await this.validate();


    // await newNode(this.state.newNode);
    
    this.setState({
      claimingUsername: false,
    });
    
    try {
      if(this.props.onAfterCreate){
        this.props.onAfterCreate();
      }
      // EE.emit('recheck-login', '');
    }catch(err){
      console.error('recheck login failed:', err);
    }

    return true;

  }
  
  render = () => {
  
    return (
      <section className="hero is-fullheight is-white has-background-info">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-6">

                <div className="box" style={{background:'white'}}>

                  <h3 className="title is-5">
                    Create Identity 
                    <span style={{fontSize:'12px', fontWeight: 'normal'}}>
                      &nbsp;&nbsp;&nbsp;({
                        this.state.ownerNode ? 
                        <span style={{}}>{this.state.ownerNode.data.username}</span>
                        :
                        <span style={{fontStyle:'italic'}}>none</span>
                      })
                    </span>
                  </h3>
                  <div className="field has-addons">
                    <div className="control is-expanded">
                      <input 
                        className="input" 
                        type="text" 
                        placeholder="Username" 
                        value={this.state.username} 
                        onChange={this.handleChangeUsername} 
                        onKeyDown={this.handleKeyDown} 
                        autocorrect="off" 
                        autocapitalize="none"
                      />
                    </div>
                    <div className="control" style={this.state.checkedUsername ? {}:{display:'none'}}>
                      <span className={"button is-default " + (this.state.checkingUsername ? 'is-loading ':'') + (((this.state.checkedUsername && !this.state.checkingUsername) ? (this.state.usernameAvailable ? 'is-success':'is-danger'):''))}>
                        {
                          this.state.usernameAvailable ? <span className="icon"><i className={"fas fa-check"}></i></span>:
                          'X'
                        }
                      </span>
                    </div>
                    <div className="control" style={(!this.state.usernameAvailable && this.state.checkedUsername && !this.state.checkingUsername) ? {}:{display:'none'}}>
                      <span className={"button is-default " + (this.state.isSearching ? 'is-loading ':'')} onClick={this.handleSearch}>
                        Load Data
                      </span>
                    </div>
                  </div>
                  
                  <div className="field has-addons">
                    <div className="control is-expanded">
                      <input className="input" type="password" placeholder="seed for locking" value={this.state.stellarSeed} onChange={e=>this.setState({stellarSeed:e.target.value})} onKeyDown={this.handleKeyDown} />
                    </div>
                    <div className="control" style={!this.state.stellarSeed ? {}:{display:'none'}}>
                      <span className={"button is-default " + (this.state.generatingLumens ? 'is-loading ':'')} onClick={this.generateStellarSeed}>
                        Create Test
                      </span>
                    </div>
                  </div>
                  
                  <div className="field">
                    <div className="control">
                      <span className={"button is-info " + (this.state.claimingUsername ? 'is-loading':'')} onClick={this.handleClaimClick}>
                        Claim Username and Save Identity 
                      </span>
                    </div>
                  </div>
                  {/*
                  <div className="field">
                    <div className="control">
                      <a onClick={this.handlePurchaseClick}>
                        Don't have a seed value for a username? 
                      </a>
                    </div>
                  </div>
                */}
                  
                  <div>
                    <div>
                      {this.state.statusMsg}
                    </div>
                    <div>
                      {this.state.purchaseInfo}
                    </div>
                  </div>

                  {
                    !this.state.dataValue ? '':
                    <div>
                      <br />
                      <h3 className="title is-5">
                        Data for Username
                      </h3>
                      <div>
                        <pre><code>{this.state.dataValue}</code></pre>
                      </div>
                    </div>
                  }

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
      
  }
}


 
Home = GlobalState(Home);

export default Home;
