

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
export { audioContext };



// PLAYBACK
// three basic UI element source objects
// "ambient" is for looping status elements
// "content" is for user content
// "reactive" is for UI elements and feedback

// Ambient objects play on a loop
class Ambient {
    constructor(sourceUrl) {
        this.source = sourceUrl
    }

    startLoop() {
        // Code goes here
    }

    stopLoop() {

    }
}


// Reactive objects play spontaneously as one shots
export class Reactive {

    constructor() { // accepts a json with names as keys and urls as values
        this.bufferList = {};
        this.isPlaying = false;
        this.wasInterrupted = false;
    }


    async load(soundSheet) {
        for (let [cue, url] of Object.entries(soundSheet)) {
            // console.log(`Cue: ${cue}, url: ${url}`);
            try {
                let response = await fetch(url);
                let arrayBuffer = await response.arrayBuffer();
                let decodedData = await audioContext.decodeAudioData(arrayBuffer);
                // console.log("buffer loaded");
                this.bufferList[cue] = decodedData;
            } catch (error) {
                console.error('Error loading audio:', error);
            }
        }
        console.log(this.bufferList);
    }

    trigger(soundName, callback) {
        if (this.isPlaying) {
            this.interrupt();
        }
        if (!this.source) {
            this.source = audioContext.createBufferSource();
            this.source.buffer = this.bufferList[soundName];
            this.source.connect(audioContext.destination);
            this.source.onended = () => {
                // console.log("poop");
                this.isPlaying = false;
                this.source = null;
                if (!this.wasInterrupted) {
                    if (callback) {
                        callback();
                    }
                }
                this.wasInterrupted = false;

            };
            this.source.start(0);
        }
        this.isPlaying = true;
    }

    interrupt() {
        this.isPlaying = false;
        this.wasInterrupted = true;
        this.source.stop();
        this.source = null;
    }

}


// Content objects play from a maipulatable timeline
export class Content {

    constructor() {
        this.discreteBuffers = [];
        this.isPlaying = false;
        this.wasPaused = false;
        this.startTime = 0;
        this.startOffset = 0;
        this.playbackRate = 1;
        this.scrubStartTime = 0;
    }

    async loadContentFromUrls(audioUrlArray) { // accepts an array of child paths e.g. ["audio/burp5.aif", ...]
        // console.log(audioUrlArray);
        return fetch(audioUrlArray.shift())
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(decodedData => {
                this.discreteBuffers.push(decodedData);
                // Check if all audio files have been loaded
                if (audioUrlArray.length == 0) {
                    console.log("all content cues loaded")
                    // Merge the audio buffers
                    const mergedContentBuffer = mergeBuffers(this.discreteBuffers);
                    this.buffer = mergedContentBuffer;
                    // contentSource.buffer = currentContentBuffer; // make the source when play is clicked
                } else {
                    this.loadContentFromUrls(audioUrlArray);
                }
            })
            .catch(error => {
                console.error('Error loading audio:', error);
            });
    }

    get state() { // true if is playing
        return this.isPlaying;
    }

    play() {
        if (!this.source) {
            this.source = audioContext.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(audioContext.destination);
            this.source.onended = () => {
                this.isPlaying = false;
                this.source = null;
                if (!this.wasPaused) {
                    this.startOffset = 0;
                }
            };
            this.source.start(0, this.startOffset % this.buffer.duration);
            this.scrubStartTime = audioContext.currentTime;
        }
        this.isPlaying = true;
        this.wasPaused = false;
    }

    pause() {
        this.source.stop();
        this.startOffset += (audioContext.currentTime - this.scrubStartTime) * this.playbackRate;
        this.source = null;
        this.isPlaying = false;
        this.wasPaused = true;
    }

    scrub(jogwheelValue) { // expected values 0 - 0.5 - 1.0
        this.startOffset += (audioContext.currentTime - this.scrubStartTime) * this.playbackRate;


        this.playbackRate = getPlaybackRate(jogwheelValue);
        this.source.playbackRate.setValueAtTime(this.playbackRate, audioContext.currentTime);
        // update playhead position somehow?

        this.scrubStartTime = audioContext.currentTime;

    }

    reset() {
        this.discreteBuffers = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.startOffset = 0;
        this.playbackRate = 1;
        this.scrubStartTime = 0;
        this.buffer = null;
    }
}


// helper functions


function mergeBuffers(buffers) {
    // Calculate total length of merged buffer
    const totalLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);

    // Create a new buffer to hold the merged audio
    const mergedBuffer = audioContext.createBuffer(1, totalLength, audioContext.sampleRate);
    const mergedData = mergedBuffer.getChannelData(0);
    let offset = 0;

    // Copy data from each buffer into the merged buffer
    buffers.forEach(buffer => {
        const data = buffer.getChannelData(0);
        mergedData.set(data, offset);
        offset += buffer.length;
    });

    return mergedBuffer;
}

function getPlaybackRate(jogwheelVal) {
    let floatVal = parseFloat(jogwheelVal);
    if (floatVal < 0.5) {
        return scale(floatVal, 0, 0.5, -4, -1);
    } else {
        return scale(floatVal, 0.5, 1, 1, 4);
    }
}

function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}