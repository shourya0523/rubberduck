---
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
date: 2026-08-10
---

# Duck OS UI Overhaul - Plan

## Goal Capsule

**Objective:** Recast the Rubber Duck debugging surface as a retro developer-terminal mini-game while preserving every current debugging interaction.

**Product authority:** This plan defines the visual language, interaction tone, and duck-character behavior. It does not change voice capture, typed input, streaming responses, session history, or bridge behavior.

**Open blockers:** None. Exact art frames and copy are creative-production choices to resolve during implementation.

## Product Contract

### Users and outcome

Developers explaining a problem to the duck should be able to read and control an active debugging session as quickly as they can today, while feeling that the duck is an active companion rather than static decoration.

### In scope

- Replace the atmospheric glass interface with a cohesive **Duck OS** pixel-art developer-terminal design language.
- Use high-contrast, terminal-inspired surfaces: dark display background, pixel borders, grid-aligned panels, amber duck, and restrained phosphor-green/mint diagnostics.
- Make the duck the central visual actor with distinct idle, listening, thinking, and celebration/error-appropriate reactions.
- Add short, non-blocking pixel speech bubbles or captions for personality moments, including quacks and thinking reactions.
- Reframe existing status, input, transcript, typing, and session-log surfaces as a readable terminal/workbench interface.
- Preserve the current input and response lifecycle, including hold-to-talk, keyboard activation, typed fallback, streamed output, session log, and error states.
- Retain accessibility accommodations for reduced motion, increased contrast, reduced transparency, keyboard use, and screen-reader announcements.

### Out of scope

- Changes to speech recognition, microphone permissions, SSE streaming, bridge endpoints, or session persistence.
- New gameplay, scoring, progression, accounts, or changes to the debugging workflow.
- Requiring runtime-hosted assets or external font/CDN dependencies.

### Design principles

1. **Utility survives the theme.** Active input, live response text, status, and recovery actions remain immediately scannable.
2. **The duck earns attention.** Character animation and quips respond to meaningful session states rather than looping as background noise.
3. **Pixel-native, not pixel-flavored.** Typography, borders, spacing, iconography, and motion share a deliberately low-resolution system.
4. **Charm never interrupts.** Speech bubbles are brief, secondary, and must not cover live text or block controls.
5. **Accessible terminal.** Contrast and semantic feedback matter more than CRT effects; motion and visual texture must degrade cleanly.

### Experience requirements

#### Screen structure

- The page retains its existing primary regions: identity/status, duck stage, live conversation, and input dock.
- Each region receives a distinct terminal-panel role so people can identify status, compose input, and follow output at a glance.
- When streaming begins, conversation output becomes the dominant reading surface without hiding the duck's current state.

#### Duck character states

- **Idle:** inviting but calm; may use infrequent ambient pixel motion.
- **Listening:** visibly acknowledges active voice capture and communicates that release ends capture.
- **Thinking:** indicates the request has been sent and the duck is awaiting a response; may display a brief themed thought bubble.
- **Responding/completing:** celebrates useful completion without competing with the streamed answer.
- **Failure/fallback:** communicates an unavailable microphone or bridge problem clearly, with no misleading celebratory behavior.

#### Speech bubbles

- Bubbles appear only at state transitions or meaningful milestones, never per streamed token.
- Copy is concise, legible, and can include a playful quack/terminal flavor.
- Status text remains the source of truth; bubbles supplement rather than replace it.
- Reduced-motion users receive static state indicators and may receive non-animated text equivalents.

#### Typography, color, and motion

- The visual language uses a compact bitmap/pixel-display treatment for labels and headings, paired with a legible body treatment for extended debugging text.
- Palette assignments carry meaning consistently: duck/action emphasis, ordinary terminal information, waiting/listening, and error states are distinguishable without relying on hue alone.
- Effects such as scan lines, dithering, or phosphor glow remain subtle enough to preserve text contrast and avoid visual fatigue.
- Animation timing feels like small game feedback—snappy, intentional, and state-linked—not continuous decoration.

### Acceptance signals

- A user can still complete a voice or typed debugging exchange and find the live response, current status, and session log without relearning the flow.
- The duck visibly differentiates idle, listening, thinking, response completion, and error/fallback contexts.
- Character bubbles are playful but do not obstruct controls, user input, or streamed content on desktop or mobile layouts.
- The interface remains usable with keyboard-only input and with reduced-motion, high-contrast, and reduced-transparency preferences enabled.
- The redesigned UI introduces no runtime dependency on an external CDN or media host.

### Existing-context constraints

- The product is a single static UI surface served by a dependency-free Node bridge; its current interaction model is intentionally preserved.
- The existing state model already distinguishes base, thinking, and excited duck states. The redesign may enrich their presentation, but its requirements do not assume a new backend state protocol.
- Repository documentation currently disagrees about whether the duck uses inline SVG or bundled media. The implementation should reconcile that documentation with the chosen asset approach.

### Key decisions

- **session-settled:** Use the Duck OS / retro developer-terminal mini-game direction rather than a restrained CRT companion design.
- **session-settled:** Preserve the current voice, typed-input, streaming, and session-log interactions.
- **session-settled:** Balance fast debugging readability with a delightful, more expressive duck character.
- **session-settled:** Add quacks and thinking speech bubbles as supplementary character feedback.
