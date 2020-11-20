const {db, admin} = require('../util/admin');

const config = require('../util/config')

const firebase = require('firebase');
firebase.initializeApp(config)

const {validateSignupData, validateLoginData, reduceUserDetails} = require ('../util/validators');
const { user } = require('firebase-functions/lib/providers/auth');

//Signup
exports.signup = (req, resp) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const {valid, errors} = validateSignupData(newUser);
  if(!valid) return resp.status(400).json(errors);

  //apply no-img avatar after validated signup
  const noImg = 'no-img.png'

  //validate User Handle
  let token, userID, agreeTOS;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
      if(doc.exists){
        return resp.status(400).json({handle: 'this handle is already taken'});
      } else {
        return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    /// if we made it here we have created a user - need an access token.
    .then(data => {
      userID = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        UID: userID,
      };
      //write new user to our user collection
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return resp.status(201).json({token})
    })
    .catch(err => {
      console.error(err);
      if(err.code === "auth/email-already-in-use"){
        return resp.status(400).json({email: 'Email is already in use.'})
      } else {
        return resp.status(500).json({general: 'Something went wrong, please try again'});
      }
    })
}

//Login
exports.login = (req, resp) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, errors} = validateLoginData(user);
  if(!valid) return resp.status(400).json(errors)

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return resp.json({token});
    })
    .catch(err => {
      console.error(err);
      //auth/wrong-password
      //auth/user-not-user

      return resp.status(403).json({general: 'Wrong credentials, please try again'});
 
    })

};

// add user details (bio, location, additional socials)
exports.addUserDetails = (req, resp) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`).update(userDetails)
  .then(()=>{
    return resp.json({message: 'Details added successfully!'});
  })
  .catch(err => {
    console.error(err);
    return resp.status(500).json({error: err.code});
  });
}

//Get own user details
exports.getAuthenticatedUser = (req, resp) => {
  let userData = {}; //response data

  db.doc(`/users/${req.user.handle}`).get()
  .then(doc => {
    if(doc.exists){
      userData.credentials = doc.data();
      return db.collection('competitors').where('userHandle', '==', req.user.handle).get()
    }
  })
  .then(data => {
    userData.pools = [];
    data.forEach(doc => {
      userData.pools.push(doc.data());
    });
    return resp.json(userData);
  })
  .catch(err => {
    console.error(err);
    return resp.status(500).json({error: err.code});
  });
};

// upload user avatar image
exports.uploadImage = (req, resp) => {

  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({headers: req.headers});

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

    if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
      return resp.status(400).json({error: 'Wrong file type submitted'})
    }

    // extracting image extension
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    imageFileName = `${Math.round(Math.random()*100000000)}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = { filepath, mimetype};
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('finish', () => {
    admin.storage().bucket(`${config.storageBucket}`).upload(imageToBeUploaded.filepath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: imageToBeUploaded.mimetype
        }
      }
    })
    .then(() => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
      return db.doc(`/users/${req.user.handle}`).update({imageUrl: imageUrl})
    })
    .then(() => {
      return resp.json({message:'Image uploaded successfully'});
    })
    .catch(err => {
      console.error(err);
      return resp.status(500).json({error: err.code})
    });
  });

  busboy.end(req.rawBody);

}


