const functions = require('firebase-functions');
const {db} = require('./util/admin');

const app = require('express')(); 

const fbAuth = require('./util/fbAuth');
const cors = require('cors');
app.use(cors());

const {getAllComments, postOneComment} = require('./handlers/comments');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require('./handlers/users');

const { 
  getPools, 
  getPool, 
  joinPool, 
  createExercise, 
  createPool, 
  getExercises } = require('./handlers/pools');


//Comment Routes
app.get('/screams', getAllComments);
app.post('/scream', fbAuth, postOneComment);

//Admin Routes
app.post('/admin/pools', fbAuth, createPool)
app.get('/admin/pools', fbAuth, getPools)
app.get('/admin/pools/exercise', fbAuth, getExercises)
app.post('/admin/pools/exercise', fbAuth, createExercise)

//Pool Routes
app.get('/pools', getPools);
app.get('/pools/:poolID', fbAuth, getPool);
app.get('/pools/:poolID/join', fbAuth, joinPool);
//TODO: Get: Authorized Pool Workout
//TODO: Post: Authorized Workout Score

// users route
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', fbAuth, uploadImage);
app.post('/user', fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);
// app.get('/user/pools', fbAuth, myPools);

// post request for poolPublishing ('/admin, fbAuth, publishPool)

exports.api = functions.https.onRequest(app);

// send notification when pool opens
exports.createNotificationOnOpen = functions.firestore.document('pools/{id}')
.onUpdate((snapshot) => {
  db.doc(`/pools/${snapshot.data().poolID}`).get()
  .then(doc => {
    if(doc.exists){
      return db.doc(`/notifications/${snapshot.id}`).set({
        createdAt: new Date().toISOString,
        recipient: doc.data().userHandle,
        poolId: doc.id,
        type:'Open',
        read: false
      });
    }
  })
  .then(()=>{
    return;
  })
  .catch(err => {
    console.error(err);
    return;
  })
});
//send notification when join a pool
exports.createNotificationOnJoin = functions.firestore.document('pools/{id}')
.onCreate((snapshot) => {
  db.doc(`/pools/${snapshot.data().poolID}`).get()
  .then(doc => {
    if(doc.exists){
      return db.doc(`/notifications/${snapshot.id}`).set({
        createdAt: new Date().toISOString,
        recipient: doc.data().userHandle,
        poolId: doc.id,
        type:'Join',
        read: false
      });
    }
  })
  .then(()=>{
    return;
  })
  .catch(err => {
    console.error(err);
    return;
  })
});

