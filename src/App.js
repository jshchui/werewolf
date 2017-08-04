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
    const gameSettingsRef = rootRef.child('game-settings');
    gameStateRef.set(false);
    gameSettingsRef.child('currentCounter').set('null');

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

    this.props.firebaseService.displayCurrentUser((currentUsers) => {
      this.setState({
        players: currentUsers,
        thisplayerID: id
      })
    });

  }// end of component did mount




  onReadyUp = () => {
    console.log('onreadyup');
    return this.props.firebaseService.setReady(this.state.thisplayerID);
  }

  getPlayerVotedId = (playerID, event) => {
    console.log(playerID);
    return firebase.database().ref().child('presence').child(playerID).child('votes').set(2);
  }

  renderVotingPlayers = (players) => {
    return Object.keys(players).map((playerID) => {
      return (
        <div>
          <p>{playerID}</p>
          <p>{this.state.players[playerID].alias}</p>
          <button onClick={this.getPlayerVotedId.bind(null, playerID)} >Vote</button>

        </div>
      )
    })
  }

  voteKillTest = () => {
    let mostVotedPlayer;
    let mostVotes = 0;
    Object.keys(this.state.players).map((playerID) => {
      if(this.state.players[playerID].votes  > mostVotes) {
        mostVotes = this.state.players[playerID].votes
        mostVotedPlayer = playerID
        console.log('mostVotedPLayerID:',mostVotedPlayer)
      }
    })
  }

  render() {
    let Timer = null; //Timer is for rendering out the timer below
    Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;


    return (
      <div className="App {this.state.gameStatus}">
        <div className="player-list">
          <PlayerList players={this.state.players} getPlayerVotedId={this.votedPlayerID} />
          <div>
          <h2>{this.state.countDown}</h2>
            {Timer}
          </div>

            {this.renderVotingPlayers(this.state.players)}

          <div className="VotingKillTest">
            <button onClick={this.voteKillTest} >Kill Test</button>
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
