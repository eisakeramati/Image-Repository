const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const app = express();
const session = require("express-session");
const passport = require("passport");
const multer = require("multer");
const passportLocalMongoose = require("passport-local-mongoose");

app.set('view engine', 'ejs');

app.use(session({
    secret: "my image repository.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-eisa:mongorye13@cluster0.4vxhn.mongodb.net/userImRepo?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    images: [{
        img: String,
        desc: String,
        location: String,
        Date: String
    }]
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.png')
    }
})

var upload = multer({storage: storage})

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('profile', {images: req.user.images});
    } else {
        res.render('main', {opt: 0});
    }
});

app.get("/register", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('profile', {images: req.user.images});
    } else {
        res.render('main_signup', {opt: 0});
    }
});

app.get("/profile", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('profile', {images: req.user.images});
    } else {

    }
});

app.get("/upload", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('upload', {opt: 1});
    } else {

    }
});

app.post("/profile", function (req, res) {
    query = req.body.description;
    list = []
    req.user.images.map(x=> x.desc.includes(query) ? list.push(x) : null);
    res.render('profile', {images: list});
});

app.post("/delete", function (req, res) {
    query = req.body.id;
    list = []
    if (req.isAuthenticated()) {
        User.updateOne(
            {_id: req.user._id},
            {
                $set: {
                    images: req.user.images.filter(x=> x._id != query)
                }
            }
            , function (err) {
                if (err) {
                    console.log(err);
                    console.log("error")
                }
                ;
            });
    }
    res.render('profile', {images: list});
});

app.get("/logout", function (req, res) {
    if (req.isAuthenticated()) {
        req.logout();
        res.redirect("/");
    } else {

    }
});

app.get("/about", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("about");
    } else {

    }
});

app.post("/", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            res.render('auth', {
                opt: 1
            });
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.render("profile", {images: req.user.images});
            });
        }
    });
});

app.post('/upload', upload.single('myFile'), (req, res, next) => {
    const file = req.file
    // console.log(req.body.loc)
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    if (req.isAuthenticated()) {
        User.updateOne(
            {_id: req.user._id},
            {
                $set: {
                    images: [...req.user.images, { img:req.file.filename, desc:req.body.desc, location:req.body.loc, Date:req.body.date}]
                }
            }
            , function (err) {
                if (err) {
                    console.log(err);
                    console.log("error")
                }
                ;
            });
    }
    res.render('profile', {images: req.user.images});
})


app.post("/register", function (req, res) {
    User.register({username: req.body.username}, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.render("profile", {images: req.user.images});
            })
        }
    });
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});

