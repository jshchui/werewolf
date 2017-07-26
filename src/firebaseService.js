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
    }


  }
}
