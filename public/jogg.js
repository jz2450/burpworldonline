const audioContext = new (window.AudioContext || window.webkitAudioContext)();
export { audioContext };





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
class Reactive {

    constructor(sourceUrl) {

    }

    trigger() {

    }

}


// Content objects play from a maipulatable timeline
export class Content {

    constructor() {
        this.discreteBuffers = [];
        this.isPlaying = false;
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
            };
            this.source.start(0, this.startOffset % this.buffer.duration);
            this.scrubStartTime = audioContext.currentTime;
        }
        this.isPlaying = true;
    }

    pause() {
        this.source.stop();
        this.startOffset += (audioContext.currentTime - this.scrubStartTime) * this.playbackRate;
        this.source = null;
        this.isPlaying = false;
    }

    scrub(jogwheelValue) { // expected values 0 - 0.5 - 1.0
        this.startOffset += (audioContext.currentTime - this.scrubStartTime) * this.playbackRate;


        this.playbackRate = getPlaybackRate(jogwheelValue);
        this.source.playbackRate.setValueAtTime(this.playbackRate, audioContext.currentTime);
        // update playhead position somehow?

        this.scrubStartTime = audioContext.currentTime;

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
        return scale(floatVal, 0, 0.5, -2, -1);
    } else {
        return scale(floatVal, 0.5, 1, 1, 2);
    }
}

function scale(number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}