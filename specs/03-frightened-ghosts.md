# SPEC 03 — Frightened Ghosts

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-10
> **Objective:** Make Power Pellets frighten ghosts for ten seconds so Pac-Man can eat them for escalating scores with visual and audio feedback.

## Scope

**In:**

- Activate a ten-second frightened mode whenever Pac-Man collects a Power Pellet.
- Reuse the existing Power Pellet pulse and collection sound without changing their duration or parameters.
- Immediately reverse every released ghost when a Power Pellet is collected, including during an already active frightened mode.
- Make released frightened ghosts choose valid routes that maximize their shortest-path distance from Pac-Man.
- Choose randomly between equally distant frightened routes while retaining the existing tunnel and ghost door traversal rules.
- Keep frightened ghost speed at the existing `0.1` cells per frame.
- Frighten unreleased ghosts only after they leave the pen while the frightened timer remains active.
- Make Pac-Man eat frightened ghosts instead of losing a life on collision.
- Award `200`, `400`, `800`, and `1600` points for successive frightened ghost captures in one frightened activation.
- Award `1600` points for every capture after the fourth one in the same activation.
- Return an eaten ghost instantly to its configured start cell, keep its normal color while waiting in the pen, and delay its new release from the capture time by its original `releaseDelay`.
- Reset the frightened timer and capture chain when another Power Pellet is collected.
- Cancel frightened mode, capture chain, floating scores, and pending frightened-ghost sounds after Pac-Man loses a life.
- Render frightened ghosts with body color `#2121ff`, pink `#ffb8ff` rectangular eyes, and a pink zigzag mouth.
- Alternate the frightened body between `#2121ff` and white every `250` ms during the final two seconds of frightened mode.
- Render one yellow, 12-pixel floating score for each eaten ghost that rises `20` pixels and fades out over one second of active game time.
- Generate one square-wave Web Audio tone rising from `440` Hz to `880` Hz over `150` ms with maximum gain `0.1` for each eaten ghost.
- Sequence multiple frightened-ghost tones from one frame at `150` ms intervals without overlapping them.
- Continue gameplay and visual effects if Web Audio is unavailable or blocked.

**Out of scope (for future specs):**

- Returning eyes that navigate back to the pen.
- Original arcade timing tables, scatter mode, Elroy behavior, or original-game bugs.
- New audio for frightened-mode activation, an ambient frightened-mode sound, or audio settings.
- Changes to Power Pellet locations, values, pulsing, or collection sound.
- Persistent game state, scoreboards, or high scores.

## Data model

`src/js/game.js` adds frightened-mode state and per-ghost release scheduling.

```js
const game = {
  playingTime: 0,
  frightenedRemaining: 0,
  frightenedGhostsEaten: 0,
  ghostEatenSoundsPending: 0,
  floatingScores: [], // { x, y, score, remaining }
};

const ghost = {
  released: false,
  releaseAt: 0,
};
```

`frightenedRemaining` and each `floatingScores[].remaining` are milliseconds measured only while `game.state === 'playing'`.

`ghostEatenSoundsPending` counts tones to schedule. `releaseAt` is an absolute `game.playingTime` value. An eaten ghost receives `releaseAt = game.playingTime + ghost.releaseDelay`.

A ghost is frightened only when `ghost.released === true` and `game.frightenedRemaining > 0`. A ghost waiting in the pen keeps its normal render color until release.

## Implementation plan

1. Extend `createGame()` and `resetPositions()` in `src/js/game.js` with frightened-mode state, floating-score state, per-ghost `releaseAt`, and reset behavior while preserving the existing positions and release delays.
2. Update Power Pellet collection and active-time advancement in `src/js/game.js` to start or restart the ten-second frightened timer, reset the capture chain, reverse released ghosts, release pen ghosts at `releaseAt`, and expire frightened mode before collision evaluation when its timer reaches zero.
3. Add frightened route selection in `src/js/game.js` that evaluates valid non-reversing directions by shortest-path distance from Pac-Man and selects randomly among the furthest options while retaining existing ghost behavior outside frightened mode.
4. Replace frightened-ghost collision handling in `src/js/game.js` with escalating scores, floating-score creation, pending sound increments, instant return to the pen, and a capture-time release delay; retain ordinary life loss for non-frightened collisions.
5. Update `src/js/render.js` to draw frightened bodies, the final-two-second blue-and-white blink, pink arcade faces, and yellow 12-pixel floating scores that rise 20 pixels and fade over one second.
6. Update `src/js/main.js` to consume `ghostEatenSoundsPending` and schedule one non-overlapping square-wave `440` to `880` Hz tone per capture without interrupting the game if Web Audio fails.

## Acceptance criteria

- [ ] Collecting a Power Pellet sets `frightenedRemaining` to exactly `10000` ms and resets `frightenedGhostsEaten` to zero.
- [ ] Collecting a second Power Pellet during frightened mode restores the timer to `10000` ms, resets the capture chain, and reverses every released ghost again.
- [ ] A released ghost reverses direction immediately when frightened mode begins.
- [ ] A ghost that remains in the pen keeps its release delay and becomes frightened only if it releases before the timer ends.
- [ ] At an intersection, a frightened released ghost selects a valid non-reversing route with maximum shortest-path distance from Pac-Man and resolves equal maxima randomly.
- [ ] Frightened ghosts keep speed `0.1` cells per frame and retain current tunnel and door traversal rules.
- [ ] A frightened ghost body is `#2121ff` with pink rectangular eyes and a pink zigzag mouth before the last two seconds.
- [ ] During the last `2000` ms of frightened mode, each released frightened ghost alternates between blue and white every `250` ms.
- [ ] A collision with a frightened ghost awards `200`, then `400`, `800`, and `1600` points for successive captures in one activation.
- [ ] A fifth or later capture in the same activation awards `1600` points.
- [ ] Eating a frightened ghost returns it instantly to its configured start cell, marks it unreleased, and schedules its normal release delay from the capture time.
- [ ] A ghost waiting in the pen after capture renders with its normal configured color.
- [ ] Each eaten ghost creates an independent yellow 12-pixel score label at its capture location that rises 20 pixels and fades out within `1000` ms of active game time.
- [ ] Each eaten ghost schedules a square-wave tone from `440` Hz to `880` Hz for `150` ms with maximum gain `0.1`.
- [ ] Multiple captures in one frame schedule their tones sequentially at `150` ms intervals.
- [ ] Web Audio failure does not prevent scoring, ghost return, or floating-score rendering.
- [ ] When frightened mode reaches `0` ms, a same-frame ghost collision is treated as a normal collision and reduces Pac-Man's life.
- [ ] Losing a life clears frightened mode, the capture chain, floating scores, and pending frightened-ghost sounds.
- [ ] Existing Power Pellet pulse and `220` to `440` Hz collection sound remain unchanged.
- [ ] Starting, restarting, normal dots, win state, normal ghost behaviors, lives, loss state, and row-14 tunnel wrapping remain functional.

## Decisions

- **Yes:** Ten seconds of frightened mode. It gives sufficient time for the requested avoidance and capture loop.
- **Yes:** Released ghosts immediately reverse for every Power Pellet. It makes activation visible and applies consistently to repeated pellets.
- **Yes:** Flee through maximum shortest-path distance with random tie resolution. It creates deliberate avoidance without deterministic loops.
- **Yes:** Keep frightened speed at `0.1`. The state changes pathing and collision rules without introducing another speed balance variable.
- **Yes:** Unreleased ghosts remain scheduled and become frightened only after release. The existing staged-release behavior remains intact.
- **Yes:** Use the `200/400/800/1600` capture chain and cap later captures at `1600`. It rewards consecutive captures while bounding score growth.
- **Yes:** Reset timer and chain for every new Power Pellet. Each pellet begins a new frightened activation.
- **Yes:** Return eaten ghosts instantly to the pen and restart their configured release delay at capture time. Returning eyes are intentionally deferred.
- **Yes:** Expire frightened mode before collisions at zero milliseconds. The boundary condition is deterministic.
- **Yes:** Use blue, then blue-and-white blinking, with a pink arcade face. The visual state stays distinct from all classic ghost colors.
- **Yes:** Show one yellow floating score per capture. The score increase is visible without introducing a new HUD component.
- **Yes:** Reuse the existing Power Pellet pulse and tone unchanged. Those are collection effects, not frightened-mode effects.
- **Yes:** Add sequential square-wave capture tones. They distinguish ghost captures and preserve one audible cue per simultaneous capture.
- **No:** Return-to-pen eye movement. It needs a separate navigation and rendering state.
- **No:** Frightened-mode ambient audio or new Power Pellet audio. The requested capture tone is sufficient.
- **No:** Power Pellet layout or score changes. SPEC 02 remains authoritative for those rules.

## Risks

| Risk                                                               | Mitigation                                                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| A frightened route cannot reach Pac-Man's region through the maze. | Evaluate only valid first directions and choose from the furthest reachable shortest-path distances. |
| Multiple captured ghosts schedule overlapping sound.               | Consume the pending counter by scheduling each 150 ms tone after the prior one.                      |
| A pen ghost is rendered frightened before its new release.         | Require `ghost.released` in both frightened logic and rendering.                                     |
| Floating scores leak across a life loss.                           | Empty `floatingScores` in `resetPositions()`.                                                        |
| Timer expiry and collision occur in one frame.                     | Decrement and expire frightened state before checking collisions.                                    |

## What is **not** in this spec

- Returning-eye navigation or animations.
- Original arcade scatter and chase timing systems.
- Ambient frightened-mode sound, audio settings, or persistence.
- Changes to Power Pellet placement, values, pulse, or collection tone.
