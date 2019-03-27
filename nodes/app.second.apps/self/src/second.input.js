
const path = require('path');
const fs = require('fs-extra');

const inputFunc = async function({universe, SELF, INPUT}){

  console.log('--App: --', SELF.name);

  // handle incoming request for an app (view, api)  
  // - expecting type:express_obj 
  // - also handling authentication here (allow anonymous, etc.) for paths 
  
  
  let {
    req,
    res 
  } = universe.requestsCache[universe.requestId];
  
  let appPath = SELF.name; //universe.navPathv1(SELF.name, 1)
  let appNode = SELF; //await universe.getNodeAtPath(appPath); // SELF
  
  // Capture /api and other routes 
  // Fallback to static file sending 
      
  let usedPath = req.url.split('/').slice(0,3).join('/');
  let appLookupPath = req.url.substring(usedPath.length);
  appLookupPath = appLookupPath || 'index.html'; // if root, default to index.html
  
  // console.log('http_request sample_pwa INPUT:', INPUT.type, INPUT.data);
  // INPUT = express_obj
  
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
  console.log('404 in app:', finalVolumeLookupPath, appLookupPath, req.originalUrl, appPath);

  res.send('Missing, 404d');
  return;

 }


module.exports = inputFunc;

