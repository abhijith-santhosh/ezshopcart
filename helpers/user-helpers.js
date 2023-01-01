

var collection = require("../config/collections");
var db = require("../config/connection");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const { CART_COLLECTION } = require("../config/collections");
var objectId  = require("mongodb").ObjectId ;
const Razorpay = require('razorpay');
let instance = new Razorpay({
  key_id: 'rzp_test_uhnKcQy1446ov3',
  key_secret: 'HXM0jx7kZ99P6alTuYGl9D72',
});
require('dotenv').config()
const accountSid = process.env.accountSid 
const authToken =process.env.authToken
const serviceId = process.env.serviceId 
const client = require("twilio")(accountSid, authToken);

const { timeStamp } = require("console");
const { resolve } = require("path");



module.exports = {

 
  doSignup: (userData) => {
    console.log(userData.Mobile);
    return new Promise(async (resolve, reject) => {
        let response = {};
        let phone = await db
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ Mobile: userData.Mobile });

        if (phone) {
            console.log("same phone no");
            response.status = true;
            resolve(response);
        } else {
            console.log("no same");
            userData.Password = await bcrypt.hash(userData.Password, 10);
            userData.action = true;
            client.verify
                .services(serviceId)
                .verifications.create({
                    to: `+91${userData.Mobile}`,
                    //to: '+918921653181',
                    channel: "sms",
                })
                .then((verification) => console.log(verification.status))
                .catch((e) => {
                    console.log("here is the error in otp senting block", e);
                });
            console.log("no same email");
            resolve({ status: false, userData });
        }
    });
},

signupOtp: (userData, userDetails) => {
    console.log(userDetails, "user details is here");
    return new Promise((resolve, reject) => {
        console.log('phone number is',userDetails.Mobile);
         console.log('printing otp of user is ',userData.otp);
        userData.otp=userData.otp+""

        let response = {};
        client.verify
            .services(serviceId)
            .verificationChecks.create({
                to: `+91${userDetails.Mobile}`,
                code: userData.otp
            })
            .then((verification_check) => {
                console.log(verification_check.status);
                console.log("test");
                if (verification_check.status == "approved") {
                    db.get()
                        .collection(collection.USER_COLLECTION)
                        .insertOne(userDetails)
                        .then((data) => {
                            resolve(userDetails);
                        });
                } else {
                    response.err = "otp is invalid";
                    console.log(response);
                    resolve(response);
                }
            })
            .catch((e) => {
                console.log("here is the error", e);
            });
    });
},

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  //*========================================WISH ========LIST===========================

  getWishlistProducts: (userId) => {
    console.log(userId);
    console.log('reached in getwishlist function');
    
    return new Promise(async (resolve, reject) => {
      console.log('******logged**************');
      let wishlistItems = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .aggregate([
          {
            $match: { users: objectId (userId) },
          },
          {
            $unwind: "$product",
          },
          {
            $project: {
              item: "$product.item",
              quantity: "$product.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },

            
          },
        ])
        .toArray();
        console.log("dfghjk");
      console.log('888',wishlistItems);
      resolve(wishlistItems);
    });
  },
//
addToWishlist:(proId,userId)=>{
  let proObj = {
      item: objectId (proId),
      
  }
  return new Promise(async (resolve, reject) => {
     
          let wishObj = {
              users: objectId (userId),
              product: [proObj]
          }
          db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
              resolve(response);

          })
      // }
  })
},



  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId (proId),
      quantity: 1,
    };
    console.log("proId:");
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId (userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex(
          (product) => product.item == proId
        );

        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId (userId), "products.item": objectId (proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get().collection(CART_COLLECTION).updateOne( { user: objectId (userId) },{$push: { products: proObj }}) .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObj = {user: objectId (userId),products: [proObj] };
        db.get() .collection(collection.CART_COLLECTION) .insertOne(cartObj).then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    console.log(userId, "ijjjj");
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId (userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },

            
          },
        ])
        .toArray();
      console.log(cartItems);
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId (userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  //         ==================================================  ADD =======   USERS =============================
  getAllusers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      // console.log('-----------------------------------------------------------------')
      // console.log(users)
      resolve(users);
    });
  },
  

    getUserDetails: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId (userId) })
        .then((users) => {
          resolve(users);
        });
    });
  },
  updateUser: (userId, userDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId (userId) },
          {
            $set: {
              Name: userDetails.Name,
              Email: userDetails.Email,
              Mobile: userDetails.Mobile,
              // category:proDetails.category
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  changeProductQuantity: (details) => {
    // console.log("=================================================");
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get().collection(collection.CART_COLLECTION)
        .updateOne(
          // {
          //   user: objectId (details.userId)
          // },
          {
            $pull : { products: {item:objectId (details.product)}}
          }
        ).then((response)=>{
            resolve({removeProduct:true})
        })
       
      }else{
       db.get().collection(collection.CART_COLLECTION).updateOne(
          {
            _id: objectId (details.cart),
            "products.item": objectId (details.product),
          },
          {
            $inc: { "products.$.quantity": details.count },
          }
        )
        .then((reponse) => {
          // resolve({status:true});
          resolve(true)
        });
    }
    });
  },






 // ==========//*===========================TOTAL========AMMOUNT=======================================================================

getTotalAmount:(userId)=>{
  console.log('hi hello getTottalAmount');
  let response ={}
  return new Promise(async (resolve, reject) => {
      let total = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
              {
                  $match: { user: objectId(userId) },
              },
              {
                  $unwind: "$products",
              },
              {
                  $project: {
                      item: "$products.item",
                      quantity: "$products.quantity",
                  },
              },
              {
                  $lookup: {
                      from: collection.PRODUCT_COLLECTION,
                      localField: "item",
                      foreignField: "_id",
                      as: "product",
                  },
              },
              {
                  $project: {
                      item: 1,
                      quantity: 1,
                      product: { $arrayElemAt: ["$product", 0] },
                  },
              },
              {
                  $group: {
                      _id: null,
                      total: {
                          $sum: {
                              $multiply: [
                                  { $toInt: "$quantity" },
                                  { $toInt: "$product.Prize" },
                              ],
                          },
                      },
                  },
              },
          ])
          .toArray();
      console.log("hhhhhh");
      if (total.length == 0) {
         
          total.push({ total: 0 });
          
          let nullTotal = total[0].total;
          response.status=false
        
         
          resolve(response);
      } else {
         
          let cartTotal = total[0].total;
          response.status=true
          response.cartTotal=cartTotal
        
          resolve(response);

      }
      
  });
},
//   

//*============================PLACE===============ORDER======================================

placeOrder:(order,products,total)=>{
  return new Promise((resolve,reject)=>{
    let date= new Date()
    console.log(order,products,total);
    let status=order['payment-method']==='COD'?'placed':'pending'
    let orderObj={
      deliveryDetails:{
        name:order.name,
        address:order.address,
        post:order.post,
        email:order.email,
        phone:order.phone
        },
        userId:objectId (order.userId),
        paymentMethod:order['payment-method'],
        products:products,
        totalAmount:total,
        status:status,
        date:date.toLocaleString(),
        

    }
    db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
      db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId (order.userId)})
        resolve(response.insertedId)     
    })
  })

},

getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
  let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId (userId)})
  resolve(cart)
    })
},


getUserOrders:()=>{
  return new Promise(async(resolve,reject)=>{
     let orders=await db.get().collection(collection.ORDER_COLLECTION)
     .find().toArray()
     console.log(orders);
     resolve(orders)
  })
},


getOrderProducts:(orderId)=>{
  return new Promise(async (resolve, reject) => {
    let orderItems = await db .get() .collection(collection.ORDER_COLLECTION) .aggregate([
        {
          $match: { _id: objectId (orderId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] },
          },
  
          
        },
      ])
      .toArray();
    console.log(orderItems);
    resolve(orderItems);

})  
},


//*========================RAZOR============== PAY==================
 
generateRazorpay:(orderId,total)=>{
  return new Promise((resolve,reject)=>{
    let instance = new Razorpay({
      key_id: 'rzp_test_uhnKcQy1446ov3',
      key_secret: 'HXM0jx7kZ99P6alTuYGl9D72',
    });
    console.log('reacged in razorpy');
    var  options={
      amount:total*100,   //amount in smallest currency unit
      currency:"INR",
      receipt:"order"+orderId
       };
       instance.orders.create(options,function(err,order){
        if(err){
          console.log(err);
        }else{
        console.log(" new order:",order);
        resolve(order)
        }
       });
   
    
    
  })

},

//*==================BLOCK=========== UNBLOCK===== user===============


blockUser: (userId, userdetails) => {

  return new Promise((resolve, reject) => {


    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId (userId, userdetails) },

      {
        $set: {

          status: false
        }
      })

    resolve()

  })

},

unblocklUser: (userId, userdetails) => {

  return new Promise((resolve, reject) => {

    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId (userId, userdetails) },
      {
        $set: {
          status: true
        }
      }
    )

    resolve()
  })

},
getUserOrder: (userId) => {
  return new Promise(async (resolve, reject) => {
      let order = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId (userId) }).sort({ date: -1 }).toArray();
      console.log('order');
      console.log(order);
      resolve(order);
  });
},
getViewOrder: (orderId) => {
  return new Promise(async (resolve, reject) => {
      let order = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ _id: objectId(orderId) });
      resolve(order);
  });
},




//*=======================  REMOVE ==========CART ======ITEM===================================================



deleteCartProduct: (cartId, item) => {
  console.log('***********************************************************************');
  return new Promise(async (resolve, rejcet) => {
    await db
      .get()
      .collection(collection.CART_COLLECTION)
      .updateOne(
        { _id: objectId (cartId) },
        { $pull: { 
           
          products:{item:objectId(item)}
                 } 
        } 
      )
      .then((response) => {
        resolve(response); 
      });
      
  });         
},


//* remove wishpdt

deleteWishProduct: (cartId, item) => {
  console.log('***********************************************************************');
  return new Promise(async (resolve, rejcet) => {
    await db
      .get()
      .collection(collection.WISHLIST_COLLECTION)
      .updateOne(
        { _id: objectId (cartId) },
        { $pull: { 
           
          product:{item:objectId(item)}
                 } 
        } 
      )
      .then((response) => {
        resolve(response); 
      });
      
  });         
},

updatePassword: (password, uid) => {
  console.log(password);
  console.log(uid);
  return new Promise(async (resolve, reject) => {
      await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ _id: objectId(uid) })
          .then((response) => {
              bcrypt
                  .compare(password.currentpassword, response.password)
                  .then(async (status) => {
                      console.log("status is   " + status);
                      if (status) {
                          password.newpassword = await bcrypt.hash(
                              password.newpassword,
                              10
                          );
                          await db
                              .get()
                              .collection(collection.USER_COLLECTION)
                              .updateOne(
                                  { _id: objectId(uid) },
                                  {
                                      $set: {
                                          Password: password.newpassword,
                                      },
                                  }
                              );
                          resolve(status);
                      } else {
                          console.log("going back to route");
                          resolve(status);
                      }
                  });
          });
  });
},


cancelOrder: (orderId, userId) => {
  console.log(orderId);
  return new Promise(async (resolve, reject) => {
      let totalamount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ _id: objectId(orderId) });
      db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
              { _id: objectId(orderId) },
              { $set: { status: "cancelled", cancelled: true } }
          );
      db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne({ _id: objectId(orderId) }, { $set: { totalAmount: 0 } });
      console.log(totalamount.totalAmount);
      console.log(totalamount.paymentmethod);
      if (totalamount.paymentmethod != "COD") {
          console.log("Not cod");
          if (totalamount.totalAmount > 1) {
              console.log("+0");
              db.get()
                  .collection(collection.WALLET_COLLECTION)
                  .updateOne(
                      { user: objectId(userId) },
                      { $inc: { amount: totalamount.totalAmount } }
                  );
          } else {
              console.log("100");
              db.get()
                  .collection(collection.WALLET_COLLECTION)
                  .updateOne(
                      { user: objectId(userId) },
                      { $set: { amount: totalamount.totalAmount } }
                  );
          }
          console.log(totalamount.totalAmount);
      } else {
          console.log("cod sds");
      }
  });
},





clearCart: (userId)=>{
  console.log(userId);
  return new Promise((resolve, reject)=>{
      db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then(()=>{
          resolve()
      })
  })
},





checkCoupon: (coupon, total, userId) => {
  console.log("coupon");
  console.log(coupon);
  console.log(total);
  return new Promise((resolve, reject) => {
      let responses = {};
      db.get()
          .collection(collection.COUPON_COLLECTION)
          .findOne({ couponname: coupon.coupon })
          .then(async (response) => {
              if (response) {
                  if (response.users.includes(userId)) {
                      responses.status = false;
                      resolve(responses);
                  } else {
                      // await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id: response._id }, {
                      //     //$push: { users: userId }
                      // })
                      let discountAmount = (total * response.discount) / 100;
                      db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                      {$set:{coupon: coupon.coupon,coupOffer:discountAmount}}
                      ).then(()=>{
                          let discountAmount = (total * response.discount) / 100;
                          responses.totalAmount = total - discountAmount;
                          response.Actual = total;
                          responses.status = true;
                          console.log(responses);
                          resolve(responses);
                      })
                      
                  }
              } else {
                  responses.status = false;
                  resolve(responses);
              }
          });
  });
},


verifyPayment: (details) => {
  return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "URlsfCf9N3d6scwbEVFBQuW7");

      hmac.update(
          details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
          console.log("kkkkk");
          resolve();
      } else {
          reject();
      }
  });
},
changePaymentStatus: (orderId) => {
  return new Promise((resolve, reject) => {
      db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
              { _id: objectId(orderId) },
              {
                  $set: {
                      status: "placed",
                  },
              }
          )
          .then(() => {
              resolve();
          });
  });
},


userAddress:(data)=>{
  return new Promise(async (resolve, reject) => 
  {
      db.get()
          .collection(collection.ADDRESS_COLLECTION)
          .insertOne(data)
          .then((response) => {
              resolve();
              
          });
  });
},
getAddress:(userId)=>{
  return new Promise(async (resolve, reject) => {
       await db
          .get()
          .collection(collection.ADDRESS_COLLECTION).findOne({userId:(userId) }).then((savedAddress) => {
              resolve(savedAddress)
          })
         
  });
}














};
