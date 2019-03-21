
let React = require('react');
let LeftRightComponent = require('components/left-right/LeftRight.js').default;

let propsObj = {
		leftComponent : require('./3_basictext').default,
		rightComponent : require('./4_basictext').default,
}

class LeftRightComponentImport extends React.Component {
	constructor(props){
		super(props)
		this.state = {}
	}
	render(){
		return (
			<LeftRightComponent
				{...this.props}
				{...propsObj}
			/>
		)
	}
}

export default LeftRightComponentImport;
