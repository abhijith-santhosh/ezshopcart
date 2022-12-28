
const { MongoClient } = require('mongodb')

const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}


module.exports.connect=(done)=>{
    // const url='mongodb://localhost:27017'
    const url='mongodb+srv://abhijith:12345@cluster0.ilvnfrc.mongodb.net/?retryWrites=true&w=majority'

    const dbname= 'shoppingcart'

   MongoClient.connect(url,(err,data)=>{
    if(err) return done(err)
    state.db=data.db(dbname)
    done()

   })
 
}

module.exports.get=function(){
    return state.db
}