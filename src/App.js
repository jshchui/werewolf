import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';
import './index.js';
import ChatRoom from './components/ChatRoom';
import PlayerList from './components/PlayerList';
import Role from './components/Role';

import moon from './moon.png';
import sun from './sun.png';


class App extends Component {

  constructor() {
    super(); //i deleted props

    this.state = {
      players: {},
      alias: '',
      gameStatus: 'unready',
      thisplayerID: null,
      thisplayerRole: null,
      countDown: 0,
      selectedOption: null,
      inspected: null,
      amIAlive: null,
      nightTime: true,
      endTime: null,
      timerInterval: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.setName = this.setName.bind(this);
  }

  setupGame() {
    const id = Math.floor(Date.now()).toString();
    // const alias = prompt('What is your alias') || `Person ${id.toString().slice(-2)}`;
    const alias = this.state.alias;

    const rootRef = firebase.database().ref();
    const presenceRef = rootRef.child('presence');
    // checks the cycle
    const gameSettingsRef = rootRef.child('game-settings');
    gameSettingsRef.child('currentCounter').set('0');

    let lastGameState;

    //this.props from index.js
    this.props.firebaseService.setPlayerAlias(id, alias);
    this.props.firebaseService.setOnlineAndWatchPresence(id, alias);
    this.props.firebaseService.countOnlineUser((count) => {});

    presenceRef.on('value', snap => {
      this.setState({
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

    presenceRef.child(id).child('isAlive').on('value', snap => {
      let isAlive = snap.val()
      this.setState({
        amIAlive: isAlive
      })
    })

    gameSettingsRef.on('value', snap => {
      const gameSettings = snap.val()
      this.setState({
        endTime: gameSettings.endTime,
        gameStatus: gameSettings.gameState
      })
      this.countDownTimer();



      if(lastGameState !== gameSettings.gameState) {
        presenceRef.child(id).once('value', snap => {
          const thisPlayer = snap.val()


          if(gameSettings.gameState === "all-ready") {
            console.log('reset');
            presenceRef.child(id).update({
              isAlive: true,
              ready: false,
              votes: 0
            })
          }


          if(gameSettings.gameState !== "villagers-win" &&  gameSettings.gameState !== "werewolves-win" && gameSettings.gameState === "Werewolf-Phase" && thisPlayer.role === 'Werewolf' && thisPlayer.isAlive ) {
            this.formHide('death-alert');
            this.formShow('voting-form-outer');
          } else if (gameSettings.gameState === "Seer-Phase" && thisPlayer.role === 'Seer' && thisPlayer.isAlive) {
            this.formShow('seer-form-outer');
          } else if (gameSettings.gameState === "Night-Death-Phase") {
            this.formShow('death-alert');
            this.formHide('seer-form-outer');
            this.formHide('voting-form-outer');
            this.clearThisPlayerAction(presenceRef);

            //Set state inspected here for seer logic
            this.setState({
              inspected: null,
              nightTime: false
            })
            document.getElementById('killButton').disabled = false;
            document.getElementById('lynchButton').disabled = false;
            document.getElementById('inspectButton').disabled = false;


          } else if (gameSettings.gameState === "Lynch-Phase") {
            this.formShow('lynch-form-outer');
          } else if (gameSettings.gameState === "Day-Death-Phase") {
            this.formShow('death-alert')
            this.formHide('lynch-form-outer');

            document.getElementById('killButton').disabled = false;
            document.getElementById('lynchButton').disabled = false;

            this.setState({
              nightTime: true
            })

          } else if (gameSettings.gameState === "werewolves-win") {
            // this.formShow('werewolves-win')
          } else if (gameSettings.gameState === "villagers-win") {
            // this.formShow('villagers-win')
          } else {
            // this.formHide('werewolves-win')
            // this.formHide('villagers-win')
            this.formHide('voting-form-outer');
            this.formHide('seer-form-outer');
            this.formHide('death-alert');
            this.formHide('lynch-form-outer');

            if(thisPlayer.ready === true) {
              presenceRef.child(id).child('ready').set(false)
            }
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

  }

  componentDidMount() {
  }// end of component did mount

  formShow = (form) => {
    let formStatus = document.getElementById(form);
    formStatus.style.display = 'flex';
  }

  formHide = (form) => {
    let formStatus = document.getElementById(form);
    formStatus.style.display = 'none';
  }



  onReadyUp = (players) => {
    let ready = !players[this.state.thisplayerID].ready
    return this.props.firebaseService.setReady(this.state.thisplayerID, ready);
  }

  //this is responsible for voting players for DEATH
  setVote = (event) => {
    event.preventDefault();
    let playerID = this.state.selectedOption

    //disable button after submitting once
    document.getElementById('killButton').disabled = true;
    document.getElementById('lynchButton').disabled = true;

    const votingOptions = event.target.querySelectorAll('input[type="radio"]')
    let hiddenOptions = []

    votingOptions.forEach(player => {
      let currentPlayer = player.nextSibling

      if (player.id !== playerID) {
        currentPlayer.style.display = 'none'
        hiddenOptions.push(currentPlayer)
      }
    })

    setTimeout(() => {
      hiddenOptions.forEach(player => player.style.display = 'inline-block')
    }, 3000)

    firebase.database().ref().child('presence').child(playerID).child('votes')
    .once('value', snap => {
      let selectedPlayerCurrentVotes = snap.val();
      return firebase.database().ref().child('presence').child(playerID).child('votes').set(selectedPlayerCurrentVotes + 1);
    })

    // This shows that the player comfirmed a vote
    firebase.database().ref().child('presence').child(this.state.thisplayerID).child('currentAction').set('confirmed-vote');
  }

  inspect = (event) => {
    event.preventDefault();
    let playerID = this.state.selectedOption

    document.getElementById('inspectButton').disabled = true;

    return firebase.database().ref().child('presence').child(playerID).child('role')
    .once('value', snap => {
      let selectedPlayerForInspection = snap.val();

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

  clearThisPlayerAction = (presenceRef) => {
    presenceRef.child(this.state.thisplayerID).child('currentAction').set(null);
    presenceRef.child(this.state.thisplayerID).child('selectedPerson').set('no-one');
  }

  renderVotesOnPlayers = (players, phase) => {
    return Object.keys(players).map((playerID, index) => {
      if(phase === 'werewolf') {
        if(players[playerID].role === 'Werewolf') {
          if(players[playerID].isAlive === true) {
            if(players[playerID].currentAction === 'confirmed-vote') {
              return (
                <h3 className="voteOnPlayers">{this.state.players[playerID].alias} has Locked In <span className="confirmed">{players[playerID].selectedPerson}</span></h3>
              )
            } else {
              return (
                <h3 className="voteOnPlayers">{this.state.players[playerID].alias} has selected <span className="selecting">{players[playerID].selectedPerson || 'no-one'}</span></h3>
              )
            }
          }
        }
      } else {
        if(players[playerID].isAlive === true) {
          if(players[playerID].currentAction === 'confirmed-vote')
          return (
            <h3 className="voteOnPlayers">{this.state.players[playerID].alias} has Locked In <span className="confirmed">{players[playerID].selectedPerson}</span></h3>
          )
          else {
            return (
              <h3 key={index} className="voteOnPlayers">{this.state.players[playerID].alias} has selected <span className="selecting">{players[playerID].selectedPerson || 'no-one'}</span></h3>
            )
          }
        }
      }
    })
  }

  renderVotingPlayers = (players) => {
    return Object.keys(players).map((playerID, index) => {
      if(this.state.players[playerID].isAlive === true) {
        return (
          <div className="vote_selections" key={index}>
              <input
                type="radio"
                name='voteFormDeath'
                value={playerID}
                checked={this.state.selectedOption === playerID}
                onChange={this.handleOptionChange}
                id={playerID}
                required
              />
            <label htmlFor={playerID}
              onClick=
              {() => this.playerSelected(this.state.players[this.state.thisplayerID],
              this.state.players[playerID])}>
              {this.state.players[playerID].alias}
            </label>
          </div>
        )
      } else {
        return null;
      }
    })
  }

  playerSelected = (thisplayerId, selectedPlayerId) => {
    firebase.database().ref().child('presence').child(this.state.thisplayerID).child('selectedPerson').set(selectedPlayerId.alias);
  }

  renderDeadPlayers = (players) => {
    return Object.keys(players).map((playerID) => {
      if(this.state.players[playerID].isAlive === 'recentlyDead') {
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

  voteFormToggle = () => {
    // let formStatus = document.getElementById('lynch-form-outer');
    // if(formStatus.style.display === 'none') {
    //   formStatus.style.display = 'flex';
    // } else {
    //   formStatus.style.display = 'none';
    // }

    document.getElementById('voting-form-outer').classList.toggle("appear");
  }



  toggleNav = () => {
    document.getElementById("player-list").classList.toggle("show");
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

   killSwitch = () => {
     firebase.database().ref().child('game-settings').child('gameState').set('game-ended');
   }


  countDownTimer = () => {
    this.clearCountDownInterval()

    let countDownAmount = (this.state.endTime) - Date.now();
    console.log('this.state.endTime', this.state.endTime)
    console.log('Date.now()', Date.now())
    console.log('countDownAmount', countDownAmount)

    let currentCount = Math.floor(countDownAmount / 1000);
    console.log('currentCount:', currentCount)

    this.setState({
      countDown: currentCount
    })

    // let int = null
    let int = setInterval(() => {
      if(currentCount > 0) {
        currentCount -= 1;
        this.setState({
          countDown: currentCount
        })
      } else {
        this.clearCountDownInterval()
        console.log('clear', this.state.timerInterval, this.state.countDown)
      }
    }, 1000)

    this.setState({
      timerInterval: int
    })
  }

  clearCountDownInterval = () => {
    clearInterval(this.state.timerInterval);
    this.setState({
      timerInterval: null,
      countDown: 0
    })
  }

  setName(event) {
    event.preventDefault();
    document.getElementById('name-form-screen').style.display = 'none';
    console.log('alias', this.state.alias);
    this.setupGame()
  }

  handleChange(event) {
    console.log('handlingChange', event.target.value)
    this.setState({alias: event.target.value})
  }

  render() {
    // let Timer = null; //Timer is for rendering out the timer below
    // Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;

    let InspectedPlayer = null
    if(this.state.inspected != null) {
      InspectedPlayer = <p>That person is a {this.state.inspected}</p>
    }

    let votingPlayers
    let killBut
    let inspectBut
    let lynchBut

    if(this.state.amIAlive === true) {
      votingPlayers = this.renderVotingPlayers(this.state.players)
      killBut = <input id='killButton' type="submit" value="Submit" />
      inspectBut = <input id='inspectButton' type="submit" value="Submit" />
      lynchBut = <input id='lynchButton' type="submit" value="Submit" />
    } else {
      votingPlayers = <p>You are dead and cannot vote</p>
      killBut = <input style={{display: 'none'}} id='killButton' type="submit" value="Submit" />
      inspectBut = <input style={{display: 'none'}} id='inspectButton' type="submit" value="Submit" />
      lynchBut = <input style={{display: 'none'}} id='lynchButton' type="submit" value="Submit" />
    }

    let sunOrMoon;

    if(this.state.nightTime === true) {
      sunOrMoon = <img className='sun-moon' src={moon} alt='moon' />
    } else if(this.state.nightTime === false ) {
      sunOrMoon = <img className='sun-moon' src={sun} alt='sun' />
    }

    return (
      <div className="App">
        <div id="overlapping-components">

          <div id="name-form-screen">
            <form id="name-form" onSubmit={this.setName}>
              <input id="name-input" type="text"
                name="name"
                onChange={this.handleChange}
                value={this.state.alias}
              />
              <h2 id='name-form-name'>Name</h2>
              <input id='name-submit' type="submit" value=">>" />
            </form>

          </div>

          <div id="voting-form-outer">
            {this.renderVotesOnPlayers(this.state.players, 'werewolf')}
            <form id="votingform" onSubmit={this.setVote}>
              <h2>Choose a person to get a claw in face</h2>
              <div>
                {votingPlayers}
              </div>
              {/* <input id='killButton' type="submit" value="Submit" /> */}
              {killBut}
            </form>

          </div>

          <div id="seer-form-outer">
            <form id="seerform" onSubmit={this.inspect}>
              <h2>Choose a player to inspect</h2>
              {votingPlayers}
              {/* <input id='inspectButton' type="submit" value="Submit" /> */}
              {inspectBut}
              {InspectedPlayer}
            </form>
          </div>

          <div id="death-alert">
            <div id="death-alert-box">
              <h2>{this.renderDeadPlayers(this.state.players)}</h2>
            </div>
          </div>

          <div id="lynch-form-outer">
            {this.renderVotesOnPlayers(this.state.players, 'lynch')}
            <form id="lynchform" onSubmit={this.setVote}>
              <h2>Who should get hanged?</h2>
              <div>
                {votingPlayers}
              </div>
              {/* <input id='lynchButton' type="submit" value="Submit" /> */}
              {lynchBut}
            </form>
          </div>

          {/* <div id="werewolves-win">
            <div id="werewolves-win-box">
              <h2>The werewolves win!</h2>
            </div>
          </div>

          <div id="villagers-win">
            <div id="villagers-win-box">
              <h2>The villagers-win</h2>
            </div>
          </div> */}
        </div>


        <div className="announcer" onClick={this.toggleNav}>


          {/* <img className='sun-moon' src={moon} /> */}
          {sunOrMoon}

          <span id='timer'>{this.state.countDown}</span>
          <h2>{this.state.gameStatus}</h2>
        </div>
        <div className="show" id="player-list">
          {/* <h1>{this.state.gameStatus} - </h1>
          <h1>&nbsp;{this.state.countDown}</h1> */}

          <PlayerList players={this.state.players} setVote={this.votedPlayerID} thisPlayer={this.state.thisplayerID}/>
          {/* <button onClick={this.countDownTimer}>Start Timer</button> */}
          {/* <button onClick={this.clearCountDownInterval}>Clear Timer Interval</button> */}
          {/* <button onClick={this.killSwitch}>Kill Switch</button> */}

          <div className="ready-role">
            <p>Role:</p>
            <h3>{this.state.thisplayerRole}</h3>
            <Role onReadyUp={()=>this.onReadyUp(this.state.players)} />
          </div>
        </div>



        <ChatRoom player={this.state.alias} playerId={this.state.thisplayerID} />
        <button className="hamburger" onClick={this.voteFormToggle}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    );
  }
}

export default App;
