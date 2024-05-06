# Burp World Online
![Burp World Online Cover Image](./doc/images/cover-black.png)
**Interaction Design + Product Design + Sound + Tech & Society**

[burpworld.online](https://burpworld.online) is an online social space for burpers and burp connoisseurs.

This app is a case study for non-visual user interfaces and an exploration of sound-based interactions to navigate rich functions, celebrating the utility of sound and the rich sonic qualities of the unfairly shamed burp.

This is Josh’s Thesis Project for ITP.

## Table of Contents

- [Abstract](#abstract)
- [Key Features](#key-features)
- [Technical Details](#technical-details)
- [Research and Context](#research-and-context)
- [Further Reading](#further-reading)

## Abstract
Why is the reaction to a burp either “ew gross”, a dirty look, or “Josh that’s disgusting”?

We as a society have failed the naturally gassy when we unfairly shame them for ruining a moment with an untimely burp. Sometimes we just can’t help it, after all, burps are unpredictable forces of nature and are uncomfortable to hold in.

Burp World Online was created to provide a safe online space for the helplessly gassy to share recordings of their burps, connect with each other, and celebrate the part of themselves that society wishes to quietly fan away.

Burp World Online also explores **sound design as interface design.** A case study of a social media platform with a non-visual sound-based user interface, we can imagine what it would ~~look~~ sound like to engage with each other online and asynchronously through the medium of sound.

There is so much we can do with just our ears and this project is designed to see what the boundaries of those abilities are. We do this by creating a framework for designing sound-based web user interfaces called Jogg.js, by designing an array of sounds that indicate user actions and app states, and a case study app.

This design exercise speculates on what other applications and user experiences could be created using this design framework, while also destigmatising natural body functions like burps. 

Who knew sound had the power to do all that?

## Key Features
Burp World Online allows you to:
- Create new burp threads
- Respond to existing burp threads
- Visit user profiles
- Scrub through playback

## Technical Details

Burp World Online is a full-stack web application that uses Node.js, Express, Firebase for authentication and storage, and MongoDB Community Edition. [burpworld.online](burpworld.online) is deployed on Digital Ocean and can be accessed using the web client with potential to work with native hardware clients in the future.

The web client is built with HTML, CSS, JavaScript, and uses [Jogg.js](./public/joggjs.md), a custom-built Javascript abstraction layer built on top of the Web Audio API designed to create interactive audio interfaces. Jogg is designed to work with Ambient, Reactive, and Content objects to create Stages in the app. 

All sounds used in the interface were designed in Ableton from one of my burps.

💡 This repo includes:

- The source code for Burp World Online
- [Jogg.js](./public/joggjs.md), a Javascript library for creating sound-based front end user interfaces
- The Ableton project file used to create the sounds

## Research and Context
Burp World Online is a divergence from voice assistant-style audio interfaces. Rather than taking one-off queries it takes a more casual approach that allows for browsing. The interface takes direct influence from a handheld tape recorder because its microphone, button, and slider input allows for both basic and rich input. Originally designed to use repurposed hardware, the web client is restricted to these inputs to put the audio-only hypothesis to the test and to be portable to hardware in the future. 

The interface also looks towards video game sound design (dynamically generated sound cues), Muzak (ambient mood altering music), and radio (surfing simultaneous audio streams) for inspiration. Using these influences a framework was created for dynamic sonic Stages (i.e the equivalent to a “view” in a graphic user interface) using Ambient, Reactive, and Content elements. More on this can be read in the [Jogg.js documentation](./public/joggjs.md).

Burp World Online uses custom sounds inspired by notable ambient composer Brian Eno. Each sound cue is carefully composed to be intuitively recognisable as an audio analog to a visual icon that represents a function. More on this can be read in the [full documentation](https://joshjoshjosh.notion.site/The-Thesis-Burp-World-Online-78d15c5a7433410aa86f26828636cea6?pvs=4).

As a social media platform, Burp World Online operates similarly to the For You Page on TikTok or the Reels page on Instagram using a single algorithmically sorted feed to show new content. Despite it being a single linear feed, users don’t find it limiting with some using it as their main source of content. As a repository for short-form audio content it is related to voice apps such as AirChat, Clubhouse, and Cappuccino.

The context of burps is varied, but in Western cultures it is considered uncouth and low brow to burp in public. Burp World Online aims to dispel the shame that surrounds burps and destigmatise the perfectly natural bodily function of burping. This project is a nod to previous absurd low brow social platforms like ratemypoo.com and Yo! (both defunct).

# Further Reading
[Read the full write up](https://joshjoshjosh.notion.site/The-Thesis-Burp-World-Online-78d15c5a7433410aa86f26828636cea6?pvs=4), describing the full research and development process.