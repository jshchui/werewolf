import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as firebase from 'firebase';
import './index.js';
import ChatRoom from './components/ChatRoom';
import PlayerList from './components/PlayerList';
import Role from './components/Role';


class App extends Component {
  constructor() {
    super(); //i deleted props


    this.state = {
      speed: 40,
      players: {},
      alias: '',
      gameStatus: 'unready',
      thisplayerID: null
    };
  }

  componentDidMount() {

    const alias = prompt('What is your alias');
    const id = Math.floor(Date.now()).toString();

    const rootRef = firebase.database().ref().child('react');
    const speedRef = rootRef.child('speed');

    //this.props from index.js
    this.props.firebaseService.setPlayerAlias(id, alias);
    this.props.firebaseService.setOnlineAndWatchPresence(id, alias);

    // function callBack(count) {
    //   console.log(count)
    // }
    this.props.firebaseService.countOnlineUser((count) => {
      console.log(count)
    });

    speedRef.on('value', snap => {
      this.setState({
        speed: snap.val(),
        alias: alias,
        thisPlayerID :id
      });
    });

    //I think this displays current users
    firebase.database().ref().child('presence').on('value', (snapshot) => {
        const currentUsers = snapshot.val()
        console.log(currentUsers)

        // const alias = prompt('What is your alias');
        // console.log(currentUsers)
        if(currentUsers != null) {
          this.setState({
            players: currentUsers
        })
      }
    })
  }

  checkPlayerStatus() {

  }



  doSomething(playerID) {
    // this.state.players
    // this.state.players[playerID];
    // console.log(playerID);
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>

        <h1>{this.state.speed}</h1>
        <ChatRoom player={this.state.alias} />
        <PlayerList players={this.state.players} doSomething={this.doSomething} />
        <Role playerID={this.state.thisPlayerID}/>
      </div>
    );
  }
}

export default App;
