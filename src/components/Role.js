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
    // const playerID = event.target.value;
    this.setState({
      ready: 'true'
    })
    console.log(this.props.playerID);
    firebase.database().ref().child('presence').child(this.props.playerID).child('ready').set(true);
  }


  render() {
    return (
      <div>
        <h3>Readyness: {this.state.ready}</h3>
        <button onClick={this.readyUp}>Ready</button>
      </div>
    )
  }


}

export default Role;
