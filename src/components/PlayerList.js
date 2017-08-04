import React, { Component } from 'react';
import * as firebase from 'firebase';
import '../index.js';


class PlayerList extends Component {

  renderPlayerList = (players) => {
    // debugger
    return Object.keys(players).map((playerID) => {
      // this.props.getPlayerVotedId(playerID);
      return (
        <div>
        <p id='hey'>{playerID}</p>
        <li>{players[playerID].alias}</li>
        <button onClick={this.props.getPlayerVotedId}>Vote</button>
        </div>
        // players[playerID].username...
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
        <ul>
          {this.renderPlayerList(this.props.players) }
        </ul>
      </div>
    )
  }
}


export default PlayerList;
