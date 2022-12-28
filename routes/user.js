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
   let user=req.session.user
   let cartCount=null
   if(req.session.user){
    cartCount= await userHelpers.getCartCount(req.session.user._id)
   }
  productHelpers.getAllProducts().then((products)=>{
    
    res.render('user/index',{products,user,cartCount});
  })
});
router.get('/men', async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
   cartCount= await userHelpers.getCartCount(req.session.user._id)
  }
 productHelpers.getAllProductsMen().then((products)=>{
   
   res.render('user/men',{products,user,cartCount});
 })
});
router.get('/women', async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
   cartCount= await userHelpers.getCartCount(req.session.user._id)
  }
 productHelpers.getAllProductsWomen().then((products)=>{
   
   res.render('user/men',{products,user,cartCount});
 })
});




router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
     res.redirect('/')
  }else{
    res.render('user/login',{"logginErr":req.session.logginErr})
    req.session.logginErr=false
  }
 
})

router.get('/signup',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/')
  }
  res.render('user/signup',{emailErr:req.session.emailErr})
})


let user;
router.post('/signup',(req,res)=>{
  console.log(req.body);
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
      console.log('dell', totalValue);
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
    console.log('=====================api call',req.params.id);
    try{
     userHelpers.addToCart(req.params.id,req.session.user._id).then((resolve)=>{
      res.json({status:true})
       })
      }catch(err){
        res.render('user/404')
      }
  })  
  
  router.post('/changequantity',(req,res)=>{
          userHelpers.changeProductQuantity(req.body).then(async(response)=>{
            response.total= await userHelpers.getTotalAmount(req.session.user._id)
          res.json(response)
            
          })
  })  
  

  
//*===========remove product========

router.post("/remove-item",verifyLogin, async (req, res) => {
  console.log('remove hitted twice')
  let cartId = req.body.cartId;
  let item = req.body.proId;
  console.log(req.body,"hitted twice");
  await userHelpers.deleteCartProduct(cartId, item).then((response) => {
    res.json( response );
  });
});
router.post("/remove-itemq",verifyLogin, async (req, res) => {
  console.log('remove hitted twice')
  let cartId = req.body.cartId;
  let item = req.body.proId;
  console.log(req.body,"hitted twice");
  await userHelpers.deleteWishProduct(cartId, item).then((response) => {
    res.json( response );
  });
});





  router.get('/place-order',verifyLogin,async(req,res)=>{
   try{

    
    let total= await userHelpers.getTotalAmount(req.session.user._id)
    let savedAddress= await userHelpers.getAddress(req.session.user._id)
    console.log("============ place order=========");
   
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
      let product=await productHelpers.productView(req.params.id)
      res.render('user/multiview',{product,user:true})

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
    res.render('user/order-success',{user:req.session.user})
   })


  router.get('/orders',verifyLogin,async(req,res)=>{
    let orders=await userHelpers.getUserOrders(req.session.user._id)
    res.render('user/orders',{user:req.session.user,orders})
  })

 

  router.get('/view-order-products/:id',async(req,res)=>{
   let product=await userHelpers.getOrderProducts(req.params.id)
   console.log('helloo get',product);
    res.render('user/view-order-products',{user:req.session.user,product})
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
    let product = await userHelpers.getWishlistProducts(req.session.user._id);
		let user = req.session.user._id;
    if(product.length>=1){
      res.render('user/wishlist',{product,user})
    }else{
      res.render('user/emptywish')
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
  let user=await userHelpers.getAddress(req.session.user._id)
  res.render('user/profile',{user})
})
router.get('/updateprofile',verifyLogin,async(req,res)=>{
  let user=await userHelpers.getUserDetails(req.session.user._id)
  res.render('user/updateprofile',{user})
})
//update Password
router.get('/updatePassword',(req,res)=>{
  res.render('user/updatepassword')
})


let passwordchange = true;
router.post("/updatePassword", verifyLogin, async (req, res) => {
  console.log('reached in post method in passwd');
		try {
		await userHelpers
			.updatePassword(req.body, req.session.user._id)
			.then((passwordchange1) => {
				if (passwordchange1) {
					res.redirect("/updatepassword");
				} else {
					console.log("rdiredcting");
					console.log(passwordchange1);
					passwordchange = passwordchange1;
					res.redirect("/updatepassword");
				}
			});
		} catch (err) {
			res.render("user/404");
		}
	});


router.get('/myorder',verifyLogin,async(req,res)=>{
  let user=await userHelpers.getUserDetails(req.session.user._id)
  let order = await userHelpers.getUserOrder(req.session.user._id);
  res.render('user/myorder',{user,order})
})



router.get('/otp',(req, res) => {

  res.render('user/otp')
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
		console.log('req.bodyyyy')
		console.log(req.body)
		let total = await userHelpers.getTotalAmount(req.session.user._id);
		console.log("reached check post 1")

		userHelpers.checkCoupon(req.body, total.cartTotal, req.session.user._id).then((response) => {
			console.log('responseeeeeeeeee')
			console.log(response)
			if (response.status) {
				req.session.Total = response.totalAmount
				Math.round(response.totalAmount)
				response.totalAmount = Math.round(response.totalAmount);
				response.discount=total.cartTotal-response.totalAmount
			           	console.log(total,"have a nice total");
				response.actual=total.cartTotal
                console.log('coupon checkkkkkkkkk');
				console.log(response);
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
  console.log('haii',req.body);
  userHelpers.userAddress(req.body).then(() => 
  {
    res.redirect("/profile")
  })
})


router.get('/newadd',(req,res)=>{
  res.render('user/newadd',{user:req.session.user})
})



   

   
    
 

module.exports = router;
