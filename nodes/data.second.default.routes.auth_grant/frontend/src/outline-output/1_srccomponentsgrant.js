
  let React = require('react');
  let SrcComponentsGrantComponent = require('../components/grant/Grant.js').default;

  let propsObj = {
  }

  class SrcComponentsGrantComponentImport extends React.Component {
    constructor(props){
      super(props)
      this.state = {}
    }
    render(){
      return (
        <SrcComponentsGrantComponent
          {...this.props}
          {...propsObj}
        />
      )
    }
  }

  export default SrcComponentsGrantComponentImport;
  