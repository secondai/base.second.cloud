
const path = require('path');
const fs = require('fs-extra');

const inputFunc = async function({universe, SELF, INPUT}){

  console.log('--Service: --', SELF.name);

  // handle request for login page 
  // - could be POST'd to also 

  let {
    req,
    res 
  } = universe.requestsCache[universe.requestId];
  
  let appPath = SELF.name; 
  let appNode = SELF; 
  
  // Capture POST and routes 
  // Fallback to static file sending 
      
  let usedPath = req.url.split('/').slice(0,3).join('/');
  let appLookupPath = req.url.substring(usedPath.length);
  appLookupPath = appLookupPath || 'index.html'; // if root, default to index.html
  
  // console.log('http_request sample_pwa INPUT:', INPUT.type, INPUT.data);
  // INPUT = express_obj

  // POST'd 
   // - mark as "loggedin" (todo: return a token for granting permissions) 
  
  // respond with either a redirect (usually to the /auth/grant page?), or "true" if didnt exist (necessary?) 
  let redirectTo = req.query.redirect;
  function respondLoggedIn(){
    if(redirectTo){
      res.redirect(redirectTo);
      return;
    }
    return res.send({
      type: 'success',
      data: {
        message: 'Logged in'
      }
    });
  }

  if(req.session.loggedin){
    return respondLoggedIn();
  }

  // Not already logged in 
  // - process a POST login request 
  // - show the login page info 

  if(req.method.toLowerCase() == 'post'){
    let ownerLoginNode = await universe.getNodeAtPath('private.auth.owner');
    
    // check password, TODO: bcrypted 
    if(ownerLoginNode.data.passphrase != req.body.passphrase){
      // failed, resend the login html 
      // - TODO: different? 
      console.error('invalid password');
      return res.send({
        type: 'error',
        data: {
          error: true,
          message: 'Failed login'
        }
      });
    }

    // login success! 
    
    // set session value 
    // - expecting /auth/grant next 
    req.session.loggedin = true;
    respondLoggedIn();

    return;
  }

  
  let htmlNode, page;
  
  // Load static files from appPath
  // - no auth required 
  // - simple redirect? 
  if(!universe.env.ATTACHED_VOLUME_ROOT){
    console.error('Missing ATTACHED_VOLUME_ROOT');
    return res.status(404).send('Missing File');
  }
  let staticFileDirectory = appNode.data.vars.frontendStaticFileDirectory || '';
  let volumePrefix = path.join(universe.env.ATTACHED_VOLUME_ROOT, appPath);
  let staticRootPath = path.join(volumePrefix, staticFileDirectory);
  let volumeLookupPath = path.join(staticRootPath, appLookupPath);
  let finalVolumeLookupPath = path.resolve(volumeLookupPath);
  if(finalVolumeLookupPath.indexOf(volumePrefix + '/') !== 0){
    console.error('Invalid PATH lookup!', finalVolumeLookupPath);
    return res.status(404).send('Missing File');
  }
  let exists = fs.existsSync(finalVolumeLookupPath);
  if(exists){
    console.log('finalVolumeLookupPath:',finalVolumeLookupPath);
    res.sendFile(finalVolumeLookupPath);
    return true;
  }


  // get url relative to myself 
  // let appPath = universe.navPathv1(SELF.name, 1)
  console.log('404 in service:', finalVolumeLookupPath, appLookupPath, req.originalUrl, appPath);

  res.send('Missing, 404d');
  return;

 }


module.exports = inputFunc;

