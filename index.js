import express from "express";
import { fileURLToPath } from "url";
import {dirname} from "path";
import path from "path";
import mongoose from "mongoose";
import _ from "lodash";
import notifier from "node-notifier";
// import bcrypt from "bcrypt";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({path: path.resolve(__dirname, ".env")});

const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.static(path.join(__dirname,"javascript")));
app.use(express.urlencoded({extended: true}));


// set up express session
app.use(session({
    secret: process.env.MY_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/blogsDB").then(() => {
        console.log("connected")
    }).catch((err) => console.log(err))
}

const blogSchema = new mongoose.Schema({
    imgUrl : String,
    title : String,
    content : String
});
const Blog = mongoose.model("Blog", blogSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    blogs : [blogSchema]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// serialize and deserialize users locally :-
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// serialize and deserialize users authenticated with all types of strategies:-
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});


passport.use(new GoogleStrategy ({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home"
    },
    function(accessToken, refreshToken, profile, cb) {
        // console.log(profile); // shows the entire profile details of the user
        User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value}, function (err, user) {  // if user not found already, creating a user with googleId and googleEmailId
            return cb(err, user);
        });
    }
));



app.get("/", (req, res) => {
    if(req.isAuthenticated()) {
        Blog.find({}).then((docs) => {
            // console.log(docs)
            res.render('home', {
                docs: docs,
                isRegistered: "ME",
                logged: "LogOut"
                
            });
        }).catch((err) => console.log(err));  
    } else {
        Blog.find({}).then((docs) => {
            res.render('home', {
                docs: docs,
                isRegistered: "Register",
                logged: "Login"
            });
        }).catch((err) => console.log(err));  
    }  
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/home', passport.authenticate('google', { failureRedirect: '/login' }), (req,res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
});

app.get("/compose", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("compose", {
            isRegistered: "ME",
            logged: "LogOut"
        });
    } else {
        res.redirect("/login")
    }
});

app.post("/compose", (req, res) => {
    // console.log(req.user);
    const newBlog = new Blog({
        imgUrl: req.body.image,
        title: req.body.title,
        content : req.body.content
    });
    if(req.user.googleId != null) {
        User.findByIdAndUpdate(req.user._id, {$push: {blogs: newBlog}}).then((updatedUser) => {
            newBlog.save().then(() => {
                console.log("saved into the collection")
                res.redirect("/");
            })  
        })
        .catch((err) => {
            console.log(err)
        });
    } else {
        User.findOneAndUpdate({username: req.user.username}, {$push: {blogs: newBlog}}).then((updatedUserByName) => {
            newBlog.save().then(() => {
                console.log("saved into the collection")
                res.redirect("/");
            })
        }).catch((err) => {
            console.log(err)
        });
    }
});

app.get("/blogs/:blogTitle", (req, res) => {
    const reqBlog = _.lowerCase(req.params.blogTitle)
    res.set(
        'Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if(req.isAuthenticated()) {
        // console.log(req.body);
        // Blog.find({}).then((docs) => {
        //     docs.forEach((doc) => {
        //         if( doc.title == req.params.blogTitle) {
        //             res.render("post", {
        //                 logged: "LogOut",
        //                 image: doc.imgUrl,
        //                 title: doc.title,
        //                 content: doc.content
        //             });
        //             res.end();
        //         }
        //     });

        // }).catch((e) => console.log(e));

        Blog.findOne({title: req.params.blogTitle}).then((doc) => {
            // console.log(fname)
            res.render("post", {
                isRegistered: "ME",
                logged: "LogOut",
                blog: doc,
                image: doc.imgUrl,
                title: doc.title,
                content: doc.content
            });
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/ME", (req, res) => {
    // console.log("req.user = ", req.user)
    if(req.user) {  // if the user is defined
        if((req.user.googleId != null)) {  // if the user is authenticated by google, then the user will have a googleId
            User.findById(req.user._id).then((foundUser) => {
                // console.log("foundUser = "+foundUser)
                if(foundUser) {
                    res.render("account", {
                        logged: "LogOut",
                        username: foundUser.username,
                        docs: foundUser.blogs
                    });
                } else {
                    res.redirect("/login")
                }    
            }).catch((err) => {
                console.log(err)
            });
        } else if(req.user.googleId == null) {  // whereas users registered using local strategy(by logging in manually using their emailId) wont have a googleId, hence finding them using username
            User.findOne({username: req.user.username}).then((foundUserByName) => {
                // console.log("foundUserByName = "+foundUserByName)
                if(foundUserByName) {
                    res.render("account", {
                        logged: "LogOut",
                        username: foundUserByName.username,
                        docs: foundUserByName.blogs
                    });
                } else {
                    res.redirect("/login")
                }  
            }).catch((err) => {
                console.log(err)
            });
        }
    } else {  //if the user is undefined
        res.redirect("/login")
    }
});


app.get("/register", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("register", {
            isRegistered: "ME",
            logged: "LogOut"
        });
    } else {
        res.render("register", {
            isRegistered: "Register",
            logged: "Login"
        });
    }
    
});

app.get("/Login", (req, res) => {
    res.render("login", {
        isRegistered: "Register",
        logged: "Login"
    }); 
});

app.get("/LogOut", (req, res) => {
    req.logOut((err) => {  // terminates the session
        if(err) {
            console.log(err)
        } else {
            res.redirect("/");
        }
    });
});

app.post("/register", (req, res) => {
    // using passport-local-mongoose to register the user
    // console.log("register details = " + req.body)
    if(req.body.password === req.body.confirmPassword) {
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if(err) {
                console.log(err);
                res.redirect("/register");
            } else {
                // console.log(user)
                // console.log("request=" + req)
                passport.authenticate("local")(req, res, function() {
                    res.redirect("/login");
                });
            };
        });
    } else {
        notifier.notify({
            title: "Alert",
            message: "Password doesn't match"
        });
        function redirect() {
            res.redirect("/register");
        }
        setTimeout(redirect, 2000);
    }
    
});

app.post("/Login", passport.authenticate('local', {failureRedirect: "/login"}), function(req,res) {
    User.findOne({username: req.body.username}).then((foundUser) => {
        const newUser = new User({
            username: req.body.username,
            password: req.body.password,
            blogs: foundUser.blogs
        });
        req.login(newUser, function(err) {
            if(err) {
                console.log(err);
                res.redirect("/login");
            } else {
                res.redirect("/");
            }
        });
    });
});

app.post("/delete", (req, res) => {
    const deleteId = req.body.deleteId;
    // console.log("doc = ", deleteId);
    // console.log("req.user = ",req.user)

    Blog.findByIdAndDelete(deleteId).then((doc) => {  // deleting from the home page
        // console.log(doc)
        console.log("deleted from home page");
    }).catch((e) => console.log(e));

    const query = {username: req.user.username};
    User.findOneAndUpdate(query, {$pull: {blogs: {_id: deleteId}}}).then(() => {  // deleting from the user account
        console.log("deleted from the user");
        res.redirect("/ME");
    }).catch((e) => console.log(e));
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Server started at port "+port);
});