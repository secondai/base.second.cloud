import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Home.css';

let horizonPossible = {
  'idtest:': 'https://horizon-testnet.stellar.org',
  'test:': 'https://horizon-testnet.stellar.org',
  'id:': 'https://horizon.stellar.org',
  'second:': 'https://horizon.stellar.org'
}

function getIpfsHash(str){
  // Not used, using createIpfsHash instead 
  return new Promise(async (resolve,reject)=>{
    
    let buf = universe.Buffer.from(str,'utf8');
    let mhash = await universe.MultiHash.getMultiHash(buf);
    
    resolve(mhash);
    
    // let thisIpfs = WINDOW.existingIpfs;
    // if(!thisIpfs){
    //   thisIpfs = new WINDOW.Ipfs();
    //   WINDOW.existingIpfs = thisIpfs;
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
    universe.fetch('https://ipfs.io/ipfs/' + hash)
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
    
    
    // let thisIpfs = WINDOW.existingIpfs;
    // if(!thisIpfs){
    //   thisIpfs = new WINDOW.Ipfs();
    //   WINDOW.existingIpfs = thisIpfs;
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
    var cipher = universe.crypto.createCipher(algorithm,password)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    console.log('crypted', text, crypted);
    resolve(crypted);
  });
}
function decryptToString(text, password){
  return new Promise(async (resolve,reject)=>{
    var algorithm = 'aes-256-ctr';
    var decipher = universe.crypto.createDecipher(algorithm,password)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    resolve(dec);
  });
}


class Home extends Component {
  constructor(props){
    super(props);
    
    // let thisIpfs = WINDOW.existingIpfs;
    // if(!thisIpfs){
    //   thisIpfs = new WINDOW.Ipfs();
    //   WINDOW.existingIpfs = thisIpfs;
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
    
    this.setupWebsocket();
    
  }
  
  componentDidMount(){
    
    console.log('Loaded interface', this);
      
    // PeerJs server 
    const script = WINDOW.document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/peerjs/0.3.16/peer.min.js";
    script.async = true;
    WINDOW.document.body.appendChild(script);
      
    if(this.props.initEditComponent){
      this.props.initEditComponent(this);
    }
    
    this.startup();
    
  }
  
  startup = async () => {
    
    await this.loadComponents();
    
    this.updateRouteFullPath();
    
    this.checkIpfsConnected();
    
    this.fetchOutgoingMessages(); // local
    
  }
  
  setupWebsocket = async () => {
    
    console.log('setupWebsocket');
    
    // universe.sharedServices.socketioClient = universe.require('socket.io-client')
    // var io = universe.sharedServices.socketioClient;
    let socket = WINDOW.io(); // same address? 
    WINDOW.socketioClient = socket;
    
    socket.on('connect', async ()=>{
      console.log('Connected websocket (listening)!');
      
      // Run "register" event when button is pressed 
      universe.setTimeout(()=>{
        console.log('Proxy setup');
        
        // if(!WINDOW.confirm('connect websocket?')){
        //   return false;
        // }
        
        this.emitBrowserProxySetup();
        
      },1000);
      
    });
    
    
    socket.on('proxied-request', async (RequestNode, responseFunc)=>{
      // let requestId = uuidv4();
     //  console.log('RequestNode:', RequestNode);
     
      console.log('Got a proxied request from server', RequestNode);
    
      responseFunc({
        type: 'received_boolean:Qmtesting',
        data: true
      });
      
      
      // responseFunc('Response from browser2!!!!');
      this.processSitutationFromExternal(RequestNode);
      
      
    });
    
  }
  
  emitBrowserProxySetup = async () => {
  
    var passwordPair = universe.StellarSdk.Keypair.fromSecret(this.state.stellarKey);
    
    let sourcePublicKey = passwordPair.publicKey();
    let endpoint = this.props.state.UsernamePassphraseNode.data.username;
    let nonce = Date.now().toString();
    let sig = passwordPair.sign(sourcePublicKey + endpoint + nonce).toString('base64'); //fileValue);
    
    console.log('sig:', sig, typeof sig);
    
    let SetupNode = {
      type: 'browser_proxy_setup:Qmtesting',
      data: {
        sourcePublicKey,
        endpoint,
        nonce,
        sig
      }
    }
    
    console.log('SetupNode for browser-proxy-setup', SetupNode);
    
    // TODO: check if connected to websocket 
    
    WINDOW.socketioClient.emit('browser-proxy-setup', SetupNode, async (ResponseNode)=>{
      console.log('browser-proxy-setup result:', ResponseNode);
      
      // Update ipfs Hash for myself (if different, or unset) 
      
      // Load existing 
      let routePath = (this.props.state.UsernamePassphraseNode.data.network == 'test' ? 'test://':'second://') + this.props.state.UsernamePassphraseNode.data.username;
      let routeInfo = await this.parseRoute(routePath);
      let routeData;
      let currentRouteData;
      try {
        currentRouteData= await this.loadIdentityRoute(routeInfo.protocol, routeInfo.pairForIdentity.publicKey(), routeInfo.lookupPath);
      }catch(err){
        console.error('Failed finding currentRouteData', err)
        currentRouteData = undefined;
      }
      
      console.log('currentRouteData:', currentRouteData);
      
      if(currentRouteData){
        try {
          routeData = JSON.parse(currentRouteData);
          routeData.data.urls['message-drop'] = ResponseNode.data.proxyUrl
        }catch(err){
          console.error('Unable to parse existing routeData', routeData);
          routeData = null;
        }
      }
      
      if(!routeData){
        // Unable to find valid routeData!
        console.error('Failed to lookup my default route info');
        routeData = {
          "type": "",
          "data": {
            "urls": {
              "message-drop": ResponseNode.data.proxyUrl
            }
          }
        };
        if(!this.props.state.receivingEnabled){
          console.log('Receiving disabled');
          this.props.setState({
            waitingForEnabled: true
          });
          return false;
        }
      }
      
      this.props.setState({
        waitingForEnabled: false,
        receivingEnabled: true
      });
      
      let stringifiedData = JSON.stringify(routeData,null,2);
      
      console.log('routeData to save', routePath, routeData);
      if(stringifiedData == currentRouteData){
        console.log('No need to update, same proxy routes');
        return;
      }
      this.addRouteData(stringifiedData, routePath);
      
      
    });
  }
  
  processSitutationFromExternal = async (RequestNode) => {
    
    console.log('processSitutationFromExternal', RequestNode);
    
    // TODO: validate RequestNode type 
    if(!RequestNode || !RequestNode.data || RequestNode.type != 'signed_message:Qmtesting'){
      console.error('Missing expected incoming data for RequestNode, ignoring');
      return false;
    }
    
    let messagesIncoming = this.props.state.messagesIncoming || [];
    
    messagesIncoming.push({
      IncomingNode: RequestNode,
      createdAt: Date.now()
    });
    
    this.props.setState({
      messagesIncoming
    });
    
  }
  
  loadComponents = async () => {
    
    // Not async for setState! 
    
    let components = [
      'PartialReceiveMessagesComponent'
    ];
    
    for(let componentInternalId of components){
      try {
          
        let Component = await this.props.loadComponent({
          internalId: componentInternalId
        });
        let obj = {};
        obj[componentInternalId] = Component;
        this.setState(obj)
      }catch(err){
        console.error("Failed loading component:",componentInternalId);
      }
    }
    
  }
  
  logout = async () => {
    
    // remove all data 
    // root nodes that aren't the app 
    await universe.sharedServices.logout();
    
    this.props.setState({
      renderMain: false,
      UsernamePassphraseNode: null,
      waitingForEnabled: true,
      receivingEnabled: false
    });
    
    // WINDOW.location.reload();
    
  }
  
  checkIpfsConnected = async () => {
    
    console.log('checkIpfsConnected');
    
    let connectedColor = 'yellow';
    
    this.setState({
      connectedColor
    });
    
    let response = await universe.fetch('/ipfs-connected',{
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
      nodeData = universe.dirtyJSON.parse(nodeData);
      
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
    if(typeof WINDOW != 'undefined'){
      parser = WINDOW.document.createElement('a');
      parser.href = routeUrl; 
    } else {
      const { URL } = universe.require('url');
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
        WINDOW.alert('Invalid protocol. please use id:// or idtest:// or second://');
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
        universe.StellarSdk.Network.usePublicNetwork();
        break;
      case 'idtest:':
      case 'test:':
        universe.StellarSdk.Network.useTestNetwork();
        break;
      default:
        console.error('Invalid protocol');
        return;
    }
    
    let usernameSeed = universe.crypto.createHash('sha256').update(baseIdentity).digest(); //returns a buffer
    console.log('usernameSeed', usernameSeed);
    
    var pairForIdentity = universe.StellarSdk.Keypair.fromRawEd25519Seed(usernameSeed);
    
    // // route path ALWAYS starts with a slash 
    // // - reserving non-slash for zone-like files 
    // if(routePath.length == 0){
    //   routePath = '/';
    // }
    
    let lookupPath = baseIdentity + '|' + subName + '|' + password + '|' + routePath;
    
    let lookupPathHash = universe.crypto.createHash('sha256').update(lookupPath).digest('hex'); 
    
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
        
      let stellarServer = new universe.StellarSdk.Server(horizonPossible[protocol]);
        
      let identityAccount;
      try {
        identityAccount = await stellarServer.loadAccount(pubKey)
        console.log('identityAccount:', identityAccount);
      }catch(err){
        console.error('Failed getting identityAccount', err);
        return false;
      }
      
      let lookupPathHash = universe.crypto.createHash('sha256').update(route).digest('hex'); 
      
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
      let stellarServer = new universe.StellarSdk.Server(horizonPossible[routeInfo.protocol]);
      
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
      
      // owned by me? 
      var pairSource = universe.StellarSdk.Keypair.fromSecret(this.state.stellarKey);
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
      WINDOW.alert('Invalid username protocol to send to');
      this.setState(state=>{
        state.gettingBalance[idx] = false;
        return state;
      });
      return false;
    }
    
    
    let stellarServer = new universe.StellarSdk.Server(horizonPossible[routeInfo.protocol]);
    
    if(idx == 0){
      
      // From (private key only) 
      var pairSource = universe.StellarSdk.Keypair.fromSecret(this.state.fromRouteHost);
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
      let stellarServer = new universe.StellarSdk.Server(horizonPossible[routeInfo.protocol]);
      
      let targetAccount;
      try {
        targetAccount = await stellarServer.loadAccount(routeInfo.pairForIdentity.publicKey())
        console.log('targetAccount:', targetAccount);
      }catch(err){
        console.error('Failed getting targetAccount', err);
        // WINDOW.alert('failed loading idenity');
        
        this.setState({
          isTransferring: false,
          failedTransfer: 'Failed finding target account (doesnt exist on blockchain)'
        });
      
        return false;
      }
      
      
      var pairSource = universe.StellarSdk.Keypair.fromSecret(fromStellarKey);
      // var pairSourcePublicKey = pairSource.publicKey();
      
      let sourceAccount;
      try {
        sourceAccount = await stellarServer.loadAccount(pairSource.publicKey())
        console.log('sourceAccount:', sourceAccount);
      }catch(err){
        console.error('Failed getting sourceAccount', err);
        // WINDOW.alert('failed loading idenity');
        
        this.setState({
          isTransferring: false,
          failedTransfer: 'Failed finding source account (doesnt exist on blockchain)'
        });
      
        return false;
      }
      
      
      // Start building the transaction for manageData update
      let transaction = new universe.StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(universe.StellarSdk.Operation.payment({
          destination: routeInfo.pairForIdentity.publicKey(),
          // Because Stellar allows transaction in many currencies, you must
          // specify the asset type. The special "native" asset represents Lumens.
          asset: universe.StellarSdk.Asset.native(),
          amount: transferAmount
        }))
        // A memo allows you to add your own metadata to a transaction. It's
        // optional and does not affect how Stellar treats the transaction.
        // .addMemo(universe.StellarSdk.Memo.text('Test'))
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
    //   WINDOW.alert('Invalid JSON specified');
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
      let stellarServer = new universe.StellarSdk.Server(horizonPossible[routeInfo.protocol]);
      
      // multi-sig address for updating 
      var pairForWrite = universe.StellarSdk.Keypair.fromSecret(stellarKey);
      
      console.log('pairForIdentity', routeInfo.pairForIdentity);
      
      let identityAccount;
      try {
        identityAccount = await stellarServer.loadAccount(routeInfo.pairForIdentity.publicKey())
        console.log('identityAccount:', identityAccount);
      }catch(err){
        console.error('Failed getting identityAccount', err);
        WINDOW.alert('failed loading idenity');
        throw 'Failed loading identity'
      }
      
      // write the new data value 
      console.log('writing ipfs values to ipfs');
       
      let value = ipfsHashOfEncryptedData || ipfsHashOfData;
      let name = routeInfo.lookupPathHash;
      
      console.log('name, value:', name, value);
      
      // Start building the transaction for manageData update
      let transaction = new universe.StellarSdk.TransactionBuilder(identityAccount)
      
      .addOperation(universe.StellarSdk.Operation.manageData({
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
  
  handleSendMessage = async () => {
    
    // Get address to send to 
    // - expecting only one type of address (https) 
    
    let text = this.state.msgValue;
    if(!text){
      return false;
    }
    
    this.setState({
      isSending: true,
      failedSending: false
    })
    
    // Load message-input node for username 
    let routeInfo = await this.parseRoute(this.state.sendMessageHost);
    if(!routeInfo){
      this.setState({
        isSending: false,
        failedSending: 'Invalid route'
      });
      return false;
    }
    
    let nodeForLookup = await this.loadIdentityRoute(routeInfo.protocol, routeInfo.pairForIdentity.publicKey(), routeInfo.lookupPath);
    
    if(!nodeForLookup){
      // Unable to find valid 
      console.error('Failed to lookup connection info');
      this.setState({
        isSending: false,
        failedSending: 'Failed to find user connection info (1)'
      })
      return false;
    }
    
    try {
      nodeForLookup = universe.cJSON.parse(nodeForLookup);
    }catch(err){
      console.error('invalid node returned');
      this.setState({
        isSending: false,
        failedSending: 'Failed to find user connection info (2)'
      })
      return false;
    }
    
    console.log('nodeForLookup:', nodeForLookup);
    
    let secondUrl;
    try {
      secondUrl = nodeForLookup.data.urls['message-drop'];
    }catch(err){
      // invalid urls
      console.error('Invalid URLs for message-drop');
      this.setState({
        isSending: false,
        failedSending: 'Failed to find user connection info (3)'
      })
      return false;
    }
    
    // TODO: validate message-drop endpoint (should be signed by user?) 
    
    let upNode = this.props.state.UsernamePassphraseNode;
    
    let messageNode = {
      type: 'signed_message:Qmtesting',
      data: {
        msgId: universe.uuidv4(), // for uniqueness
        to: routeInfo.fullName, // TODO: encrypt for that username too? using a different pubkey? 
        from: upNode.data.username,
        content: {
          type: 'text:Qmtesting',
          data: {
            text
          }
        },
        sig: undefined,
        // createdAt ? 
      }
    }
    
    // Sign 
    // - order keys, stringify each value
    var passwordPair = universe.StellarSdk.Keypair.fromSecret(this.state.stellarKey);
    
    let stringToSign = Object.keys(messageNode.data).sort().map(k=>JSON.stringify(messageNode.data[k])).join('');
    console.log('stringToSign:',stringToSign);
    
    let sig = passwordPair.sign(stringToSign).toString('base64'); 
    
    console.log('sig:', sig);
    
    // add signature to data 
    messageNode.data.sig = sig;
    
    let response = await universe.fetch(secondUrl, {
      method: 'POST',
      headers: {
          "Content-Type": "application/json", // charset=utf-8
      },
      body: JSON.stringify(messageNode)
    })
    console.log('Response:', response);
    
    let responseJson = await response.json();
    
    console.log('responseJson', responseJson);
    
    // Success receiving?
    try {
      if(responseJson.data != true){
        throw "Failed"
      }
    }catch(err){
      console.error('Failed sending, could not reach endpoint');
      this.setState({
        isSending: false,
        failedSending: 'Sending Failed (could not reach endpoint)'
      });
      return false;
    }
    
    // Push to "sent" messages (in memory only) 
    
    let newOutgoing = await universe.newNode(messageNode);
    
    this.setState({
      msgValue: '',
      isSending: false,
      failedSending: false
    })
    
    this.fetchOutgoingMessages();
    
  }
  
  fetchOutgoingMessages = async () => {
    
    let outgoingMessages = await universe.searchMemory({
      filter: {
        sqlFilter: {
          type: 'signed_message:Qmtesting',
        }
      }
    });
    
    this.setState({
      outgoingMessages
    })
    
    
  }
  
  handleViewAccount = async () => {
    
    let stellarKey = this.state.stellarKey;
    
    let routePath = this.state.routePath;
    
    try {
        
      // parse route 
      // - parse twice, second time probably using http, cuz id/idtest are not recognized protocols yet 
      let parser;
      if(typeof WINDOW != 'undefined'){
        parser = WINDOW.document.createElement('a');
        parser.href = routePath; 
      } else {
        const { URL } = universe.require('url');
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
          WINDOW.alert('Invalid protocol. please use id:// or idtest:// or second://');
          throw 'Invalid protocol'
      }
      
      let baseIdentity = parser.host;
      
      let pkTargetSeed = universe.jsSHA256.array(baseIdentity);
      var pairTarget = universe.StellarSdk.Keypair.fromRawEd25519Seed(pkTargetSeed);
      
      let href = `https://horizon-testnet.stellar.org/accounts/${pairTarget.publicKey()}`;
      
      WINDOW.open(href, '_blank');
      
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
        
        // let response = await universe.loadAndRunCapability('TalkToSecond',{
        //   type: 'default_loadandruncapability_options:Qmf239j',
        //   data: {
        //     skipSameAppPlatform: true
        //   }
        // },{
        //   type: 'standard_capability_action:0.0.1:local:298j291bs',
        //   data: {
        //     action: 'send',
        //     options: {
        //       ExternalIdentityNode: this.props.state.OwnerSecondExternalIdentityNode,
        //       RequestNode: {
        //         type: 'run_action_sequence:0.0.1:local:293fh8239hsdf23f',
        //         data: {
        //           actions: [
                    
        //             {
        //               matchActionType: 'identify_via_token:0.0.1:local:237823783g2123',
        //               dataForAction: {
        //                 type: 'string:...',
        //                 data: this.props.state.OwnerSecondExternalIdentityNode.data.token
        //               }
        //             },
                
        //             { 
        //               matchActionType: 'ipfs_file_add:Qmfmk230fjs',
        //               dataForAction: {
        //                 type: 'standard_query_request:0.0.1:local:65723f2khfds',
        //                 data: {
        //                   type: 'file_with_data_and_options:Qmdf23ifsmkmm',
        //                   data: {
        //                     options: {
        //                       pin: true
        //                     },
        //                     fileValue
        //                   }
        //                 }
        //               }
        //             },
                    
        //           ]
                  
        //         }
        //       }
        //     }
        //   }
        // });
        
        // console.log('Response:', response);
        
        // let hash = response.data.actionResponses[1].data.hash;
        
        console.log('stellarKey:', this.state.stellarKey);
        var passwordPair = universe.StellarSdk.Keypair.fromSecret(this.state.stellarKey);
        
        let sourcePublicKey = passwordPair.publicKey();
        let sig = passwordPair.sign(fileValue).toString('base64'); //fileValue);
        
        console.log('sig:', sig, typeof sig);
        
        universe.fetch('/ipfs-pin',{
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
          console.error('failed!', respones);
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
            WINDOW.alert('Failed pinning IPFS data, please try again or contact support');
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
      nodeData = universe.dirtyJSON.parse(nodeData);
      
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
                          {universe.moment(msg.createdAt, 'x').fromNow()}
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
    
    let PartialReceiveMessagesComponent = this.state.PartialReceiveMessagesComponent || WINDOW.ErrorComponent('PartialReceiveMessagesComponent');
    
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
    
    var hostUrl = WINDOW.location.protocol + "//" + WINDOW.location.host;
    
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
                    <span onClick={e=>{WINDOW.prompt('',this.props.state.UsernamePassphraseNode.data.passphrase)}}>{this.props.state.UsernamePassphraseNode.data.passphrase.substring(0,10)}...</span>
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
                        <a className="dropdown-item" onClick={()=>{WINDOW.UpdateApp()}}>
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

if(universe.sharedComponents && universe.sharedComponents.withEditableNodeInfo){
  mycomponent = universe.sharedComponents.withEditableNodeInfo(mycomponent, {
    localNode: SELF,
    localNodeIsRemote: true
  });
}
 
mycomponent = universe.ReactGlobalState(mycomponent);
mycomponent = universe.ReactHelpers(mycomponent);

const styles = {
  deleteIcon: {
    position: 'absolute',
    top: '0px',
    right: '-24px',
    cursor: 'pointer'
  }
}

export default Home;
