
      let React = require('react');
      let SrcComponentsLoginComponent = require('../components/login/Login.js').default;

      let propsObj = {
      }

      class SrcComponentsLoginComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsLoginComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsLoginComponentImport;
      