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
      countDown: null,
      selectedOption: null
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

    let lastGameState;

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
      // console.log("snap", gameSettings)

      if(lastGameState != gameSettings.gameState) {
        presenceRef.child(id).child('role').once('value', snap => {

          if(gameSettings.gameState == "night" && snap.val() == 'Werewolf') {
            this.voteFormShow();
          } else if(gameSettings.gameState =="day") {
            this.voteFormHide();
          } else {
            this.voteFormHide();
          }
        })
      }

      lastGameState = gameSettings.gameState;
    })

    this.props.firebaseService.displayCurrentUser((currentUsers) => {
      this.setState({
        players: currentUsers,
        thisplayerID: id
      })
    });

  }// end of component did mount




  onReadyUp = () => {
    // console.log('onreadyup');
    return this.props.firebaseService.setReady(this.state.thisplayerID);
  }

  //this is responsible for voting players for DEATH
  setVote = (event) => {
    event.preventDefault();
    let playerID = this.state.selectedOption

    firebase.database().ref().child('presence').child(playerID).child('votes')
    .once('value', snap => {
      let selectedPlayerCurrentVotes = snap.val();
      // console.log(selectedPlayerCurrentVotes + 1);
      return firebase.database().ref().child('presence').child(playerID).child('votes').set(selectedPlayerCurrentVotes + 1);
    })

    // console.log('>>>>>>>>>>>>>>>>', playerID)
  }

  // <input type="radio" name={this.setVote.bind(null, playerID)} value="vote" />

  handleOptionChange = (changeEvent) => {
    this.setState({
      selectedOption: changeEvent.target.value
    });
  }

  renderVotingPlayers = (players) => {
    return Object.keys(players).map((playerID) => {
      if(this.state.players[playerID].isAlive == true) {
        return (
          <div>
            <p>Player ID: {playerID}</p>
            <p>{this.state.players[playerID].alias}</p>
            <input
              type="radio"
              name={playerID}
              value={playerID}
              checked={this.state.selectedOption === playerID}
              onChange={this.handleOptionChange} />
          </div>
        )
      } else {
        return null;
      }
    })
  }

  voteKillTest = () => {
    let mostVotedPlayer;
    let mostVotes = 0;
    Object.keys(this.state.players).map((playerID) => {
      if(this.state.players[playerID].votes > mostVotes) {
        mostVotes = this.state.players[playerID].votes
        mostVotedPlayer = playerID
        console.log('mostVotedPLayerID:',mostVotedPlayer)
      }
    })
    firebase.database().ref().child('presence').child(mostVotedPlayer).child('isAlive').set(false);
  }

  voteFormToggle = () => {
    let formStatus = document.getElementById('voting-form-outer');
    if(formStatus.style.display === 'none') {
      formStatus.style.display = 'flex';
    } else {
      formStatus.style.display = 'none';
    }
  }

  voteFormShow = () => {
    let formStatus = document.getElementById('voting-form-outer');
    formStatus.style.display = 'flex';
  }

  voteFormHide = () => {
    let formStatus = document.getElementById('voting-form-outer');
    formStatus.style.display = 'none';
  }

  killSwitch = () => {
    firebase.database().ref().child('game-settings').child('gameState').set('game-ended');
  }

  assignRole = () => {
    const playerSettingsFirebaseObject = firebase.database().ref().child('presence')
    // const Roster = ['Villager', 'Werewolf', 'Seer']
    const Roster = ['Villager', 'Werewolf', 'Seer']
    let RosterSize = []

    playerSettingsFirebaseObject.once('value', snap => {
      let players = snap.val()
      for(let x in players) {
        console.log(x);
        RosterSize.push(x);
      }

      //Square root of number of players FLoored
      // Root n floored
      let werewolves = 1
      if(RosterSize.length > 5) {
        werewolves = Math.floor(Math.sqrt(RosterSize.length));
      }
      let seer = 1
      let villagers = RosterSize.length - werewolves - seer

      //Pushing the roles in Roster
      for(let i=0; i<werewolves; i++) {
        Roster.push('Werewolf')
      }

      for(let i=0; i<seer; i++) {
        Roster.push('Seer')
      }

      for(let i=0; i<villagers; i++) {
        Roster.push('Villager')
      }
      
      console.log(Roster)
      Object.keys(players).map((playerID) => {
        let Role = Roster[Math.floor(Math.random()*3)]
        playerSettingsFirebaseObject.child(playerID).child('role').set(Role);
      })
    })
  }

  voteKillTestWithoutState = () => {
    const playerSettingsFirebaseObject = firebase.database().ref().child('presence')

    let mostVotedPlayer;
    let mostVotes = 0;
    playerSettingsFirebaseObject.once('value', snap => {
      let players = snap.val()
      Object.keys(players).map((playerID) => {
        if(players[playerID].votes > mostVotes) {
          mostVotes = players[playerID].votes
          mostVotedPlayer = playerID
        }
      })
    })
    playerSettingsFirebaseObject.child(mostVotedPlayer).child('isAlive').set(false);
  }


  render() {
    let Timer = null; //Timer is for rendering out the timer below
    Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;

    return (
      <div className="App {this.state.gameStatus}">

        <div id="voting-form-outer">
          <form id="votingform" onSubmit={this.setVote}>
          <h2>Voting for a player to die</h2>
            {this.renderVotingPlayers(this.state.players)}
          <input type="submit" value="Submit" />
          </form>
          <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
          <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
        </div>

        <div className="player-list">
          <PlayerList players={this.state.players} setVote={this.votedPlayerID} />

          <div>
            <h2>{this.state.countDown}</h2>
            {Timer}
            <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
            <button onClick={this.assignRole}>Assign Role</button>
            <button onClick={this.voteKillTestWithoutState}>KillTest without State</button>
          </div>


          <div className="VotingKillTest">
            <button onClick={this.voteKillTest}>Kill Test</button>
            <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
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
