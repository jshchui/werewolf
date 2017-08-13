import React, { Component } from 'react';
import * as firebase from 'firebase';

import '../index.js';

class ChatRoom extends Component {

  constructor(props, context) {
    super(props, context);
    this.updateMessage = this.updateMessage.bind(this);
    this.submitMessage = this.submitMessage.bind(this);
    this.state = {
      message: '',
      messages: [
        //Messages will be stored here
      ],
      users: ''
    }
  }


  componentDidMount() {
    // console.log('componentDidMount');
    firebase.database().ref().child('messages/').on('value', (snapshot)=> {

      const currentMessages = snapshot.val()

      if(currentMessages != null) {
        this.setState({
          messages: currentMessages
        })
      }
    })

    //Here i am trying to get the name to show for messages
    // const id = Math.floor(Date.now()).toString();
    //
    // firebase.database().ref().child('presence').child(id).child('alias').on('value', (snapshot) => {
    //   const currentAlias = snapshot.val()
    //
    //   if(currentAlias != null) {
    //     this.setState({
    //       users: currentAlias
    //     })
    //   }
    // })
  }

  updateMessage(event) {
    // console.log('updateMessage:' + event.target.value)
    this.setState({
      message: event.target.value
    })
  }

// I need to get users in here
  submitMessage(event) {
    // console.log('submitMessage: ' + this.state.message);
    const nextMessage = {
      id: this.state.messages.length,
      text: this.state.message,
      player: this.props.player,
      playerId: this.props.playerId
    }

    firebase.database().ref().child('messages/'+nextMessage.id).set(nextMessage)

    // var list = Object.assign([], this.state.messages)
    // list.push(nextMessage)
    // this.setState({
    //   message: ' ',
    //   messages: list
    // })

    console.log('i am submitting');
  }

  onFormSubmit(event) {
    event.preventDefault();

    document.getElementById('form').reset(); // is this the correct way?
  }

  renderPlayerList(players) {
    return Object.keys(players).map((playerID) => {
      return (
        <li>{players[playerID].alias}</li> // players[playerID].username...
      )
    })

  }

  render() {
    const currentMessage = this.state.messages.map((message, i) => {
      return (
        <div className="single-message">
          <div className="single-message-container">
            <p className="user-name">{ message.player }: </p>
            <p key={message.id}>
            {message.text}
            </p>
          </div>
        </div>
      )
    })

    return (
      <div className="chatRoom-inner-container">
        <ol className="message-submitted">
          {currentMessage}
        </ol>
        <form className="message-form" id='form' onSubmit={this.onFormSubmit}>
          <input className="message-input" onChange={this.updateMessage} type="text" placeholder="Message" />
          <button className="message-submit" onClick={this.submitMessage}>Submit Message</button>
        </form>
      </div>
    )
  }
}

// console.log('chatroom-connected');

export default ChatRoom;
