import React, { Component } from 'react';
import * as firebase from 'firebase';

import '../index.js';

class Role extends Component {
  constructor(props, context) {
    super(props, context);
    this.readyUp = this.readyUp.bind(this);
    this.state = {
      ready: 'false'
    }
  }


  readyUp(event) {
    this.setState({
      ready: 'true'
    });

    // THIS IS HOW YOU ADD FUNCtion VALUE TO  this.props.firebaseService.loopThroughPlayers(this.props.playerID).then((players) => {
    //   console.log(players);
    // });

    // firebase.database().ref().child('presence').child(this.props.playerID).child('ready').set(true);
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

  handleClick() {
    // this.props.loopThroughPlayers();
    this.readyUp();
    this.props.onReadyUp();
  }


  render() {
    return (
      <div>
        <h3>Ready?: {this.state.ready}</h3>
        <button onClick={(e)=> this.handleClick(e)}>Ready</button>
      </div>
    )
  }


}

export default Role;
