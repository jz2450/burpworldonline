import express from 'express';
// import bodyParser from "body-parser";
import https from 'https';
import http from 'http';
import fs from 'fs';
import mongoose from 'mongoose';

const app = express();




// Your Express app configuration and routes go here
app.use(express.static("public"));
// app.use(bodyParser.raw({ limit: '10mb' }));

// If the user just goes to the "route" / then run this function
// app.get("/", function (req, res) {
//   res.send("this is josh's thesis project :)");
// });

// Read the SSL certificate and key files
const privateKey = fs.readFileSync('./ssl/burpworld_online.key', 'utf8');
const certificate = fs.readFileSync('./ssl/burpworld_online.crt', 'utf8');
const ca = fs.readFileSync('./ssl/burpworld_online.ca-bundle', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

const httpApp = express();

httpApp.get("*", function (req, res, next) {
  res.redirect("https://" + req.headers.host + req.path);
});

http.createServer(httpApp).listen(80, function () {
  console.log("HTTP server listening on port 80");
});

// Create an HTTPS server with the Express app
const httpsServer = https.createServer(credentials, app);

// Start the server
httpsServer.listen(443, () => {
  console.log('HTTPS server running on port 443');
});

// // mock audio urls, in order
// const mockAudioUrlArray = [
//   "/burpworldmockaudio/burp7.aif",
//   "/burpworldmockaudio/response1.aif",
//   "/burpworldmockaudio/response2.aif",
//   "/burpworldmockaudio/response3.aif",
//   "/burpworldmockaudio/response4.aif",
//   "/burpworldmockaudio/response5.aif",
//   "/burpworldmockaudio/response6.aif"
// ]

// DB 
//mongo
const url = 'mongodb://localhost:27017/burpworldonline';
mongoose.connect(url);
const Schema = mongoose.Schema;
const userSchema = new Schema({
  firebaseUserID: String,
  userThreads: [],
  seenThreads: [],
})
const userModel = mongoose.model('userModel', userSchema);
const threadSchema = new Schema({
  threadID: String,
  dateCreated: Date,
  postUrls: [],
})
const threadModel = mongoose.model('threadModel', threadSchema);
// console.log(mongoose);

app.get("/", async (req, res) => {
  try {// // Find a document
    MyModel.findOne({ username: 'John' }, (err, doc) => {
      if (err) {
        console.error(err);
        res.status(500).send(err);
      } else {
        console.log(doc);
        res.status(200).send(doc);
      }
    });
  }
  catch (error) {
  }
});


// Create record API
app.post("/", async (req, res) => {
  try {
    // // Create a new document
    const myDocument = new MyModel({ username: 'John' });
    myDocument.save();
    console.log("created new profile", myDocument);
    res.status(200).send("created new profile");
  }
  catch (error) {
  }
});


// Update record API
app.put("/", async (req, res) => {
  try {
    // // Update a document
    MyModel.findOneAndUpdate({ name: 'John' }, { name: 'Jane' }, (err, doc) => {
      console.log(doc);
    });
    res.status(200).send("updated data")
  }
  catch (error) {
  }
})


// Delete record API
app.delete("/", async (req, res) => {
  try {
    // Delete a document
    MyModel.findOneAndDelete({ name: 'Jane' }, (err) => {
      console.log('Document deleted');
    });
    res.status(200).send("deleted data")
  }
  catch (error) {
  }
})