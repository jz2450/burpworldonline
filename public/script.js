// JOGG.JS
import { audioContext, Content, Reactive, Ambient } from "./jogg.js";

// FIREBASE
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";
import { getStorage, ref, uploadBytes, getDownloadURL, list, listAll } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
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
    appId: "1:174854073314:web:84050fb07c1208e25627bb",
    measurementId: "G-S4GX130WX3"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebase);
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

// LOGIN UI yes it's visual i'm sorry
const loginPrompt = document.getElementById("login-prompt");
const loginInput = document.getElementById("login-input");
const loginMessage = document.getElementById("login-message");
const loginButton = document.getElementById("login-button");
const verifyButton = document.createElement('button');
verifyButton.id = 'verify-button';
verifyButton.className = 'login-buttons';
verifyButton.textContent = 'Volume up, let\'s go';

// ENTER KEY
loginInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        loginButton.click();
    }
});

// + in the area code
loginInput.addEventListener('input', addPlus);

function addPlus(e) {
    let target = e.target, position = target.selectionStart - 1;
    // Remove non-digit characters
    target.value = target.value.replace(/[^0-9]/g, '');
    // Add '+' at the start
    if (!target.value.startsWith('+')) {
        target.value = '+' + target.value;
    }
}

// BUTTON SETUP
let jogwheel = document.getElementById('jogwheel');
let stopButton = document.getElementById('stopButton');
let playButton = document.getElementById('playButton');
let recordButton = document.getElementById('recButton');
let infoButton = document.getElementById('info-button2');
let tutorialToggle = document.getElementById('tutorial-check');

// BUTTON EVENT LISTENERS
// login button
loginButton.addEventListener('click', submitPhoneNumber);
setupButtons();

// about page
infoButton.addEventListener('click', () => {
    if (document.body.classList.contains('about')) {
        document.body.classList.remove('about');
        infoButton.innerHTML = "<h2>ⓘ</h2>";
        if (document.body.classList.contains('authenticated')) {
            document.getElementById('main-card').classList.add('animateToLeft');
        }
    } else {
        document.body.classList.add('about');
        infoButton.innerHTML = "<h2>🔙</h2>";
        if (document.body.classList.contains('authenticated')) {
            document.getElementById('main-card').classList.remove('animateToLeft');
        }
    }

});

// tutorial toggle
tutorialToggle.addEventListener('change', () => {
    if (tutorialToggle.checked) {
    } else {
        // nothing?? feels weird come back to this
    }
});

// button map defines what each button does in each stage
let buttonMap;

let jogwheelPrevVal;
let jogPrevThres = 0.1;
let jogNextThres = 0.9;


// RECORDING SETUP
let mediaRecorder;
let micStream;
let isRecording = false;
let recordedChunks = [];
let pendingBlob, pendingBlobUrl;

try {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // stream.getTracks().forEach(track => track.stop());
    micStream = stream;
} catch (err) {
    console.log("error getting mic input");
    loginPrompt.innerHTML = "Could not get mic input, please check your settings and refresh :)<br>";
    throw new Error("Stopping script execution due to mic input error");
}

// MOCK AUDIO FOR DEVELOPMENT
const mockpaths = [
    "mockaudio/burp5.aif",
    "mockaudio/response6.aif",
    "mockaudio/response3.aif",
    "mockaudio/response5.aif"
];

// AMBIENT FILE NAMES
let ambientSheet = {
    idle: "/cues/idleloop.mp3",
    loading: "/cues/loadingloop.mp3",
    profile: "/cues/profileloop2.mp3",
    thread: "/cues/threadloop2.mp3",
}
// REACTIVE FILE NAMES
let reactiveSheet = {
    autonext: "/cues/autonext.mp3",
    autoprev: "/cues/autoprev.mp3",
    back: "/cues/back.mp3",
    error: "/cues/error.mp3",
    newunseen: "/cues/newunseen.mp3",
    nextcloser: "/cues/nextcloser.mp3",
    nextopener: "/cues/nextopener.mp3",
    prevcloser: "/cues/prevcloser.mp3",
    prevopener: "/cues/prevopener.mp3",
    recordstart: "/cues/recordstart.mp3",
    select: "/cues/select.mp3",
    sourceburp: "/cues/sourceburp.mp3",
    splash: "/cues/splash.mp3",
    success: "/cues/success.mp3",
    threadlength: "/cues/threadlength.mp3",
    onboarding1: "/cues/onboarding1.mp3",
    onboarding2: "/cues/onboarding2.mp3",
    onboarding3: "/cues/onboarding3.mp3",
    onboarding4: "/cues/onboarding4.mp3",
    onboarding5: "/cues/onboarding5.mp3",
    onboarding6: "/cues/onboarding6.mp3",
}

let tutorialSheet = {
    standby: "/cues/tutorial/standby.mp3",
    thread: "/cues/tutorial/thread.mp3",
    profile: "/cues/tutorial/profile.mp3"
}

// LOAD IN UI ELEMENTS
const ambientObject = new Ambient();
await ambientObject.load(ambientSheet);
console.log("Ambient cues loaded: " + ambientObject);
const reactiveObject = new Reactive();
await reactiveObject.load(reactiveSheet);
console.log("Reactive cues loaded: " + reactiveObject);
const tutorialObject = new Reactive();
await tutorialObject.load(tutorialSheet);
console.log("Tutorial cues loaded");

// CONTENT
let currentThread;
let threadQueue = [];
let threadHistory = [];
const contentObject = new Content();

//  CHECK FOR PREVIOUS SIGN IN
if (auth.currentUser) {
    burpuid = auth.currentUser.uid;
    console.log("User signed in successfully: " + burpuid);
    loginPrompt.innerHTML = "WELCOME BACK";
    loginInput.style.display = "none";
    loginMessage.style.display = "block";
    loginMessage.innerHTML = `Wasn't you? <button id="signOutButton" style="cursor:pointer;background-color:rgb(192, 192, 192);color:rgba(0, 0, 0, 0.847);border-radius:3px;">Sign out</button><br><br>`;
    document.getElementById('signOutButton').addEventListener('click', fbSignOut);
    loginButton.parentNode.replaceChild(verifyButton, loginButton);
    verifyButton.style.width = "100";
    verifyButton.addEventListener('click', () => {
        audioContext.resume();
        toBootStage();
    });
} else {
    console.log("no user logged in");
    loginPrompt.innerHTML = "ENTER YOUR PHONE NUMBER";
    loginInput.style.display = "block";
    loginMessage.style.display = "block";
    loginButton.style.display = "block";
}


// ------------------------- HELPERS


// STAGES
async function toBootStage() {
    console.log('to boot stage');
    audioContext.resume(); // for chrome
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => { },
        jogMoved: () => { },
        jogUp: () => { },
    };
    document.body.classList.add('authenticated');
    document.getElementById('main-card').classList.add('animateToLeft');
    reactiveObject.trigger("splash", async () => {
        ambientObject.lowPass(true);
        ambientObject.start("loading");
        try {
            let profile = await dbGetUserProfile(burpuid);
            if (profile.missing) {
                toOnboardingStage(profile.missing);
            } else {
                if (tutorialToggle.checked) toTutIdleStage();
                else toIdleStage();
            }
            // check if user has a profile setup
        } catch (error) {
            console.error("error getting profile ", error);
        }
    });
}

// ONBOARDING
async function toOnboardingStage(isMissing) {
    console.log("in the onboarding stage");
    buttonMap = {
        recDown: () => {
            ambientObject.stop();
            reactiveObject.interrupt();
            console.log("recording now"); reactiveObject.trigger("recordstart", () => {
                startRecording(() => {
                    toOnboardingStage2(isMissing);
                });
            });
        },
        recUp: () => {
            // check if we're still in prerecord stage
            if (isRecording) {
                stopRecording();
            } else if (reactiveObject.isPlaying) {
                console.log("recording cancelled");
                reactiveObject.interrupt();
                ambientObject.start('profile');
            }
        },
        playDown: () => {
            reactiveObject.interrupt();
            console.log(reactiveObject.isPlaying);
            reactiveObject.trigger("select");
            ambientObject.stop();
        },
        playUp: () => {
            ambientObject.start("profile");

            reactiveObject.interrupt();
            // console.log(reactiveObject.isPlaying);
            reactiveObject.trigger("onboarding1");
            // console.log("onboarding triggered", reactiveObject.isPlaying);
        },
        backDown: () => {
            ambientObject.stop();
            reactiveObject.interrupt();
            reactiveObject.trigger("back");
        },
        backUp: () => {
            ambientObject.start("profile");
        },
        jogMoved: () => { },
        jogUp: () => { },
    };
    // do recording flow
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("profile");
    reactiveObject.trigger("onboarding1");
}

function toOnboardingStage2(isMissing) {
    console.log("in the onboarding 2 stage");
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => { },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("profile");
    reactiveObject.trigger("onboarding2", async () => {
        // play blob
        const response = await fetch(pendingBlobUrl);
        const arrayBuffer = await response.arrayBuffer();
        let decodedData = await audioContext.decodeAudioData(arrayBuffer);
        let preview = audioContext.createBufferSource();
        preview.buffer = decodedData;
        preview.connect(audioContext.destination);
        preview.start(0);
        preview.onended = () => {
            reactiveObject.trigger("onboarding3");
            buttonMap = {
                recDown: () => { },
                recUp: () => { },
                playDown: () => {
                    ambientObject.stop();
                    reactiveObject.trigger("select");
                },
                playUp: () => {
                    toOnboardingStage3(isMissing);
                },
                backDown: () => {
                    ambientObject.stop();
                    reactiveObject.trigger("back");
                },
                backUp: () => {
                    toOnboardingStage(isMissing);
                },
                jogMoved: () => { },
                jogUp: () => { },
            };
        }
    });
}

function toOnboardingStage3(isMissing) {
    console.log("in the onboarding 3 stage");
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => { },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("loading");
    reactiveObject.trigger("onboarding4", async () => {
        // upload audio to server
        let uploadPath = await uploadBlob(pendingBlob);
        if (isMissing == "profile") {
            try {
                await dbCreateUser(burpuid, uploadPath);
                ambientObject.stop();
                ambientObject.lowPass(true);
                ambientObject.start("profile");
                reactiveObject.trigger("onboarding6", () => {
                    if (tutorialToggle.checked) toTutIdleStage();
                    else toIdleStage();
                });
            } catch (error) {
                console.log("error creating profile", error);
            }
        } else {
            try {
                await dbUpdateUserTag(burpuid, uploadPath);
                ambientObject.stop();
                ambientObject.lowPass(true);
                ambientObject.start("profile");
                reactiveObject.trigger("onboarding6", () => {
                    if (tutorialToggle.checked) toTutIdleStage();
                    else toIdleStage();
                });
            } catch (error) {
                console.log("error updating profile", error);
            }

        }
    });
}

async function toIdleStage() {
    console.log("in the idle stage");
    buttonMap = {
        recDown: () => {
            ambientObject.stop();
            reactiveObject.interrupt();
            console.log("recording now");
            reactiveObject.trigger("recordstart", () => {
                startRecording(async () => {
                    // upload audio to server
                    let uploadPath = await uploadBlob(pendingBlob);
                    try {
                        await dbCreateThread(burpuid, uploadPath);
                        reactiveObject.trigger("success", () => {
                            if (tutorialToggle.checked) toTutIdleStage();
                            else toIdleStage();
                        });
                    } catch (error) {
                        reactiveObject.trigger("error");
                        console.log("error creating thread", error);
                    }
                });
            });
        }, // create new thread
        recUp: () => {
            if (isRecording) {
                stopRecording();
            } else if (reactiveObject.isPlaying) {
                console.log("recording cancelled");
                reactiveObject.interrupt();
                ambientObject.start('profile');
            }
        },
        playDown: () => {
            reactiveObject.trigger('select');
        },
        playUp: () => {
            if (tutorialToggle.checked) toTutThreadStage();
            else toThreadStage();
        }, // to thread stage
        backDown: () => { },
        backUp: () => { },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("idle");
}

function toTutIdleStage() {
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => {
            tutorialObject.interrupt();
            toIdleStage();
        },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("idle");
    tutorialObject.trigger('standby', () => {
        toIdleStage();
    });
}

async function toThreadStage() {
    console.log("loading the thread stage");
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => { },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("loading");
    await loadFeed();
    console.log("in the thread stage");
    buttonMap = {
        recDown: () => { // respond to thread not create FIX
            ambientObject.stop();
            reactiveObject.interrupt();
            contentObject.pause();
            console.log("recording now"); reactiveObject.trigger("recordstart", () => {
                startRecording(async () => {
                    // upload audio to server
                    let uploadPath = await uploadBlob(pendingBlob);
                    try {
                        console.log(currentThread);
                        await dbRespondToThread(burpuid, currentThread._id, uploadPath);
                        reactiveObject.trigger("success", async () => {
                            ambientObject.start('thread');
                            ambientObject.lowPass(false);
                            currentThread = await dbGetOneThread(currentThread._id);
                            reloadCurrentThread();
                        });
                    } catch (error) {
                        reactiveObject.trigger("error");
                        console.log("error responding to thread", error);
                    }
                });
            });
        },
        recUp: () => {
            if (isRecording) {
                stopRecording();
            } else if (reactiveObject.isPlaying) {
                console.log("recording cancelled");
                reactiveObject.interrupt();
                ambientObject.start('thread');
            }
        },
        playDown: () => { reactiveObject.trigger('select'); },
        playUp: () => {
            // reactiveObject.trigger('select');
            if (contentObject && !contentObject.isPlaying) {
                ambientObject.lowPass(true);
                contentObject.play(() => {
                    ambientObject.lowPass(false);
                });
            } else if (contentObject && contentObject.isPlaying) {
                contentObject.pause();
                contentObject.reset();
                
                if (tutorialToggle.checked) toTutProfileStage(currentThread.threadAuthor);
                else toProfileStage(currentThread.threadAuthor);
            }
        },
        backDown: () => {
            reactiveObject.trigger('back');
        },
        backUp: () => {
            if (contentObject.isPlaying) {
                contentObject.pause();
                ambientObject.lowPass(false);
            } else {
                currentThread = null;
                if (tutorialToggle.checked) {
                    toTutIdleStage();
                } else {
                    toIdleStage();
                }
            }
        },
        jogMoved: () => {
            // jogwheel value is 0 - 1.0
            if (jogwheel.value < jogNextThres && jogwheel.value > jogPrevThres) {
                if (contentObject.isPlaying) {
                    contentObject.scrub(jogwheel.value);
                }
            } else if (jogwheel.value >= jogNextThres && jogwheelPrevVal < jogNextThres) {
                reactiveObject.trigger('nextopener');
            } else if (jogwheel.value <= jogPrevThres && jogwheelPrevVal > jogPrevThres) {
                reactiveObject.trigger('prevopener');
            }
            jogwheelPrevVal = jogwheel.value;
        },
        jogUp: () => {
            if (jogwheelPrevVal < jogNextThres && jogwheelPrevVal > jogPrevThres) {
                if (contentObject.isPlaying) {
                    contentObject.scrub(jogwheel.value);
                }
            } else if (jogwheelPrevVal >= jogNextThres) {
                reactiveObject.trigger('nextcloser');
                loadNextThread();
            } else if (jogwheelPrevVal <= jogPrevThres) {
                reactiveObject.trigger('prevcloser');
                loadPreviousThread();
            }
            jogwheelPrevVal = jogwheel.value;
        },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("thread");

}

function toTutThreadStage() {
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => {
            tutorialObject.interrupt();
            toThreadStage();
        },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("thread");
    tutorialObject.trigger('thread', () => {
        toThreadStage();
    })
}

async function toProfileStage(uid) {
    console.log("to profile stage");
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => { },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("loading");
    await loadProfile(uid);
    reactiveObject.trigger('success');
    console.log("in the profile stage");
    buttonMap = {
        recDown: () => {
            ambientObject.stop();
            reactiveObject.interrupt();
            contentObject.pause();
            console.log("recording now"); reactiveObject.trigger("recordstart", () => {
                startRecording(async () => {
                    // upload audio to server
                    let uploadPath = await uploadBlob(pendingBlob);
                    try {
                        console.log(currentThread);
                        await dbRespondToThread(burpuid, currentThread._id, uploadPath);
                        reactiveObject.trigger("success", async () => {
                            ambientObject.start('thread');
                            ambientObject.lowPass(false);
                            currentThread = await dbGetOneThread(currentThread._id);
                            reloadCurrentThread();
                        });
                    } catch (error) {
                        reactiveObject.trigger("error");
                        console.log("error responding to thread", error);
                    }
                });
            });
        },
        recUp: () => {
            if (isRecording) {
                stopRecording();
            } else if (reactiveObject.isPlaying) {
                console.log("recording cancelled");
                reactiveObject.interrupt();
                ambientObject.start('profile');
                // contentObject.play();
            }
        },
        playDown: () => { reactiveObject.trigger('select'); },
        playUp: () => {
            // reactiveObject.trigger('select');
            if (contentObject && !contentObject.isPlaying) {
                ambientObject.lowPass(true);
                contentObject.play(() => {
                    ambientObject.lowPass(false);
                });
            }
        },
        backDown: () => {
            reactiveObject.trigger('back');
        },
        backUp: () => {
            if (contentObject.isPlaying) {
                contentObject.pause();
                ambientObject.lowPass(false);
            } else {
                currentThread = null;
                if (tutorialToggle.checked) toTutThreadStage();
                else toThreadStage();
            }
        },
        jogMoved: () => {
            // jogwheel value is 0 - 1.0
            if (jogwheel.value < jogNextThres && jogwheel.value > jogPrevThres) {
                if (contentObject.isPlaying) {
                    contentObject.scrub(jogwheel.value);
                }
            } else if (jogwheel.value >= jogNextThres && jogwheelPrevVal < jogNextThres) {
                reactiveObject.trigger('nextopener');
            } else if (jogwheel.value <= jogPrevThres && jogwheelPrevVal > jogPrevThres) {
                reactiveObject.trigger('prevopener');
            }
            jogwheelPrevVal = jogwheel.value;
        },
        jogUp: () => {
            if (jogwheelPrevVal < jogNextThres && jogwheelPrevVal > jogPrevThres) {
                if (contentObject.isPlaying) {
                    contentObject.scrub(jogwheel.value);
                }
            } else if (jogwheelPrevVal >= jogNextThres) {
                reactiveObject.trigger('nextcloser');
                loadNextThread();
            } else if (jogwheelPrevVal <= jogPrevThres) {
                reactiveObject.trigger('prevcloser');
                loadPreviousThread();
            }
            jogwheelPrevVal = jogwheel.value;
        },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("profile");
}

function toTutProfileStage(uid) {
    buttonMap = {
        recDown: () => { },
        recUp: () => { },
        playDown: () => { },
        playUp: () => { },
        backDown: () => { },
        backUp: () => {
            tutorialObject.interrupt();
            toProfileStage(uid);
        },
        jogMoved: () => { },
        jogUp: () => { },
    };
    ambientObject.stop();
    ambientObject.lowPass(true);
    ambientObject.start("profile");
    tutorialObject.trigger('profile', () => {
        toProfileStage(uid);
    });
}

// <----------------------------------------------

// FIREBASE HELPERS
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
            loginInput.value = ""; // set to "" for production
            loginInput.placeholder = "Code";
            loginInput.removeEventListener('input', addPlus);
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
    // console.log("verify button clicked");
    const code = loginInput.value;
    confirmationResult.confirm(code).then(function (result) {
        var user = result.user;
        burpuid = user.uid;
        // console.log(user);
        console.log("User signed in successfully: " + burpuid);
        audioContext.resume();
        toBootStage();
    }).catch(function (error) {
        console.error("Error while verifying the code", error);
        document.getElementById("login-message").innerHTML = "Could not verify code, please try again.";
    });
}

function fbSignOut() {
    auth.signOut().then(() => {
        console.log('User signed out.');
        location.reload();
    }).catch((error) => {
        console.error('Sign Out Error', error);
    });
}

// INTERFACE BUTTON HELPERS

function setupButtons() {
    let recButtonDiv = document.getElementById("recButtonDiv");
    let playButtonDiv = document.getElementById("playButtonDiv");
    let stopButtonDiv = document.getElementById("stopButtonDiv");

    // adding animations on click
    ['mousedown', 'touchstart'].forEach(function (e) {
        recButtonDiv.addEventListener(e, function (event) {
            if (e === 'touchstart') {
                event.preventDefault();
            }
            recordButton.classList.add('button-clicked');
            buttonMap.recDown();
        });
        playButtonDiv.addEventListener(e, function (event) {
            if (e === 'touchstart') {
                event.preventDefault();
            }
            playButton.classList.add('button-clicked');
            buttonMap.playDown();
        });
        stopButtonDiv.addEventListener(e, function (event) {
            if (e === 'touchstart') {
                event.preventDefault();
            }
            stopButton.classList.add('button-clicked');
            buttonMap.backDown();
        });
    });

    ['mouseup', 'touchend'].forEach(function (e) {
        recButtonDiv.addEventListener(e, function (event) {
            if (e === 'touchstart') {
                event.preventDefault();
            }
            recordButton.classList.remove('button-clicked');
            buttonMap.recUp();
        });
        playButtonDiv.addEventListener(e, function (event) {
            if (e === 'touchstart') {
                event.preventDefault();
            }
            playButton.classList.remove('button-clicked');
            buttonMap.playUp();
        });
        stopButtonDiv.addEventListener(e, function (event) {
            if (e === 'touchstart') {
                event.preventDefault();
            }
            stopButton.classList.remove('button-clicked');
            buttonMap.backUp();
        });
    });

    // JOGWHEEL
    ['input', 'change'].forEach(function (e) {
        jogwheel.addEventListener(e, function () {
            buttonMap.jogMoved();
        });
    });

    // reset jogwheel when released
    ['mouseup', 'touchend'].forEach(function (e) {
        jogwheel.addEventListener(e, function () {
            jogwheel.value = 0.5;
            buttonMap.jogUp();
        });
    });
}

// CONTENT HELPERS

async function loadProfile(uid) {
    try {
        console.log('loading profile for ', uid);
        let userProfile = await dbGetUserProfile(uid);
        let pseudoThread = {
            posts: [
                {
                    storagePath: userProfile.userTagPath
                }
            ]
        }
        threadQueue = await dbGetUserThreads(uid);
        threadQueue.unshift(pseudoThread);
        if (threadQueue.length > 1) {
            console.log('threads to be loaded: ', threadQueue);
            threadHistory = [];
            currentThread = null;
            await loadNextThread();
        } else {
            console.log('no threads authored by this user');
        }
    } catch (error) {
        console.log('Error loading profile', error);
    }
}

async function loadFeed() { // gets all unseen threads and preps the first one for playback
    try {
        threadHistory = [];
        currentThread = null;
        threadQueue = await dbGetUnseenThreads(burpuid); // returns an array of threads into global variable
        if (!threadQueue || threadQueue.length < 1) {
            console.log("no new threads");
        } else {
            console.log("new threads to be loaded:", threadQueue);
            threadQueue.forEach((thread, index) => {
                setTimeout(() => {
                    reactiveObject.trigger('newunseen');
                }, 500 * index);
            })
            // loadNextThread();
        }
        loadSeenFeed();
    } catch (error) {
        console.error('Error loading feed:', error);
    }
}

async function loadSeenFeed() {
    console.log('loading seen threads, since you know every fucking thing');
    try {
        // threadHistory = [];
        // currentThread = null;
        let seenThreadQueue = await dbGetSeenThreads(burpuid); // returns an array of threads into global variable

        if (!seenThreadQueue || seenThreadQueue.length < 1) {
            console.log("no seen threads");

        } else {
            console.log("threads to be loaded:", seenThreadQueue);
            if (!threadQueue || threadQueue.length < 1) threadQueue = [];
            seenThreadQueue.forEach((thread) => {
                threadQueue.push(thread);
            });
        }
        await loadNextThread();
    } catch (error) {
        console.error('Error loading audio:', error);
    }
}

async function logThreadView(thread) {
    try {
        if (thread) {
            await dbLogSeen(burpuid, thread._id);
            console.log("logged thread as seen");
        }
    } catch (error) {
        console.error("error logging this thread as seen: ", error)
    }
}

async function reloadCurrentThread() {
    try {
        if (!currentThread) {
            console.log('no current thread');
            reactiveObject.trigger('error');
            return null;
        } else {
            let posts = currentThread.posts;
            let storagePaths = posts.map(post => post.storagePath);
            let urls = await getUrlsFromPaths(storagePaths);
            contentObject.reset();
            await contentObject.loadContentFromUrls(urls);
            ambientObject.lowPass(true);
            contentObject.play(() => {
                ambientObject.lowPass(false);
            });
            logThreadView(currentThread);
        }
    } catch (error) {
        console.log('error reloading current thread', error);
    }
}

async function loadNextThread() {
    try {
        if (!threadQueue || threadQueue.length < 1) {
            console.log("no more new threads");
            reactiveObject.trigger("error");
            return null;
        } else {
            if (currentThread) threadHistory.push(currentThread);
            currentThread = threadQueue.shift();
            // console.log("current thread: ", currentThread);
            // console.log("thread queue: ", threadQueue);
            // console.log("thread history: ", threadHistory);
            let posts = currentThread.posts;
            let storagePaths = posts.map(post => post.storagePath);
            // console.log(storagePaths);
            let urls = await getUrlsFromPaths(storagePaths);
            contentObject.reset();
            await contentObject.loadContentFromUrls(urls);
            ambientObject.lowPass(true);
            contentObject.play(() => {
                ambientObject.lowPass(false);
            });
            logThreadView(currentThread);
        }
    } catch (error) {
        console.error('error loading next thread:', error);
    }
}

async function loadPreviousThread() {
    try {
        if (threadHistory.length < 1) {
            console.log("reached start of thread queue");
            reactiveObject.trigger("error");
            return null;
        } else {
            if (currentThread) threadQueue.unshift(currentThread);
            currentThread = threadHistory.pop();
            console.log("current thread: ", currentThread);
            console.log("thread queue: ", threadQueue);
            console.log("thread history: ", threadHistory);
            let posts = currentThread.posts;
            let storagePaths = posts.map(post => post.storagePath);
            console.log(storagePaths);
            let urls = await getUrlsFromPaths(storagePaths);
            contentObject.reset();
            await contentObject.loadContentFromUrls(urls);
            ambientObject.lowPass(true);
            contentObject.play(() => {
                ambientObject.lowPass(false);
            });
            logThreadView(currentThread);
        }
    } catch (error) {
        console.error('error loading next thread:', error);
    }
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



async function getCdnURL(path) {
    return new Promise(resolve => {
        getDownloadURL(ref(storage, path))
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                switch (error.code) {
                    case 'storage/object-not-found':
                        break;
                    case 'storage/unauthorized':
                        break;
                    case 'storage/canceled':
                        break;
                    case 'storage/unknown':
                        break;
                }
            });
    })
}

// // legacy from dev
// async function getAllAudioRefs() {
//     const listRef = ref(storage, 'audio');
//     const res = await listAll(listRef);
//     // console.log(res.items);
//     return res.items;
// }
// async function getUrlsFromRefs(refArray) {
//     console.log(refArray);
//     let urls = [];
//     refArray.forEach((r) => {
//         urls.push(getCdnURLFromRef(r));
//     });
//     try {
//         const results = await Promise.all(urls);
//         console.log("All urls gotten successfully");
//         console.log(results);
//         return results;
//         // console.log(urls);
//         // return urls;
//     } catch (error) {
//         console.error("Error processing items:", error);
//     }
// }
// async function getCdnURLFromRef(audioRef) {
//     return new Promise(resolve => {
//         getDownloadURL(audioRef)
//             .then((url) => {
//                 resolve(url);
//             })
//             .catch((error) => {
//                 switch (error.code) {
//                     case 'storage/object-not-found':
//                         break;
//                     case 'storage/unauthorized':
//                         break;
//                     case 'storage/canceled':
//                         break;
//                     case 'storage/unknown':
//                         break;
//                 }
//             });
//     })
// }

// // RECORDING HELPERS

function startRecording(callback) {
    if (contentObject.isPlaying) {
        contentObject.pause();
    }
    if (ambientObject.isPlaying) {
        console.log("stopping ambient");
        ambientObject.stop();
    }

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
        isRecording = false;
        recordedChunks = [];
        pendingBlob = recordedBlob;
        pendingBlobUrl = URL.createObjectURL(recordedBlob);
        if (callback) callback();
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
        // micStream.getTracks().forEach(track => track.stop());
    }
}

// upload audio
async function uploadBlob(audioBlob) {
    try {
        const uploadPath = '/audio/' + burpuid + "/" + Date.now() + '.wav';
        const uploadref = ref(storage, uploadPath);
        await uploadBytes(uploadref, audioBlob);
        console.log('Uploaded a blob or file!');
        return uploadPath;
    } catch (error) {
        console.log("error uploading audio: " + error);
        reactiveObject.trigger("error");
    }
}

// END OF RECORDING HELPERS

// DATABASE HELPERS
// CREATE
async function dbCreateUser(uid, burpPath) {
    try {
        const response = await fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "user",
                userID: uid,
                tagPath: burpPath,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        const data = await response.text();
        console.log('Success:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function dbCreateThread(uid, burpPath) {
    try {
        const response = await fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "thread",
                threadAuthor: uid,
                posts: [{
                    author: uid,
                    storagePath: burpPath,
                }],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        const data = await response.text();
        console.log('Success:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

// READ
async function dbGetUnseenThreads(uid) { // Returns array
    try {
        const response = await fetch('/thread/?' + new URLSearchParams({
            type: "unseen-threads",
            userID: uid,
        }));

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        if (typeof data === 'string') {
            console.error('Failed to parse JSON, received string: ', data);
        } else {
            console.log('Success:', data);
        }

        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function dbGetSeenThreads(uid) { // Returns array
    try {
        const response = await fetch('/thread/?' + new URLSearchParams({
            type: "seen-threads",
            userID: uid,
        }));

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        if (typeof data === 'string') {
            console.error('Failed to parse JSON, received string: ', data);
        } else {
            console.log('Success:', data);
        }

        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function dbGetOneThread(threadid) {
    try {
        const response = await fetch('/thread/?' + new URLSearchParams({
            type: "single-thread",
            threadID: threadid,
        }));

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        if (typeof data === 'string') {
            console.error('Failed to parse JSON, received string: ', data);
        } else {
            console.log('Success:', data);
        }

        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function dbGetUserThreads(uid) {
    try {
        const response = await fetch('/user/?' + new URLSearchParams({
            type: "user-threads",
            userID: uid,
        }));

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        if (typeof data === 'string') {
            console.error('Failed to parse JSON, received string: ', data);
        } else {
            console.log('Success:', data);
        }

        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function dbGetUserProfile(uid) { // if no profile, will return "no profile"
    try {
        const response = await fetch('/user/?' + new URLSearchParams({
            type: "profile",
            userID: uid,
        }));

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        console.log('got user profile ', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}


// PUT
async function dbLogSeen(uid, threadId) {
    try {
        const response = await fetch('/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "log-seen",
                userID: uid,
                threadID: threadId,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch {
            data = await response.text();
        }

        console.log('Successfully logged as seen:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function dbRespondToThread(uid, threadId, burpPath) {
    try {
        const response = await fetch('/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "new-response",
                threadID: threadId,
                post: {
                    author: uid,
                    storagePath: burpPath,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        const data = await response.json().catch(() => response.text());
        console.log('Success:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

async function dbUpdateUserTag(uid, burpPath) {
    try {
        const response = await fetch('/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "update-user-tag",
                userID: uid,
                tagPath: burpPath,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.statusText}`);
        }

        const data = await response.json().catch(() => response.text());
        console.log('Success:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}


