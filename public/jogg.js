// SET UP AUDIO CONTEXT
// let audioContext;
// try {
//     let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     console.log(stream.getAudioTracks()[0].getSettings().sampleRate);
//     audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: stream.getAudioTracks()[0].getSettings().sampleRate });
//     stream.getTracks().forEach(track => track.stop());
// } catch (error) {
//     console.error('Error getting sample rate from microphone:', error);
// }
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
export { audioContext };

// PLAYBACK
// three basic UI element source objects
// "ambient" is for looping status elements
// "content" is for user content
// "reactive" is for UI elements and feedback

// Ambient objects play on a loop
export class Ambient {
    constructor() {
        this.bufferList = {};
        this._isPlaying = false;
        this.wasInterrupted = false;
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = 0.5;
        this.gainNode.connect(audioContext.destination);
        this.filter = audioContext.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 20000;
        // this.filter.Q.value = 10;
        this.filter.connect(this.gainNode)
    }

    get isPlaying() { // true if is playing
        return this._isPlaying;
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
        // console.log(this.bufferList);
    }

    start(soundName) {
        if (this._isPlaying) {
            this.stop();
        }
        // if (!this.source) {
        this.source = audioContext.createBufferSource();
        this.source.buffer = this.bufferList[soundName];
        this.source.loop = true;
        this.source.connect(this.filter);
        this.source.start(0);
        this._isPlaying = true;
        // }
    }

    stop() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
        this._isPlaying = false;
        this.wasInterrupted = true;
    }

    playOnce(soundName, callback) { // callback checks if an event is done for example loading content
        if (this._isPlaying) {
            this.stop();
        }
        // if (!this.source) {
        this.wasInterrupted = false;
        this.source = audioContext.createBufferSource();
        this.source.buffer = this.bufferList[soundName];
        this.source.loop = false;
        this.source.connect(this.filter);
        this.source.onended = () => {
            this._isPlaying = false;
            this.source = null;
            if (!this.wasInterrupted) {
                if (callback) {
                    callback();
                }
            }
        };
        this.source.start(0);
        this._isPlaying = true;
        // }
    }

    lowPass(on) {
        if (on) {
            this.filter.frequency.value = 300;
        } else {
            this.filter.frequency.value = 20000;
        }
    }
}


// Reactive objects play spontaneously as one shots
export class Reactive {

    constructor() { // accepts a json with names as keys and urls as values
        this.bufferList = {};
        this._isPlaying = false;
        this.wasInterrupted = false;
    }

    get isPlaying() { // true if is playing
        return this._isPlaying;
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
        // console.log(this.bufferList);
    }

    trigger(soundName, callback) { // callback = function to trigger on end
        if (!this.source) {
            this.wasInterrupted = false;
            this.source = audioContext.createBufferSource();
            this.source.buffer = this.bufferList[soundName];
            this.source.connect(audioContext.destination);
            this.source.onended = () => {
                this._isPlaying = false;
                this.source = null;
                if (!this.wasInterrupted) {
                    if (callback) {
                        callback();
                    }
                }
            };
            this.source.start(0);
            this._isPlaying = true;
        }
    }

    interrupt() {
        this._isPlaying = false;
        this.wasInterrupted = true;
        this.source.stop();
        this.source = null;
    }

}


// Content objects play from a maipulatable timeline
export class Content {

    constructor() {
        this.discreteBuffers = [];
        this._isPlaying = false;
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
                // console.log("pushing buffer");
                this.discreteBuffers.push(decodedData);
            })
            .catch(error => {
                console.error('Error loading audio:', error);
            })
            .finally(() => {
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
            });

    }

    get isPlaying() { // true if is playing
        return this._isPlaying;
    }

    play() {
        if (!this.source) {
            this.wasPaused = false;
            this.source = audioContext.createBufferSource();
            this.source.buffer = this.buffer;
            this.source.connect(audioContext.destination);
            this.source.onended = () => {
                this._isPlaying = false;
                this.source = null;
                if (!this.wasPaused) {
                    this.startOffset = 0;
                }
            };
            this.source.start(0, this.startOffset % this.buffer.duration);
            this.scrubStartTime = audioContext.currentTime;
            this._isPlaying = true;
        }
    }

    pause() {
        this.source.stop();
        this.startOffset += (audioContext.currentTime - this.scrubStartTime) * this.playbackRate;
        this.source = null;
        this._isPlaying = false;
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
        this._isPlaying = false;
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