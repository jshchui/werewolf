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
      announcement: ``,
      players: {},
      alias: '',
      gameStatus: 'unready',
      thisplayerID: null,
      thisplayerRole: ''
    };
  }

  componentDidMount() {

    const alias = prompt('What is your alias');
    const id = Math.floor(Date.now()).toString();

    const rootRef = firebase.database().ref().child('react');
    const presenceRef = rootRef.child('presence');
    const gameStateRef = rootRef.child('gameState');

    gameStateRef.set(false);

    //this.props from index.js
    this.props.firebaseService.setPlayerAlias(id, alias);
    this.props.firebaseService.setOnlineAndWatchPresence(id, alias);

    this.props.firebaseService.countOnlineUser((count) => {
      // console.log(count)
    });

    presenceRef.on('value', snap => {
      this.setState({
        speed: snap.val(),
        alias: alias,
        announcement: `Players currently not ready`
      });
    });
    gameStateRef.on('value', snap => {
      if(snap.val() == true) {
        this.setState({
          gameStatus: 'ready'
        })
      }
    })


    this.props.firebaseService.displayCurrentUser((currentUsers) => {
      this.setState({
        players: currentUsers,
        thisplayerID: id
      })
    });
  }


  componentDidUpdate() {
    if(this.state.gameStatus == 'ready') {
      var Roster = ['Villager', 'Werewolf', 'Seer']
      var Role = Roster[Math.floor(Math.random()*2)];
      this.setState({
        thisplayerRole: Role,
        gameStatus: 'begin'
      });
      console.log('game status ready, giving out roles');
    }
  }



  //maybe used for later
  checkPlayerStatus() {

  }


  // maybe used for later
  doSomething(playerID) {
    // this.state.players
    // this.state.players[playerID];
    // console.log(playerID);
  }

  ready() {
    return ;
  }



  loopThroughPlayers = () => {
    // this.props.firebaseService.checkReady();
    this.props.firebaseService.checkReady(this.state.thisplayerID).then(
      (gameStart) => {
      console.log(`Gamestate: ${gameStart}`);
      if(gameStart == true) {
        firebase.database().ref().child('react').child('gameState').set(true);
      }
    });
    // var name = this.state.alias;
    // console.log(this.state.alias);


    //
    // firebase.database().ref().child('presence').child(this.state.thisplayerID).child('ready').set(true);
    //
    // var query = firebase.database().ref('presence');
    // query.once("value")
    //   .then(function(snapshot) {
    //     var gameReady = true;
    //     snapshot.forEach(function(childSnapshot) {
    //       var key = childSnapshot.key;
    //       var childData = childSnapshot.val();
    //       if (childData.ready == false) {
    //         gameReady = false;
    //       }
    //     });
    //     return gameReady;
    //   }).then(function(gameReady) {
    //     if(gameReady == true) {
    //       console.log('Game Start');
    //     }
    //   })
  }

  // <Role playerID={this.state.thisPlayerID} loopThroughPlayers={this.loopThroughPlayers}/>


  render() {
    return (
      <div className="App">
        <div className="player-list">
          <PlayerList players={this.state.players} doSomething={this.doSomething} />
          <div className="ready-role">
            <h2>Your role:{this.state.thisplayerRole}</h2>
            <Role loopThroughPlayers={this.loopThroughPlayers} ready={this.ready}/>
          </div>
        </div>
        <div className="announcer">
          <h1>{this.state.gameStatus}</h1>
        </div>
        <div className="chatRoom-container">
          <ChatRoom player={this.state.alias} />
        </div>
      </div>
    );
  }
}

export default App;
