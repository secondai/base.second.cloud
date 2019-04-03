
      let React = require('react');
      let SrcComponentsLayoutComponent = require('../components/layout/Layout.js').default;

      let propsObj = {
          pageTitle : "Setup",
          title : "Setup",
          loginComponent : require('./2_srccomponentslogin').default,
          mainComponent : require('./3_srccomponentshome').default,
      }

      class SrcComponentsLayoutComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsLayoutComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsLayoutComponentImport;
      