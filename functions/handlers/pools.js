const {db} = require('../util/admin')

// get all pools
exports.getPools = (req, resp) => {
  db.collection('pools')
  .get()
  .then(data => {
    let pools = [];
    data.forEach(doc => {
      pools.push({
        poolID: doc.id,
        ...doc.data()
      });
    });
    return resp.json(pools);
  })
  .catch(err => console.error(err))
};


//fetch specific pool
exports.getPool = (req, resp) => {
  let poolData = {};
  db.doc(`/pools/${req.params.poolID}`).get()
  .then(doc => {
    if(!doc.exists){
      return resp.status(404).json({error:'Pool not found'});
    }
    poolData = doc.data();
    poolData.poolID = doc.id;
    return db.collection('competitors')
    .orderBy('createdAt','desc')
    .where('poolId', '==', req.params.poolID).get();
  })
  .then(data => {
    poolData.users =[];
    data.forEach(doc => {
      poolData.users.push(doc.data())
    });
    return resp.json(poolData)
  })
  .catch(err => {
    console.error(err);
    resp.status(500).json({error: err.code});
  })

}

//join the pool
exports.joinPool = (req, resp) => {
  

  const competitorDocument = db.collection('competitors').where('userHandle', '==', req.user.handle)
  .where('poolId', '==', req.params.poolID).limit(1);

  const poolDocument = db.doc(`/pools/${req.params.poolID}`);
  
  let poolData;
  
  poolDocument.get()
  .then(doc => {
    //check the pool exists
    if(doc.exists){
      poolData = doc.data();
      //check if there is room
      if(poolData.competitorCount >= poolData.maxParticipants){
        return resp.status(400).json({error: "Pool is full!"});
      };
      poolData.poolId = doc.id;
      return competitorDocument.get();
    } else {
      return resp.status(404).json({error: "Pool not found"});
    }
  })
  .then(data => {
    // check if you have already joined, then add you to the competitors document.
    if(data.empty){
      return db.collection('competitors').add({
        poolId: req.params.poolID,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString(),
        hasPaid:true
      })
      //then increase competitor count in pooldocument
      .then(() => {
        poolData.competitorCount++
        return poolDocument.update({competitorCount: poolData.competitorCount});
      })
      .then(() => {
        return resp.json(poolData);
      })
    } else {
      return resp.status(400).json({error:'Pool already joined'});
    }    
  })
  .catch(err => {
    console.error(err);
    resp.status(500).json({error: 'Something went wrong'});
  });
};

/// ADMIN POOL STUFF

exports.createPool = (req, resp) => {
  const newPool = {
    title:req.body.title,
    cost: req.body.cost,
    desc: req.body.desc,
    maxParticipants: req.body.maxParticipants

  };
  db.collection('pools')
    .add(newPool)
    .then((doc)=>{
      return poolID = doc.id
    })
    .then(()=>{
      const newPoolDetails = {
        title: newPool.title,
        createdAt: new Date().toISOString(),
        poolID: poolID,
        cost:  newPool.cost,
        desc: newPool.desc,
        competitorCount: 0,
        maxParticipants: newPool.maxParticipants
      }
      return db.doc(`/pools/${poolID}`).set(newPoolDetails)
    })
    .then(()=>{
      return resp.json({message: `Pool ${poolID} added successfully!`});
    })
    .catch(err =>{
      resp.status(500).json({error:'something went wrong'})
      console.error(err);
    })

}

//Admin
//get exercises

exports.getExercises = (req, resp) => {
  db.collection('exercises')
  .get()
  .then(data => {
    let exercise = [];
    data.forEach(doc => {
      exercise.push({
        exerciseID: doc.id,
        ...doc.data()
      });
    });
    return resp.json(exercise);
  })
  .catch(err => {
    console.error(err)
  })
};

//admin
//create exercise
exports.createExercise = (req, resp ) => {
  const newExercise = {
    title: req.body.title,
    desc: req.body.desc,
    inputType: req.body.inputType,
    inputTarget: req.body.inputTarget
  };

  db.collection(`exercises`)
  .add(newExercise)
  .then(doc=> {
    return exerciseID = doc.id
  })
  .then(() => {
    const newExerciseSet = {
      title:newExercise.title,
      desc: newExercise.desc,
      inputType: newExercise.inputType,
      inputTarget: newExercise.inputTarget,
      ID: exerciseID
    }
    return db.doc(`/exercises/${exerciseID}`).set(newExerciseSet);
  })
  .then(()=>{
    return resp.json({message: `Exercise ${exerciseID} added successfully!`});
  })
  .catch(err =>{
    resp.status(500).json({error:'something went wrong'})
    console.error(err);
  })
}