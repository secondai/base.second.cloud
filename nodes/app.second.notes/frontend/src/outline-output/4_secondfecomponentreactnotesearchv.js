
      let React = require('react');
      let SecondFeComponentReactNoteSearchV1Component = require('second-fe-component-react-note-search-v1').default;

      let propsObj = {
      }

      class SecondFeComponentReactNoteSearchV1ComponentImport extends React.Component {
        constructor(props){
          super(props)
          this.state = {}
        }
        render(){
          return (
            <SecondFeComponentReactNoteSearchV1Component
              {...this.props}
              {...propsObj}
            />
          )
        }
      }

      export default SecondFeComponentReactNoteSearchV1ComponentImport;
      