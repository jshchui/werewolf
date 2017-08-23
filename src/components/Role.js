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
  }

  handleClick() {
    this.readyUp();
    this.props.onReadyUp();
  }


  render() {
    return (
      <div>
        <button className="ready-button" onClick={(e)=> this.handleClick(e)}>Ready</button>
      </div>
    )
  }
}

export default Role;
