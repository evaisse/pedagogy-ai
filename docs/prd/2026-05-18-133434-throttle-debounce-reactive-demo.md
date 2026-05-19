# PRD: Interactive Throttle/Debounce Reactive Event Flow Demo

## Introduction/Overview
Create a dependency-free static web demo that teaches junior developers how debounce and throttle shape high-frequency event streams in reactive programming.

The demo must let users generate rapid events, compare raw events with debounced and throttled handler calls, adjust timing values, and see the resulting flow on live timelines. The implementation should be simple enough to open directly in a browser from the repository.

## Goals
- Explain the difference between raw event streams, debounced handlers, and throttled handlers through direct interaction.
- Show how debounce waits for quiet time while throttle limits emissions to a regular cadence.
- Keep the implementation in vanilla HTML, CSS, and JavaScript with no build step or package installation.
- Provide clear junior-friendly educational copy, with optional short code snippets for implementation context.
- Make the demo responsive, accessible, and easy to validate manually.

## Technical Considerations
- Create the demo with `index.html`, `styles.css`, and `app.js`.
- Keep reusable debounce and throttle helpers as plain JavaScript functions in `app.js`.
- Use DOM APIs and browser timers only; do not introduce RxJS, npm tooling, frameworks, bundlers, or external assets.
- Use fixed-size timeline lanes so event markers do not resize or shift the layout.
- Keep all code, comments, UI text, and documentation in English.

## User Stories
### US-001: Build the static demo shell
**Description:** As a learner, I want a clear static page layout so that I can immediately understand what the demo compares.

**Acceptance Criteria:**
- [x] The repository contains `index.html`, `styles.css`, and `app.js`
- [x] Opening `index.html` directly in a browser displays the demo without a build step
- [x] The page has clearly labeled areas for raw events, debounced output, and throttled output
- [x] The layout remains usable at desktop and mobile widths
- [x] Interactive controls use accessible labels, button states, and keyboard-focus styles

**TDD Plan:**
- Test: Add a temporary browser smoke check that fails until the required demo containers and controls exist in the DOM.
- Implementation: Build the static HTML structure, link the CSS and JS files, and add the base responsive layout and accessible controls.

**Dependencies:** -
**Parallel Group:** shell

### US-002: Generate interactive event streams
**Description:** As a learner, I want to create rapid event bursts so that I can observe how high-frequency input behaves before filtering.

**Acceptance Criteria:**
- [x] Typing in an input field generates raw events
- [x] Moving a pointer over an interaction pad generates raw events
- [x] Pressing a burst button generates a short rapid sequence of raw events
- [x] Raw event count updates immediately for every generated event
- [x] A pause/resume control stops and restarts event capture without clearing existing data

**TDD Plan:**
- Test: Add failing browser-side checks for the event recorder: one event increments the raw counter, a burst increments it multiple times, and paused capture ignores new events.
- Implementation: Implement event capture, raw event recording, burst generation, counters, and pause/resume state.

**Dependencies:** US-001
**Parallel Group:** events

### US-003: Implement debounce and throttle behavior
**Description:** As a learner, I want raw events to feed debounce and throttle handlers so that I can compare their emitted outputs.

**Acceptance Criteria:**
- [x] The debounce helper emits only after the selected quiet period has passed
- [x] The throttle helper emits at most once per selected interval during a rapid event stream
- [x] Debounced and throttled emission counts update independently from the raw event count
- [x] Changing timing values affects future events without requiring a page reload
- [x] Resetting the demo cancels pending debounce timers and clears throttle state

**TDD Plan:**
- Test: Add failing dependency-free JavaScript assertions for pure debounce and throttle helpers using controlled timer delays.
- Implementation: Implement the helper functions, connect raw events to both handlers, and handle timing updates and reset cleanup.

**Dependencies:** US-002
**Parallel Group:** behavior

### US-004: Visualize event flow on timelines
**Description:** As a learner, I want to see raw and filtered events on separate timelines so that the timing difference is visible instead of abstract.

**Acceptance Criteria:**
- [x] Raw, debounce, and throttle lanes display event markers as events occur
- [x] Markers are visually distinct across lanes
- [x] Timeline labels and counts stay readable while many events are generated
- [x] The timeline keeps a recent rolling window instead of growing without limit
- [x] Reset clears all lanes and counters

**TDD Plan:**
- Test: Add a failing DOM check that records sample raw, debounce, and throttle events and expects one marker in each matching lane.
- Implementation: Add timeline rendering, rolling-window pruning, marker styling, and reset behavior.

**Dependencies:** US-003
**Parallel Group:** visualization

### US-005: Add educational explanation and code examples
**Description:** As a learner, I want concise explanations beside the live demo so that I can connect the visualization to real programming decisions.

**Acceptance Criteria:**
- [x] The page explains debounce in terms of waiting for a quiet period
- [x] The page explains throttle in terms of limiting output frequency
- [x] The page includes a short practical use-case comparison for search input, resize events, scroll events, and pointer movement
- [x] The page includes compact JavaScript snippets for debounce and throttle
- [x] The page avoids long tutorial text that distracts from the interactive demo

**TDD Plan:**
- Test: Add a failing content check that expects the main explanation terms and use-case labels to exist on the page.
- Implementation: Add concise educational copy, use-case guidance, and readable code snippets.

**Dependencies:** US-004
**Parallel Group:** content

### US-006: Validate and polish the static demo
**Description:** As a repository maintainer, I want the final static demo to be manually verifiable so that it can be trusted without a framework test setup.

**Acceptance Criteria:**
- [x] Manual validation confirms rapid input creates many raw events, one delayed debounce emission after quiet time, and regular throttle emissions during bursts
- [x] Manual validation confirms timing controls update behavior for subsequent events
- [x] Manual validation confirms pause/resume and reset behave correctly
- [x] Manual validation confirms the page is usable at narrow and wide viewport widths
- [x] The final files contain no unused dependencies, generated build output, or non-English code/documentation

**TDD Plan:**
- Test: Add a failing manual validation checklist before polish work and mark it complete only after all acceptance criteria pass.
- Implementation: Fix layout, interaction, timing, and content issues found during manual validation.

**Manual Validation Checklist:**
- [x] Rapid input records many raw events, one delayed debounce emission, and regular throttle emissions
- [x] Updated debounce and throttle timings affect only subsequent events
- [x] Pause/resume and reset preserve or clear state as expected
- [x] Narrow and wide viewport layouts remain usable
- [x] Final repository files contain no unused dependencies, build output, or non-English code/documentation

**Dependencies:** US-005
**Parallel Group:** validation

## Functional Requirements
- The demo must run by opening `index.html` directly in a modern browser.
- The demo must support three event sources: text input, pointer movement, and a burst button.
- The demo must show raw, debounced, and throttled event counts.
- The demo must show raw, debounced, and throttled event markers on separate timeline lanes.
- The demo must provide adjustable debounce and throttle intervals with visible current values.
- The demo must provide pause/resume and reset controls.
- The debounce implementation must cancel pending emissions when new raw events arrive before the quiet period ends.
- The throttle implementation must limit emissions to one call per selected interval during continuous input.
- The UI must explain when to use debounce versus throttle in practical programming scenarios.
- The implementation must not require npm, a dev server, a bundler, or external network access.

## Non-Goals
- Implementing a full reactive programming library.
- Adding RxJS or framework-specific examples.
- Creating a marketing landing page.
- Persisting demo state across browser sessions.
- Supporting legacy browsers that lack modern DOM and timer APIs.
- Adding analytics, telemetry, or remote assets.

## Success Metrics
- A junior developer can describe the difference between debounce and throttle after using the demo.
- The demo makes timing behavior visible without requiring users to read code first.
- The static files work locally with no installation step.
- Manual validation confirms all event sources, counters, timelines, timing controls, pause/resume, and reset behavior.
- The implementation remains small, readable, and convention-based.

## Open Questions
- None for v1.
- Default: keep validation manual except for lightweight browser-side checks embedded in the implementation where practical.
- Default: teach one simple throttle behavior instead of adding leading-edge and trailing-edge variants.
- Default: do not add a `README.md`; the demo page should be self-explanatory and directly openable.
