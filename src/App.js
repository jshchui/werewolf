import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';
import './index.js';
import ChatRoom from './components/ChatRoom';
import PlayerList from './components/PlayerList';
import Role from './components/Role';

import moon from './pictures/moon.png';
import sun from './pictures/sun.png';
import wolf_white from './pictures/wolf_white.png';
import wolf_line from './pictures/wolf_line.png';
import wolf_line_grey from './pictures/wolf_line_grey.png';
import seer from './pictures/seer.png'
import death from './pictures/death2.png'
import villager from './pictures/villager.png'



class App extends Component {

  constructor() {
    super(); //i deleted props

    this.state = {
      players: {},
      alias: '',
      gameStatus: 'unready',
      gameTitle: 'No game has started',
      thisplayerID: null,
      thisplayerRole: null,
      selectedOption: null,
      inspected: null,
      amIAlive: null,
      nightTime: true,
      endTime: null,
      timerInterval: null,
      countDown: 0
    };

  }

  setupGame() {
    const id = Math.floor(Date.now()).toString();
    const alias = this.state.alias || `Person ${id.toString().slice(-2)}`;

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
        gameStatus: gameSettings.gameState,
        gameTitle: gameSettings.stateTitle
      })

      this.countDownTimer();


      if(lastGameState !== gameSettings.gameState) {
        presenceRef.child(id).once('value', snap => {
          const thisPlayer = snap.val()


          if(gameSettings.gameState === "all-ready") {
            this.formHide('you-are-dead')
            this.formShow('starting-turn')
            console.log('reset');
            presenceRef.child(id).update({
              isAlive: true,
              ready: false,
              votes: 0
            })

            this.setState({
              nightTime : true
            })
          }

          if(gameSettings.gameState === "Werewolf-Phase" && thisPlayer.isAlive ) {
            this.formHide('death-alert');
            this.formHide('starting-turn')
            if(thisPlayer.role === 'Werewolf') {
              this.formShow('voting-form-outer');
            } else {
              console.log('werewolves-turn show')
              this.formShow('werewolf-turn');
            }
          } else if (gameSettings.gameState === "Seer-Phase" && thisPlayer.isAlive) {
            this.formHide('werewolf-turn');
            this.formHide('starting-turn');

            if(thisPlayer.role === 'Seer') {
              this.formShow('seer-form-outer');
            } else {
              this.formShow('seer-turn')
            }
          } else if (gameSettings.gameState === "Night-Death-Phase") {
            this.formShow('death-alert');
            this.formHide('seer-form-outer');
            this.formHide('voting-form-outer');
            this.formHide('seer-turn')
            this.formHide('werewolf-turn')
            this.formHide('starting-turn');

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
            this.clearThisPlayerAction(presenceRef);

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
            this.formHide('seer-turn');
            this.formHide('werewolf-turn');

            this.checkDeath();

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

  componentWillMount() {
    document.addEventListener("keydown", this.onKeyDown);
  }

  componentDidMount() {
  }// end of component did mount

  formShow = (form) => {
    let formStatus = document.getElementById(form);
    console.log('showing forms');
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

    //Voting options hiding dont delete =========================================
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
    }, 13000)
    // ===========================================================================
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
    let playerID = this.state.selectedOption;

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

  //RenderDeadPlayers Goes here
  renderDeadPlayers = (players) => {
    return Object.keys(players).reduce((deadPlayers, playerID) => {
      if(this.state.players[playerID].isAlive === 'recentlyDead') {
        return [...deadPlayers,
          <div>
            <h3>{this.state.players[playerID].alias} was found dead on the floor</h3>
            <p>{this.state.players[playerID].alias} was a {this.state.players[playerID].role}</p>
          </div>
        ]
      } else {
        return deadPlayers
      }
    }, [])
  }


  voteFormToggle = () => {
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
    let endTime = typeof(this.state.endTime) != 'undefined' ? this.state.endTime : 0

    let countDownAmount = endTime - Date.now();
    let currentCount = Math.floor(countDownAmount / 1000);

    // if (isNaN(currentCount)) {
    //   debugger
    // }

    this.setState({
      countDown: currentCount
    })
    let int = setInterval(() => {
      if(currentCount > 0) {
        currentCount -= 1;

        this.setState({
          countDown: currentCount
        })
      } else {
        this.clearCountDownInterval()
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

  setName =(event) => {
    event.preventDefault();
    document.getElementById('name-form-screen').style.display = 'none';
    this.setupGame()
  }

  handleChange = (event) => {
    this.setState({alias: event.target.value})
  }

  forcePhaseChange = () => {
    // if(this.state.alias.length === 10) {
      firebase.database().ref().child('game-settings').child('gameState').set('skipToNextPhase');
    // }
  }

  checkDeath = () => {
    console.log('checkDeath Ran');
    if(this.state.amIAlive !== true) {
      console.log('show dead screen');
      this.formShow('you-are-dead')
    } else {
      console.log('No dead Sscreen')
      this.formHide('you-are-dead')
    }
  }

  onKeyDown = (event) => {
    console.log('pressing')
    if(event.key == 'Escape') {
      console.log('forcingphasechange')
      this.forcePhaseChange()
    }
  }




  render() {
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

    let roleDisplay ;
    if(this.state.thisplayerRole === 'Werewolf') {
      roleDisplay =
      <div>
        <img className='wolf_picture' src={wolf_line} alt='sun' />
        <h2>You are a Werewolf</h2>
        <h3>Kill a player every night, eliminate all the villagers</h3>
      </div>
    } else if (this.state.thisplayerRole === 'Seer') {
      roleDisplay =
          <div>
            <img className='seer_picture' src={seer} alt='sun' />
            <h2>You are the Seer</h2>
            <h3>Inspect a player every night, eliminate all the werewolves</h3>
          </div>
    } else if (this.state.thisplayerRole === 'Villager'){
      roleDisplay =
      <div>
        <img className='wolf_picture' src={villager} alt='sun' />
        <h2>You are a Villager</h2>
        <h3>Eliminate all the werewolves</h3>
      </div>
    } else {
      roleDisplay =
      <div>
        <h2>Selecting your role</h2>
      </div>
    }
    return (
      <div className="App" onKeyDown={this.onKeyDown}>
        <div id="overlapping-components">

          <div id="you-are-dead">
            <div id="you-are-dead-box">
              <img className='wolf_picture' src={death} alt='sun' />

              <h2>You are dead</h2>
            </div>
          </div>

          <div id="name-form-screen">
            <img className='wolf_picture' src={wolf_line_grey} alt='wolf' />
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
              <h2>Choose a player to kill</h2>
              <div>
                {votingPlayers}
              </div>
              {killBut}
            </form>

          </div>

          <div id="seer-form-outer">
            <form id="seerform" onSubmit={this.inspect}>
              <h2>Choose a player to inspect</h2>
              <div>
                {votingPlayers}
              </div>
              {inspectBut}
              {InspectedPlayer}
            </form>
          </div>

          <div id="death-alert">
            <div id="death-alert-box">
              <h2>{this.renderDeadPlayers(this.state.players).length > 0 ? this.renderDeadPlayers(this.state.players) : 'Nobody died this round!' }</h2>
            </div>
          </div>


          <div id="lynch-form-outer">
            {this.renderVotesOnPlayers(this.state.players, 'lynch')}
            <form id="lynchform" onSubmit={this.setVote}>
              <h2>Who should get hanged?</h2>
              <div>
                {votingPlayers}
              </div>
              {lynchBut}
            </form>
          </div>

          <div id="werewolf-turn">
            <div id="werewolf-turn-box">
              <h2>The werewolves are lurking...</h2>
            </div>
          </div>

          <div id="seer-turn">
            <div id="seer-turn-box">
              <h2>The seer is probing...</h2>
            </div>
          </div>

          <div id='starting-turn'>
            <div id='starting-turn-box'>
              {roleDisplay}
            </div>
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


          {sunOrMoon}

          <span id='timer'>{(this.state.countDown >= 0) ? this.state.countDown : 0}</span>
          <h2 id='phase-shower'>{this.state.gameTitle}</h2>
        </div>
        <div className="show" id="player-list">
          <PlayerList players={this.state.players} setVote={this.votedPlayerID} thisPlayer={this.state.thisplayerID}/>

          <div className="ready-role">
            <p>Your Name: {this.state.alias}</p>
            <h3>Role: {this.state.thisplayerRole}</h3>

            <Role onReadyUp={()=>this.onReadyUp(this.state.players)} />
          </div>
        </div>

        <ChatRoom player={this.state.alias} playerId={this.state.thisplayerID} />
      </div>
    );
  }
}

export default App;
