let db = {
  screams: [
    //from tutorial
    {
      userHandle: 'user',
      body:'this is the post body',
      createdAt: '2020-11-11T15:41:32.710Z',
      likeCount: 5,
      commentCount: 2
    }
  ],
  //user doc id == user handle. each participant will have unique handle
  users: [{
    UID:"",
    email:"",
    handle:"",
    createdAt:"",
    imageUrl:"",
    bio:"hello",
    location:'',
    pools: [{
      id:"",
    }]  
  }],
  pools: [
    {
      poolID:"",
      cost:25,
      maxParticipants:5,
      competitorCount:5,
      desc:"",
      events:[
        {
          title:"",
          target:"",
         }
      ]
    }
  ],
  notifications : [
    {
      recipient:'user',
      sender:'wodpool',
      read:'true | false',
      poolId: "",
      type:"joined | open",
      createdAt:"isostring"
    }
  ]
};

const userDetails = {
  //redux data
  credentials: {
    UID:'',
    email:"",
    handle: "",
    createdAt:"",
    imageUrl:"",
    bio:"",
    twitter:"",
    instagram:"",
    location:"",
  },
  pools:[
    {
      userHandle:'user',
      poolID:""
    },
    {
      userHandle:'user',
      poolID:""
    },
  ]
}