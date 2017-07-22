import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import * as firebase from 'firebase';
import FirebaseService from './firebaseService';

var config = {
  apiKey: "AIzaSyDMgK9TFoOd5Ts74x_J7fuN4nDTGav60bU",
  authDomain: "chat-d457d.firebaseapp.com",
  databaseURL: "https://chat-d457d.firebaseio.com",
  projectId: "chat-d457d",
  storageBucket: "",
  messagingSenderId: "133132278363"
};
firebase.initializeApp(config);

const db = firebase.database().ref('/');
const firebaseService = FirebaseService(db);

// const alias = prompt('What is your alias');
// const id = Math.floor(Date.now()).toString();
// const alias = {
//   name: prompt('what is your name')
// }


// const playerRef = db.child('players');
// playerRef.child(id).set({
//   alias
// });
//
// firebaseService.setPlayerAlias(id, alias);
// firebaseService.setOnlineAndWatchPresence(id, alias);

// function callBack(count) {
//   console.log(count)
// }

// firebaseService.countOnlineUser((count) => {
//   console.log(count)
// });

// const onlineRef = firebase.database().ref('presence');
// console.log(listRef);
// const userRef = onlineRef.child(id);
// userRef.set({
//   alias
// });
// const presenceRef = firebase.database().ref('.info/connected');
// // userRef.push(alias)
// presenceRef.on('value', function(snap) {
//   if(snap.val()) {
//     userRef.onDisconnect().remove();
//
//     userRef.update({
//       online: true
//     });
//     // userRef.push(alias);
//     // userRef['name'] = alias;
//   }
// });


// onlineRef.on('value', function(snap) {
//   console.log('# of online users =' + snap.numChildren());
// })


// firebase.auth().signInAnonymously().catch(function(error) {
//   // Handle Errors here.
//   var errorCode = error.code;
//   var errorMessage = error.message;
//   // ...
// });
//
// firebase.auth().onAuthStateChanged(function(user) {
//   if (user) {
//     // User is signed in.
//     var isAnonymous = user.isAnonymous;
//     var uid = user.uid;
//     // ...
//
//     console.log(`${uid} has signed in`);
//     firebase.database().ref().child('users/'+ `${uid}`).set(true);
//
//   } else {
//     // User is signed out.
//
//     console.log(`${uid} has signed out`);
//     firebase.database().ref().child('users/'+ `${uid}`).set(false);
//
//
//     // ...
//   }
//   // ...
// });


//this is in charge of passing it to app.js
ReactDOM.render(<App firebaseService={firebaseService}/>, document.getElementById('root'));
registerServiceWorker();
