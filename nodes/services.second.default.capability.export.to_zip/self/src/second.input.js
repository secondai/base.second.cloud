
const path = require('path');
const GitHub = require('github-api');
const fs = require('fs-extra');
const request = require('request');
const globby = require('globby');
const parseGithubUrl = require('parse-github-url');
const SHA1 = require("crypto-js/sha1");
const Zip = require("adm-zip");

const inputFunc = async function({universe, SELF, INPUT, PATH}){

  console.log('--Service:', SELF.name);
  
  console.log('Exporting to Zip');

  let allowedTypes = ['types.second.default.export_nodes_with_options'];
  if(allowedTypes.indexOf(INPUT.type) === -1){
    return {
      type: 'types.second.default.error',
      data: {
        error: true,
        message: 'Invalid type for INPUT, expecting "types.second.default.export_nodes_with_options"'
      }
    }
  }


  // INPUT.data = {
  //   nodePathsToWriteWithFiles // array of paths 
  // }

  // For each path, fetch files (ignore node_modules, build artifacts [.second-ignore]?) 

  // write to /nodes and /paths directories 

  // console.log({
  //   INPUT, 
  //   PATH
  // });
  // return {
  //   INPUT, PATH
  // }


  let finalZipPath = '/tmp/zipped-' + Date.now() + '.zip';


  let {
    nodePathsToWriteWithFiles, // array of paths 
  } = INPUT.data;


  var zip = new Zip();

  // add file directly
  // zip.addFile(zipPath, Buffer.alloc(content.length, content), null); // leaving out 'entry comment' at end 
  
  // zip.addLocalFile(localFilePath, zipPath);

  console.log('nodePathsToWriteWithFiles',nodePathsToWriteWithFiles);
  
  let blankContent = '';

  // Fetch nodes/files 
  let nodesToWrite = {};
  let addedNodes, addedFiles;
  for(let nodePath of nodePathsToWriteWithFiles){

    // get node data 
    let nodeData = await universe.getNodeAtPath(nodePath, {excludeChildren: true});
    // nodesToWrite['nodes/' + nodePath + '.json'] = JSON.stringify(nodeData, null, 2)
    let content = JSON.stringify(nodeData, null, 2);
    zip.addFile('nodes/' + nodePath + '.json', Buffer.alloc(content.length, content), null); // leaving out 'entry comment' at end 
    console.log('addNode:', nodePath);
    addedNodes = true;

    let cwd = path.join(universe.env.ATTACHED_VOLUME_ROOT, nodePath) + '/';
    // console.log('CWD:', cwd);
    // return {};

    // get file data (directory) 
    let fileOpts = {
      // force 
      cwd,
      // stats: false,
      followSymlinkedDirectories: false,
      ignore: [
        '**/node_modules/**',
        // 'frontend/node_modules',
        // 'frontend/node_modules/**',
        // '{,!(node_modules)/**}'
      ],
      gitignore: false, // TODO: second-ignore ? 
      onlyFiles: true,
      expandDirectories: true,
      dot: true
      // onlyFiles: false,
      // onlyDirectories: false,
      // markDirectories: true
    }
    // make sure directory exists 
    // - otherwise, skip 
    let isDir;
    try {
      isDir = fs.lstatSync(cwd);
    }catch(err){
      console.error('Directory doesnt exist:', nodePath);
      continue;
    }
    // console.log(isDir);
    if(isDir && isDir.isDirectory()){
      let matches = await globby('*/**', fileOpts)
      console.log('File matches for', nodePath, ':', matches.length);

      for(let match of matches){
        let internalFilePath = path.join(cwd, match);
        console.log('internalFilePath:', internalFilePath);
        try {

          // zip.addLocalFile(internalFilePath, 'files/' + match); // broken, adds files as folders
          let fileBuffer = fs.readFileSync(internalFilePath);
          zip.addFile('nodes/' + nodePath + '/' + match, fileBuffer, '', parseInt('0644', 16));
          console.log('addFile:', internalFilePath, 'files/' + nodePath + '/' + match);
          addedFiles = true;
          // let fileData = fs.readFileSync(internalFilePath);
          // fileData = fileData.toString('base64');
          // nodesToWrite['files/' + match] = fileData; //fileData.toString();
          // // console.log('filedata:', fileData);
        }catch(err){
          console.error('fs.readFileSync (or zip.addFile) error:', err, internalFilePath);
        }
      }

    } else {
      console.error('No directory for:', nodePath);
    }

  }

  // create root, empty files
  let rootContent = '';
  zip.addFile('second-root', Buffer.alloc(rootContent.length, rootContent), null); // leaving out 'entry comment' at end 
  if(!addedNodes){
    zip.addFile('nodes/.empty', Buffer.alloc(rootContent.length, rootContent), null);
  }
  // if(!addedFiles){
  //   zip.addFile('files/.empty', Buffer.alloc(rootContent.length, rootContent), null);
  // }
  
  // write zip to path 
  console.log('Writing zip');
  zip.writeZip(finalZipPath);

  // create temporary download link
  universe.globalCache.tmpLinks = universe.globalCache.tmpLinks || {};
  let linkToken = universe.uuidv4();
  universe.globalCache.tmpLinks[linkToken] = {};
  let linkObj = universe.globalCache.tmpLinks[linkToken];
  linkObj.type = 'types.second.default.temporary_download_link_internal_file';
  linkObj.data = {};
  linkObj.data.createdAt = Date.now();
  linkObj.data.validUntil = Date.now(); // TODO 
  linkObj.data.triesAllowed = 1;
  linkObj.data.internalFilePath = finalZipPath; // expected to be absolute, likely at /tmp/xyz

  console.log('Done, zipped');
  
  return {
    type: 'types.second.default.response.temporary_download_link_internal_file',
    data: {
      link: `/api/tmplink/${linkToken}`
    }
  }

 }


module.exports = inputFunc;

