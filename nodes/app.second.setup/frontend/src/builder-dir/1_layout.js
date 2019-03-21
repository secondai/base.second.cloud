
let React = require('react');
let LayoutComponent = require('components/layout/Layout.js').default;

let propsObj = {
		childComponents : [
				require('./2_leftright').default,
				require('./5_basictext').default
		],
		title : "Page Title Here",
}

class LayoutComponentImport extends React.Component {
	constructor(props){
		super(props)
		this.state = {}
	}
	render(){
		return (
			<LayoutComponent
				{...this.props}
				{...propsObj}
			/>
		)
	}
}

export default LayoutComponentImport;
