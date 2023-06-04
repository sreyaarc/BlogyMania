import express from "express";
import { fileURLToPath } from "url";
import {dirname} from "path";
import path from "path";
import mongoose from "mongoose";
import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/blogsDB").then(() => {
        console.log("connected")
    }).catch((err) => console.log(err))
}

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.static(path.join(__dirname,"javascript")));
app.use(express.urlencoded({extended: true}));

const blogSchema = new mongoose.Schema({
    imgUrl : String,
    title : String,
    content : String
})

const Blog = mongoose.model("Blog", blogSchema);


app.get("/", (req, res) => {
    Blog.find({}).then((docs) => {
        res.render('home', {
            docs: docs
        });
    }).catch((err) => console.log(err));
});

app.get("/compose", (req, res) => {
    res.render("compose");
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
    // console.log(req.params)
    const reqBlog = _.lowerCase(req.params.blogTitle)
    Blog.find({}).then((docs) => {
        docs.forEach((doc) => {
            const docTitle = _.lowerCase(doc.title);
            if(docTitle == reqBlog) {
                res.render("post", {
                    image: doc.imgUrl,
                    title: doc.title,
                    content: doc.content
                });
            }
        });   
    }).catch((e) => console.log(e));
});





const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Server started at port "+port);
})