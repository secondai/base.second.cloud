import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { 
  StyleSheet,
  Button,
  Text, 
  View,
  SafeAreaView
} from 'react-native';

import AppList from './AppList'


const Header = ({ onBack, title }: { onBack?: () => mixed, title: string }) => (
  <SafeAreaView style={styles.headerContainer}>
    <View style={styles.header}>
      <View style={styles.headerCenter}>
        <Text accessibilityRole="heading" aria-level="3" style={styles.title}>{title}</Text>
      </View>
      {onBack ? (
        <React.Fragment>
          <View style={styles.headerLeft}>
            <Button title="Back" onPress={onBack} />
          </View>
          <View style={styles.headerRight}>
          </View>
        </React.Fragment>
      ) : null}
    </View>
  </SafeAreaView>
);


class App extends Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Apps" />
        <SafeAreaView>
          <AppList />
        </SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#96969A',
    backgroundColor: '#F5F5F6',
  },
  header: {
    padding: 10,
    paddingVertical: 5,
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50
  },
  headerCenter: {
    flex: 1,
    order: 2
  },
  headerLeft: {
    order: 1,
    width: 80
  },
  headerRight: {
    order: 3,
    width: 80
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  exampleContainer: {
    flex: 1,
  },
});

export default App;
