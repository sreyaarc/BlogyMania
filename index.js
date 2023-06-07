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
    password: String
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/", (req, res) => {
    if(req.isAuthenticated()) {
        Blog.find({}).then((docs) => {
            res.render('home', {
                docs: docs,
                logged: "LogOut"
            });
        }).catch((err) => console.log(err));  
    } else {
        Blog.find({}).then((docs) => {
            res.render('home', {
                docs: docs,
                logged: "Login"
            });
        }).catch((err) => console.log(err));  
    }  
});


app.get("/compose", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("compose", {
            logged: "LogOut"
        });
    } else {
        res.redirect("/login")
    }
})

app.post("/compose", (req, res) => {
    // console.log(req.body);
    const newBlog = new Blog({
        imgUrl: req.body.image,
        title: req.body.title,
        content : req.body.content
    });
    newBlog.save().then(() => {
        console.log("saved into the collection")
        res.redirect("/");
    })
    .catch((err) => {
        console.log(err)
    })
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
            res.render("post", {
                logged: "LogOut",
                image: doc.imgUrl,
                title: doc.title,
                content: doc.content
            });
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/register", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("register", {
            logged: "LogOut"
        })
    } else {
        res.render("register", {
            logged: "Login"
        })
    }
    
});

app.get("/Login", (req, res) => {
    res.render("login", {
        logged: "Login"
    }) 
});

app.get("/LogOut", (req, res) => {
    req.logOut((err) => {  // terminates the session
        if(err) {
            console.log(err)
        } else {
            res.redirect("/");
        }
    })
})

app.post("/register", (req, res) => {
    // using passport-local-mongoose to register the user
    console.log(req.body)
    if(req.body.password === req.body.confirmPassword) {
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if(err) {
                console.log(err);
                res.redirect("/register");
            } else {
                // console.log(user)
                console.log("request="+req)
                passport.authenticate("local")(req, res, function() {
                    
                    res.redirect("/");
                });
            };
        });
    } else {
        notifier.notify({
            title: "Alert",
            message: "Passwords doesn't match"
        });
        function redirect() {
            res.redirect("/register");
        }
        setTimeout(redirect, 2000);
    }
    
});

app.post("/Login", passport.authenticate('local', {failureRedirect: "/login"}), function(req,res) {
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(newUser, function(err) {
        if(err) {
            console.log(err);
            res.redirect("/login");
        } else {
            res.redirect("/");
        }
    })

})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Server started at port "+port);
})