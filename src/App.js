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
      announcement: ``,
      players: {},
      alias: '',
      gameStatus: 'unready',
      thisplayerID: null,
      thisplayerRole: null,
      countDown: null

    };
  }

  componentDidMount() {
    const alias = prompt('What is your alias');
    const id = Math.floor(Date.now()).toString();

    const rootRef = firebase.database().ref();
    const presenceRef = rootRef.child('presence');
    const gameStateRef = rootRef.child('react').child('gameState');
    const reactdbStateRef = rootRef.child('react');
    // checks the cycle
    const gameSettingsRef = rootRef.child('game-settings')
    gameStateRef.set(false);

    //this.props from index.js
    this.props.firebaseService.setPlayerAlias(id, alias);
    this.props.firebaseService.setOnlineAndWatchPresence(id, alias);
    this.props.firebaseService.countOnlineUser((count) => {
    });

    presenceRef.on('value', snap => {
      this.setState({
        speed: snap.val(),
        alias: alias,
        announcement: `Players currently not ready`
      });
    });

    gameSettingsRef.on('value', snap => {
      const gameSettings = snap.val()
      this.setState({
        countDown: gameSettings.currentCounter,
        gameStatus: gameSettings.gameState
      })
      console.log("snap", gameSettings)
    })
    // reactdbStateRef.on('value', (snap) => {
    //   clearInterval(int);
    //   console.log('front-end-cycle-start')
    //   const gameStatus = snap.val();
    //
    //   let time = gameStatus.cycleEnd - gameStatus.cycleStart;
    //   console.log(time);
    //   let theTimer = time/1000 + 1;
    //
      // const int = setInterval(() => {
      //   if(theTimer > 0) {
      //     theTimer -= 1;
      //     this.setState({
      //       countDown: theTimer
      //     });
      //   } else {
      //     return clearInterval(int);
      //   }
      // }, 1000)
    // })

    this.props.firebaseService.displayCurrentUser((currentUsers) => {
      this.setState({
        players: currentUsers,
        thisplayerID: id
      })
    });

  }// end of component did mount




  onReadyUp = () => {
    return this.props.firebaseService.setReady(this.state.thisplayerID);
  }

  render() {
    let Timer = null; //Timer is for rendering out the timer below
    Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;


    return (
      <div className="App {this.state.gameStatus}">
        <div className="player-list">
          <PlayerList players={this.state.players} doSomething={this.doSomething} />
          <div>
          <h2>{this.state.countDown}</h2>
            {Timer}
          </div>
          <div className="ready-role">
            <h2>Your role:{this.state.thisplayerRole}</h2>
            <Role onReadyUp={this.onReadyUp} />
          </div>

        </div>
        <div className="announcer">
          <h1>{this.state.announcement}</h1>
          <h2>{this.state.gameStatus}</h2>
        </div>
        <div className="chatRoom-container">
          <ChatRoom player={this.state.alias} />
        </div>
      </div>
    );
  }
}

export default App;
