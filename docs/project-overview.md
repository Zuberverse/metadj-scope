# MetaDJ Scope — Project Overview

**Last Modified**: 2025-12-30 17:31 EST

MetaDJ Scope explores the intersection of music and AI-generated visuals, transforming how we experience sound through real-time visual storytelling. Built for the Daydream Scope Track hackathon, this project represents an early step toward a larger vision: creating immersive, personalized visual experiences that respond to and enhance the music we love.

## The Vision

Music moves us in ways words can't capture. MetaDJ Scope aims to give that movement a visual form—creating living artwork that breathes with the rhythm, pulses with the energy, and shifts with the mood of any track. Rather than static visualizers or pre-rendered videos, we're exploring what becomes possible when AI generation happens in real-time, directly responding to the music as it plays.

This is a creative exploration tool, not a production system. It's about discovering new ways to see sound and understanding how AI can amplify artistic expression without replacing human creativity.

## MVP Focus: Soundscape

For the hackathon, we're concentrating on **Soundscape**—a music-reactive visual generation experience. Upload any audio track, choose a visual theme, and watch as AI creates visuals that respond to the music's energy, brightness, and rhythm in real-time.

The MVP is designed for **private, local use**—a personal creative tool for exploring and experimenting with audio-visual possibilities rather than a public-facing application.

**Soundscape** and **Avatar Studio** each have dedicated pages in the custom Next.js app (`/soundscape` and `/avatar`). The home page (`/`) serves as a landing with tiles linking to each experience. Avatar Studio ingests webcam video via WebRTC (video-to-video mode), supports Apply Updates over the data channel, and auto-reconnects on drops (3 attempts). The native Scope UI remains a fallback for troubleshooting.

## Key Features (Status)

- **Soundscape** (active): Audio-reactive visuals driven by real-time music analysis.
- **Avatar Studio** (active): Webcam-driven MetaDJ avatar generation with VACE identity lock (video-to-video mode).
- **Storyteller** (future): Narrative visual mode for spoken or scripted prompts.

### What Soundscape Does

- Analyzes audio in real-time directly in the browser
- Maps musical characteristics (energy, brightness, texture, beats) to visual parameters
- Generates AI visuals that evolve with the music
- Offers themed visual styles aligned with the MetaDJ aesthetic

### Stretch Goal

If Soundscape development completes ahead of schedule, we may explore **Storyteller**—using AI to create narrative visual journeys that unfold alongside longer musical pieces, adding another dimension to the audio-visual experience.

## Why This Matters

This project is part of a broader exploration into how AI tools can serve as creative amplifiers. The goal isn't to automate creativity but to provide new instruments for expression—tools that respond to human input and create possibilities that wouldn't exist otherwise.

MetaDJ Scope is a learning journey as much as it is a hackathon entry. Every insight gained here informs the larger vision of what AI-enhanced creative experiences might become.

---

*Built for the Daydream Scope Track Hackathon | December 2024 – January 2025*
