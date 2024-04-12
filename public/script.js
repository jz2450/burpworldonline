
// firebase check if someone is logged in already
// written manual
// info button
// check if phone number is valid before going to captcha
// implement sound when jogwheel past threshold to skip
// implement an end of queue sound
// implement loading sounds FIGURE OUT "LOADING"
// sound for an empty feed?? paused??
// how do you refresh?
// notification when new burp uploaded
// audio mic input problems
// clean up microphone sound, too artifacty
// synthesis, not audio files
// animate joshjoshjosh logo to left
// button labels keep shifting??
// turn on and off voice cues
// fix error throwing as success in db helpers
// format errors from server endpoints
// clickable threads
// profiles should have all posts not just threads
// tutorial flow
// delete


// RIGHT NOW vvv
// develop ux flow
// loadFeed from db
// stop button should interrupt everything
// sound not working mobile :/

// JOGG.JS
import { audioContext, Content, Reactive, Ambient } from "./jogg.js";

// FIREBASE
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL, list, listAll } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// MAIN FLOW BEGINS

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAsjqIoD03-oGah19E0ng2L9PzqTrUMPko",
    authDomain: "burp-world-online.firebaseapp.com",
    projectId: "burp-world-online",
    storageBucket: "burp-world-online.appspot.com",
    messagingSenderId: "174854073314",
    appId: "1:174854073314:web:84050fb07c1208e25627bb"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const storage = getStorage();
const auth = getAuth();
// auth
let burpuid;
auth.languageCode = 'en';
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'login-button', {
    'size': 'invisible',
    'callback': (response) => {
        console.log("reCAPTCHA solved, allow signInWithPhoneNumber");
    }
});
const loginPrompt = document.getElementById("login-prompt");
const loginInput = document.getElementById("login-input");
const loginButton = document.getElementById("login-button");
const verifyButton = document.createElement('button');
verifyButton.id = 'verify-button';
verifyButton.className = 'login-buttons';
verifyButton.textContent = 'Start burping';
// ENTER KEY
loginInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        loginButton.click();
    }
});
//  CHECK FOR PREVIOUS SIGN IN // saving this for later
// if (auth.currentUser) {
//     // skip login
//     console.log("User previously logged in");
// } else console.log("no user logged in");

// BUTTON SETUP
let jogwheel = document.getElementById('jogwheel');
let stopButton = document.getElementById('stopButton');
let playButton = document.getElementById('playButton');
let recordButton = document.getElementById('recButton');

// RECORDING SETUP
let mediaRecorder;
let micStream;

// AMBIENT FILE NAMES
let ambientSheet = {
    loading: "/cues/loadingloop.mp3",
    profile: "/cues/profileloop.mp3",
    thread: "/cues/threadloop.mp3",
}
// REACTIVE FILE NAMES
let reactiveSheet = {
    autonext: "/cues/autonext.mp3",
    autoprev: "/cues/autoprev.mp3",
    back: "/cues/back.mp3",
    error: "/cues/error.mp3",
    nextcloser: "/cues/nextcloser.mp3",
    nextopener: "/cues/nextopener.mp3",
    prevcloser: "/cues/prevcloser.mp3",
    prevopener: "/cues/prevopener.mp3",
    recordstart: "/cues/recordstart.mp3",
    select: "/cues/select.mp3",
    sourceburp: "/cues/sourceburp.mp3",
    splash: "/cues/splash.mp3",
    success: "/cues/success.mp3",
}


// LOAD IN UI ELEMENTS
let ambientLoaded = false;
let reactiveLoaded = false;
let ambientObject = new Ambient(ambientSheet);
ambientObject.load(ambientSheet).then(() => {
    console.log("Ambient cues loaded: " + ambientObject);
    ambientLoaded = true;
})
let reactiveObject = new Reactive(reactiveSheet);
reactiveObject.load(reactiveSheet).then(() => {
    console.log("Reactive cues loaded: " + reactiveObject);
    reactiveLoaded = true;
})
const contentObject = new Content();


// MAIN FLOW
function main() { // to be called after log in authorised
    // hide captcha
    document.body.classList.add('authenticated');
    // animate card to go to the left, bring up buttons
    document.getElementById('main-card').classList.add('animateToLeft');


    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            stream.getTracks().forEach(track => track.stop());
            micStream = stream;
            audioContext.resume(); // for chrome

            reactiveObject.trigger("splash", () => {
                // trigger loading loop
                // console.log("callback from splash!");

                reactiveObject.trigger("ready"); // this should actually be attached to the load function instead of the previous trigger function
                // maybe with the loading loop
            });

            // check db for user account
            // if not, onboardingFlow()
            // if yes, loadUnseenFeed()
                // if all seen, loadSeenFeed()
                // *click* goToUserProfile()


            // back press and hold back to home
            // back press once to pause
            // back press again to go back (SAVES PLACE)


            loadFeed();
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}




// BUTTON EVENT LISTENERS
// login button
loginButton.addEventListener('click', submitPhoneNumber);

function submitPhoneNumber() {
    const phoneNumber = loginInput.value;
    const appVerifier = window.recaptchaVerifier;
    console.log("phone number: " + phoneNumber);
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((confirmationResult) => {
            // SMS sent. Prompt user to type the code from the message, then sign the
            // user in with confirmationResult.confirm(code).
            console.log(confirmationResult);
            const sentCodeId = confirmationResult.verificationId;
            // clear out field and reconfig button
            // loginButton.removeEventListener('click', submitPhoneNumber);
            loginPrompt.innerHTML = "ENTER VERIFICATION CODE";
            loginInput.value = "123456"; // set to "" for production
            loginInput.placeholder = "Code";

            loginButton.parentNode.replaceChild(verifyButton, loginButton);
            // loginButton.innerHTML = "Log in";
            verifyButton.addEventListener('click', () => {
                submitVerificationNumber(confirmationResult);
            });
        }).catch((error) => {

            console.log("SMS not sent: " + error);

            document.getElementById("login-message").innerHTML = "Please enter a valid phone number with area code.";
            // Error; SMS not sent
            // ...
            // Or, if you haven't stored the widget ID:
            window.recaptchaVerifier.render().then(function (widgetId) {
                grecaptcha.reset(widgetId);
            });
        });
}

function submitVerificationNumber(confirmationResult) {
    console.log("verify button clicked");
    const code = loginInput.value;
    confirmationResult.confirm(code).then(function (result) {
        var user = result.user;
        burpuid = user.uid;
        console.log(user);
        console.log("User signed in successfully: " + burpuid);
        main(); // commented out for dev
    }).catch(function (error) {
        console.error("Error while verifying the code", error);
        document.getElementById("login-message").innerHTML = "Could not verify code, please try again.";
    });
}

// INTERFACE BUTTONS

// play button
// playButton.addEventListener('click', async () => {
//     // reactiveObject.trigger('play');
//     if (contentObject && !contentObject.isPlaying) {
//         contentObject.play();
//     }
// });

// // record button
// ['mousedown', 'touchstart'].forEach(function (e) {
//     recordButton.addEventListener(e, function () {
//         reactiveObject.trigger("prerecord", () => {
//             console.log("recording now");
//             startRecording();
//         })
//     })
// });

// ['mouseup', 'touchend'].forEach(function (e) {
//     recordButton.addEventListener(e, function () {
//         // check if we're still in prerecord stage
//         if (isRecording) {
//             stopRecording();
//         } else if (reactiveObject.isPlaying) {
//             console.log("recording cancelled");
//             reactiveObject.interrupt();
//         }

//     });
// });

// stop button
// stopButton.addEventListener('click', () => {
//     // reactiveObject.trigger('pause');
//     if (contentObject.isPlaying) {
//         contentObject.pause();
//     }
// })

// jogwheel
jogwheel.addEventListener('input', jogwheelMoved);
jogwheel.addEventListener('change', jogwheelMoved);

function jogwheelMoved() {
    // jogwheel value is 0 - 1.0
    if (contentObject.isPlaying) {
        contentObject.scrub(jogwheel.value);
    }
}


// reset jogwheel when released
['mouseup', 'touchend'].forEach(function (e) {
    jogwheel.addEventListener(e, function () {
        // console.log("mouse up");
        jogwheel.value = 0.5;
        if (contentObject.isPlaying) {
            contentObject.scrub(jogwheel.value);
        }
    });
});

let recButtonDiv = document.getElementById("recButtonDiv");
let playButtonDiv = document.getElementById("playButtonDiv");
let stopButtonDiv = document.getElementById("stopButtonDiv");

// adding animations on click
['mousedown', 'touchstart'].forEach(function (e) {
    recButtonDiv.addEventListener(e, function () {
        recordButton.classList.add('button-clicked');
        reactiveObject.trigger("prerecord", () => {
            console.log("recording now");
            startRecording();
        })
    });
    playButtonDiv.addEventListener(e, function () {
        playButton.classList.add('button-clicked');
    });
    stopButtonDiv.addEventListener(e, function () {
        stopButton.classList.add('button-clicked');
    });
});

['mouseup', 'touchend'].forEach(function (e) {
    recButtonDiv.addEventListener(e, function () {
        recordButton.classList.remove('button-clicked');
        // check if we're still in prerecord stage
        if (isRecording) {
            stopRecording();
        } else if (reactiveObject.isPlaying) {
            console.log("recording cancelled");
            reactiveObject.interrupt();
        }
    });
    playButtonDiv.addEventListener(e, function () {
        playButton.classList.remove('button-clicked');
        // reactiveObject.trigger('play');
        if (contentObject && !contentObject.isPlaying) {
            contentObject.play();
        }
    });
    stopButtonDiv.addEventListener(e, function () {
        stopButton.classList.remove('button-clicked');
        if (contentObject.isPlaying) {
            contentObject.pause();
        }
    });
});



// HELPER FUNCTIONS

const mockpaths = [
    "mockaudio/burp5.aif",
    "mockaudio/response6.aif",
    "mockaudio/response3.aif",
    "mockaudio/response5.aif"
];

function loadFeed(callback) {
    getAllAudioRefs()
        .then((refArray) => { return getUrlsFromRefs(refArray) })
        .then((urls) => {
            contentObject.reset();
            contentObject.loadContentFromUrls(urls);
        })
        .then(() => {
            // console.log(contentObject);
            if (callback) callback();
        })
        .catch(error => {
            console.error('Error loading audio:', error);
        });
}

let threadQueue;
// thread >> post >> ref
async function newLoadFeed(callback) { // working on this 7/4
    try {
        
        let threads = await dbGetUnseenThreads(burpuid); // returns an array of threads
        if (threads.length < 1) {
            throw new Error("no new threads");
        } else {
            console.log(threads);
            threadQueue = threads;
            let postArray = [...threadQueue.shift().posts];
            let storageRefs = postArray.map(post => post.storageRef);
            let urls = await getUrlsFromRefs(storageRefs);
            contentObject.reset();
            contentObject.loadContentFromUrls(urls);
            if (callback) callback();
        }
    } catch (error) {
        console.error('Error loading audio:', error);
    }

}

async function loadNextThread(callback) {
    // play reactive cue for next thread
    // play loading ambient cue
    try {
        if (threadQueue.length < 1) {
            throw new Error("no more threads");
        } else {
            let postArray = [...threadQueue.shift().posts];
            let storageRefs = postArray.map(post => post.storageRef);
            let urls = await getUrlsFromRefs(storageRefs);
            contentObject.reset();
            contentObject.loadContentFromUrls(urls);
            if (callback) callback();
        }
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

async function getPageOfAudioRefs() {
    // Create a reference under which you want to list
    const listRef = ref(storage, 'audio');
    const firstPage = await list(listRef, { maxResults: 20 });
    // console.log(firstPage.items);
    return firstPage.items;

    // Fetch the second page if there are more elements.
    // if (firstPage.nextPageToken) {
    //   const secondPage = await list(listRef, {
    //     maxResults: 100,
    //     pageToken: firstPage.nextPageToken,
    //   });
    //   // processItems(secondPage.items)
    //   // processPrefixes(secondPage.prefixes)
    // }
}

async function getAllAudioRefs() {
    const listRef = ref(storage, 'audio');
    const res = await listAll(listRef);
    // console.log(res.items);
    return res.items;
}

async function getUrlsFromPaths(sourcePathArray) {
    let urls = [];
    sourcePathArray.forEach((path) => {
        urls.push(getCdnURL(path));
    });
    try {
        const results = await Promise.all(urls);
        console.log("All urls gotten successfully");
        return results;
    } catch (error) {
        console.error("Error processing items:", error);
    }
}

async function getUrlsFromRefs(refArray) {
    let urls = [];
    refArray.forEach((r) => {
        urls.push(getCdnURLFromRef(r));
    });
    try {
        const results = await Promise.all(urls);
        console.log("All urls gotten successfully");
        return results;
    } catch (error) {
        console.error("Error processing items:", error);
    }
}

async function getCdnURL(path) {
    return new Promise(resolve => {
        getDownloadURL(ref(storage, path))
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                // A full list of error codes is available at
                // https://firebase.google.com/docs/storage/web/handle-errors
                switch (error.code) {
                    case 'storage/object-not-found':
                        // File doesn't exist
                        break;
                    case 'storage/unauthorized':
                        // User doesn't have permission to access the object
                        break;
                    case 'storage/canceled':
                        // User canceled the upload
                        break;

                    // ...

                    case 'storage/unknown':
                        // Unknown error occurred, inspect the server response
                        break;
                }
            });
    })
}

async function getCdnURLFromRef(audioRef) {
    return new Promise(resolve => {
        getDownloadURL(audioRef)
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                // A full list of error codes is available at
                // https://firebase.google.com/docs/storage/web/handle-errors
                switch (error.code) {
                    case 'storage/object-not-found':
                        // File doesn't exist
                        break;
                    case 'storage/unauthorized':
                        // User doesn't have permission to access the object
                        break;
                    case 'storage/canceled':
                        // User canceled the upload
                        break;

                    // ...

                    case 'storage/unknown':
                        // Unknown error occurred, inspect the server response
                        break;
                }
            });
    })
}

// // RECORDING HELPERS

// Variables to store recording state and audio buffers
let isRecording = false;
let recordedChunks = [];

function startRecording() {
    if (contentObject.isPlaying) {
        contentObject.pause();
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            micStream = stream;
            mediaRecorder = new MediaRecorder(micStream);
            mediaRecorder.ondataavailable = event => {
                recordedChunks.push(event.data);
            };

            // Event handler for when recording stops
            mediaRecorder.onstop = () => {
                // Create a Blob from the recorded chunks
                const recordedBlob = new Blob(recordedChunks, { type: 'audio/wav' });
                // For demonstration, let's just log the Blob URL
                console.log(recordedBlob);
                console.log('Recorded audio Blob URL:', URL.createObjectURL(recordedBlob));
                // Reset recording state and recordedChunks array
                // upload to server
                uploadBlob(recordedBlob);

                isRecording = false;
                recordedChunks = [];
            };
            // Start recording
            mediaRecorder.start();
            // Update recording state
            isRecording = true;
        })
}

// Function to stop recording
function stopRecording() {
    if (isRecording) {
        reactiveObject.trigger('uploading');
        mediaRecorder.stop();
        micStream.getTracks().forEach(track => track.stop());
    }
}

// upload audio
function uploadBlob(audioBlob) {
    const uploadref = ref(storage, '/audio/' + burpuid + "/" + Date.now() + '.wav');
    uploadBytes(uploadref, audioBlob)
        .then((snapshot) => {
            console.log('Uploaded a blob or file!');
            // adding to db
            dbCreateThread(burpuid, uploadref);
            // reload feed
            console.log("reloading feed");
            loadFeed(() => {
                reactiveObject.interrupt();
                reactiveObject.trigger('ready');
            })
        })
        .catch(error => {
            reactiveObject.trigger("error");
            console.log("error uploading audio: " + error);
        });
}

// END OF RECORDING HELPERS

// DATABASE HELPERS
// CREATE
function dbCreateUser(uid, burpRef) {
    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "user",
            username: uid,
            burpRef: burpRef,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Success:', data);
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function dbCreateThread(uid, burpRef) {
    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "thread",
            threadAuthor: uid,
            posts: [{
                author: uid,
                storageRef: burpRef,
            }],
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.text();
        })
        .then(data => {
            console.log('Success:', data);
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// READ
function dbGetUnseenThreads(uid) { // Returns array
    fetch('/thread/?' + new URLSearchParams({
        type: "unseen-threads",
        userID: uid,
    }))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.json().catch(() => response.text());
        })
        .then(data => {
            if (typeof data === 'string') {
                console.error('Failed to parse JSON, received string: ', data);
            } else {
                console.log('Success:', data);
            }
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function dbGetSeenThreads(uid) { // Returns array
    fetch('/thread/?' + new URLSearchParams({
        type: "seen-threads",
        userID: uid,
    }))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.json().catch(() => response.text());
        })
        .then(data => {
            if (typeof data === 'string') {
                console.error('Failed to parse JSON, received string: ', data);
            } else {
                console.log('Success:', data);
            }
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function dbGetUserThreads(uid) {
    fetch('/user/?' + new URLSearchParams({
        userID: uid,
    }))
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.json().catch(() => response.text());
        })
        .then(data => {
            if (typeof data === 'string') {
                console.error('Failed to parse JSON, received string: ', data);
            } else {
                console.log('Success:', data);
            }
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}


// PUT
function dbLogSeen(uid, threadId) {
    fetch('/', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "log-seen",
            userID: uid,
            threadID: threadId,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.json().catch(() => response.text());
        })
        .then(data => {
            console.log('Success:', data);
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function dbRespondToThread(uid, threadId, burpRef) {
    fetch('/', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "new-response",
            threadID: threadId,
            post: {
                author: uid,
                storageRef: burpRef,
            },
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.text}`);
            }
            return response.json().catch(() => response.text());
        })
        .then(data => {
            console.log('Success:', data);
            return data;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

