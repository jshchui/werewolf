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
      time: {},
      seconds: 4,
      currentTime: 10
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

    //if gameStateRef on FIREBASE is true, set gameStatus state to ready
    gameStateRef.on('value', snap => {
      if(snap.val() == true) {
        this.setState({
          gameStatus: 'ready'
        })
      };

      //select from roster and gives the player the role from roster
      if(snap.val() == 'begin') {
        var Roster = ['Villager', 'Werewolf', 'Seer'];
        var Role = Roster[Math.floor(Math.random()*3)];
        this.setState({
          thisplayerRole: Role
        });
        this.props.firebaseService.setPlayerRole(this.state.thisplayerID, Role);
      };

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
    firebase.database().ref().child('react').child('currentTime').set(this.state.currentTime);
  }


  countDown() {
    // let currentTime = firebase.database().ref().child('react')
    // .child('currentTime').once('value').then((snap) => {
    //   console.log(snap.val());
    //   return snap.val();
    // });

    // let timeRef = firebase.database().ref().child('react').child('currentTime');
    // let currentTime = timeRef.on('value', function(snapshot) {
    //   // console.log(snapshot.val() - 1);
    //   const time = snapshot.val();
    //   let timeMinus1 = snapshot.val() - 1;
    //   return time;
    // });

    let timeRef = firebase.database().ref().child('react').child('currentTime');
    let currentTime;
    let databaseTime = timeRef.on('value', function(snapshot) {
      currentTime = snapshot.val();
      return null;
    });

    let minusOne = currentTime - 1;


    console.log(minusOne);
    if(minusOne >= 0) {

      timeRef.set(minusOne);
    }

    this.setState({
      time: this.secondsToTime(currentTime),
      // seconds: seconds
      currentTime: minusOne
    });



    // let currentTimeMinusOne = currentTime - 1;
    // currentTime.set(currentTime);
    // console.log(currentTimeMinusOne);
    // let seconds = this.state.seconds - 1;

    if (currentTime == 0) {
      clearInterval(this.timer);
    }
  }


  componentDidUpdate() {
    //Once status is true from the react true data, give out role
    // if(this.state.gameStatus == 'ready') {
    //   var Roster = ['Villager', 'Werewolf', 'Seer']
    //   var Role = Roster[Math.floor(Math.random()*3)];
    //
    //   // This is not updateing the state, its not working!!!
    //   this.setState({
    //     thisplayerRole: Role,
    //     gameStatus: 'begin'
    //   });
    //   console.log(Role);
    //   console.log(this.state.thisplayerRole);
    //   // TODO: WHY DOESN"T this.state.thisplayerRole work here
    //   console.log(this.state.gameStatus);
    //   firebase.database().ref().child('presence').child(this.state.thisplayerID).child('role').set(this.state.thisplayerRole);
    // }
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
      // console.log(`Gamestate: ${gameStart}`);
      if(gameStart == true) {
        this.startTimer();
        //once everyone is ready, start timer and set react gameState data to true
        //which also sets gamesState state to begin
        setTimeout(() => {
          //refactor this later to firebaseService
          firebase.database().ref().child('react').child('gameState').set('begin');
        }, this.state.currentTime * 1000 + 1000);

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
    // console.log(this.state.thisplayerRole);
    let Timer = null; //Timer is for rendering out the timer below
    // if(this.state.seconds <= 3) {
      // Timer = <h3> Game Starting in: {this.state.time.s} </h3>;
      Timer = <h3> Game Starting in: {this.state.currentTime} </h3>;
    // } else {
      // Timer = null;
    // }

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
