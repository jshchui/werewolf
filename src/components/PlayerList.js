import React, { Component } from 'react';
import * as firebase from 'firebase';
import '../index.js';


class PlayerList extends Component {

  renderPlayerList = (players) => {
    // console.log(players)
    // debugger
    return Object.keys(players).map((playerID) => {
      return (
        <li>{players[playerID].alias} <button onClick={this.props.doSomething}></button></li> // players[playerID].username...
      )
    })
  }

  render() {

    // renderTopics: function() {
    //   retu (zrn this.state.players.map((player, i) => {
    //     return (<li>{player.id}</li>)
    //   });
    // }
    return (
      <div>
        <h2>PlayerList is Here</h2>
        <ol>
          { this.renderPlayerList(this.props.players) }
        </ol>
      </div>
    )
  }
}


export default PlayerList;
