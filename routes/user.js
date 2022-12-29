const { ObjectID, ObjectId } = require('bson');
var express = require('express');
const session = require('express-session');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')


const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
} 

/* GET home page. */
router.get('/', async function(req, res, next) {
  try{
    let user=req.session.user
    let cartCount=null
    if(req.session.user){
     cartCount= await userHelpers.getCartCount(req.session.user._id)
    }
   productHelpers.getAllProducts().then((products)=>{
     
     res.render('user/index',{products,user,cartCount});
   })

  }catch(err){
    res.render("user/404");
  } 
  
});


router.get('/men', async function(req, res, next) {
   try{
    let user=req.session.user
    let cartCount=null
    if(req.session.user){
     cartCount= await userHelpers.getCartCount(req.session.user._id)
    }
   productHelpers.getAllProductsMen().then((products)=>{
     res.render('user/men',{products,user,cartCount});
   })
   }catch(err){
    res.render("user/404");
   }
 
});



router.get('/women', async function(req, res, next) {
 try{
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
   cartCount= await userHelpers.getCartCount(req.session.user._id)
  }
 productHelpers.getAllProductsWomen().then((products)=>{
 res.render('user/men',{products,user,cartCount});
 })
 }catch(err){
  res.render("user/404");
 }
});




router.get('/login',(req,res)=>{
  try{
    if(req.session.loggedIn){
      res.redirect('/')
   }else{
     res.render('user/login',{"logginErr":req.session.logginErr})
     req.session.logginErr=false
   }
  }catch(err){
    res.render("user/404");
  }

 
})

router.get('/signup',(req,res)=>{
  try{
    if(req.session.userLoggedIn){
      res.redirect('/')
    }
    res.render('user/signup',{emailErr:req.session.emailErr})
  }catch(err){
    res.render("user/404");
  }
 
})


let user;
router.post('/signup',(req,res)=>{
  try{
    userHelpers.doSignup(req.body).then((response)=>{
      if(response.userExist){
        console.log(response);
        req.session.emailExist=true
        req.session.emailErr=true
        req.session.loggedIn=true
        req.session.user=response
        res.redirect('/signup')
      }else{
        user=response.userData;
        res.render('user/otp')
      }
     })
 }catch(err){
    res.render("user/404");
  }
   
  })
  //===============================================//*====dz===OTP=====================
router.post("/otp", (req, res) => {
  try {
    console.log('printing user is ',user);
    console.log('printing otp of user is ',req.body);
  userHelpers.signupOtp(req.body,user).then((response) => {
    req.session.loggedIn = true;
    req.session.user= response;
    if(response.err){
         res.redirect('/signup')
    }else{
      res.redirect("/");
    }
   
  });
} catch (err) {
  console.log('otp blocks breals here',err);
  res.render("user/404");
}
});



   router.post('/login',(req,res)=>{
    try{
      userHelpers.doLogin(req.body).then((response)=>{
        if(response.status){
          req.session.loggedIn=true
          req.session.user=response.user
          res.redirect('/')
        }else{
          req.session.logginErr=true
          res.redirect('/login')
        }
      })

    }catch(err){
      res.render("user/404");
    }
   

  })                                                                                                                    
  
  router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
  })

  
  router.get("/cart",verifyLogin, async (req, res) => {
		try {
		let product = await userHelpers.getCartProducts(req.session.user._id);
		let user = req.session.user;
		let totalValue =0
		if (product.length >= 1) {
			user = req.session.user._id;
			totalValue= await userHelpers.getTotalAmount(req.session.user._id);
      totalValue=totalValue.cartTotal
      cartCount = await userHelpers.getCartCount(req.session.user._id);
			res.render("user/cart1", {
				product,
        totalValue,
				user: true,
				user,
				user_log: req.session.user,
				cartCount
			});
			
		}
    else{
      let user = req.session.user._id;
			totalValue=totalValue.nullTotal
      res.render('user/emptycart', {
				product,
				totalValue,
				user_log: req.session.user,
				user: true,
        user
			});          
      
    }
    
	} catch (err) {
		res.render("user/404");
	}
});

  router.post('/add-to-cart/:id',verifyLogin,(req,res)=>{
    try{
     userHelpers.addToCart(req.params.id,req.session.user._id).then((resolve)=>{
      res.json({status:true})
       })
      }catch(err){
        res.render('user/404')
      }
  })  
  
  router.post('/changequantity',(req,res)=>{
    try{
      userHelpers.changeProductQuantity(req.body).then(async(response)=>{
        response.total= await userHelpers.getTotalAmount(req.session.user._id)
      res.json(response)
        
      })

    }catch(err){
      res.render('user/404')
    }
         
  })  
  

  
//*===========remove product========

router.post("/remove-item",verifyLogin, async (req, res) => {
 try{
  let cartId = req.body.cartId;
  let item = req.body.proId;
  await userHelpers.deleteCartProduct(cartId, item).then((response) => {
    res.json( response );
  });
}catch(err){
  res.render('user/404')
}
});


router.post("/remove-itemq",verifyLogin, async (req, res) => {
try{
  let cartId = req.body.cartId;
  let item = req.body.proId;
 await userHelpers.deleteWishProduct(cartId, item).then((response) => {
    res.json( response );
  });
}catch(err){
  res.render('user/404')
}
  
});





  router.get('/place-order',verifyLogin,async(req,res)=>{
   try{
     let total= await userHelpers.getTotalAmount(req.session.user._id)
    let savedAddress= await userHelpers.getAddress(req.session.user._id)
   if(total.status){
				if (req.session.Total) {
      	total = Math.round(req.session.Total);
      	}
			 total=total.cartTotal
			res.render("user/place-order", {user: true, total, user: req.session.user,savedAddress});
		}
		else{
			if (req.session.Total) {
				total = Math.round(req.session.Total);
			}
			console.log(req.session.user);
			total=total.nullTotal
		  res.render("user/place-order", {user: true, total, user: req.session.user});
     }
    }catch(err){
    res.render("user/404");
   }

  })



  router.get('/product-view/:id',async(req,res)=>{
    try{
      let product=await productHelpers.productView(req.params.id)
      res.render('user/multiview',{product,user:true})
     }catch(err){
      res.render("user/404");
     }
  })
  


  router.post("/place-order",verifyLogin, async (req, res) => {
		try {
		
		let product = await userHelpers.getCartProductList(req.body.userId);
		
		let totalPrize = await userHelpers.getTotalAmount(req.body.userId);
    
		if(totalPrize.status){
			
		}
		if (req.session.Total) {
			totalPrize = Math.round(req.session.Total);
	}else{
			totalPrize =Math.round(totalPrize.cartTotal);
		}
			userHelpers.placeOrder(req.body, product, totalPrize).then((orderId) => {
			if (req.body["payment-method"] === "COD") {
				if(req.session.Total){
					req.session.Total=null
				}
				res.json({ codSuccess: true });
			} else {
				
				userHelpers.generateRazorpay(orderId, totalPrize).then((response) => {
					
					response.razorpay = true;
					res.json(response);
				});
			} 
			
		});
	} catch (err) {
		res.render("user/404");
	}
});
  










   router.get('/order-success',(req,res)=>{
   try{
    res.render('user/order-success',{user:req.session.user})
   }catch(err){
    res.render("user/404");
   }
   
   })


  router.get('/orders',verifyLogin,async(req,res)=>{
    try{
      let orders=await userHelpers.getUserOrders(req.session.user._id)
      res.render('user/orders',{user:req.session.user,orders})
    }catch{
      res.render("user/404");
    }
   
  })

 

  router.get('/view-order-products/:id',async(req,res)=>{
    try{
      let product=await userHelpers.getOrderProducts(req.params.id)
      res.render('user/view-order-products',{user:req.session.user,product})
    }catch(err){
      res.render("user/404");
    }
   })

 
 
 

  router.post("/verify-payment", (req, res) => {
		try {
		userHelpers
			.verifyPayment(req.body)
			.then(() => {
				userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
					console.log("ggggg");
					res.json({ status: true });
				});
			})
			.catch((err) => {
				res.json({ status: false, errMsg: "" });
			});
		} catch (err) {
			res.render("user/404");
		}
	});

  router.get("/wishlist",verifyLogin, async (req, res) => {
   try{
    let product = await userHelpers.getWishlistProducts(req.session.user._id);
		let user = req.session.user._id;
    if(product.length>=1){
      res.render('user/wishlist',{product,user})
    }else{
      res.render('user/emptywish')
    }
   }catch(err){
    res.render("user/404");
   }
	
});


router.get("/add-to-wishlist/:id",(req, res) => {
	try {
	userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
		res.redirect('/')
		
	});
} catch (err) {
	res.render("user/404");
}
});



router.get('/profile',verifyLogin,async(req,res)=>{
  try{
    let user=await userHelpers.getAddress(req.session.user._id)
    res.render('user/profile',{user})
  }catch(err){
    res.render("user/404");
  }
 
})


router.get('/myorder',verifyLogin,async(req,res)=>{
  try{
    let user=await userHelpers.getUserDetails(req.session.user._id)
    let order = await userHelpers.getUserOrder(req.session.user._id);
    res.render('user/myorder',{user,order})
  }catch(err){
    res.render("user/404");
  }
 
})



router.get('/otp',(req, res) => {
  try{
    res.render('user/otp')
  }catch(err){
    res.render("user/404");
  }
})


router.get("/cancelOrder/:id", (req, res) => {
  try {
  userHelpers.cancelOrder(req.params.id, req.session.user._id);
  res.redirect("/orders");
} catch (err) {
  res.render("user/404");
}
});





router.post("/check-coupon",verifyLogin, async (req, res) => {
	try {
		let total = await userHelpers.getTotalAmount(req.session.user._id);
		  userHelpers.checkCoupon(req.body, total.cartTotal, req.session.user._id).then((response) => {
			if (response.status) {
				req.session.Total = response.totalAmount
				Math.round(response.totalAmount)
				response.totalAmount = Math.round(response.totalAmount);
				response.discount=total.cartTotal-response.totalAmount
			  response.actual=total.cartTotal
        res.json(response)
			} else {
				res.redirect('/place-order')
			}
		});
	} catch (err) {
		res.render("user/404");
	}
});

router.post('/newadd',async (req,res)=>{
  try{
    userHelpers.userAddress(req.body).then(() =>  {
      res.redirect("/profile")
    })
  }catch(err){
    res.render("user/404");
  }

})


router.get('/newadd',(req,res)=>{
  try{
    res.render('user/newadd',{user:req.session.user})
  }
  catch(err){
    res.render("user/404"); 
  }

})



   

   
    
 

module.exports = router;
