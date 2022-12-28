const { Db } = require('mongodb')
const { ObjectId } = require('mongodb')
const { response } = require('../app')
var collection=require('../config/collections')
var db=require('../config/connection')
var objectId=require('mongodb').ObjectId
module.exports={
    addProduct:(product)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
                console.log(data);
               resolve()
            })
        })
  
    },
    getAllProducts:()=>{
        return new Promise (async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getAllProductsMen:()=>{
      return new Promise (async(resolve,reject)=>{
          let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:'Mens'}).toArray()
          resolve(products)
      })
  },
  getAllProductsWomen:()=>{
    return new Promise (async(resolve,reject)=>{
        let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:'Women'}).toArray()
        resolve(products)
    })
},

    productView:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })

    },



    deleteProduct:(proId)=> {
        return new Promise((resolve,reject)=>{
            console.log(proId);
            console.log(objectId(proId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(proId)}).then((response)=>{
                
                resolve(response)

            })
        })
    },




    
    getproductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
                })
        })
    },
    updateProduct:(proId,productDetails)=>{
      
        return new Promise(async(resolve,reject)=>{
            let image=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)})
            console.log(productDetails)
            if(productDetails.image.length==0){
                productDetails.image=image.image
            }
              db.get().collection(collection.PRODUCT_COLLECTION).findOneAndUpdate({_id:ObjectId(proId)},{
                $set:{
                        Name:productDetails.Name,
                        Description:productDetails.Description,
                        Prize:productDetails.Prize,
                        Category:productDetails.Category
                       
                }  
            } ).then((response)=>{
                resolve(response)
        })
        }) 
       
    },

    //*===============shipped=============cancelled======delevered===========

cancelOrder: (orderId) => {

    return new Promise((resolve, reject) => {
  
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
          $set: {
            status: "Canceled",
            cancel: true,
          }
  
        }).then((response) => {
  
          console.log(response.status);
  
          resolve()
        })
  
  
    })
  
  },
  
  shippOrder: (orderId) => {
  
    return new Promise((resolve, reject) => {
  
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
          $set: {
            status: "Shipped",
            shipp: true,
            cancel: null,
  
  
          }
  
        }).then((response) => {
  
          console.log(response.status);
  
          resolve()
        })
  
  
    })
  
  },
  
  deliverOrder: (orderId) => {
  
    return new Promise((resolve, reject) => {
  
      db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
        {
          $set: {
            status: "Delivered",
            delivered: true,
            cancel: true,
            return: true
          }
  
        }).then((response) => {
  
          console.log(response.status);
  
          resolve()
        })
  
  
    })
  
  },
  updateStatus:(changeStatus, orderId) => {
    return new Promise(async (resolve, reject) => {
      if (changeStatus == 'cancelled') {
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
  
          $set: {
            status: changeStatus,
            cancelStatus: true
  
  
          }
        })
  
      }
      else {
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
  
          $set: {
            status: changeStatus
  
  
  
          }
        })
      }
    }).then((response) => {
      resolve(response)
    })
    resolve(response)
  },


  getCoupons: ()=>{
    return new Promise((resolve, reject)=>{
      db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((response)=>{
        resolve(response)
      })
    })
  },
  addCoupon:(coupon) =>{
    return new Promise(async (resolve, reject) => {
      coupon.discount = parseInt(coupon.discount)
      db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((response) => {
        resolve(response)
      })
    })
  },













}