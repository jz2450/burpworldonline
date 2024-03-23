// import * as Tone from "../node_modules/tone"; // make this work, folder issue probably
// implement audio recording
// implement button sounds -> retrigger not working
// implement ambient sounds
// implement an end of queue sound
// implement sound when jogwheel past threshold to skip

// PORTING TO WEB AUDIO API *priority*

let jogwheel = document.getElementById('jogwheel');
let stopButton = document.getElementById('stopButton');
let playButton = document.getElementById('playButton');
let recordButton = document.getElementById('recButton');
// let startButton = document.getElementById('startButton');
// let trigButton = document.getElementById('trigButton');

let player;
let sampler;
let multi;

let queueIndex = 0;

let playerObjects = [];
let currentPlayer;
let mockAudioUrlArray = [
    "/burpworldmockaudio/burp7.aif",
    "/burpworldmockaudio/response1.aif",
    "/burpworldmockaudio/response2.aif",
    "/burpworldmockaudio/response3.aif",
    "/burpworldmockaudio/response4.aif",
    "/burpworldmockaudio/response5.aif",
    "/burpworldmockaudio/response6.aif"
]

let reachedEndOfQueue = false;
let reachedStartOfQueue = false;

// Tone FX
const cueVerb =  new Tone.Reverb(3).toDestination();

// set up instruments for buttons and cues
let scrubClick = new Tone.Sampler({
    urls: {
        C3: "/burpworldmockaudio/scrub-click.aif"
    }
}).toDestination();
scrubClick.volume.value = -24;
// scrubClick.connect(cueVerb);
const scrubClickLoop = new Tone.Loop((time) => {
    scrubClick.triggerAttack("C3", time);
}, "16n");

const buttonSynth = new Tone.MonoSynth({
    filter: {
        frequency: 2000
    }
}).toDestination();
const cueInst = new Tone.MonoSynth({
    filter: {
        frequency: 2000
    }
}).toDestination();
cueInst.connect(cueVerb);
buttonSynth.connect(cueVerb);

// set up sequences as cues
const playButtonCue = new Tone.Sequence((time, note) => {
    buttonSynth.triggerAttackRelease(note, 0.05, time);
}, ["F3"]);
playButtonCue.loop = false;

const stopButtonCue = new Tone.Sequence((time, note) => {
    buttonSynth.triggerAttackRelease(note, 0.05, time);
}, ["C4","F3"]);
stopButtonCue.loop = false;

const loadedCue = new Tone.Sequence((time, note) => {
    if (note === "END") {
        playerObjects[0].start();
    } else {
        cueInst.triggerAttackRelease(note, 0.05, time);
    }
}, ["F5", "G5", ["E5", "F5"], "A5", "END"]);
loadedCue.loop = false;


playButton.addEventListener('click', async () => {
    // playButtonCue.start(Tone.Transport.seconds);
    if (queueIndex>0) {
        queueIndex = 0;
        // playLoginCue(cueInst);
        loadedCue.start();
    } else {
        await Tone.start();
        console.log('audio is ready');
        // retrieve audio from server

        Tone.Transport.start();

        mockAudioUrlArray.forEach((sourceUrl) => {
            let p = new Tone.Player(sourceUrl).toDestination();
            p.onstop = onstopfunc();
            playerObjects.push(p);
        });

        // playLoginCue(cueInst);
        loadedCue.start();
    }
})

recordButton.addEventListener('mousedown', () => {
    audioContext.resume();
})

stopButton.addEventListener('click', async () => {
    Tone.Transport.stop();
    stopButtonCue.start(Tone.Transport.seconds);
    // stopButtonCue.start(0);
    Tone.Transport.start();
    // playerObjects[queueIndex].stop();
})

function onstopfunc() {
    return function() {
        console.log('player stopped');
        if (!playerObjects[queueIndex].reverse) {
            if (playerObjects[queueIndex+1]) {
                queueIndex++;
                // playerObjects[queueIndex].playbackRate = parseFloat(jogwheel.value) + 0.5;
                playerObjects[queueIndex].playbackRate = getPlaybackRate(jogwheel.value)
                playerObjects[queueIndex].start();
            } else {
                reachedEndOfQueue = true;
            }
        } else {
            if (playerObjects[queueIndex-1]) {
                console.log("player was reversed");
                playerObjects[queueIndex].reverse = false;
                queueIndex--;
                playerObjects[queueIndex].reverse = true;
                // playerObjects[queueIndex].playbackRate = 1/(parseFloat(jogwheel.value) + 0.5);
                playerObjects[queueIndex].playbackRate = getPlaybackRate(jogwheel.value);
                playerObjects[queueIndex].start(playerObjects[queueIndex].buffer.length*playerObjects[queueIndex].sampleTime);
            } else {
                reachedStartOfQueue = true;
                scrubClickLoop.stop();
            }
        }
    }
}

function jogwheelMoved() {
    scrubAudio();
    playScrubClick(jogwheel.value);
}

['mouseup', 'touchend'].forEach(function(e) {
    jogwheel.addEventListener(e, function() {
        // console.log("mouse up");
    scrubClickLoop.stop();
    Tone.Transport.bpm.value = 120;
    jogwheel.value = 0.5;
    scrubAudio();
    if (reachedStartOfQueue) {
        playerObjects[0].start();
        reachedStartOfQueue = false;
    }
    });
})

function scrubAudio() {
    // console.log(jogwheel.value);
    if(parseFloat(jogwheel.value) < 0.5) {
        playerObjects[queueIndex].reverse = true;
        playerObjects[queueIndex].playbackRate = getPlaybackRate(jogwheel.value);
    } else {
        playerObjects[queueIndex].reverse = false;
        playerObjects[queueIndex].playbackRate = getPlaybackRate(jogwheel.value);
    }
    playerObjects[queueIndex].restart("now", playerObjects[queueIndex].position);
    // playScrubCue(jogwheel.value);
}


// function playLoginCue(inst) {
//     const loadedCue = new Tone.Sequence((time, note) => {
//         if (note === "END") {
//             playerObjects[0].start();
//         } else {
//             inst.triggerAttackRelease(note, 0.1, time);
//         }
//     }, ["F5", "G5", ["E5", "F5"], "A5", "END"]).start(Tone.Transport.seconds);
//     loadedCue.loop = false;
// }

function playScrubClick(jogwheelVal) { //jogwheel value
    if (scrubClickLoop.state != 'started') {
        scrubClickLoop.start();
    }
    let floatVal = parseFloat(jogwheelVal);
    if (floatVal<0.5) {
        Tone.Transport.bpm.value = 120 + scale(floatVal, 0, 0.5, 100, 0);
    } else {
        Tone.Transport.bpm.value = 120 + scale(floatVal, 0.5, 1, 0, 100);
    }
    
}

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function getPlaybackRate(jogwheelVal) {
    let floatVal = parseFloat(jogwheelVal);
    if (floatVal<0.5) {
        return scale(floatVal, 0, 0.5, 2, 1);
    } else {
        return scale(floatVal, 0.5, 1, 1, 2);
    }
}