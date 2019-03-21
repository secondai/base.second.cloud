
let React = require('react');
let BasicTextComponent = require('components/basic-text/BasicText.js').default;

let propsObj = {
		text : "this is the right",
}

class BasicTextComponentImport extends React.Component {
	constructor(props){
		super(props)
		this.state = {}
	}
	render(){
		return (
			<BasicTextComponent
				{...this.props}
				{...propsObj}
			/>
		)
	}
}

export default BasicTextComponentImport;
