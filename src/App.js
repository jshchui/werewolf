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
      // time: {},
      // seconds: 4,
      // currentTime: 8
    };

    // this.timer = 0;
    // this.startTimer = this.startTimer.bind(this);
    // this.countDown = this.countDown.bind(this);
  }

  // secondsToTime(secs){
  //   let divisor_for_minutes = secs % (60 * 60);
  //   let minutes = Math.floor(divisor_for_minutes / 60);
  //   let divisor_for_seconds = divisor_for_minutes % 60;
  //   let seconds = Math.ceil(divisor_for_seconds);
  //
  //   let obj = {
  //     "s": seconds
  //   };
  //   return obj;
  // }

  componentDidMount() {
    const alias = prompt('What is your alias');
    const id = Math.floor(Date.now()).toString();

    const rootRef = firebase.database().ref();
    const presenceRef = rootRef.child('presence');
    const gameStateRef = rootRef.child('react').child('gameState');
    const reactdbStateRef = rootRef.child('react');
    // checks the cycle
    const cycleStateRef = rootRef.child('react').child('cycle');
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

    cycleStateRef.on('value', snap => {
      this.setState({
        gameStatus: snap.val() == 'night' ? 'night' : 'day'
      })
      // if(snap.val() == 'night') {
      //   this.setState({
      //     gameStatus: 'night'
      //   });
      // };
      //
      // if(snap.val() =='day') {
      //   this.setState({
      //     gameStatus: 'day'
      //   });
      // }
    })

    // reactdbStateRef.on('value', (snap) => {
    //   const gameStatus = snap.val();
    //
    //   let time = gameStatus.cycleEnd - gameStatus.cycleStart;
    //   console.log(gameStatus.cycleEnd);
    //   console.log(gameStatus.cycleStart);
    // })


    // reactdbStateRef.on('value', (snap) => {
    //   const gameStatus = snap.val();
    //
    //   if (gameStatus.cycle !== this.state.cycle) {
    //     const int = setInterval(() => {
    //       let count = 4;
    //       if (count > 0) {
    //         count = count - 1;
    //         console.log(count);
    //         this.setState({
    //           countDown: count
    //         });
    //       } else {
    //         return clearInterval(int);
    //       }
    //     }, 1000)
    //   }
    //
    //   // this.setState({
    //   //   gameStatus: gameStatus
    //   // })
    // });


  // .child('react').on('value', function(snap) => {
  //   const gameStatus = snap.val()
  //
  //   if (gameStatus.cycle !== this.state.cycle) {
  //     const int = setInterval(() => {
  //       let count = 11;
  //       if (count > 0) {
  //         this.setState({
  //           countDown: count -= 1
  //         });
  //       } else {
  //         return clearInterval(int);
  //       }
  //     }, 1000)
  //   }
  //
  //   this.setState({
  //     gameStatus
  //   });
  // })
  //
  //
  // {this.state.cycle}


    //if gameStateRef on FIREBASE is true, set gameStatus state to ready
    // gameStateRef.on('value', snap => {
      // this is useless delete later;
      // if(snap.val() == true) {
      //   this.setState({
      //     gameStatus: 'ready'
      //   })
      // };
      //
      // // COUNT DOWN BEGIN
      // if (snap.val() == 'countdown') {
      //   this.startTimer();
      //   setTimeout(() => {
      //     //refactor this later to firebaseService
      //     firebase.database().ref().child('react').child('gameState').set('begin');
      //   }, this.state.currentTime * 1000 + 1000);
      // };
      //
      // //select from roster and gives the player the role from roster
      // if(snap.val() == 'begin') {
      //   var Roster = ['Villager', 'Werewolf', 'Seer'];
      //   var Role = Roster[Math.floor(Math.random()*3)];
      //   this.setState({
      //     thisplayerRole: Role,
      //     currentTime: 8
      //   });
      //   this.props.firebaseService.setPlayerRole(this.state.thisplayerID, Role);
      //
      //   // after giving out roles, set to NIGHTTIME
      //
      //   // Is there a better way to get this value?
      //   let nightStatus;
      //   let nightTrue = gameStateRef.on('value', (snapshot) => {
      //     nightStatus = snapshot.val();
      //     console.log('inside val:' + nightStatus);
      //     return null;
      //   });
      //   // console.log('outside val:' + nightTrue);
      //   // console.log('nightstatus:' + nightStatus);
      //
      //   // if(nightStatus == 'begin') {
      //   // };
      //
      //   gameStateRef.set('night');
      //
      //
      //   // let currentTime;
      //   // let databaseTime = timeRef.on('value', (snapshot) => {
      //   //   currentTime = snapshot.val();
      //   //   return null;
      //   // });
      //
      //   // this.timer = 0;
      //   // this.startTimer();
      // };
      //
      // // IT IS NIGHTTIME
      // if(snap.val() == 'night') {
      //   this.timer = 0;
      //   this.startTimer();
      //   console.log('it is night time');
      //   setTimeout(() => {
      //     //refactor this later to firebaseService
      //     gameStateRef.set('day');
      //   }, this.state.currentTime * 1000 + 1000);
      // };
      //
      // // IT IS DAYTIME
      // if(snap.val() == 'day') {
      //   console.log('its day time');
      // };

    // });


    this.props.firebaseService.displayCurrentUser((currentUsers) => {
      this.setState({
        players: currentUsers,
        thisplayerID: id
      })
    });

    // let timeLeftVar = this.secondsToTime(this.state.seconds);
    // this.setState({ time: timeLeftVar })

  }// end of component did mount

  //
  // startTimer() {
  //
  //   if(this.timer == 0) {
  //     // console.log('timer ran');
  //
  //     this.timer = setInterval(this.countDown, 1000);
  //   }
  //   firebase.database().ref().child('react').child('currentTime').set(this.state.currentTime);
  // }


  // countDown() {
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

    // let timeRef = firebase.database().ref().child('react').child('currentTime');
    // let currentTime;
    // timeRef.on('value', (snapshot) => {
    //   let timeref = snapshot.val()
    //   console.log(timeRef.key);
    // });
    // // why cant you just timeRef.key.val()?
    //
    // let minusOne = currentTime - 1;
    // console.log(minusOne);
    // if(minusOne >= 0) {
    //   timeRef.set(minusOne);
    // };
    //
    // this.setState({
    //   time: this.secondsToTime(currentTime),
    //   // seconds: seconds
    //   currentTime: minusOne
    // });
    //
    // if (currentTime == 0) {
    //   clearInterval(this.timer);
    // }
  // }


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




  // loopThroughPlayers = () => {
    // this.props.firebaseService.setReady(this.state.thisplayerID).then(
      // (gameStart) => {
      // console.log(`Gamestate: ${gameStart}`);
      // if(gameStart == true) {
        // this.startTimer();
        // firebase.database().ref().child('react').child('gameState').set('countdown');
        //once everyone is ready, start timer and set react gameState data to true
        //which also sets gamesState state to begin
        // setTimeout(() => {
        //   //refactor this later to firebaseService
        //   firebase.database().ref().child('react').child('gameState').set('begin');
        // }, this.state.currentTime * 1000 + 1000);

    //   }
    // });
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
  // }

  // <Role playerID={this.state.thisPlayerID} loopThroughPlayers={this.loopThroughPlayers}/>

  // <button onClick={this.startTimer}>Start</button>
  onReadyUp = () => {
    return this.props.firebaseService.setReady(this.state.thisplayerID);
  }

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

    // if( {this.state.gameStatus} == 'day') {
    //   let color = 'lightyellow';
    // } else {
    //   let color = 'lightblue';
    // }

    //  loopThroughPlayers={this.loopThroughPlayers}


    return (
      <div className="App {this.state.gameStatus}">
        {this.state.countDown}
        <div className="player-list">
          <PlayerList players={this.state.players} doSomething={this.doSomething} />
          <div>
            {Timer}
          </div>
          <div className="ready-role">
            <h2>Your role:{this.state.thisplayerRole}</h2>
            <Role onReadyUp={this.onReadyUp} ready={this.ready}/>
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
