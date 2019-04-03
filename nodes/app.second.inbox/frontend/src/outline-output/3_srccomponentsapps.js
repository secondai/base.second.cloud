
      let React = require('react');
      let SrcComponentsAppsComponent = require('../components/apps/Apps.js').default;

      let propsObj = {
      }

      class SrcComponentsAppsComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsAppsComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsAppsComponentImport;
      