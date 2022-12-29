const { response, Router } = require('express');
var express = require('express');
const session = require('express-session');
const { render } = require('../app');

var router = express.Router();
const multer = require("multer");

const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');


const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next();
  } else {
    res.render("admin/admin-login", { adminErr: req.session.loginErr });
    req.session.loginErr = false;
  }
};

let usernamedm='admin@gmail.com';
let passworddm='admin123'


 

  

  router
  .route("/")
  .get((req,res)=>{
    res.render("admin/admin-login")
  })

  router
  .route("/dashboard")
  .get((req,res)=>{
     res.render("admin/myadmin") 
  })
  .post((req,res)=>{
    const username=req.body.username
    const password = req.body.password
    if (username===usernamedm && password===passworddm) {
     res.redirect("/admin/dashboard") 
    }
  })

  router
  .route("/products")
  .get((req,res)=>{
    productHelpers.getAllProducts().then((products)=>{
      console.log(products)
      res.render('admin/view-products',{products});
    })
  })

  
  router.route("/users").get( function (req, res, next) {
    try{
    userHelpers.getAllusers().then((users) => {
      res.render("admin/view-users", { users });
    });
  }catch(err) {
    res.render("admin/404");
  }
});

router.route("/orders").get( function (req, res, next) {
  try{
  userHelpers.getUserOrders().then((orders) => {
     res.render("admin/orders", {orders});
  });
}catch(err) {
  res.render("admin/404");
}
});








    //* PRODUCT =============ADDING==================

    



  router.get("/add-products", function (req, res) {
   console.log("hihihi")
    res.render("admin/add-products");
  })



 
  router.route("/dynamictable").get( function (req, res, next) {
    try{
    userHelpers.getUserOrders().then((orders) => {
       res.render("admin/dynamictable", {orders});
    });
  }catch(err) {
    res.render("admin/404");
  }
  });

     let fileStorageEngine = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, "public/images");
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + "--" + file.originalname);
      },
    });
 


  

      const upload = multer({ storage: fileStorageEngine });
      
      router.post("/add-products", upload.array("image"), async(req, res) => {
        console.log('=====================================================');
        var filenames = req.files.map(function (file) {
          return file.filename;
        });
        req.body.image = filenames;
        await productHelpers.addProduct(req.body).then(() => {

          
        });
      });


      
  
  
            //  DELETE================ PRODUCT=================

    router.get('/delete-product/:id',(req,res)=>{
    try{
      let proId=req.params.id
      console.log(proId);
      productHelpers.deleteProduct(proId).then((response)=>{
          res.redirect('/admin/')
      })
    }catch(err){
      res.render("admin/404");
    }

    })


    //*==========EDIT====== PRODUCT===========================
           
    router.get('/edit-product/:id', async (req, res) => {
      let product = await productHelpers.getproductDetails(req.params.id)
      console.log(product);
      console.log('*******************************************************');
      res.render('admin/edit-product', { product, admin: true })
    })
    
    
    try{
      let fileStorageEngines = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, "public/images");
        },
        filename: (req, file, cb) => {
          cb(null, Date.now() + "--" + file.originalname);
        },
      });
    }catch(err) {
      res.render("admin/404");
      }

router.post('/edit-product/:id', upload.array("image"), async(req, res) => {
  console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
      var filenames = req.files.map(function (file) {
        return file.filename;
      });
      req.body.image = filenames;
      await productHelpers.updateProduct(req.params.id, req.body).then(() => {
        res.redirect('/admin/products')
        })
      })    



//*================== ADMIN====LOGIN==========================================ADMIN_LOGIN==============
router.get('/login',(req,res)=>{
  if(req.session.adminLogged){
    req.session.adminloggedIn = true;
    req.session.admin = response.admin;
    res.redirect('/admin')
  }else {
    res.render('admin/admin-login',{adminErr:req.session.adminErr})
    req.session.adminErr=false
  }
})



router.post('/login',(req,res)=>{
 
   try{
    if(req.body.userName==credentials.userName && req.body.password==credentials.password){
      req.session.adminloggedIn=true
      req.session.admin=response.admin
      if(response.status){
        res.redirect('/')
      }
     }else{
      req.session.logginErr="Invalid user name or Password"
      res.redirect('/login')
    }
  
   }catch{
    res.render("admin/404");
   }

})   





/*admin logout*/ 

router.get('/logout', (req, res)=>{

  req.session.destroy()
  res.redirect('/')
});

// --------------blocking of user---------------


router.get("/block/:id", (req, res) => {
  try{
  let userId = req.params.id;

  userHelpers.blockUser(userId).then(() => {
    req.session.user = null;
    req.session.loggedIn = null;

    res.redirect("admin/view-users");
  });
}catch(err) {
  res.render("admin/404");
}
});

// -------------------unblocking of user----------------


router.get("/unblock/:id", (req, res) => {
  try{
  let userId = req.params.id;
  userHelpers.unblocklUser(userId).then(() => {
    res.redirect("admin/view-users");
  });
}catch(err) {
  res.render("admin/404");
}
});

//**SHIPPED=================CANCELLED========DELEVERED============ */


router.get("/cancel/:id", (req, res) => {
  try{
  productHelpers.cancelOrder(req.params.id).then(() => {
    res.redirect("/admin/dashboard");
  });
}catch(err) {
  res.render("admin/404");
}
});



router.get("/shipp/:id", (req, res) => {
    try{
    productHelpers.shippOrder(req.params.id).then(() => {
      res.redirect("/admin/dashboard");
    });
  }catch(err) {
    res.render("admin/404");
  }
});



router.get("/delivered/:id", (req, res) => {
      try{
      productHelpers.deliverOrder(req.params.id).then(() => {
        res.redirect("/admin/dashboard");
      });
    }catch(err) {
      res.render("admin/404");
    }
  });
    
//post changeStatus
router.post("/changeStatus/:id", async (req, res) => {
try{

await productHelpers
.updateStatus(req.body.changeStatus, req.params.id)
.then(() => {
  res.redirect("/admin/dashboard");
});
}catch(err) {
res.render("admin/404");
}
});


router.get('/chart',(req,res)=>{
  res.render('admin/chart')
})



router.get("/coupon", (req, res) => {
  try{
  productHelpers.getCoupons().then((coupons) => {
    res.render("admin/coupon", { admin: true , coupons});
  })
}catch(err) {
  res.render("admin/404");
}
});




router.post("/coupon", (req, res) => {

    try{
    req.body.users = [];
     productHelpers.addCoupon(req.body).then((response) => {
    res.redirect("/admin/coupon");
    });

  }catch(err) {

    res.render("admin/404");
  }

});












    
    
    
    
     


 module.exports = router;
