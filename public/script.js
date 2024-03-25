// implement button sounds -> retrigger not working
// make a buffer sheet for reactive sounds
// implement ambient sounds
// implement an end of queue sound
// implement sound when jogwheel past threshold to skip
// implement boot sound
// implement loading sounds
// clean up microphone sound, too artifacty
// implement remote data store that isn't the fs
// design recording flow?
// sound for an empty feed??
// how do you refresh?
// redesign, more physical model
// firebase authentication
// audio file db per user

// RIGHT NOW vvv
// fuckin slider is broken

// JOGG.JS
import { audioContext, Content } from "./jogg.js";

// FIREBASE
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL, list } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

let jogwheel = document.getElementById('jogwheel');
let stopButton = document.getElementById('stopButton');
let playButton = document.getElementById('playButton');
let recordButton = document.getElementById('recButton');

// const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// BUTTON EVENT LISTENERS
// play button
playButton.addEventListener('click', async () => {
    audioContext.resume(); // for chrome
    // if (contentSource.buffer) {
    //     contentSource.start(0);
    // }
    if (contentObject && !contentObject.isPlaying) {
        contentObject.play();
    }
});

// record button
['mousedown', 'touchstart'].forEach(function (e) {
    recordButton.addEventListener(e, function () {
        startRecording();
    })
});

['mouseup', 'touchend'].forEach(function (e) {
    recordButton.addEventListener(e, function () {
        stopRecording();
    });
});

stopButton.addEventListener('click', () => {
    // maybe a cute diy check if the source is playing
    // contentSource.stop();
    if (contentObject.isPlaying) {
        contentObject.pause();
    }
})

// jogwheel

jogwheel.addEventListener('input', jogwheelMoved);
jogwheel.addEventListener('change', jogwheelMoved);

function jogwheelMoved() {
    // jogwheel value is 0 - 1.0
    // scrubContentSource(jogwheel.value);
    if (contentObject.isPlaying) {
        contentObject.scrub(jogwheel.value);
    }
    // playScrubClick(jogwheel.value);
}


// reset jogwheel when released
['mouseup', 'touchend'].forEach(function (e) {
    jogwheel.addEventListener(e, function () {
        console.log("mouse up");
        jogwheel.value = 0.5;
        if (contentObject.isPlaying) {
            contentObject.scrub(jogwheel.value);
        }

        // scrubContentSource(jogwheel.value);
        // muteScrubClick();
    });
});

// MAIN

// RECORDING 
let mediaRecorder;
let micStream;
// // 20 mar commenting out to speed up debugging
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        micStream = stream;
    })
    .catch(error => {
        console.error('Error accessing microphone:', error);
    });



// PLAYBACK

// three basic UI element source objects
// "ambient" is for looping status elements

// "content" is for user content
let contentSource = audioContext.createBufferSource();
contentSource.connect(audioContext.destination);
// "reactive" is for UI elements and feedback


// Load AMBIENT



// Load REACTIVE
// we should use an array or object sheet of requested cue sources
let scrubClickBuffer;
// let scrubClickSource = audioContext.createBufferSource();
// loadReactiveAudio("/burpworldmockaudio/scrub-click.aif");



// Load CONTENT

// // Array to store MULTIPLE audio buffers
// const contentBuffers = [];
// let currentContentBuffer;
// // todo: pointers to starts and ends of each buffer??

// // Load each audio file from server into a buffer
// getMocks()
//     .then((result) => {
//         console.log(result);
//         loadContentAudio(result);
//     });


const mockpaths = [
    "mockaudio/burp5.aif",
    "mockaudio/response6.aif",
    "mockaudio/response3.aif",
    "mockaudio/response5.aif"
];


const contentObject = new Content();
// getUrlsFromPaths(mockpaths)
//     .then((urls) => {
//         contentObject.loadContentFromUrls(urls).then(() => {
//             console.log(contentObject);
//         }
//         ).catch(error => {
//             console.error('Error loading audio:', error);
//         });
//     })
//     .catch(error => {
//         console.error('error getting urls from firebase', error);
//     })

getPageOfAudioRefs()
    .then((refArray) => {
        getUrlsFromRefs(refArray)
            .then((urls) => {
                contentObject.loadContentFromUrls(urls).then(() => {
                    console.log(contentObject);
                }
                ).catch(error => {
                    console.error('Error loading audio:', error);
                });
            })
            .catch(error => {
                console.error('error getting urls from firebase', error);
            })
    })
    .catch(error => {
        console.error('error getting page of refs from firebase', error);
    })




// HELPER FUNCTIONS

async function getPageOfAudioRefs() {
    // Create a reference under which you want to list
    const listRef = ref(storage, 'audio');

    // Fetch the first page of 100.
    const firstPage = await list(listRef, { maxResults: 20 });

    console.log(firstPage.items);
    return firstPage.items;
    // Use the result.
    // processItems(firstPage.items)
    // processPrefixes(firstPage.prefixes)

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


// // get mock urls from server
// async function getMocks() {
//     let mockurls = [];
//     const mockpaths = [
//         "mockaudio/burp5.aif",
//         "mockaudio/response6.aif",
//         "mockaudio/response3.aif",
//         "mockaudio/response5.aif"
//     ];
//     mockpaths.forEach((path) => {
//         mockurls.push(getCdnURL(path));
//     });
//     try {
//         const results = await Promise.all(mockurls);
//         console.log("All items processed successfully");
//         return results;
//     } catch (error) {
//         console.error("Error processing items:", error);
//     }
// }



// get real audio from server, last 24 hours
async function getFeed() {
    const response = await fetch("/feed");
    const mockurls = response.json();
    // console.log(mockurls);
    return mockurls;
}

// Variables to store recording state and audio buffers
let isRecording = false;
let recordedChunks = [];

function startRecording() {
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
}

// Function to stop recording
function stopRecording() {
    if (isRecording) {
        mediaRecorder.stop();
    }
}

// upload audio
function uploadBlob(audioBlob) {
    const uploadref = ref(storage, '/audio/' + Date.now() + '.wav');
    uploadBytes(uploadref, audioBlob).then((snapshot) => {
        console.log('Uploaded a blob or file!');
    });
}


function loadReactiveAudio(audioFile) { // make this work with another arg for loading ALL different UI sounds from array at once
    fetch(audioFile)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(decodedData => {
            scrubClickBuffer = extendBufferWithSilence(decodedData, 0.25);
            scrubClickSource.buffer = scrubClickBuffer;
            scrubClickSource.loop = true;
            scrubClickSource.start();
            console.log("all reactive cues loaded")
        })
        .catch(error => {
            console.error('Error loading audio:', error);
        });
}

// Function to extend the length of an AudioBuffer with silence
function extendBufferWithSilence(originalBuffer, targetLength) {
    // Calculate the current duration of the buffer
    const currentDuration = originalBuffer.duration;
    // Calculate the number of additional seconds needed
    const additionalSeconds = targetLength - currentDuration;
    // Calculate the number of additional samples needed
    const additionalSamples = Math.ceil(originalBuffer.sampleRate * additionalSeconds);
    // Create a new buffer with the desired length
    const newBuffer = audioContext.createBuffer(originalBuffer.numberOfChannels, originalBuffer.length + additionalSamples, originalBuffer.sampleRate);
    // Iterate over each channel
    for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);
        // Copy the original data
        newData.set(originalData);
        // Fill the remaining portion with silence
        for (let i = originalBuffer.length; i < newBuffer.length; i++) {
            newData[i] = 0; // Silence
        }
    }
    return newBuffer;
}

// function loadContentAudio(audioFileArray) {
//     fetch(audioFileArray.shift())
//         .then(response => response.arrayBuffer())
//         .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
//         .then(decodedData => {
//             contentBuffers.push(decodedData);
//             // Check if all audio files have been loaded
//             if (audioFileArray.length == 0) {
//                 console.log("all content cues loaded")
//                 // Merge the audio buffers
//                 const mergedContentBuffer = mergeBuffers(contentBuffers);
//                 currentContentBuffer = mergedContentBuffer;
//                 contentSource.buffer = currentContentBuffer;
//             } else {
//                 loadContentAudio(audioFileArray);
//             }
//         })
//         .catch(error => {
//             console.error('Error loading audio:', error);
//         });
// }

// // Function to merge audio buffers
// function mergeBuffers(buffers) {
//     // Calculate total length of merged buffer
//     const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);

//     // Create a new buffer to hold the merged audio
//     const mergedBuffer = audioContext.createBuffer(1, totalLength, audioContext.sampleRate);
//     const mergedData = mergedBuffer.getChannelData(0);
//     let offset = 0;

//     // Copy data from each buffer into the merged buffer
//     buffers.forEach(buffer => {
//         const data = buffer.getChannelData(0);
//         mergedData.set(data, offset);
//         offset += buffer.length;
//     });

//     return mergedBuffer;
// }

// like the p5 map() function
function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function getPlaybackRate(jogwheelVal) {
    let floatVal = parseFloat(jogwheelVal);
    if (floatVal < 0.5) {
        return scale(floatVal, 0, 0.5, -2, -1);
    } else {
        return scale(floatVal, 0.5, 1, 1, 2);
    }
}

// function scrubContentSource(jogwheelValue) {
//     contentSource.playbackRate.setValueAtTime(getPlaybackRate(jogwheelValue), audioContext.currentTime);
// }

function playScrubClick(jogwheelValue) {
    // console.log('playing click');
    if (!scrubClickSource.isConnected) {
        scrubClickSource.connect(audioContext.destination);
    }
    scrubClickSource.playbackRate.setValueAtTime(getPlaybackRate(jogwheelValue), audioContext.currentTime);
}

function muteScrubClick() {
    // console.log("beep boop");
    scrubClickSource.disconnect();
    scrubClickSource.playbackRate.setValueAtTime(1, audioContext.currentTime);
}




