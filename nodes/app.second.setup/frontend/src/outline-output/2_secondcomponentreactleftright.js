
  let React = require('react');
  let SecondComponentReactLeftRightComponent = require('second-component-react-left-right').default;

  let propsObj = {
      leftComponent : require('./3_basictext').default,
      rightComponent : require('./4_basictext').default,
  }

  class SecondComponentReactLeftRightComponentImport extends React.Component {
    constructor(props){
      super(props)
      this.state = {}
    }
    render(){
      return (
        <SecondComponentReactLeftRightComponent
          {...this.props}
          {...propsObj}
        />
      )
    }
  }

  export default SecondComponentReactLeftRightComponentImport;
  