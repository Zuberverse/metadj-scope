# Strategy - MetaDJ Scope

**Last Modified**: 2025-12-28 09:35 EST
**Status**: Active

## Purpose
Define the goals, constraints, and decision points for the Daydream Scope hackathon project.

## Selected Direction
Build a Scope-generated MetaDJ avatar driven by live webcam input. Scope is the avatar renderer. VACE provides identity consistency. ControlNet provides pose guidance if supported by Scope.

## Strategic Positioning

### Why This Hackathon Matters for MetaDJ
- Direct tech alignment: Scope uses StreamDiffusion, same foundation as Dream Engine work
- Avatar opportunity: VACE enables character-consistent generation, core to MetaDJ identity
- Performance narrative: Z's DJ background gives authentic voice in this space
- Portfolio expansion: Shipping this demo strengthens Zuberant's AI-native credibility

### Unique Advantages
1. Existing visual identity: MetaDJ avatar and aesthetic are already defined
2. Domain expertise: performance context is native, not learned
3. Prior AI video work: Dream Engine + StreamDiffusion experience reduces ramp-up
4. Brand story: clear demonstration of human identity embodied by AI video

## Goals

### Primary
- Ship a stable, real-time Scope avatar demo by the Jan 9 checkpoint
- Prove Scope can embody MetaDJ identity from live webcam input
- Keep the demo tight, reliable, and narrative-driven

### Secondary
- Learn Scope API and VACE deeply for future integration
- Establish a path for streaming-ready output
- Generate reusable patterns for MetaDJ Studio and Nexus

## Success Metrics
- Demo runs end-to-end without manual fixes
- Avatar identity is consistent across minutes of runtime
- Setup time for judges is minimal
- Clear 1-minute explanation of the flow

## Constraints
- Solo founder timeline and bandwidth
- Hackathon timeline with mid-point (Jan 2) and final (Jan 9) demo dates
- Holiday schedule may reduce available hours
- Stack still TBD (API vs desktop app)

## Assumptions
- Scope supports webcam ingest via API or desktop app
- VACE works with the chosen model and real-time pipeline
- ControlNet support is available for pose guidance (to be validated)
- RunPod is available if local GPU is insufficient

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope setup complexity | High | Start with RunPod; follow quickstart exactly |
| VACE quality insufficient | High | Iterate on reference set and prompts; adjust ControlNet strength |
| Latency too high | Medium | Simplify ControlNet stack; reduce resolution or steps |
| Over-scoping | High | Lock scope by Dec 28; defer masking and environments |

## Decision Points

### Decision 1: Integration Path (By Dec 28)
Options:
- Scope API server (programmatic control)
- Scope desktop app (manual control)

Decision criteria: fastest path to a reliable webcam-to-avatar demo

### Decision 2: Deployment Target (By Jan 2)
Options:
- Local GPU
- RunPod

Decision criteria: demo reliability and setup speed

### Decision 3: Post-MVP Enhancements (After Jan 9)
- Masking/segmentation for clean overlay
- Background environment layers
- TouchDesigner or Spout pipeline for performance compositing

### Decision 4: UI/UX Approach (Decided Dec 26)
**Decision**: Use native Scope platform UI for hackathon; defer custom UI to future.

**Rationale**:
- Scope's built-in UI already provides webcam input, VACE controls, prompt editing, and output display
- Building custom UI is overhead that doesn't improve the demo's impact
- Hackathon timeline favors focusing on the creative output (avatar quality) over infrastructure
- Custom UI can be developed later for MetaDJ Studio/Nexus integration

**Current State**:
- Next.js 16 project scaffolded and ready (matches MetaDJ Nexus stack)
- Components exist for future custom UI development
- Focus for hackathon: use Scope UI at RunPod instance directly

**Future Considerations**:
- Custom UI for branded MetaDJ experience
- Integration with MetaDJ Studio performance engine
- OBS/streaming overlay controls
- Multi-scene management for live shows

### Decision 5: Pipeline Selection (Decided Dec 26)
**Decision**: Use `longlive` pipeline with VACE enabled for hackathon demo.

**Rationale**:
For the MetaDJ avatar demo, **identity consistency is paramount**. After validating multiple pipelines:

| Pipeline | Output | VACE | Trade-off |
|----------|--------|------|-----------|
| `longlive` | Stylized/Artistic | ✅ Yes | Identity lock, less realistic |
| `krea-realtime-video` | Photorealistic | ❌ No | Beautiful output, no identity consistency |

**Why `longlive` + VACE wins**:
- VACE locks MetaDJ avatar identity via reference images
- Consistent recognizable character across runtime
- ~20GB VRAM (runs comfortably on RTX Pro 6000 with 76GB headroom)
- Stylized output aligns with MetaDJ aesthetic

**Why NOT `krea-realtime-video`**:
- **No VACE support** - Cannot lock identity; output varies by prompt alone
- Higher VRAM requirement (32GB for Wan2.1-T2V-1.3B model)
- Photorealism less important than brand consistency for this demo

**Configuration** (see `docs/architecture.md` for full config):
```yaml
pipeline: longlive
vace:
  enabled: true
  scale: 1.5
  reference_images: [metadj-avatar-v7.0.png]
prompt: "MetaDJ avatar, cyberpunk DJ, neon purple and cyan lighting"
```

**Validated Dec 26-27**: Both pipelines tested on RunPod instances. VACE confirmed working on `longlive`, confirmed NOT available on `krea-realtime-video`. Upgraded to RTX Pro 6000 (96GB) on Dec 27 for pipeline switching headroom.

## MVP Definition
- Webcam input drives pose (ingest path TBD)
- Scope generates MetaDJ avatar with VACE reference set
- Model selection TBD (candidate models in `docs/scope-technical.md`)
- Simple control panel for prompt intensity and style preset
- Demo viewer (browser or desktop)

## Near-Term Plan

### Phase 1: Validation (Dec 26-28)
1. Confirm webcam ingest path (API or desktop app)
2. Validate VACE reference image format and consistency
3. Run first stream with MetaDJ prompt + reference images
4. Lock scope and update `docs/architecture.md`

### Phase 2: Build (Dec 29 - Jan 5)
1. Implement core demo flow
2. Add minimal UI controls
3. Jan 2: Midpoint check-in with working prototype

### Phase 3: Polish (Jan 6-8)
1. Stability and latency cleanup
2. Demo preparation and rehearsal
3. Documentation and presentation materials

### Phase 4: Submit (Jan 9)
1. Final submission
2. Project completion and voting

## Documentation Checkpoints
- Dec 28: Architecture documented in `docs/architecture.md`
- Jan 2: Midpoint status in `CHANGELOG.md`
- Jan 9: Final documentation complete

## Notes
- Update this document after each major decision
- Cross-reference with `docs/research.md`
- Keep scope humane; ship the demo first, expand later
