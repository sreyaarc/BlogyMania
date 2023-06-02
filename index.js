import express from "express";
const app = express();







app.get("/", (req, res) => {
    res.send("hey there")
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Server started at port "+port);
})