import React, { Component } from 'react';
import * as firebase from 'firebase';
import '../index.js';


class PlayerList extends Component {

  renderPlayerList = (players, thisPlayer) => {
    // If the player is you, highlight yourself
    return Object.keys(players).map((playerID, index) => {
      if(players[playerID].isAlive !== false) {
        if(playerID === thisPlayer) {
          if(players[thisPlayer].ready) {
            return (
              <div className="playersInList highlight ready-highlight" key={index}>
                <li>{players[playerID].alias}</li>
              </div>
            )
          } else {
            return (
              <div className="playersInList highlight" key={index}>
                <li>{players[playerID].alias}</li>
              </div>
            )
          }
        } else {
          if(players[playerID].ready) {
            return (
              <div className="playersInList ready-highlight" key={index}>
                <li>{players[playerID].alias}</li>
              </div>
            )
          } else {
            return (
              <div className="playersInList" key={index}>
                {/* <p id='hey'>{playerID}</p> */}
                <li>{players[playerID].alias}</li>
                {/* <button onClick={this.props.getPlayerVotedId}>Vote</button> */}
              </div>
              // players[playerID].username...
            )
          }
        }
      }
    })
  }

  //if player is dead, render here instead
  renderDeadPlayerList = (players, thisPlayer) => {
    return Object.keys(players).map((playerID, index) => {
      if(players[playerID].isAlive == false) {
        if(playerID == thisPlayer) {
          return (
            <div className="playersInList highlight" key={index}>
              <li>{players[playerID].alias}</li>
            </div>
          )
        } else {
          return (
            <div className="playersInList" key={index}>
              <li>{players[playerID].alias}</li>
            </div>
          )
        }
      }
    })
  }


  render() {

    // renderTopics: function() {
    //   retu (zrn this.state.players.map((player, i) => {
    //     return (<li>{player.id}</li>)
    //   });
    // }
    return (
      <div id="alive-player-list">
        <h2>ALIVE</h2>
        <ul>
          {this.renderPlayerList(this.props.players, this.props.thisPlayer) }
        </ul>

        <h2>DEAD</h2>
        <ul>
          {this.renderDeadPlayerList(this.props.players, this.props.thisPlayer) }
        </ul>
      </div>
    )
  }
}


export default PlayerList;
