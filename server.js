import express from 'express';
import bodyParser from "body-parser";
import https from 'https';
import fs from 'fs';
import archiver from 'archiver';
import { initializeApp } from "firebase/app";
import { getStorage, ref } from "firebase/storage";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAsjqIoD03-oGah19E0ng2L9PzqTrUMPko",
  authDomain: "burp-world-online.firebaseapp.com",
  projectId: "burp-world-online",
  storageBucket: "burp-world-online.appspot.com",
  messagingSenderId: "174854073314",
  appId: "1:174854073314:web:84050fb07c1208e25627bb"
};
const firebase = initializeApp(firebaseConfig);
const storage = getStorage();

const app = express();

// Your Express app configuration and routes go here
app.use(express.static("public"));
app.use(bodyParser.raw({ limit: '10mb' }));

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

// Create an HTTPS server with the Express app
const httpsServer = https.createServer(credentials, app);

// provide client with mock audio urls
app.get('/mocks', (req, res) => {
  res.send(mockAudioUrlArray);
});

// get folder of audio files from 24 hours ago
app.get('/feed', (req, res) => {
  const folderPath = './audio';
  // Read the files in the folder
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading folder');
    }
    // Filter files based on your condition
    let timeThreshold = Date.now() - 86400000; // 24 hours previous
    const filteredFiles = files.filter(file => {
      const fileNameWithoutExtension = file.split('.')[0];
      const fileNumber = parseInt(fileNameWithoutExtension);
      return !isNaN(fileNumber) && fileNumber > timeThreshold;
    });
    const zipStream = fs.createWriteStream('filtered_files.zip');
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level
    });
    archive.pipe(zipStream);

    // Append filtered files to the archive
    filteredFiles.forEach(file => {
      const filePath = `${folderPath}/${file}`;
      archive.append(fs.createReadStream(filePath), { name: file });
    });

    // Finalize the archive
    archive.finalize();

    // Set headers for the response
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=filtered_files.zip');

    // Pipe the zip stream to the response
    zipStream.pipe(res);
  });
});

const rawParser = bodyParser.raw();
// receive audio blobs to save
app.post('/upload', rawParser, (req, res) => {
  console.log("body: ", req.body);
  if (!req.body) { // || !req.body.audioBlob
    return res.status(400).json({ error: 'Audio data is missing' });
  }
  fs.writeFile('./audio/' + Date.now() + '.wav', req.body, function (err) {
    if (err) console.log(err);
    else console.log("It's saved!");
  });
  res.status(200).json({ message: 'Audio file uploaded successfully' });
});

// Start the server
httpsServer.listen(443, () => {
  console.log('HTTPS server running on port 443');
});

// mock audio urls, in order
const mockAudioUrlArray = [
  "/burpworldmockaudio/burp7.aif",
  "/burpworldmockaudio/response1.aif",
  "/burpworldmockaudio/response2.aif",
  "/burpworldmockaudio/response3.aif",
  "/burpworldmockaudio/response4.aif",
  "/burpworldmockaudio/response5.aif",
  "/burpworldmockaudio/response6.aif"
]

