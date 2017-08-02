export default function(db) {
  return {
    setPlayerAlias(id, alias) {
      return db.child('players').child(id).set({alias});
    },

    setOnlineAndWatchPresence(id, alias) {
      const user = db.child('presence').child(id);

      return user.set({
        alias
      }).then(() => {
        return db.child(`.info/connected`).on('value', (snap) => {
          if (snap.val()) {
            user.onDisconnect().remove();
            user.update({
              online: true,
              ready: false
            });
          }
        })
      })
    },
    countOnlineUser(cb) {
      db.child('presence').on('value', function(snap) {
        console.log('# of online users =' + snap.numChildren());
        return cb(snap.numChildren());
      })
    },
    // displays current users
    displayCurrentUser(allUsers) {
      var users;
      db.child('presence').on('value', (snapshot) => {
        const currentUsers = snapshot.val()
        if(currentUsers != null) {
          users = currentUsers;
          return allUsers(users);
        }
      })
    },

    //checks if all users are ready
    setReady(thisplayerID) {
      return db.child('presence').child(thisplayerID).child('ready').set(true);

      // return db.child('presence').once("value")
      //     .then(function(snapshot) {
      //       return Object.keys(snapshot.val()).map((playerID) => {
      //         return snapshot.val()[playerID].ready
      //       }).indexOf(false) === -1; // if it can't find a false, -1
      //
      //       // snapshot.forEach(function(childSnapshot) {
      //       //   var key = childSnapshot.key;
      //       //   var childData = childSnapshot.val();
      //       //   if (childData.ready == false) {
      //       //     gameReady = false;
      //       //   }
      //       // });
      //       // return gameReady;
      //     })
      // return Promise.resolve(true);
    },
    // sets the player role
    setPlayerRole(thisplayerID, Role) {
      db.child('presence').child(thisplayerID).child('role').set(Role);
    }
  }
}
