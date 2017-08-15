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
      players: {},
      alias: '',
      gameStatus: 'unready',
      thisplayerID: null,
      thisplayerRole: null,
      countDown: null,
      selectedOption: null,
      inspected: null,
      menuVisible: false
    };
  }

  componentDidMount() {
    const alias = prompt('What is your alias') || 'Unnamed Person';
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
        alias: alias
      });
    });

    // checks the players role and displays it at the bottom
    presenceRef.child(id).child('role').on('value', snap => {
      let role = snap.val()
      this.setState({
        thisplayerRole: role
      })
    })

    gameSettingsRef.on('value', snap => {
      const gameSettings = snap.val()
      this.setState({
        countDown: gameSettings.currentCounter,
        gameStatus: gameSettings.gameState
      })

      if(lastGameState != gameSettings.gameState) {
        presenceRef.child(id).child('role').once('value', snap => {
          if(gameSettings.gameState == "Werewolf-Phase" && snap.val() == 'Werewolf') {
            this.formHide('death-alert');
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
            console.log('button should be disabled')
            document.getElementById('killButton').disabled = false;
            document.getElementById('lynchButton').disabled = false;
            document.getElementById('inspectButton').disabled = false;


          } else if (gameSettings.gameState == "Lynch-Phase") {
            this.formShow('lynch-form-outer');
          } else if (gameSettings.gameState == "Day-Death-Phase") {
            this.formShow('death-alert')
            this.formHide('lynch-form-outer');

            document.getElementById('killButton').disabled = false;
            document.getElementById('lynchButton').disabled = false;

          } else if (gameSettings.gameState == "werewolves-win") {
            this.formShow('werewolves-win')
          } else if (gameSettings.gameState == "villagers-win") {
            this.formShow('villagers-win')
          } else {
            this.formHide('werewolves-win')
            this.formHide('villagers-win')
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

  formShow = (form) => {
    let formStatus = document.getElementById(form);
    formStatus.style.display = 'flex';
  }

  formHide = (form) => {
    let formStatus = document.getElementById(form);
    formStatus.style.display = 'none';
  }



  onReadyUp = () => {
    return this.props.firebaseService.setReady(this.state.thisplayerID);
  }

  //this is responsible for voting players for DEATH
  setVote = (event) => {
    event.preventDefault();
    let playerID = this.state.selectedOption

    //disable button after submitting once
    document.getElementById('killButton').disabled = true;
    document.getElementById('lynchButton').disabled = true;

    firebase.database().ref().child('presence').child(playerID).child('votes')
    .once('value', snap => {
      let selectedPlayerCurrentVotes = snap.val();
      return firebase.database().ref().child('presence').child(playerID).child('votes').set(selectedPlayerCurrentVotes + 1);
    })
  }

  inspect = (event) => {
    event.preventDefault();
    let playerID = this.state.selectedOption

    document.getElementById('inspectButton').disabled = true;

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

  handleOptionChange = (changeEvent) => {
    this.setState({
      selectedOption: changeEvent.target.value
    });
  }

  renderVotingPlayers = (players) => {
    return Object.keys(players).map((playerID, index) => {
      if(this.state.players[playerID].isAlive == true) {
        return (
          <div class="vote_selections" key={index}>
            {/* <p>Player ID: {playerID}</p> */}
              <input
                type="radio"
                name='voteFormDeath'
                value={playerID}
                checked={this.state.selectedOption === playerID}
                onChange={this.handleOptionChange}
                id={playerID}
                required
              />
            <label htmlFor={playerID}>
              {this.state.players[playerID].alias}
            </label>
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
    let formStatus = document.getElementById('seer-form-outer');
    if(formStatus.style.display === 'none') {
      formStatus.style.display = 'flex';
    } else {
      formStatus.style.display = 'none';
    }
  }

  killSwitch = () => {
    firebase.database().ref().child('game-settings').child('gameState').set('game-ended');
  }

  assignRole = () => {
    const playerSettingsFirebaseObject = firebase.database().ref().child('presence')
    const Roster = []

    playerSettingsFirebaseObject.once('value', snap => {
      let players = snap.val()
      let numPlayers = Object.keys(players).length;

      let werewolves, seer, villagers = 0;
      if(numPlayers > 5) {
        werewolves = Math.floor(Math.sqrt(numPlayers));
        seer = 1;
        villagers = numPlayers - (werewolves + seer);
      } else if(numPlayers == 5) {
        werewolves = 1;
        seer = 1;
        villagers = 3;
      } else if(numPlayers == 4) {
        werewolves = 1
        seer = 1;
        villagers = 2;
      } else if(numPlayers == 3) {
        werewolves = 1;
        seer = 1
        villagers = 1;
      } else if(numPlayers == 2) {
        seer = 1;
        werewolves = 1;
      } else if(numPlayers == 1) {
        seer = 1;
      }

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

      Object.keys(players).map((playerID) => {
        let randomNumber = Math.floor(Math.random() * Roster.length)
        let selectFromRoster = Roster[randomNumber]
        Roster.splice(randomNumber, 1);
        playerSettingsFirebaseObject.child(playerID).child('role').set(selectFromRoster);
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

  checkWinCondition = () => {
    const playerSettingsFirebaseObject = firebase.database().ref().child('presence')
    playerSettingsFirebaseObject.once('value', snap => {
      let players = snap.val()

      let werewolves = 0;
      let villagers = 0;
      Object.keys(players).map((playerID) => {
        if(players[playerID].isAlive) {
          if(players[playerID].role == 'Werewolf') {
            werewolves += 1;
          } else {
            villagers += 1;
          }
        }
      })

      if(werewolves >= villagers) {
        firebase.database().ref().child('game-settings').child('gameState').set('werewolves-win');

      } else if (werewolves <= 0) {
        firebase.database().ref().child('game-settings').child('gameState').set('villagers-win');

      } else {
        console.log('The game continues')
      }
    })
  }

  toggleNav = () => {
    // document.getElementById("player-list").classList.toggle("show");
    this.setState({
      menuVisible: !this.state.menuVisible
    })
  }

  // <div className="VotingKillTest">
  //   <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
  //   <button onClick={this.assignRole}>Assign Role</button>
  //   <button onClick={this.voteKillTestWithoutState}>KillTest without State</button>
  //   <button onClick={this.setIsAliveFalse}>RecentlyDead to False</button>
  //   <button onClick={this.checkWinCondition}>Check Win Condition</button>
  //   <button onClick={this.voteKillTest}>Kill Test</button>
  //   <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
  // </div>



  render() {
    // let Timer = null; //Timer is for rendering out the timer below
    // Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;

    let InspectedPlayer = null
    if(this.state.inspected != null) {
      InspectedPlayer = <p>That person is a {this.state.inspected}</p>
    }

    return (
      <div className="App">
        <div id="overlapping-components">
          <div id="voting-form-outer">
            <form id="votingform" onSubmit={this.setVote}>
              <h2>Choose a person to get a claw in face</h2>
              {this.renderVotingPlayers(this.state.players)}
              <input id='killButton' type="submit" value="Submit" />
            </form>

            <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
            <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
          </div>

          <div id="seer-form-outer">
            <form id="seerform" onSubmit={this.inspect}>
              <h2>Choose a player to inspect</h2>
              {this.renderVotingPlayers(this.state.players)}
              <input id='inspectButton' type="submit" value="Submit" />
              {InspectedPlayer}
            </form>
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
              <input id='lynchButton' type="submit" value="Submit" />
            </form>

            <button id="killSwitch" onClick={this.killSwitch}>KILL SWITCH</button>
            <button onClick={this.voteFormToggle}>Voting Form Toggle</button>
          </div>

          <div id="werewolves-win">
            <div id="werewolves-win-box">
              <h2>The werewolves win!</h2>
            </div>
          </div>

          <div id="villagers-win">
            <div id="villagers-win-box">
              <h2>The villagers-win</h2>
            </div>
          </div>
        </div>

        <div className="announcer">

          <h2>{this.state.gameStatus} - </h2>
          <h2>&nbsp;{this.state.countDown}</h2>
          <button className="hamburger" onClick={this.toggleNav}>
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>

        <div className="show" id="player-list">
          <PlayerList players={this.state.players} setVote={this.votedPlayerID} />

          <button onClick={this.voteFormToggle}>Voting Form Toggle</button>

          <div className="ready-role">
            <h2>Your role: {this.state.thisplayerRole}</h2>
            <Role onReadyUp={this.onReadyUp} />
          </div>
        </div>


        <ChatRoom player={this.state.alias} playerId={this.state.thisplayerID} />
      </div>
    );
  }
}

export default App;
