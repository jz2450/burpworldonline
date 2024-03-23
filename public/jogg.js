const audioContext = new (window.AudioContext || window.webkitAudioContext)();



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
class Content {

    constructor(sourcePathArray) { // accepts an array of child paths e.g. ["audio/burp5.aif", ...]
        this.sourcePathArray = sourcePathArray;
        this.urlArray = this.loadContentURLs(this.sourcePathArray);
        this.buffer = this.loadContentAudio(this.urlArray);
    }

    async loadContentURLs(sourcePathArray) {
        let urls = [];
        sourcePathArray.forEach((path) => {
            urls.push(getCdnURL(path));
        });
        try {
            const results = await Promise.all(urls);
            console.log("All items processed successfully");
            return results;
        } catch (error) {
            console.error("Error processing items:", error);
        }
    }

    loadContentAudio(audioFileArray) {
        fetch(audioFileArray.shift())
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(decodedData => {
                contentBuffers.push(decodedData);
                // Check if all audio files have been loaded
                if (audioFileArray.length == 0) {
                    console.log("all content cues loaded")
                    // Merge the audio buffers
                    const mergedContentBuffer = mergeBuffers(contentBuffers);
                    return mergedContentBuffer;
                    // contentSource.buffer = currentContentBuffer; // make the source when play is clicked
                } else {
                    loadContentAudio(audioFileArray);
                }
            })
            .catch(error => {
                console.error('Error loading audio:', error);
            });
    }

    get state() {
        return true;
    }

    play() {

    }

    pause() {

    }

    stop() {

    }

    scrub() {

    }
}

async function getCdnURL(path) {
    return new Promise(resolve => {
        getDownloadURL(ref(storage, path))
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
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
                    case 'storage/unknown':
                        // Unknown error occurred, inspect the server response
                        break;
                }
            });
    })
}

// Function to merge audio buffers
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