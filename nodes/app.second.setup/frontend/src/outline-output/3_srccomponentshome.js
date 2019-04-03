
      let React = require('react');
      let SrcComponentsHomeComponent = require('../components/home/Home.js').default;

      let propsObj = {
      }

      class SrcComponentsHomeComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsHomeComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsHomeComponentImport;
      