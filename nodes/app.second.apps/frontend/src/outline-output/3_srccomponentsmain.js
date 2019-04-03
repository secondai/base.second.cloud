
      let React = require('react');
      let SrcComponentsMainComponent = require('../components/main/Main.js').default;

      let propsObj = {
      }

      class SrcComponentsMainComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsMainComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsMainComponentImport;
      