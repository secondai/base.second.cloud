
      let React = require('react');
      let SrcComponentsInboxComponent = require('../components/inbox/Inbox.js').default;

      let propsObj = {
      }

      class SrcComponentsInboxComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsInboxComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsInboxComponentImport;
      