import React, { Component } from 'react';
import './AppList.css';

import { 
  Text, 
  Linking,
  StyleSheet,
  TouchableOpacity,
  View 
} from 'react-native';

import PropTypes from 'prop-types';


class Link extends React.Component {
  static propTypes = {
    href: PropTypes.string,
  };

  handleClick = () => {
    Linking.canOpenURL(this.props.href).then(supported => {
      if (supported) {
        Linking.openURL(this.props.href);
      } else {
        console.log('Don\'t know how to open URI: ' + this.props.href);
      }
    });
  };

  render() {
    return (
      <TouchableOpacity
        onPress={this.handleClick}>
        <View style={styles.button}>
          <Text style={styles.text}>{this.props.children}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

class AppList extends Component {
  constructor(props){
    super(props);
    
    this.state = {
      urlVal: 'github.com/secondai/app.second.sample_install',
      apps: [],
      loading: true
    }
    
  }
  
  componentDidMount(){
    this.fetchApps();
  }

  fetchApps = async () => {
    
    let response = await fetch('/api/get_for_pattern',{
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pattern: 'app.*.*',
        excludeData: true
      })
    });
    
    console.log('Nodes Response (for pattern, apps):', response);
    
    let nodes = await response.json();
    console.log('Nodes/Apps:', nodes);
    
    this.setState({
      apps: nodes, 
      loading:false
    })
    
  }
  
  render(){
    
    return (
      <View>
        {
          this.state.apps.map(app=>{
            return (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Link href={'/app/' + app.name}>
                  {app.name}
                </Link>
              </View>
            )
          })
        }
        {
          this.state.apps.map(app=>{
            return (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Link href={'/app/' + app.name}>
                  {app.name}
                </Link>
              </View>
            )
          })
        }
        {
          this.state.loading ? <Text>Loading...</Text>:''
        }
      </View>
    )
  }
}


var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    paddingTop: 30,
  },
  button: {
    padding: 10,
    backgroundColor: '#3B5998',
    marginBottom: 10,
    width: '100%'
  },
  text: {
    color: 'white',
  },
});


export default AppList;
