
      let React = require('react');
      let SrcComponentsNotesComponent = require('../components/notes/Notes.js').default;

      let propsObj = {
          title : "Deez Notes",
          searchComponent : require('./4_secondfecomponentreactnotesearchv').default,
      }

      class SrcComponentsNotesComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SrcComponentsNotesComponent
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SrcComponentsNotesComponentImport;
      