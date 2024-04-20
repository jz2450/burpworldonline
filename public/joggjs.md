# Jogg.js

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Description

Jogg.js is a Web Audio API abstraction layer that makes it easier to design sound-based user interfaces with sonic objects that be dynamically scrubbed, looped, and triggered.

## Installation
Download Jogg.js from this repo and add to your directory, CDN link to come soon.

Add the following to your HTML header section:
```
<script type="module" src="./jogg.js"></script>
```

Add the following to the beginning of your script file:
```
import { audioContext, Content, Reactive, Ambient } from "./jogg.js";
```
## Features
Jogg gives you access to three kinds of audio objects, `Content`, `Reactive`, and `Ambient`, which all have their own specialised functions. 

Jogg creates an Audio Context for you, which you can access using `audioContext`.

## Content Object
Use a `Content` object to handle your audio content. A `Content` object can be dynamically scrubbed through using the `scrub()` function.

### Init
```
const contentObject = new Content();
```

### Load Audio
```
await contentObject.loadContentFromUrls(urls);
```
`loadContentFromUrls()` accepts an array of child paths to audio files if hosted locally e.g. ["audio/burp5.aif", ...], or an array of externally hosted audio files. All files are merged onto a single buffer/audio file from first to last.

### Play
```
contentObject.play();

contentObject.play(callback);
```
The `play()` function plays the buffer from the beginning, or from the paused point if paused (see below). You can pass in a `callback` function which will run once the object gets to the end of the buffer and stops playing.

### Pause
```
contentObject.pause();
```
The `pause()` function pauses playback. When `play()` is called again, it resumes at the paused location.

### Scrub
```
contentObject.scrub(value);
```
The `scrub()` function allows the user to scrub through audio by dynamically changing the speed and direction of playback. 

You pass in a float value between `0` and `1`, where `0.5` is normal playback, `1` is 4x speed, and `0` is reverse 4x speed.

### Reset
```
contentObject.reset();
```
The `reset()` function clears the buffer and all saves pause points.

## Reactive Object
Use a `Reactive` object to trigger one-off sounds. This is useful for dynamically triggering sonic UI elements like a button press or a success/error sound.

### Init
```
const reactiveObject = new Reactive();
```

### Load Audio
```
// for example purposes
const reactiveSheet = {
    select: "/cues/select.mp3",
    sourceburp: "/cues/sourceburp.mp3",
    splash: "/cues/splash.mp3",
    success: "/cues/success.mp3",
}

async reactiveObject.load(reactiveSheet);
```
The `load()` function accepts an object containing a list of cue names and corresponding filepaths. This function preloads the files into an array of buffers.

### Trigger
```
reactiveObject.trigger(cueName);

reactiveObject.trigger(cueName, callback);
```
The `trigger()` function triggers the sound corresponding to the cueName `string` that is passed in. You can pass in a `callback` function which will run once the object gets to the end of the sound if it was not interrupted with the `interrupt()` function.

When this function is called, it will `interrupt` any other sounds that have been triggered that are still playing.

### Interrupt
```
reactiveObject.interrupt();
```
The `interrupt()` function stops the playback of a triggered sound.

## Ambient Object
Use an `Ambient` object to create looping soundscapes. Useful for delineating different stages, menus, or 'views' in an app. 

### Init
```
const ambientObject = new Ambient();
```

### Load Audio
```
// for example purposes
const ambientSheet = { 
    idle: "/cues/idleloop.mp3",
    loading: "/cues/loadingloop.mp3",
    profile: "/cues/profileloop.mp3",
    thread: "/cues/threadloop.mp3",
}

async ambientObject.load(ambientSheet);
```
The `load()` function accepts an object containing a list of cue names and corresponding filepaths. This function preloads the files into an array of buffers.

### Start
```
ambientObject.start(cueName);
```
The `start()` function starts looping the sound corresponding to the cueName `string` that is passed in. 

Only one loop can be played at a time. If the `start()` function is called while the object is still playing, it will replace it with the new sound. Create a new instance of an `Ambient` object to allow more than one simultaneous loop.

### Stop
```
ambientObject.stop();
```
The `stop()` function stops the looping playback.

### Play Once
```
ambientObject.playOnce(cueName);

ambientObject.playOnce(cueName, callback);
```
The `playOnce()` function triggers the sound corresponding to the cueName string that is passed in. You can pass in a `callback` function which will run once the object gets to the end of the sound if `stop()` is not called first.

### Low Pass Filter
```
ambientObject.lowPass(bool);
```
The `lowPass()` function turns on and off a lowpass filter currently set to 300Hz. This helps make a loop more ambient and the content layered on top of it more present and legible without pre-processing. 

Passing in `true` turns it `on`, `false` turns it `off`.