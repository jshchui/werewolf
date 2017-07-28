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
      thisplayerRole: '',
      time: {},
      seconds: 4
    };

    this.timer = 0;
    this.startTimer = this.startTimer.bind(this);
    this.countDown = this.countDown.bind(this);
  }

  secondsToTime(secs){
    let divisor_for_minutes = secs % (60 * 60);
    let minutes = Math.floor(divisor_for_minutes / 60);
    let divisor_for_seconds = divisor_for_minutes % 60;
    let seconds = Math.ceil(divisor_for_seconds);

    let obj = {
      "s": seconds
    };
    return obj;
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

    let timeLeftVar = this.secondsToTime(this.state.seconds);
    this.setState({ time: timeLeftVar })
  }

  startTimer() {
    if(this.timer == 0) {
      this.timer = setInterval(this.countDown, 1000);
    }
  }

  countDown() {
    let seconds = this.state.seconds - 1;
    this.setState({
      time: this.secondsToTime(seconds),
      seconds: seconds
    });

    if (seconds == 0) {
      clearInterval(this.timer);
    }
  }


  componentDidUpdate() {
    //Once status is true from the react true data, give out role
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
    this.props.firebaseService.checkReady(this.state.thisplayerID).then(
      (gameStart) => {
      console.log(`Gamestate: ${gameStart}`);
      if(gameStart == true) {
        this.startTimer();
        //once everyone is ready, start timer and set react gameState data to true
        //which also sets gamesState state to begin
        setTimeout(() => {
          firebase.database().ref().child('react').child('gameState').set(true);
        }, this.state.seconds * 1000);

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

  // <button onClick={this.startTimer}>Start</button>

  render() {
    // const gameStatus = firebase.database().ref().child('react').child('gameState');
    console.log(this.state.seconds);
    let Timer = null;
    if(this.state.seconds <= 3) {
      console.log('Timer True');
      Timer = <h3> Game Starting in: {this.state.time.s} </h3>;
    } else {
      console.log('Timer null');
      Timer = null;
    }

    return (
      <div className="App">
        <div className="player-list">
          <PlayerList players={this.state.players} doSomething={this.doSomething} />
          <div>
            {Timer}
          </div>
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
