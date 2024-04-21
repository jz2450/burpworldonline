import express from 'express';
import bodyParser from "body-parser";
import https from 'https';
import http from 'http';
import fs from 'fs';
import mongoose from 'mongoose';

const app = express();




// Your Express app configuration and routes go here
app.use(express.static("public"));
app.use(bodyParser.json());

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
const url = 'mongodb://127.0.0.1:27017/burpworldonline';
try {
  await mongoose.connect(url);
} catch (error) {
  console.error(error);
}

const Schema = mongoose.Schema;
const userSchema = new Schema({
  userID: String,
  userTagPath: String,
  seenThreadIds: [],
})
const userModel = mongoose.model('userModel', userSchema);
const threadSchema = new Schema({
  threadAuthor: String,
  dateCreated: Date,
  posts: [],
})
const threadModel = mongoose.model('threadModel', threadSchema);
// console.log(mongoose);

// CREATE
app.post("/", async (req, res) => {
  try {
    // check if it's new user or new post
    if (req.body.type == "user") {
      const newUserDoc = new userModel({
        userID: req.body.userID,
        userTagPath: req.body.tagPath,
        seenThreadIds: [],
      });
      newUserDoc.save();
      console.log("created new profile", newUserDoc);
      res.status(200).send("created new profile");
    } else if (req.body.type == "thread") {
      const newThreadDoc = new threadModel({
        threadAuthor: req.body.threadAuthor,
        dateCreated: new Date(),
        posts: req.body.posts,
      });
      newThreadDoc.save();
      console.log("created new thread: ", newThreadDoc);
      res.status(200).send("created new thread");
    }
  }
  catch (error) {
    console.log("error while creating on db: ", error);
    res.status(500).send(error);
  }
});

// READ // turned off self filter, now shows all threads , threadAuthor: { $ne: req.query.userID }"
app.get("/thread", async (req, res) => {
  try {
    if (req.query.type == "unseen-threads") {
      // get NEW UNSEEN thread
      const userDoc = await userModel.findOne({
        userID: req.query.userID
      });
      if (!userDoc) {
        res.status(404).send("user not found");
      }
      const seenList = userDoc.seenThreadIds.map(id => new mongoose.Types.ObjectId(id));
      // const seenList = userDoc.seenThreadIds;
      console.log(seenList);
      // Find threads that the user has not seen
      const threadDocs = await threadModel.aggregate([
        { $match: { _id: { $nin: seenList } } },
        { $sort: { dateCreated: -1 } }
      ]);
      console.log(threadDocs);
      if (threadDocs.length < 1) {
        res.status(404).send("No unseen threads");
      } else {
        res.status(200).send(threadDocs);
      }
    } else if (req.query.type == "seen-threads") {
      // get SEEN thread
      const userDoc = await userModel.findOne({
        userID: req.query.userID
      });
      if (!userDoc) {
        res.status(404).send("user not found");
      }
      console.log(userDoc);
      const seenList = userDoc.seenThreadIds.map(id => new mongoose.Types.ObjectId(id));
      // Find threads that the user has not seen
      const threadDocs = await threadModel.aggregate([
        { $match: { _id: { $in: seenList } } },
        { $sort: { dateCreated: -1 } }
      ]);
      console.log(threadDocs);
      if (threadDocs.length < 1) {
        res.status(404).send("No seen threads");
      } else {
        res.status(200).send(threadDocs);
      }
    } else if (req.query.type == "single-thread") {
      const threadToReturn = new mongoose.Types.ObjectId(req.query.threadID);
      const threadDoc = await threadModel.findOne({
        _id: threadToReturn
      });
      console.log(threadDoc);
      if (!threadDoc) {
        res.status(404).send("No seen threads");
      } else {
        res.status(200).send(threadDoc);
      }
    }
  } catch (error) {
  console.log("error while getting a thread: ", error);
  res.status(500).send(error);
}
});

// get user profile
app.get("/user", async (req, res) => {
  try {
    if (req.query.type == "user-threads") {
      // Find threads that the user created
      // TO ADD: profile tags play first
      const threadDocs = await threadModel.find({
        threadAuthor: req.query.userID
      }).sort({dateCreated: -1});
      console.log(threadDocs);
      if (threadDocs.length < 1) {
        res.status(404).send("No threads from this user");
      } else {
        res.status(200).send(threadDocs);
      }
    } else if (req.query.type == "profile") {
      const profile = await userModel.findOne({
        userID: req.query.userID
      });
      if (!profile) {
        res.status(200).send({missing: "profile"});
      } else {
        if (!profile.userTagPath) {
          res.status(200).send({missing: "burp"});
        } else {
          res.status(200).send(profile);
        }
      }
    } else {
      res.status(400).send({ error: "Invalid query type" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "An error occurred while fetching the user: " + err.message });
  }
});


// PUT
app.put("/", async (req, res) => {
  try {
    if (req.body.type == "log-seen") {
      // Add this thread to seen list 
      const updatedUserDoc = await userModel.findOneAndUpdate(
        { userID: req.body.userID },
        { $addToSet: { seenThreadIds: req.body.threadID } },
        { new: true, useFindAndModify: false },
      );
      console.log(updatedUserDoc);
      res.status(200).send(updatedUserDoc);
    } else if (req.body.type == "new-response") {
      // contribute to thread
      const updatedThreadDoc = await threadModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.body.threadID) },
        { $push: { posts: req.body.post } },
        { new: true, useFindAndModify: false },
      );
      console.log(updatedThreadDoc)
      res.status(200).send(updatedThreadDoc)
    } else if (req.body.type == "update-user-tag") {
      // contribute to thread
      const updatedUserDoc = await userModel.findOneAndUpdate(
        { userID: req.body.userID },
        { $set: { userBurpPath: req.body.tagPath } },
        { new: true, useFindAndModify: false },
      );
      console.log(updatedUserDoc)
      res.status(200).send(updatedUserDoc)
    }
  } catch (err) {
    console.error("error while making changes: " + err);
    res.status(500).send("error while making changes: " + err);
  }
})


// DELETE
app.delete("/", async (req, res) => {
  // // not implemented yet

  // try {
  //   // Delete a document
  //   MyModel.findOneAndDelete({ name: 'Jane' }, (err) => {
  //     console.log('Document deleted');
  //   });
  //   res.status(200).send("deleted data")
  // }
  // catch (error) {
  // }
})