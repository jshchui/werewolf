const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

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

    if (allReady) {
      return event.data.ref.parent.child('game-settings').set({
        // started: allReady
        gameState: "all-ready",
        currentCounter: null
      });
    }

  });
});

exports.gameStateListener = functions.database.ref('game-settings').onUpdate((event) => {
  const gameSettings = event.data.val()
  const gameSettingsFirebaseObject = event.data.ref.parent.child('game-settings')

  switch(gameSettings.gameState) {
    case "all-ready":
      gameStateAllReady(gameSettingsFirebaseObject)
      break;
    case "night":
      console.log("night")
      break;
  }
})

const gameStateAllReady = (gameSettingsFirebaseObject) => {
  let currentCountdown = 5

  const int = setInterval(() => {
    if(currentCountdown > 0) {
      currentCountdown -= 1;
      gameSettingsFirebaseObject.set({
        currentCounter: currentCountdown
      })
    } else {
      gameSettingsFirebaseObject.set({
        gameState: "night",
        currentCounter: null
      })
      return clearInterval(int)
    }
  }, 1000)

}
