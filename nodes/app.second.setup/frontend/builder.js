// {
// 	"name" : "./layout",
// 	"vars" : {
// 		"childComponent":{
// 			"name" : "./left-right",
// 			"vars" : {
// 				"leftComponent":{
// 					"name" : "./basic-text",
// 					"vars" : {
// 						"text": "this is the left"
// 					}
// 				},
// 				"rightComponent":{
// 					"name" : "./basic-text",
// 					"vars" : {
// 						"text": "this is the right"
// 					}
// 				}
// 			}
// 		},
// 		"title":"this is the title"
// 	}
// }

var Handlebars = require('handlebars');
var helpers = require('handlebars-helpers')({
  handlebars: Handlebars
});

const path = require('path');
const fs = require('fs-extra');
const lodash = require('lodash');

let outline = require('./outline.json');

console.log('OUTLINE:', typeof outline, Object.keys(outline));
// try {
// 	outline = JSON.parse(outline);
// }catch(err){
// 	console.error(err);
// 	process.exit(1);
// }

var loaderTemplate = Handlebars.compile(`
let React = require('react');
let {{capitalize (camelcase level.name)}}Component = require('{{{componentPath}}}').default;

let propsObj = {
	{{#each props}}
		{{{@key}}} : {{{this}}},
	{{/each}}
}

class {{capitalize (camelcase level.name)}}ComponentImport extends React.Component {
	constructor(props){
		super(props)
		this.state = {}
	}
	render(){
		return (
			<{{capitalize (camelcase level.name)}}Component
				{...this.props}
				{...propsObj}
			/>
		)
	}
}

export default {{capitalize (camelcase level.name)}}ComponentImport;
`);


let id = 1;
function processOutlineLevel(level){
	let thisId = id;
	id++;
	let props = {}
	let componentName = level.name;
	let componentInfo;
	if(componentName.substring(0,1) == '.'){
		// local
		componentInfo = require('./' + path.join('./src/components/', componentName, '/second.json'));
	} else {
		// npm 
		componentInfo = require(componentName + '/second.json');
	}

	// console.log('componentInfo:', componentInfo);

	// console.log('Found Component Info:', componentInfo); // component, vars 
	let componentPath;
	if(componentName.substring(0,1) == '.'){
		// local
		componentPath = path.join('components/', componentName, componentInfo.component);
	} else {
		// npm 
		componentPath = componentName;
	}
	// console.log('COMPONENT:', component);
	for(let key in level.vars){
		let val = level.vars[key];
		if(lodash.endsWith(key,'Component')){
			var componentCreatedPath = processOutlineLevel(val);
			props[key] = `require('./${componentCreatedPath}').default`; // local, was created for importing others! 
		} else if(lodash.endsWith(key,'Components')){
			// processOutlineLevel(val);
			let arrObj = [];
			for(let obj of val){
				var componentCreatedPath = processOutlineLevel(obj);
				arrObj.push(`require('./${componentCreatedPath}').default`);
			}
			props[key] = "[\n				" + arrObj.join(",\n				") + "\n		]";

		} else {
			props[key] = JSON.stringify(val); // TODO: jsonify for template (without losing types) 
		}
	}
	let output = loaderTemplate({
		componentPath,
		level,
		props
	});
	let componentNewName = thisId.toString() + '_' + level.name.replace(/[^a-zA-Z]+/g, '');
	fs.writeFileSync('./src/builder-dir/' + componentNewName + '.js', output, 'utf8');
	// console.log(":-------",componentName,"-----:\n", output);
	return componentNewName;
}
fs.emptyDirSync('./src/builder-dir');
let firstFile = processOutlineLevel(outline);
fs.writeFileSync('./src/builder-dir/0_index.js', `module.exports = require('./${firstFile}').default;`,'utf8');
// console.log('firstFile:', firstFile);


