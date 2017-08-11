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
      selectedOption: null,
      inspected: null
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
          if(gameSettings.gameState == "Werewolf-Phase" && snap.val() == 'Werewolf') {
            this.formShow('voting-form-outer');
          } else if (gameSettings.gameState == "Seer-Phase" && snap.val() == 'Seer') {
            this.formShow('seer-form-outer');
          } else if (gameSettings.gameState == "Night-Death-Phase") {
            this.formShow('death-alert');
            this.formHide('seer-form-outer');
            this.formHide('voting-form-outer');

            //Set state inspected here for seer logic
            this.setState({
              inspected: null
            })

          } else if (gameSettings.gameState == "Lynch-Phase") {
            this.formShow('lynch-form-outer');
          } else if (gameSettings.gameState == "Day-Death-Phase") {
            this.formShow('death-alert')
            this.formHide('lynch-form-outer');
          } else {
            this.formHide('voting-form-outer');
            this.formHide('seer-form-outer');
            this.formHide('death-alert');
            this.formHide('lynch-form-outer');
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
  }

  inspect = (event) => {
    event.preventDefault();
    let playerID = this.state.selectedOption

    return firebase.database().ref().child('presence').child(playerID).child('role')
    .once('value', snap => {
      let selectedPlayerForInspection = snap.val();

      console.log(selectedPlayerForInspection);
      console.log('state inspect', this.state.inspected)
      this.setState({
        inspected: selectedPlayerForInspection
      })
    })
  }

  // <input type="radio" name={this.setVote.bind(null, playerID)} value="vote" />

  handleOptionChange = (changeEvent) => {
    this.setState({
      selectedOption: changeEvent.target.value
    });
  }

  renderVotingPlayers = (players) => {
    return Object.keys(players).map((playerID, index) => {
      if(this.state.players[playerID].isAlive == true) {
        return (
          <div key={index}>
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

  renderDeadPlayers = (players) => {
    // setting inspected state back to null here:
    //THIS MAKES AN INFINITE LOOP OF ERRORS WHY?
    // this.setState({
    //   inspected: null
    // })

    return Object.keys(players).map((playerID) => {
      if(this.state.players[playerID].isAlive == 'recentlyDead') {
        return (
          <div>
            <h3>{this.state.players[playerID].alias} was found dead on the floor</h3>
            <p>{this.state.players[playerID].alias} was a {this.state.players[playerID].role}</p>
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

  formShow = (form) => {
    let formStatus = document.getElementById(form);
    formStatus.style.display = 'flex';
  }

  formHide = (form) => {
    let formStatus = document.getElementById(form);
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

  setIsAliveFalse = () => {
    const playerSettingsFirebaseObject = firebase.database().ref().child('presence')

    playerSettingsFirebaseObject.once('value', snap => {
      let players = snap.val()
      Object.keys(players).map((playerID) => {
        if(players[playerID].isAlive == 'recentlyDead') {
          playerSettingsFirebaseObject.child(playerID).child('isAlive').set(false);
        }
      })
    })
  }



  render() {
    let Timer = null; //Timer is for rendering out the timer below
    Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;

    let InspectedPlayer = null
    if(this.state.inspected != null) {
      InspectedPlayer = <p>That person is a {this.state.inspected}</p>
    }

    return (
      <div className="App {this.state.gameStatus}">

        <div id="voting-form-outer">
          <form id="votingform" onSubmit={this.setVote}>
            <h2>Choose a person to get a claw in face</h2>
            {this.renderVotingPlayers(this.state.players)}
            <input type="submit" value="Submit" />
          </form>

          <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
          <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
        </div>

        <div id="seer-form-outer">
          <form id="seerform" onSubmit={this.inspect}>
            <h2>Choose a player to inspect</h2>
            {this.renderVotingPlayers(this.state.players)}
            <input type="submit" value="Submit" />
            {InspectedPlayer}
          </form>

          <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
          <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
        </div>

        <div id="death-alert">
          <div id="death-alert-box">
            <h2>{this.renderDeadPlayers(this.state.players)}</h2>
          </div>
        </div>

        <div id="lynch-form-outer">
          <form id="lynchform" onSubmit={this.setVote}>
            <h2>Who should get hanged?</h2>
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
            <button onClick={this.setIsAliveFalse}>RecentlyDead to False</button>
            <button onClick={this.checkWinCondition}>Check Win Condition</button>
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
