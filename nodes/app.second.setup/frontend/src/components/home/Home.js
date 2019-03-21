import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Home.css';

import moment from 'moment';
// for multihashing 
import {default as Unixfs} from 'ipfs-unixfs'
import {DAGNode} from 'ipld-dag-pb'

import GlobalState from 'components/hoc/globalstate/GlobalState';

// import Create from 'create/Create'


const dirtyJSON = require('dirty-json');
const StellarSdk = require('stellar-sdk');
const crypto = require('crypto');
const jsSHA256 = require('js-sha256');
const Buffer = require('buffer/').Buffer; // trailing slash is important! 

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


class Home extends Component {
  constructor(props){
    super(props);
    
    // let thisIpfs = window.existingIpfs;
    // if(!thisIpfs){
    //   thisIpfs = new window.Ipfs();
    //   window.existingIpfs = thisIpfs;
    // }
    
    let routeProtocol = this.props.state.UsernamePassphraseNode.data.network == 'test' ? 'test://':''
    
    let routeHost = routeProtocol + this.props.state.UsernamePassphraseNode.data.username;
    
    this.state = {
      // stellarKey: '',
      // routeText: 'id://nick/test1',
      stellarKey: this.props.state.UsernamePassphraseNode.data.passphrase, 
      defaultRouteHost: routeHost,
      routeHost, // omits trailing '/' if routeText is empty
      sendMessageHost: routeHost,
      routeText: '', // should default to "/" or be in routeHost?
      isSearching: false,
      dataValue: '',
      canParse: true,
      isSaving: false,
      usernameClaimable: false,
      usernameOwnedByMe: true,
      
      tabsMainPossible: [
        ['route','Routes'], 
        ['send_message','Send Message'],
        ['receive_messages','Receive Messages']
      ],
      tabsMainSelected: 'route', 
      
      msgValue: '',
      outgoingMessages: [],
      
      fromRouteHost: this.props.state.UsernamePassphraseNode.data.passphrase, 
      toRouteHost: routeProtocol,
      transferAmount: '0.0',
      
      gettingBalance: [false,false],
      balanceOf: [null,null],
      
      connectedColor: 'yellow',
      
      routesRemaining: 7 // TODO: calculate from stellar balance! 
    }
    
  }
  
  componentDidMount(){
    
    console.log('Loaded interface', this);
    
    this.startup();
    
  }
  
  startup = async () => {
    
    this.updateRouteFullPath();
    
    this.checkIpfsConnected();
    
    this.fetchOutgoingMessages(); // local
    
  }

  logout = async () => {
    
    // remove all data 
    // root nodes that aren't the app 
    await sharedServices.logout();
    
    this.props.setState({
      UsernamePassphraseNode: null,
      waitingForEnabled: true,
      receivingEnabled: false
    });
    
    // window.location.reload();
    
  }
  
  checkIpfsConnected = async () => {
    
    console.log('checkIpfsConnected');
    
    let connectedColor = 'yellow';
    
    this.setState({
      connectedColor
    });
    
    let response = await fetch('/api/ipfs-connected',{
      method: 'POST',
      headers: {
          "Content-Type": "application/json", // charset=utf-8
      }
    })
    console.log('Response:', response);
    
    let responseJson = await response.json();
    
    console.log('responseJson', responseJson);
    
    if(responseJson.data){
      connectedColor = 'green';
    } else {
      connectedColor = 'red';
    }
    
    this.setState({
      connectedColor
    });
    
    
  }
  
  updateRouteFullPath = async () => {
    
    let {
      routeHost,
      routeText
    } = this.state;
    
    routeText = routeText.trim();
    
    if(!routeText.length){
      // routeHost = routeHost;
      routeText = '/';
    } else {
      if(routeText.substring(0,1) != '/'){
        routeText = '/' + routeText;
      }
    }
    
    let routeFullPath = routeHost + routeText;
    
    console.log('routeFullPath', routeFullPath);
    
    this.setState({
      routeFullPath
    })
  }
  
  handleSearchKeyDown = async (e) => {
  
    if(e.key && e.key.toLowerCase() == 'enter'){
      
      this.handleSearch();
      
    } 
  }
  
  handleTextareaKeydown = async (e) => {
  
    let nodeData = this.state.dataValue; 
    try {
      nodeData = dirtyJSON.parse(nodeData);
      
      this.setState({
        canParse: true
      });
      
    }catch(err){
      this.setState({
        canParse: false
      });
    }
    
    this.setState({
      isSending: false
    })
    
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
      const { URL } = require('url');
      parser = new URL(routeUrl);
    }
    
    let protocol = parser.protocol;
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
    
    let baseIdentity = parser.host;
    let subName = parser.username || '';
    let fullName = subName.length ? `${subName}@${baseIdentity}` : baseIdentity;
    let password = parser.password.length ? parser.password : '';
    let routePath = parser.pathname || '/'; // parser.pathname ? parser.pathname.slice(1) : ''; // OLD removed leading slash! 
    
    console.log('Parsed route:', {baseIdentity, subName, password, routePath});
  
    switch(protocol){
      case 'id:':
      case 'second:':
        StellarSdk.Network.usePublicNetwork();
        break;
      case 'idtest:':
      case 'test:':
        StellarSdk.Network.useTestNetwork();
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
    
    return {
      pairForIdentity,
      parser,
      protocol,
      baseIdentity,
      subName,
      fullName,
      password,
      routePath,
      lookupPath,
      lookupPathHash
    }
    
  }
  
  loadIdentityRoute = async (protocol, pubKey, route) => {
    
    try {
        
      let stellarServer = new StellarSdk.Server(horizonPossible[protocol]);
        
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
  
  handleSearch = async () => {
    console.log('searching');
    
    // stellar key should be pasted in 
    let stellarKey = this.state.stellarKey;
    
    // let routeText = this.state.routeText;
    let routeFullPath = this.state.routeFullPath;
    
    this.setState({
      isSearching: true,
      failedSearch: false
    });
    
    try {
      
      // Load message-input node for username 
      let routeInfo = await this.parseRoute(this.state.routeFullPath);
      if(!routeInfo){
        this.setState({
          isSearching: false,
          failedSearch: 'Invalid route'
        });
        return false;
      }
      
      // Check username 
      let stellarServer = new StellarSdk.Server(horizonPossible[routeInfo.protocol]);
      
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
        // window.alert('failed loading idenity');
        
        this.setState({
          usernameClaimable: true
        });
      
        throw 'Failed loading identity'
      }
      
      // owned by me? 
      var pairSource = StellarSdk.Keypair.fromSecret(this.state.stellarKey);
      var pairSourcePublicKey = pairSource.publicKey();
      for(let signer of identityAccount.signers){
        if(signer.public_key == pairSourcePublicKey){
          this.setState({
            usernameOwnedByMe: true
          })
        }
      }
      
      
      // Load route data 
      let ipfsData = await this.loadIdentityRoute(routeInfo.protocol, routeInfo.pairForIdentity.publicKey(), routeInfo.lookupPath);
      
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
      try {
        nodeData = JSON.parse(actualValue);
      }catch(err){
        console.error('unable to parse nodedata');
      }
      
      console.log('Final nodeData:', nodeData);
      
      this.setState({
        dataValue: actualValue
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
  
  getBalance = async (idx) => { 
    // 0 = From 
    // 1 = To 
    
    this.setState(state=>{
      state.gettingBalance[idx] = true;
      state.balanceOf[idx] = null;
      return state;
    });
    
    let pubKey;
    
    // get protocol from "To" person 
    let routeInfo = await this.parseRoute(this.state.toRouteHost);
    if(!routeInfo){
      window.alert('Invalid username protocol to send to');
      this.setState(state=>{
        state.gettingBalance[idx] = false;
        return state;
      });
      return false;
    }
    
    
    let stellarServer = new StellarSdk.Server(horizonPossible[routeInfo.protocol]);
    
    if(idx == 0){
      
      // From (private key only) 
      var pairSource = StellarSdk.Keypair.fromSecret(this.state.fromRouteHost);
      pubKey = pairSource.publicKey();
      
    } else {
      
      // To (username and protocol) 
      pubKey = routeInfo.pairForIdentity.publicKey();
      
    }
    
    
    let targetAccount;
    try {
      targetAccount = await stellarServer.loadAccount(pubKey)
    }catch(err){
      console.error('Failed getting targetAccount', err);
      this.setState(state=>{
        state.gettingBalance[idx] = false;
        return state;
      });
      return false;
    }
    
    console.log('targetAccount:', targetAccount);
    
    this.setState(state=>{
      state.balanceOf[idx] = targetAccount.balances[0].balance;
      state.gettingBalance[idx] = false;
      return state;
    });
    
  }
    
  
  handleTransfer = async () => { 
    
    // stellar key should be pasted in 
    let fromStellarKey = this.state.fromRouteHost;
    let toRouteHost = this.state.toRouteHost;
    let transferAmount = this.state.transferAmount;
      
    this.setState({
      isTransferring: true,
      failedTransfer: false
    });
    
    try {
      
      if(parseFloat(transferAmount) < 0){
        this.setState({
          isTransferring: false,
          failedTransfer: 'Invalid transfer Amount'
        });
        return false;
      }
      
      // Load username (no routePath expected!) 
      let routeInfo = await this.parseRoute(this.state.toRouteHost);
      if(!routeInfo){
        this.setState({
          isTransferring: false,
          failedTransfer: 'Invalid username to send to (1)'
        });
        return false;
      }
      
      if(routeInfo.routePath.length && routeInfo.routePath != '/'){
        this.setState({
          isTransferring: false,
          failedTransfer: 'Invalid username to send to (2)'
        });
        return false;
        
      }
      
      console.log('toRouteInfo:', routeInfo);
      
      // Check username 
      let stellarServer = new StellarSdk.Server(horizonPossible[routeInfo.protocol]);
      
      let targetAccount;
      try {
        targetAccount = await stellarServer.loadAccount(routeInfo.pairForIdentity.publicKey())
        console.log('targetAccount:', targetAccount);
      }catch(err){
        console.error('Failed getting targetAccount', err);
        // window.alert('failed loading idenity');
        
        this.setState({
          isTransferring: false,
          failedTransfer: 'Failed finding target account (doesnt exist on blockchain)'
        });
      
        return false;
      }
      
      
      var pairSource = StellarSdk.Keypair.fromSecret(fromStellarKey);
      // var pairSourcePublicKey = pairSource.publicKey();
      
      let sourceAccount;
      try {
        sourceAccount = await stellarServer.loadAccount(pairSource.publicKey())
        console.log('sourceAccount:', sourceAccount);
      }catch(err){
        console.error('Failed getting sourceAccount', err);
        // window.alert('failed loading idenity');
        
        this.setState({
          isTransferring: false,
          failedTransfer: 'Failed finding source account (doesnt exist on blockchain)'
        });
      
        return false;
      }
      
      
      // Start building the transaction for manageData update
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(StellarSdk.Operation.payment({
          destination: routeInfo.pairForIdentity.publicKey(),
          // Because Stellar allows transaction in many currencies, you must
          // specify the asset type. The special "native" asset represents Lumens.
          asset: StellarSdk.Asset.native(),
          amount: transferAmount
        }))
        // A memo allows you to add your own metadata to a transaction. It's
        // optional and does not affect how Stellar treats the transaction.
        // .addMemo(StellarSdk.Memo.text('Test'))
        .build();

      // Sign the transaction to prove you are actually the person sending it.
      // transaction.sign(routeInfo.pairForIdentity); // targetKeys
      transaction.sign(pairSource); // sourceKeys

      // send to stellar network
      let stellarResult = await stellarServer.submitTransaction(transaction)
      .then(function(result) {
        console.log('Stellar payment Success! Results:'); //, result);
        return result;
      })
      .catch(function(error) {
        console.error('Stellar Something went wrong (failed payment)!', error);
        // If the result is unknown (no response body, timeout etc.) we simply resubmit
        // already built transaction:
        // server.submitTransaction(transaction);
        return null;
      });

      // console.log('stellarResult', stellarResult);

      if(!stellarResult){
        console.error('Failed stellar payment');
        throw 'Failed stellar payment'
      }
      
      console.log('Payment succeeded!', stellarResult);
      
      
    }catch(err){
      // failed finding route data 
      console.error('Failed transfer', err);
      
      this.setState({
        failedTransfer: true
      })
    
    }
    
    this.setState({isTransferring: false});
    
  }
  
  
  handleAddRouteData = async (e) => {
    
    // stellar key should be pasted in 
    let stellarKey = this.state.stellarKey;
    
    let nodeData = this.state.dataValue; // expecting a string, should be JSON.parse'able 
    
    // try {
    //   JSON.parse(nodeData);
    // }catch(err){
    //   window.alert('Invalid JSON specified');
    //   return false;
    // }
    
    // let routeText = this.state.routeText;
    let routeFullPath = this.state.routeFullPath;
    
    this.addRouteData(nodeData, routeFullPath);
  }
  
  
  
  addRouteData = async (nodeData, routeFullPath) => {
    
    // stellar key should be pasted in 
    let stellarKey = this.state.stellarKey;
    
    this.setState({
      isSaving: true,
      failedSaving: false
    });
    
    try {
        
      let routeInfo = await this.parseRoute(routeFullPath);
      if(!routeInfo){
        this.setState({
          isSaving: false,
          failedSaving: 'Invalid route'
        });
        return false;
      }
        
      // encrypt data using password
      if(routeInfo.password){
        nodeData = await encryptToString(nodeData, routeInfo.password+routeInfo.routePath);
      }
      
      console.log('encrypted NodeData:', nodeData);
      
      // create IPFS hashes of nodeData 
      let ipfsHashOfData = await this.createIpfsHashOnSecond(nodeData); // TODO 
      
      console.log('ipfsHashOfData:', ipfsHashOfData);
      
      let encryptedDataToSave,
        ipfsHashOfEncryptedData;
      if(routeInfo.password){
        // encrypt the ipfs hash using password+path 
        console.log('Using password for encryption');
        encryptedDataToSave = await encryptToString(ipfsHashOfData, routeInfo.password+routeInfo.routePath); // TODO
        ipfsHashOfEncryptedData = await this.createIpfsHashOnSecond(encryptedDataToSave); 
        console.log('ipfsHashOfEncryptedData:', ipfsHashOfEncryptedData);
      }
      
      
      // Add files and pin data to IPFS 
      // TODO 
      
      
      // Write to Stellar 
      let stellarServer = new StellarSdk.Server(horizonPossible[routeInfo.protocol]);
      
      // multi-sig address for updating 
      var pairForWrite = StellarSdk.Keypair.fromSecret(stellarKey);
      
      console.log('pairForIdentity', routeInfo.pairForIdentity);
      
      let identityAccount;
      try {
        identityAccount = await stellarServer.loadAccount(routeInfo.pairForIdentity.publicKey())
        console.log('identityAccount:', identityAccount);
      }catch(err){
        console.error('Failed getting identityAccount', err);
        window.alert('failed loading idenity');
        throw 'Failed loading identity'
      }
      
      // write the new data value 
      console.log('writing ipfs values to ipfs');
       
      let value = ipfsHashOfEncryptedData || ipfsHashOfData;
      let name = routeInfo.lookupPathHash;
      
      console.log('name, value:', name, value);
      
      // Start building the transaction for manageData update
      let transaction = new StellarSdk.TransactionBuilder(identityAccount)
      
      .addOperation(StellarSdk.Operation.manageData({
        name, // just use /path ? 
        value // encrypted, if exists 
      }))
      // .addMemo(StellarSdk.Memo.hash(b32))
      .build();

      // Sign the transaction to prove you are actually the person sending it.
      transaction.sign(routeInfo.pairForIdentity); // targetKeys
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
      
    }catch(err){
      // failed finding route data 
      console.error('Failed saving route', err);
      
      this.setState({
        failedSaving: 'Failed saving route'
      })
    
    }
    
    this.setState({isSaving: false});
    
  }
  
  handleViewAccount = async () => {
    
    let stellarKey = this.state.stellarKey;
    
    let routePath = this.state.routePath;
    
    try {
        
      // parse route 
      // - parse twice, second time probably using http, cuz id/idtest are not recognized protocols yet 
      let parser;
      if(typeof window != 'undefined'){
        parser = window.document.createElement('a');
        parser.href = routePath; 
      } else {
        const { URL } = require('url');
        parser = new URL(routePath);
      }
      
      let protocol = parser.protocol;
      switch(protocol){
        case 'id:':
        case 'idtest:':
        case 'second:':
          parser.protocol = 'http:';
          break;
        
        default:
          window.alert('Invalid protocol. please use id:// or idtest:// or second://');
          throw 'Invalid protocol'
      }
      
      let baseIdentity = parser.host;
      
      let pkTargetSeed = jsSHA256.array(baseIdentity);
      var pairTarget = StellarSdk.Keypair.fromRawEd25519Seed(pkTargetSeed);
      
      let href = `https://horizon-testnet.stellar.org/accounts/${pairTarget.publicKey()}`;
      
      window.open(href, '_blank');
      
      console.log('href:', href);
    
    }catch(err){
      console.error('Failed finding identity link:', err);
      
    }
  }
  
  createIpfsHashOnSecond = async (fileValue) => {
    // shared_node
    // 
    return new Promise(async (resolve,reject)=>{
        
      try {
        
        this.setState({
          isCreating: true
        })

        console.log('stellarKey:', this.state.stellarKey);
        var passwordPair = StellarSdk.Keypair.fromSecret(this.state.stellarKey);
        
        let sourcePublicKey = passwordPair.publicKey();
        let sig = passwordPair.sign(fileValue).toString('base64'); //fileValue);
        
        console.log('sig:', sig, typeof sig);
        
        fetch('/api/ipfs-pin',{
          method: 'POST',
          headers: {
              "Content-Type": "application/json", // charset=utf-8
          },
          body: JSON.stringify({
            username: this.state.inviteCode,
            sourcePublicKey, 
            sig,
            fileAsString: fileValue
          })
        })
        .then(response=>{
          console.log('Response1:', response);
          if(response.status == 200){
            return response;
          }
          // failed!
          console.error('failed!', response);
          // this.setState({
          //   generatingLumens: false,
          //   lumensMessage: 'Failed populating seed wallet'
          // })
          // throw "Failed populating seed wallet with Friendbot lumens"
          reject()
        })
        .then(response=>response.json())
        .then(async (response)=>{
          console.log('Response:', response);
          
          // Succeeded in creating ownership account for us to reserve the username 
          // - NOT creatinig username on server, just accepting the invite for controller account 
          //   - prevents passphrase from needing to go to the server (just send the pubkey!) 
          
          if(response.data.success != true){
            console.error('Failed:', response.data);
            window.alert('Failed pinning IPFS data, please try again or contact support');
            reject();
            return false;
          }
          
          console.log('success pinning!');
          
          let hash = response.data.hash || 'MISSING HASH';
          
          console.log('hash:', hash);
          
          resolve(hash);
          
          
        })
        .catch((err)=>{
          console.error(err);
          reject();
        })
          
        
        // // Pin! 
        // resolve(hash);
        // // {
        // //   type: 'ipfs_hash:Qmdflj',
        // //   data: hash
        // // });
        
      } catch(err){
        console.error('Failed TalkToSecond request', err);
        reject();
      }
    
      this.setState({
        isCreating: false
      })
      
      
      return;
      
    });
    
  }
  
  handlePrettify = async () => {
    
    let nodeData = this.state.dataValue; 
    try {
      nodeData = dirtyJSON.parse(nodeData);
      
      this.setState({
        dataValue: JSON.stringify(nodeData, null, 2)
      })
      
    }catch(err){
    }
    
    
  }
  
  handleUpdateDefaultInput = async (name) => {
    
    let dataValue = '';
    
    switch(name){
      case 'meta_redirect':
        dataValue = '' + 
`<html>
<head>
<meta http-equiv="refresh" content="0;url=http://example.com" />
</head>
</html>`
        break;
        
      default:
        break;
    }
    
    this.setState({
      dataValue
    });
    
    return false;
    
  }
  
  renderRoutePartial = () => {
    
    return (
      
      <div>
        {/* Route Input/Buttons */}  
        <div className="">
        
          {/* Desktop version */}  
          <div className="is-hidden-touch">
            <div className="field has-addons">
              <div className="control has-icons-left">
                <input className="input" value={this.state.routeHost} onChange={e=>this.setState({routeHost:e.target.value}, this.updateRouteFullPath)} placeholder="" />
                  <span className="icon is-small is-left">
                    <i className="fas fa-user-circle"></i>
                  </span>
              </div>
              <div className="control is-expanded">
                <input className="input" value={this.state.routeText} onChange={e=>this.setState({routeText:e.target.value}, this.updateRouteFullPath)} placeholder="" onKeyDown={this.handleSearchKeyDown} />
              </div>
              <div className="control">
                <button className={"button is-info " + (this.state.isSearching ? 'is-loading':'')} onClick={this.handleSearch}>Load Data For Route</button>
              </div>
              <div className="control">
                <button className={"button is-success " + (this.state.isSaving ? 'is-loading':'')} 
                onClick={this.handleAddRouteData}
                disabled={this.state.routeHost != this.state.defaultRouteHost}
                >Save Data</button>
              </div>
              
              {/* can be claimed? 
              <div className="control">
                <button className={"button is-default " + (this.state.isClaiming ? 'is-loading':'')} 
                onClick={this.handleClaimUsername}
                disabled={!this.state.usernameClaimable}>Claim Username</button>
              </div>
              <div className="control">
                <button className={"button is-default " + (this.state.isFunding ? 'is-loading':'')} onClick={this.handleFundAccount}>Add Funds</button>
              </div>
              
              
              <div className="control">
                <button className={"button is-default "} onClick={this.handleViewAccount}>View Account</button>
              </div>
              
              <div className="control">
                <button className={"button is-default "}>Change Private Key (SBKO...)</button>
              </div>
              */}
              
            </div>
          </div>
          
            
          {/* Mobile version*/}
          <div className="is-hidden-desktop">
            
            <div className="field has-addons">
              <div className="control has-icons-left is-expanded">
                <input className="input" value={this.state.routeHost} onChange={e=>this.setState({routeHost:e.target.value}, this.updateRouteFullPath)} placeholder="" />
                <span className="icon is-small is-left">
                  <i className="fas fa-user-circle"></i>
                </span>
              </div>
            </div>
            <div className="field has-addons">
              <div className="control is-expanded">
                <input className="input" value={this.state.routeText} onChange={e=>this.setState({routeText:e.target.value}, this.updateRouteFullPath)} placeholder="" onKeyDown={this.handleSearchKeyDown} autocapitalize="off" />
              </div>
            </div>
            <div className="field has-addons">
              <div className="control">
                <button className={"button is-info " + (this.state.isSearching ? 'is-loading':'')} onClick={this.handleSearch}>Load Data For Route</button>
              </div>
              <div className="control">
                <button className={"button is-success " + (this.state.isSaving ? 'is-loading':'')} 
                onClick={this.handleAddRouteData}
                disabled={!this.state.usernameOwnedByMe}
                >Save Data</button>
              </div>
            </div>
          
          </div>
          
          
          <div>
            {
              !this.state.failedAdd ? '':
              <span className='has-text-danger'>
                Failed adding
              </span>
            }
            {
              !this.state.failedSearch ? '':
              <span className='has-text-danger'>
                Failed loading route data
              </span>
            }
            {
              !this.state.failedClaim ? '':
              <span className='has-text-danger'>
                Failed claiming identity
              </span>
            }
            {
              !this.state.failedFunding ? '':
              <span className='has-text-danger'>
                Failed funding
              </span>
            }
            &nbsp;
          </div>
          
        </div>
        
        <br />
        
        <div>
          
          <textarea 
            className='textarea' 
            onChange={e=>this.setState({dataValue: e.target.value})} 
            onKeyDown={this.handleTextareaKeydown}
            value={this.state.dataValue} 
            rows="10" 
          />
          
          <br />
        
          <div className="control">
            <button 
              className={"button is-default "} 
              onClick={this.handlePrettify}
              disabled={!this.state.canParse}
            >Prettify JSON</button>
          </div>
          
          <br />
          
          <p>
            Defaults: 
          </p>
          <a onClick={e=>this.handleUpdateDefaultInput('meta_redirect')}>
            Meta Redirect
          </a>
        </div>
        
        <br />
        
        <div className="">
          <span>
            Anyone can view the route's data by visiting: 
            <br />
            <a href={`https://viewsecondroute.com/raw/${this.state.routeFullPath}`}>
              https://viewsecondroute.com/raw/{this.state.routeFullPath}
            </a> (server-side) 
            <br />
            or 
            <br />
            <a href={`https://viewsecondroute.com/view/${this.state.routeFullPath}`}>
              https://viewsecondroute.com/view/{this.state.routeFullPath}
            </a> (client-side) 
          </span>
        </div>
        
      </div>
      
    )
    
  }
  
  renderSendMessagePartial = () => {
    
    return (
      
      <div>
      
        <div className="">
        
          {/* Desktop version */}  
          <div className="is-hidden-touch">
            <div className="field has-addons">
              <div className="control has-icons-left is-expanded">
                <input className="input" value={this.state.sendMessageHost} onChange={e=>this.setState({sendMessageHost:e.target.value})} placeholder="" />
                <span className="icon is-small is-left">
                  <i className="fas fa-user-circle"></i>
                </span>
              </div>
              <div className="control">
                <button 
                  className={"button is-default " + (this.state.isSending ? 'is-loading':'')} 
                  onClick={this.handleSendMessage}
                  disabled={!this.state.msgValue.length}
                >Send Message</button>
              </div>
              
            </div>
          </div>
          
            
          {/* Mobile version*/}
          <div className="is-hidden-desktop">
            
            <div className="field has-addons">
              <div className="control is-expanded">
                <input className="input" value={this.state.sendMessageHost} onChange={e=>this.setState({sendMessageHost:e.target.value})} placeholder="" />
              </div>
            </div>
            <div className="field has-addons">
              <div className="control">
                <button className={"button is-info " + (this.state.isSending ? 'is-loading':'')} onClick={this.handleSendMessage}>Send Message</button>
              </div>
            </div>
          
          </div>
          
          
          <div>
            {
              !this.state.failedSending ? '':
              <span className='has-text-danger'>
                {this.state.failedSending}
              </span>
            }
            &nbsp;
          </div>
          
        </div>
        
        <br />
        
        <div>
          
          <textarea 
            className='textarea' 
            onChange={e=>this.setState({msgValue: e.target.value})} 
            onKeyDown={this.handleTextareaKeydown}
            value={this.state.msgValue} 
            rows="10" 
          />
          
        </div>
        
        <br />
        
        <div>
          
          <h3 className="title is-6">
            Outgoing Messages (in-memory) 
          </h3>
          
          {
            this.state.outgoingMessages.length ? 
              <div>
                {
                  this.state.outgoingMessages.sort((a,b)=>{return a.createdAt < b.createdAt}).map(msg=>{
                    return (    
                      <div key={msg._id} style={{borderTop:'1px solid #cecece', padding: '4px'}}>
                        <small>
                          To: {msg.data.to}
                        </small>
                        <br />
                        {msg.data.content.data.text}
                        <br />
                        <small>
                          {moment(msg.createdAt, 'x').fromNow()}
                        </small>
                      </div>
                    )
                  })
                }
              </div>
            :
              <div>
                No sent messages
              </div>
          }
          
        </div>
        
      </div>
      
    )
    
  }
  
  renderReceiveMessagesPartial = () => {
    
    let PartialReceiveMessagesComponent = this.state.PartialReceiveMessagesComponent || window.ErrorComponent('PartialReceiveMessagesComponent');
    
    return (
      
      <div>
        <PartialReceiveMessagesComponent
          onSetupReceive={this.emitBrowserProxySetup}
        />
      </div>
      
    )
    
  }
  
  renderTransferPartial = () => {
    
    return (
      
      <div>
        {/* Route Input/Buttons */}  
        <div className="">
        
          {/* Desktop version */}  
          <div className="is-hidden-touch">
          
            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label">From</label>
              </div>
              <div className="field-body">
  
                <div className="field has-addons">
                  <div className="control is-expanded">
                    <input className="input" value={this.state.fromRouteHost} onChange={e=>this.setState({fromRouteHost:e.target.value})} placeholder="password/secret" />
                  </div>
                  <div className="control">
                    <button className={"button is-default " + (this.state.gettingBalance[0] ? 'is-loading':'')} 
                    onClick={e=>this.getBalance(0)}
                    > Get Balance {this.state.balanceOf[0] ? `(${this.state.balanceOf[0]})`:''}</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label">To</label>
              </div>
              <div className="field-body">
  
                <div className="field has-addons">
                  <div className="control is-expanded">
                    <input className="input" value={this.state.toRouteHost} onChange={e=>this.setState({toRouteHost:e.target.value})} placeholder="username" />
                  </div>
                  <div className="control">
                    <button className={"button is-default " + (this.state.gettingBalance[1] ? 'is-loading':'')} 
                    onClick={e=>this.getBalance(1)}
                    > Get Balance {this.state.balanceOf[1] ? `(${this.state.balanceOf[1]})`:''}</button>
                  </div>
                  
                </div>
              </div>
            </div>
            
            <div className="field is-horizontal">
              <div className="field-label is-normal">
                <label className="label">Amount</label>
              </div>
              <div className="field-body">
  
                <div className="field">
                  <div className="control">
                    <input className="input" value={this.state.transferAmount} onChange={e=>this.setState({transferAmount:e.target.value})} placeholder="Lumens (XLM)" />
                  </div>
                  <p className="help">
                    Use a small increment first to verify the transaction succeeds 
                  </p>
                </div>
              </div>
            </div>
            
            
            <div className="field is-horizontal">
              <div className="field-label is-normal">
              </div>
              <div className="field-body">
  
                <div className="field">
                
                  <div className="control">
                    <button 
                      className={"button is-primary " + (this.state.isTransferring ? 'is-loading':'')} 
                      onClick={this.handleTransfer}
                    >Add Route Funds</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              {
                !this.state.failedTransfer ? '':
                <span className='has-text-danger'>
                  {this.state.failedTransfer}
                </span>
              }
              &nbsp;
            </div>
            
            
              
          </div>
          
        </div>
        
        <br />
        
        
        <br />
        
        <div className="">
        </div>
        
      </div>
      
    )
    
  }
  
  render(){
    
    return (<div>Home</div>)

    // // Render Create (login) 
    // if(!this.props.state.UsernamePassphraseNode){
    //   return (<Create />)
    // }

    var hostUrl = window.location.protocol + "//" + window.location.host;
    
    return (
  
      <div className="section">
        <div className="container">
          <div className="columns">
          
            <div className="column is-6 is-offset-3">
              
              <div className="columns">
                <div className="column is-9">
                
                
                  <div className="title is-4">
                    <span style={{opacity:'0.6',color:'#444'}}>
                      {
                        this.props.state.UsernamePassphraseNode.data.network == 'public' ? 
                        ''
                        :<span><span className="tag is-warning">test</span>&nbsp;</span>
                      }
                    </span>
                    {this.props.state.UsernamePassphraseNode.data.username}
                  </div>
                  <div className="subtitle is-6">
                    <strong>Passphrase: </strong>
                    <span onClick={e=>{window.prompt('',this.props.state.UsernamePassphraseNode.data.passphrase)}}>{this.props.state.UsernamePassphraseNode.data.passphrase.substring(0,10)}...</span>
                  </div>
                  {/*
                  <div>
                    <span>Storage: 0.5GB</span>
                  </div>
                  <div>
                    <span>Routes: {this.state.routesRemaining}</span>
                  </div>
                  */}
                
                </div>
                
                {/*<div className="column is-3">
                  <button className={"button is-info "} onClick={this.setupOrbitDb}>Setup Peer</button>
                </div>
                */}
                <div className="column is-3 has-text-right">
                  
                  {/* status of ipfs */}
                  <div 
                    style={{display:'inline-block',width:'50px',height:'4px',backgroundColor:this.state.connectedColor}}
                    onClick={this.checkIpfsConnected}
                  >
                    &nbsp;
                  </div>
                  
                  <br />
                    
                  <div className="dropdown is-hoverable is-right has-text-left">
                    <div className="dropdown-trigger">
                      <button className="button is-default" aria-haspopup="true" aria-controls="dropdown-menu3">
                        <span className="icon is-small">
                          <i className="fas fa-angle-down" aria-hidden="true"></i>
                        </span>
                      </button>
                    </div>
                    <div className="dropdown-menu" id="dropdown-menu3" role="menu">
                      <div className="dropdown-content">
                        <a className="dropdown-item" onClick={()=>{window.UpdateApp()}}>
                          Update
                        </a>
                        <a className="dropdown-item" onClick={e=>this.setState({tabsMainSelected:'transfer'})}>
                          Fund Routes
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item is-warning" onClick={this.logout}>
                          Logout
                        </a>
                      </div>
                    </div>
                  </div>
                  
                </div>
                
                  
                
              </div>
              
                    
              <div className="tabs">
                <ul>
                  {
                    this.state.tabsMainPossible.map(tab=>(
                      <li key={tab[0]}
                        onClick={e=>this.setState({tabsMainSelected:tab[0]})}
                        className={(this.state.tabsMainSelected == tab[0]) ? 'is-active':''}
                        ><a>{tab[1]}</a></li>
                    ))
                  }
                </ul>
              </div>
              
              {
                this.state.tabsMainSelected != 'route' ? '':
                this.renderRoutePartial()
              }
              
              {
                this.state.tabsMainSelected != 'send_message' ? '':
                this.renderSendMessagePartial()
              }
              
              {
                this.state.tabsMainSelected != 'receive_messages' ? '':
                this.renderReceiveMessagesPartial()
              }
              
              {
                this.state.tabsMainSelected != 'transfer' ? '':
                this.renderTransferPartial()
              }
              
              
              
            </div>
            
          </div>
          
        </div>
        
      </div>
      
      
    )
  }
}

 
Home = GlobalState(Home);

export default Home;
