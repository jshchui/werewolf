const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let lastGameState;
let nextGameState;
let interval;
let werewolfTurn = false;
// exports.startCycle = functions.database.ref('game-settings').onUpdate((event) => {
//   let cycleLoop;
//   // if game setting was returned TRUE, THEN RUN BELOW
//   if (event.data.val().started) {
//     // set up your game ONCE here
    // const cycle = {
    //   cycleStart: Date.now(),
    //   cycleEnd: Date.now() + (3 * 1000),
    //   cycle: 'night'
    // };
//
//     // cycles through different states
//     const cycleMap = {
//       'night' : 'day',
//       // 'deaths' : 'day',
//       'day' : 'night'
//     }
//     // collect vote during night,
//     // on death , count votes, set dead on presence, clear votes.
//     // update cycle every 3 seconds
//     return event.data.ref.parent.child('presence').database.ref('/').child('react').update(cycle).then(() => {
//       cycleLoop = setInterval(() => {
//         console.log(new Date());
//         return event.data.ref.parent.child('game-settings').once('value').then((snap) => {
//           if (snap.val().started) {
//             event.data.ref.parent.child('presence').database.ref('/').child('react').once('value').then((newSnap) => {
//               const currentCycle = newSnap.val().cycle;
//               // UPDATE YOUR GAME EVERY CYCLE HERE
//               const newCycle = {
//                 cycleStart: Date.now(),
//                 cycleEnd: Date.now() + (3 * 1000),
//                 cycle: cycleMap[currentCycle]
//               };
//               updateCycle(newCycle);
//             });
//           } else {
//             return clearInterval(cycleLoop);
//           }
//         });
//       }, 3 * 1000);
//
//       function updateCycle(newCycle) {
//         return event.data.ref.parent.child('presence').database.ref('/').child('react').update(newCycle);
//       }
//
//       // cycle: 'night' ? 'day' : 'night'
//       // isBlack ? {isHidden ? : 'foo' : 'bar '} : 'baz';
//
//       // var i = 0, times = 10;
//       // function f() {
//       //   console.log(Date.now())
//       //     event.data.ref.parent.child('game-settings').once('value').then((snap) => {
//       //       if (snap.val().started) {
//       //         event.data.ref.parent.child('presence').database.ref('/').child('react').once('value').then((newSnap) => {
//       //           const currentCycle = newSnap.val().cycle;
//       //           const newCycle = {
//       //             cylceStart: Date.now(),
//       //             cycleEnd: Date.now() + (3 * 1000),
//       //             cycle: 'night' ? 'day' : 'night'
//       //           };
//       //           updateCycle(newCycle);
//       //         });
//       //       }
//       //     });
//       //
//       //
//       //   i++ ;
//       //   if(i < times) {
//       //     setTimeout( f, 3000);
//       //   }
//       // }
//       //
//       // f();
//     });
//   }
// });

// checks if the presence is deleted then set game stetitng to false
exports.endGame = functions.database.ref('presence').onDelete((event) => {
  return event.data.ref.parent.child('presence').once('value').then((snap) => {

    // console.info('SET FALSE')
    return event.data.ref.parent.child('game-settings').set({
      gameState: "game-ended",
      started: false
    });
  });
});

// checks if all the players are ready, return true is everyone is ready and false if it isn't
exports.startGame = functions.database.ref('presence').onUpdate((event) => {
  return event.data.ref.parent.child('presence').once('value').then((snap) => {
    const allReady = Object.keys(snap.val()).map((playerID) => {
      return snap.val()[playerID].ready;
    }).indexOf(false) === -1;
    // console.log(event.data.ref.parent.child('game-settings').gameState)

    event.data.ref.parent.child('game-settings').child('gameState').once('value', snap => {
      const gameState = snap.val();
      if (allReady && (gameState == 'game-ended' || 'villagers-win' || 'werewolves-win')) {
        clearInterval(interval)
        return event.data.ref.parent.child('game-settings').set({
          gameState: "all-ready",
        });
      // } else if (gameState == 'skipToNextPhase') {
      //   clearInterval(interval)
      //   return event.data.ref.parent.child('game-settings').set({
      //     gameState: nextGameState
      //   })
      } else {
        return null;
      }
    })

  });
});


exports.gameStateListener = functions.database.ref('game-settings').onUpdate((event) => {
  const gameSettings = event.data.val()
  const gameSettingsFirebaseObject = event.data.ref.parent.child('game-settings')
  const playerSettingsFirebaseObject = event.data.ref.parent.child('presence')

  if(lastGameState != gameSettings.gameState) {
    // if(gameSettings.gameState !== "game-ended" || "werewolves-win" || "villagers-win") {
      switch(gameSettings.gameState) {
        case "all-ready":
          assignRole(playerSettingsFirebaseObject)
          countDownInterval(gameSettingsFirebaseObject, 'Werewolf-Phase', 14)
          // clearMessages(event.data.ref.parent.child('messages'))
          break;
        case "Werewolf-Phase":
          // checkWinCondition(playerSettingsFirebaseObject, gameSettingsFirebaseObject)
          setIsAliveFalse(playerSettingsFirebaseObject);
          countDownInterval(gameSettingsFirebaseObject, 'Seer-Phase', 16)
          werewolfTurn = true;
          break;
        case "Seer-Phase":
          countDownInterval(gameSettingsFirebaseObject, 'Night-Death-Phase', 16)
          break;
        case "Night-Death-Phase":
          killMostVotedPlayer(playerSettingsFirebaseObject, gameSettingsFirebaseObject)
          countDownInterval(gameSettingsFirebaseObject, 'Day-Phase', 12)
          break;
        case "Day-Phase":
          setIsAliveFalse(playerSettingsFirebaseObject);
          countDownInterval(gameSettingsFirebaseObject, 'Lynch-Phase', 180)
          werewolfTurn = false
          break;
        case "Lynch-Phase":
          countDownInterval(gameSettingsFirebaseObject, 'Day-Death-Phase', 23)
          break;
        case "Day-Death-Phase":
          killMostVotedPlayer(playerSettingsFirebaseObject)
          // countDownInterval(gameSettingsFirebaseObject, 'Werewolf-Phase', 5)
          countDownInterval(gameSettingsFirebaseObject, 'Check-Win', 12)
          break;
        case "Check-Win":
          checkWinCondition(playerSettingsFirebaseObject, gameSettingsFirebaseObject, 'Werewolf-Phase')
          // countDownInterval(gameSettingsFirebaseObject, 'Werewolf-Phase', 0.5)
          // skipPhase(gameSettingsFirebaseObject, 'Werewolf-Phase')
          break;
        case "skipToNextPhase":
          // countDownInterval(gameSettingsFirebaseObject, nextGameState, 0.5)
          skipPhase(gameSettingsFirebaseObject, nextGameState)
          break;
      }
      lastGameState = gameSettings.gameState
    // }
  }
})

// // Kill switch check EVERY SECOND
// const countDownInterval = (gameSettings, nextState, countDownTime) => {
//   let currentCountdown = countDownTime
//   let currentGameState = null;
//   const int = setInterval(() => {
//     gameSettings.child('gameState').once('value', snap => {
//       currentGameState = snap.val();
//       if(currentCountdown > 0 && currentGameState != 'game-ended') {
//         currentCountdown -= 1;
//         gameSettings.child('currentCounter').set(currentCountdown)
//       } else {
//         if(currentGameState != "game-ended") {
//           gameSettings.set({
//             gameState: nextState,
//             currentCounter: null
//           })
//         }
//         return clearInterval(int)
//       }
//     })
//   }, 1000)
// }

const skipPhase = (gameSettings, nextState) => {
  clearInterval(interval)
  nextGameState = nextState;
  // gameSettings.child('gameState').once('value', snap => {
  gameSettings.set({
    gameState: nextGameState
  })
  // })
}

const clearMessages = (messagesRef) => {
  messagesRef.remove()
}

// kill switch check at end of countdown
const countDownInterval = (gameSettings, nextState, countDownTime) => {
  clearInterval(interval)
  let endTime = Date.now() + (countDownTime * 1000)
  let currentCountdown = countDownTime
  let currentGameState = null;
  nextGameState = nextState;

  gameSettings.child('endTime').set(endTime)

  interval = setInterval(() => {
    if(currentCountdown > 0) {
      currentCountdown -= 1;
    } else {
      gameSettings.child('gameState').once('value', snap => {
        currentGameState = snap.val();
        if(currentGameState != "game-ended") {
          gameSettings.set({
            gameState: nextGameState
          })
        }
      })
      return clearInterval(interval)
    }
  }, 1000)
}

const killMostVotedPlayer = (playerSettingsFirebaseObject, gameSettingsFirebaseObject) => {
  let mostVotedPlayer = 0;
  let mostVotes = 0;
  let votesTied = false;
  let werewolvesTurn = false;

  // gameSettingsFirebaseObject.once('value', snap=> {
  //   gameSettings = snap.val()
  //
  //   if (gameSettings.gameState === 'Werewolf-Phase') {
  //     werewolvesTurn = true;
  //   }
  // })

  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()
    Object.keys(players).map((playerID) => {
      if(players[playerID].votes > mostVotes) {
        mostVotes = players[playerID].votes
        mostVotedPlayer = playerID
        votesTied = false;
      } else if (players[playerID].votes === mostVotes && werewolfTurn === false) {
        votesTied = true;
      }
    })

    if(mostVotedPlayer !== 0 && votesTied === false) {
      playerSettingsFirebaseObject.child(mostVotedPlayer).child('isAlive').set('recentlyDead');
      // playerSettingsFirebaseObject.child(mostVotedPlayer).child('votes').set(0);
      Object.keys(players).map((playerID) => {
        playerSettingsFirebaseObject.child(playerID).child('votes').set(0);
      })
    }
  })
}

const setIsAliveFalse = (playerSettingsFirebaseObject) => {
  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()
    Object.keys(players).map((playerID) => {
      if(players[playerID].isAlive == 'recentlyDead') {
        playerSettingsFirebaseObject.child(playerID).child('isAlive').set(false);
      }
    })
  })
}

const assignRole = (playerSettingsFirebaseObject) => {
  const Roster = []

  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()
    let numPlayers = Object.keys(players).length;

    let werewolves, seer, villagers = 0;
    if(numPlayers > 5) {
      werewolves = Math.floor(Math.sqrt(numPlayers));
      seer = 1;
      villagers = numPlayers - (werewolves + seer);
    } else if(numPlayers == 5) {
      werewolves = 1;
      seer = 1;
      villagers = 3;
    } else if(numPlayers == 4) {
      werewolves = 1
      seer = 1;
      villagers = 2;
    } else if(numPlayers == 3) {
      werewolves = 1;
      seer = 1
      villagers = 1;
    } else if(numPlayers == 2) {
      seer = 1;
      werewolves = 1;
    } else if(numPlayers == 1) {
      seer = 1;
    }

    //Pushing the roles in Roster
    for(let i=0; i<werewolves; i++) {
      Roster.push('Werewolf')
    }

    for(let i=0; i<seer; i++) {
      Roster.push('Seer')
    }

    for(let i=0; i<villagers; i++) {
      Roster.push('Villager')
    }

    Object.keys(players).map((playerID) => {
      let randomNumber = Math.floor(Math.random() * Roster.length)
      let selectFromRoster = Roster[randomNumber]
      Roster.splice(randomNumber, 1);
      playerSettingsFirebaseObject.child(playerID).child('role').set(selectFromRoster);
    })
  })
}

const checkWinCondition = (playerSettingsFirebaseObject, gameSettingsFirebaseObject, nextState) => {
  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()

    let werewolves = 0;
    let villagers = 0;
    Object.keys(players).map((playerID) => {
      if(players[playerID].isAlive === true) {
        if(players[playerID].role == 'Werewolf') {
          werewolves += 1;
        } else {
          villagers += 1;
        }
      }
    })

    if(werewolves >= villagers) {
      gameSettingsFirebaseObject.child('gameState').set('werewolves-win');
    } else if (werewolves <= 0) {
      gameSettingsFirebaseObject.child('gameState').set('villagers-win');
    } else {
      console.log('The game continues')
    }
  })

  gameSettingsFirebaseObject.child('gameState').once('value', snap=> {
    let currentGameState = snap.val()
    if(currentGameState != "game-ended" && currentGameState != "werewolves-win" && currentGameState != "villagers-win") {
      gameSettings.set({
        gameState: nextState
      })
    }
  })
}
