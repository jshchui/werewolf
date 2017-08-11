const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let lastGameState;
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

    console.info('SET FALSE')
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
    console.log(event.data.ref.parent.child('game-settings').gameState)

    event.data.ref.parent.child('game-settings').child('gameState').once('value', snap => {
      const gameState = snap.val();
      console.log(gameState);
      if (allReady && gameState == 'game-ended') {
        return event.data.ref.parent.child('game-settings').set({
          // started: allReady
          gameState: "all-ready",
          currentCounter: null
        });
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
    // if(gameSettings.gameState != "game-ended") {
      switch(gameSettings.gameState) {
        case "all-ready":
          assignRole(playerSettingsFirebaseObject)
          countDownInterval(gameSettingsFirebaseObject, 'Werewolf-Phase', 5)
          break;
        case "Werewolf-Phase":
          // checkWinCondition(playerSettingsFirebaseObject, gameSettingsFirebaseObject)
          setIsAliveFalse(playerSettingsFirebaseObject);
          countDownInterval(gameSettingsFirebaseObject, 'Seer-Phase', 5)
          break;
        case "Seer-Phase":
          countDownInterval(gameSettingsFirebaseObject, 'Night-Death-Phase', 5)
          break;
        case "Night-Death-Phase":
          killMostVotedPlayer(playerSettingsFirebaseObject)
          countDownInterval(gameSettingsFirebaseObject, 'Day-Phase', 5)
          break;
        case "Day-Phase":
          setIsAliveFalse(playerSettingsFirebaseObject);
          countDownInterval(gameSettingsFirebaseObject, 'Lynch-Phase', 5)
          break;
        case "Lynch-Phase":
          countDownInterval(gameSettingsFirebaseObject, 'Day-Death-Phase', 5)
          break;
        case "Day-Death-Phase":
          killMostVotedPlayer(playerSettingsFirebaseObject)
          countDownInterval(gameSettingsFirebaseObject, 'Werewolf-Phase', 5)
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

// kill switch check at end of countdown
const countDownInterval = (gameSettings, nextState, countDownTime) => {
  let currentCountdown = countDownTime
  let currentGameState = null;
  const int = setInterval(() => {
      if(currentCountdown > 0) {
        currentCountdown -= 1;
        gameSettings.child('currentCounter').set(currentCountdown)
      } else {
        gameSettings.child('gameState').once('value', snap => {
          currentGameState = snap.val();
          if(currentGameState != "game-ended" && currentGameState != "werewolves-win" && currentGameState != "villagers-win") {
            gameSettings.set({
              gameState: nextState,
              currentCounter: null
            })
          }
        })
        return clearInterval(int)
      }
  }, 1000)
}

const killMostVotedPlayer = (playerSettingsFirebaseObject) => {
  let mostVotedPlayer = 0;
  let mostVotes = 0;

  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()
    Object.keys(players).map((playerID) => {
      if(players[playerID].votes > mostVotes) {
        mostVotes = players[playerID].votes
        mostVotedPlayer = playerID
      }
    })
    if(mostVotedPlayer != 0) {
      playerSettingsFirebaseObject.child(mostVotedPlayer).child('isAlive').set('recentlyDead');
      playerSettingsFirebaseObject.child(mostVotedPlayer).child('votes').set(0);
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
  const Roster = ['Villager', 'Werewolf', 'Seer']

  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()
    Object.keys(players).map((playerID) => {
      let Role = Roster[Math.floor(Math.random()*3)]
      playerSettingsFirebaseObject.child(playerID).child('role').set(Role);
    })
  })
}

const checkWinCondition = (playerSettingsFirebaseObject, gameSettingsFirebaseObject) => {
  playerSettingsFirebaseObject.once('value', snap => {
    let players = snap.val()

    let werewolves = 0;
    let villagers = 0;
    Object.keys(players).map((playerID) => {
      if(players[playerID].isAlive) {
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
}
