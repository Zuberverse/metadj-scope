# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-12-26

### Added
- Initial repository scaffold and baseline documentation for the MetaDJ Scope hackathon project
- Next.js 16 + TypeScript + Tailwind 4 project setup (matches MetaDJ Nexus stack)
- Scope API client with typed interfaces for VACE generation
- Avatar Studio UI components (scaffolded for future custom UI)
- RunPod deployment with RTX 5090 GPU

### Changed
- Upgraded stack from Next.js 15 to Next.js 16
- Upgraded Tailwind CSS from v3 to v4 (CSS-based config)
- Updated dev server port to 2000

### Decided
- **UI Approach**: Use native Scope platform UI for hackathon; defer custom UI to future
  - Scope UI already provides webcam input, VACE controls, prompt editing, output display
  - Custom UI infrastructure ready for MetaDJ Studio integration later
  - Focus on avatar quality and demo polish, not infrastructure
