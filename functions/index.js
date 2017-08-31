const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let lastGameState;
let nextGameState;
let nextStateTitleGlobal;
let interval;
let werewolfTurn = false;

// checks if the presence is deleted then set game stetitng to false
exports.endGame = functions.database.ref('presence').onDelete((event) => {
  return event.data.ref.parent.child('presence').once('value').then((snap) => {

    // console.info('SET FALSE')
    return event.data.ref.parent.child('game-settings').set({
      gameState: "game-ended",
      stateTitle: "No game in progress",
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

    event.data.ref.parent.child('game-settings').child('gameState').once('value', snap => {
      const gameState = snap.val();
      if (allReady && (gameState == 'game-ended' || 'villagers-win' || 'werewolves-win')) {
        clearInterval(interval)
        return event.data.ref.parent.child('game-settings').set({
          gameState: "all-ready",
          stateTitle: "Game will begin shortly"
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
    switch(gameSettings.gameState) {
      case "all-ready":
        assignRole(playerSettingsFirebaseObject)
        countDownInterval(gameSettingsFirebaseObject, 'Werewolf-Phase', 14, 'Werewolves Turn')
        clearMessages(event.data.ref.parent.child('messages'))
        break;
      case "Werewolf-Phase":
        setIsAliveFalse(playerSettingsFirebaseObject);
        countDownInterval(gameSettingsFirebaseObject, 'Seer-Phase', 16, 'Seers Turn')
        werewolfTurn = true;
        break;
      case "Seer-Phase":
        countDownInterval(gameSettingsFirebaseObject, 'Night-Death-Phase', 16, 'Who Died?')
        break;
      case "Night-Death-Phase":
        killMostVotedPlayer(playerSettingsFirebaseObject, gameSettingsFirebaseObject)
        countDownInterval(gameSettingsFirebaseObject, 'Day-Phase', 12, 'Day Time')
        break;
      case "Day-Phase":
        setIsAliveFalse(playerSettingsFirebaseObject);
        werewolfTurn = false
        countDownInterval(gameSettingsFirebaseObject, 'Lynch-Phase', 60, 'Lynching Phase')
        break;
      case "Lynch-Phase":
        countDownInterval(gameSettingsFirebaseObject, 'Day-Death-Phase', 23, 'Who got lynched?')
        break;
      case "Day-Death-Phase":
        killMostVotedPlayer(playerSettingsFirebaseObject)
        countDownInterval(gameSettingsFirebaseObject, 'Check-Win', 12, 'Who got lynched?')
        break;
      case "Check-Win":
        checkWinCondition(playerSettingsFirebaseObject, gameSettingsFirebaseObject, 'Werewolf-Phase', 'Werewolves Turn')
        break;
      case "skipToNextPhase":
        skipPhase(gameSettingsFirebaseObject, nextGameState, nextStateTitleGlobal)
        break;
    }
    lastGameState = gameSettings.gameState
  }
})

const skipPhase = (gameSettings, nextState, nextTitle) => {
  clearInterval(interval)
  nextGameState = nextState;
  gameSettings.set({
    gameState: nextGameState,
    stateTitle: nextTitle
  })
}

const clearMessages = (messagesRef) => {
  messagesRef.remove()
}

// kill switch check at end of countdown
//PRESENT-THIS
const countDownInterval = (gameSettings, nextState, countDownTime, nextStateTitle) => {
  clearInterval(interval)
  let endTime = Date.now() + (countDownTime * 1000)
  let currentCountdown = countDownTime
  let currentGameState = null;
  nextGameState = nextState;
  nextStateTitleGlobal = nextStateTitle;

  gameSettings.child('endTime').set(endTime)

  interval = setInterval(() => {
    if(currentCountdown > 0) {
      currentCountdown -= 1;
    } else {
      gameSettings.child('gameState').once('value', snap => {
        currentGameState = snap.val();
        if(currentGameState != "game-ended") {
          gameSettings.set({
            gameState: nextGameState,
            stateTitle: nextStateTitleGlobal
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

const checkWinCondition = (playerSettingsFirebaseObject, gameSettingsFirebaseObject, nextState, nextStateTitle) => {
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
      gameSettingsFirebaseObject.set({
        gameState: 'werewolves-win',
        stateTitle: 'Werewolves Win!'
      })
    } else if (werewolves <= 0) {
      gameSettingsFirebaseObject.set({
        gameState: 'villagers-win',
        stateTitle: 'Villagers Win!'
      })
    } else {
      console.log('The game continues')
    }
  })

  gameSettingsFirebaseObject.once('value', snap=> {
    let currentGameState = snap.val()
    console.log('currentGameState.gameState', currentGameState.gameState)
    console.log('currentGameState', currentGameState)
    console.log('checking gameState value')
    if(currentGameState.gameState != "game-ended" && currentGameState.gameState != "werewolves-win" && currentGameState.gameState != "villagers-win") {
      console.log('changing game state')
      gameSettingsFirebaseObject.set({
        gameState: nextState,
        stateTitle: nextStateTitle
      })
    }
  })
}
