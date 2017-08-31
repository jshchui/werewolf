import React, { Component } from 'react';
import * as firebase from 'firebase';

import '../index.js';

class ChatRoom extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      message: '',
      messages: [],
      users: ''
    }

    this.updateMessage = this.updateMessage.bind(this);
    this.submitMessage = this.submitMessage.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
  }

  componentDidMount() {
    firebase.database().ref().child('messages/').on('value', (snapshot)=> {
      const currentMessages = snapshot.val()
      const elem = document.getElementById('chatRoom-container');

      if(currentMessages != null) {
        this.setState({
          messages: currentMessages
        })
      }

      elem.scrollTop = elem.scrollHeight;
    })



    firebase.database().ref().child('game-settings').child('gameState').on('value', (snapshot) => {
      const gameSettings = snapshot.val()
      // TO DO, its not clearing
      if(gameSettings === "all-ready") {
        console.log(this.state.messages)
        console.log('all ready, setting messages to be empty')
        this.setState({
          messages: []
        })
      }
    })

  }

  updateMessage(event) {
    const elem = document.getElementById('chatRoom-container');

    this.setState({
      message: event.target.value
    })

    elem.scrollTop = elem.scrollHeight;
  }

  // I need to get users in here
  submitMessage(event) {
    // console.log('submitMessage: ' + this.state.message);
    if(this.state.message.length > 0) {
      const nextMessage = {
        id: this.state.messages.length,
        text: this.state.message,
        player: this.props.player,
        playerId: this.props.playerId
      }

      firebase.database().ref().child('messages/'+nextMessage.id).set(nextMessage)
    }
  }

  onFormSubmit(event) {
    event.preventDefault();

    if(this.state.message.length > 0) {
      const elem = document.getElementById('chatRoom-container');
      elem.scrollTop = elem.scrollHeight;
      document.getElementById('form').reset();
      this.setState({message: ''})
    }
  }

  renderPlayerList(players) {
    return Object.keys(players).map(playerID => <li>{players[playerID].alias}</li>)
  }

  render() {
    let lastMessageId = null;

    const currentMessage = this.state.messages.map((message, i) => {
      if(message.playerId === this.props.playerId) {
        if(lastMessageId === message.playerId) {
          lastMessageId = message.playerId;
          return (
            <div className="single-message-self">
              <div className="single-message-container cancel-margin">
                <p key={message.id}>
                  {message.text}
                </p>
              </div>
            </div>
          )
        } else {
          lastMessageId = message.playerId;
          return (
            <div>
              <div className="single-message-self">
                <div className="single-message-container">
                  <h3 className="user-name-you">{ message.player }: </h3>
                  <p key={message.id}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )
        }
      } else {
        if(lastMessageId === message.playerId) {
          lastMessageId = message.playerId;
          return (
            <div key={i} className="single-message">
              <div className="single-message-container cancel-margin">
                <p key={message.id}>
                  {message.text}
                </p>
              </div>
            </div>
          )
        } else {
          lastMessageId = message.playerId;
          return (
            <div key={i}>
              <div className="single-message new-user-spacing">
                <div className="single-message-container">
                  <h3 className="user-name">{ message.player }: </h3>
                  <p key={message.id}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )
        }
      }
    })

    const chatPlaceholder = `Write a message here ${this.props.playerName}`

    return (
      <div id="chatRoom-container">
        <div className="chatRoom-inner-container">
          <ol className="message-submitted">
            {currentMessage}
          </ol>
          <form className="message-form" id='form' onSubmit={this.onFormSubmit}>
            <input className="message-input" onChange={this.updateMessage} type="text" placeholder={chatPlaceholder} />
            <button className="message-submit" onClick={this.submitMessage}>Submit</button>
          </form>
        </div>
      </div>
    )
  }
}

export default ChatRoom;
