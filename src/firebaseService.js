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
              ready: false,
              votes: 0,
              isAlive: true,
              role: 'Not Assigned'
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
    setReady(thisplayerID, isReady) {
      if(isReady === true){
        return db.child('presence').child(thisplayerID).child('ready').set(true);
      } else {
        return db.child('presence').child(thisplayerID).child('ready').set(false);
      }
    },
    // sets the player role
    setPlayerRole(thisplayerID, Role) {
      db.child('presence').child(thisplayerID).child('role').set(Role);
    },

    votingPlayer(thisplayerID) {
      db.child('presence').child(thisplayerID).child('votes').set(1);
    }
  }
}
