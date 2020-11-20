const {db} = require('../util/admin')

exports.getAllComments = (req, resp) => {
  db.collection('screams')
  .orderBy('createdAt', 'desc')
  .get()
  .then(data => {
    let screams = [];
    data.forEach(doc => {
      screams.push({
        screamID: doc.id,
        ...doc.data()
      });
    });
    return resp.json(screams);
  })
  .catch(err => console.error(err))
}
//Post One Comment
exports.postOneComment = (req, resp) => {
  if(req.body.body.trim() === ''){
    return resp.status(400).json({body:'Body must not be empty'});
  }

  //authenticate user before allowing posting/

  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString()
  };

  db.collection('screams')
  .add(newScream)
  .then ((doc) => {
    resp.json({message:`document ${doc.id} created successfully`});
  })
  .catch((err) => {
    resp.status(500).json({error: 'something went wrong'});
    console.error(err);
  });  
}