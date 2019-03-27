
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
      
  let usedPath = req.path.split('/').slice(0,3).join('/');
  let appLookupPath = req.path.substring(usedPath.length);
  appLookupPath = appLookupPath || 'index.html'; // if root, default to index.html
  
  // console.log('http_request sample_pwa INPUT:', INPUT.type, INPUT.data);
  // INPUT = express_obj

  console.log('--------appLookupPath:', appLookupPath);
  console.log('-----usedPath:', usedPath);


  if(req.session.loggedin){
    
    if(req.method.toLowerCase() == 'post'){
      // granting request 
      
      // generate token 
      // - save data for token, so can be picked back up 
      let tokenNode = {
        type: 'types.second.default.auth.token',
        data: {
          isOwner: true
        },
        // extras: {}, // for additional key-value entries, that can be used by the permissions (groups, etc?) 
        // permissions: [], // should be a node w/ name="permissions" in authObj.nodes[]
        // nodes: []
      };
      
      // from the incoming grant request 
      // - TODO: use a package system for permissions (check approval, etc) 
      let permissionsNode = {
        type: 'types.second.default.permissions',
        data: {
          permissions: [
            // default: allow all 
            {
              "services": [
                "services.**"
              ],
              "events": [
                "pre",
              ],
              "code": "permission_codes.second.default.true",
              "vars": {},
              "output": {
                "true": "allow"
              }
            }
          ]
        }
      }
      
      let tokenId = universe.uuidv4();
      
      console.log('tokenId created:', tokenId);
      
      let tokenNodeSaved = await universe.putNodeAtPath(`tokens.auth.${tokenId}`, tokenNode, {});
      console.log(`Created token: tokens.auth.${tokenId}`);
      let permissionsNodeSaved = await universe.putNodeAtPath(`tokens.auth.${tokenId}.permissions`, permissionsNode, {});
      console.log(`Created Permissions: tokens.auth.${tokenId}.permissions`);
      
      console.log('Granted!');
      
      let redirect = req.query.redirect;
      
      res.redirect(redirect + '#&token=' + tokenId);
      
      return resolve(true);
      
    } else {
      // show the "grant" page (static) 



    }
    
  } else {
    
    // htmlNode = await universe.getNodeAtPath('data.second.default.routes.auth_grant.login_html');
    // page = htmlNode.data.html;
    
    res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    return resolve(true);
    
  }


  // Static (index.html) 

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
  console.log('404 in service:', finalVolumeLookupPath); //, appLookupPath, req.originalUrl, appPath);

  res.send('Missing, 404d');
  return;

 }


module.exports = inputFunc;

