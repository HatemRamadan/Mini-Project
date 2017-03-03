var express = require("express");
var passport = require("passport");
var User = require("./models/user");
var router = express.Router();
var multer = require("multer");
var pathh = require("path");
var profilePicsModel = require("./models/profilePic");
var works_imgs = require("./models/works_imgs");
var works_links = require("./models/works_links");
var works = require("./models/works");
var fs = require("fs");


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("info", "You must be logged in to see this page.");
    res.redirect("/login");
  }
}

router.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});

router.get("/", function(req, res, next) {
  User.find({hasPortfolio:1},function(err, users) {
    if (err) { return next(err); }
    var totalStudents = users.length;
    var pageSize = 10;
    var pageCount = Math.ceil(totalStudents/pageSize);
    var currentPage =1;
    var students = users;
    var studentsArrays = []; 
    var studentsList = [];


  //split list into groups
  while (students.length > 0) {
      studentsArrays.push(students.splice(0, pageSize));
  }

  //set current page if specifed as get variable (eg: /?page=2)
  if (typeof req.query.page !== 'undefined') {
    currentPage = +req.query.page;
  }

  //show list of students from group
  studentsList = studentsArrays[+currentPage - 1];

  //render index.ejs view file
  res.render('index', {
    students: studentsList,
    pageSize: pageSize,
    totalStudents: totalStudents,
    pageCount: pageCount,
    currentPage: currentPage
  });



  });
});

router.get("/login", function(req, res) {
  res.render("login");
});

router.post("/login", passport.authenticate("login",{failureRedirect:"/login",failureFlash: true}), function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    
    req.flash("info","login successful!");
    res.redirect("/");
  });

router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

router.get("/signup", function(req, res) {
  res.render("signup");
});

//image
var storage = multer.diskStorage({
 destination: function(req, file, cb) {
   cb(null, 'public/img/')
 },
 filename: function(req, file, cb) {
   cb(null,req.body.username+"-"+Date.now());
 }
});

var upload = multer({
 storage: storage
});


router.post("/signup",upload.any(), function(req, res, next) {

  var username = req.body.username;
  var password = req.body.password;
  var name = req.body.name;
  var bio = req.body.bio;
  if(req.files[0]){
    var path = req.files[0].path;}
    else{
      var path = "";
    }

  //profile Pic
  if(path!=""){

    var a = new profilePicsModel;

    a.img.data = fs.readFileSync(path);
    fs.unlinkSync(path);
    a.img.contentType = 'image/'+pathh.extname(req.files[0].originalname);
    a.username = username;

    a.save(function (err, a) {
      if (err) throw err;});}

    User.findOne({ username: username }, function(err, user) {

      if (err) { return next(err); }
      if (user) {
        req.flash("error", "User already exists");
        return res.redirect("/signup");
      }

      var newUser = new User({
        username: username,
        password: password,
        displayName: name,
        bio: bio,
        profilePic: path
      });
      newUser.save(next);

    });
   
  }, passport.authenticate("login"), function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    
    req.flash("info","Thank you, "+req.body.name+"! You've successfully signed up.");
    res.redirect("/");
  }); 

//To-do 
router.get("/users/:username", function(req, res, next) {
  profilePicsModel.findOne({username: req.params.username}, function(err, pic){
    if(err){return next(err);}
    if(pic){ var picture = pic; 
    }
    User.findOne({ username: req.params.username }, function(err, user) {
      if (err) { return next(err); }
      if (!user) {console.log("404 in get"); return next(404);}
      
      /*works_links.find({username: req.params.username}).exec(function(err, links) {
    if (err) { return next(err); }

    works_imgs.find({username: req.params.username}).exec(function(err, imgs) {
      if (err) { return next(err); }*/


      res.render("profile", { user: user, pic: picture});

    });  
  });  

});


router.get("/edit", ensureAuthenticated, function(req, res) {
  res.render("edit");
});


router.post("/edit",upload.any(), ensureAuthenticated, function(req, res, next) {
  if(req.files[0]){
    var path = req.files[0].path;
    var b = fs.readFileSync(path);
    fs.unlinkSync(path);
    var c = 'image/'+pathh.extname(req.files[0].originalname);

    profilePicsModel.findOne( { username: req.user.username },function(err, pic_model) {
      if (err) { return next(err); }
      
      if (!pic_model) {
       var a = new profilePicsModel;
       a.img.data = b;
       a.img.contentType = c;
       a.username = req.user.username;

       a.save(function (err, a) {
        if (err) throw err;});
     }
     else {
      pic_model.img.data = b;
      pic_model.img.contentType = c;
      pic_model.save(function (next) {
        if (err) throw err;});
    }
  });
  }

  var name = req.body.other3;

  User.findOne({username: req.user.username },function(err, user) {
    if (err) { return next(err); }
    if (!user) {}
      user.displayName = name ;
    user.save(function (next) {
      if (err) throw err;});
  });


  req.flash("info", "Profile updated!");
  res.redirect("/users/"+req.user.username);
});

router.get("/add",function(req, res){
  res.render("add");
});

router.post("/add",upload.any(), function(req, res, next) {
  if(req.files[0]){
    var path = req.files[0].path;
    var title = req.body.title;
    var username = req.user.username; 
    var data = fs.readFileSync(path);
    fs.unlinkSync(path);
    var type = 'image/'+pathh.extname(req.files[0].originalname);
    User.findOne({username:username},function(err,user){
      var proj = new works({
        title:title,
        img:{data:data,contentType:type}
      });
      user.works.push(proj);
      user.save(next);
    });
  }
  else
  {
    var link = req.body.other3;
    var username = req.user.username;
    var title = req.body.title;

    User.findOne({username:username},function(err,user){
      var proj = new works({
        title:title,
        link:link
      });
      user.works.push(proj);
      user.save(next);
    });

  }
  res.redirect("users/"+username);

});

router.get("/createPortfolio",function(req, res){
  res.render("createPortfolio");
});

router.post("/createPortfolio",upload.any(),function(req, res, next){

  User.findOne({ username: req.user.username }, function(err, user) {
    if (err) { return next(err); }
    if (!user) { return next(404);}
    var flag = user.hasPortfolio;
    user.hasPortfolio = 1;
    user.save(next);
  });

  if(req.files[1]){
    var path = req.files[0].path;
    var path2 = req.files[1].path;
    var title = req.body.title;
    var username = req.user.username; 


    var data = fs.readFileSync(path2);
    var type = 'image/'+pathh.extname(req.files[1].originalname);
    User.findOne({username:username},function(err,user){
      var proj = new works({
        title:title,
        img:{data:data,contentType:type}
      });
      user.works.push(proj);
      user.save(next);
    }); 
    var a = new profilePicsModel;
    a.img.data = fs.readFileSync(path);
    a.img.contentType = 'image/'+pathh.extname(req.files[0].originalname);
    a.username = username;
    a.save(function (err, a) {
      if (err) throw err;});
  fs.unlinkSync(path);
  fs.unlinkSync(path2);
  }

  else {
    if(req.body.other3&&req.files[0]&&!req.files[1])
   {var path = req.files[0].path;
    var link = req.body.other3;
    var username = req.user.username;
    var title = req.body.title;
    var a = new profilePicsModel;
    a.img.data = fs.readFileSync(path);
    a.img.contentType = 'image/'+pathh.extname(req.files[0].originalname);
    a.username = username;
    a.save(function (err, a) {
      if (err) throw err;});    
    
    User.findOne({username:username},function(err,user){
      var proj = new works({
        title:title,
        link:link
      });
      user.works.push(proj);
      user.save(function (err, user) {
      if (err) throw err;}); 
    });
   fs.unlinkSync(path);
  }
  else{
    if(req.body.other3&&!req.files[0]){
      var link = req.body.other3;
      var title = req.body.title;
      var username = req.user.username;
      User.findOne({username:req.user.username},function(err,user){
      var proj = new works({
        title:title,
        link:link
      });
      user.works.push(proj);
      user.save(function (err, user) {
      if (err) throw err;}); 
    });
     
    }
    else{
      if(!req.body.other3&&!req.files[1]&&req.files[0]){
        var title = req.body.title;
        var username = req.user.username;
        var path = req.files[0].path;
        var data = fs.readFileSync(path);

        var contentType = 'image/'+pathh.extname(req.files[0].originalname);
        User.findOne({username:req.user.username},function(err,user){
        var proj = new works({
        title:title,
        img:{data:data,contentType:contentType}
      });
      user.works.push(proj);
      user.save(function (err, user) {
      if (err) throw err;}); 
    });        
      fs.unlinkSync(path);
      }
    }
  } 
}
  req.flash("info","Your portfolio was successfully created");
  res.redirect("users/"+username);

});

module.exports = router;
