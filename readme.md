Yarn ball! - _"A curious browser game about curious cats"_
===
---

_Note: This game utilizes Babylon.js and works best when `WebGPU` is enabled. For best performance, use a `WebGPU` compatable browser. Performance is highly dependent on your device and the browser used. Feel free to experiment with various browsers, or adjust your `quality` settings ingame to improve game performance._

**Device Support**
===
---

_**NOTE**: PC Specs are less important than using a browser with `WebGPU` enabled. This feature allows the browser to directly utilize the GPU for faster visual rendering and will yield overall higher FPS._

_✅ = Tested, working_

_❗= Tested and working, but experimental_

_❔ = Untested, unsure_

## Desktop Browsers:

  **Firefox**: ❗
  - **WebGPU**: ✅ _(* ONLY works in `Firefox Nightly`, enabled by default)_
  - **FPS Range**: 60FPS+

  **Opera/OperaGX**: ✅
  - **WebGPU**: ✅
  - **FPS Range**: 60FPS+

  **Chrome**: ✅
  - **WebGPU**: ✅
  - **FPS Range**: 60FPS+

  **Brave**: ✅
  - **WebGPU**: ✅
  - **FPS Range**: 60FPS+

  **Edge**: ✅
  - **WebGPU**: ✅
  - **FPS Range**: 60FPS+

## Mobile Browsers:

_**NOTE**: Keep in mind, mobile browser performance tests were conducted on a `Samsung Note 20 Ultra`_

  **Firefox (Mobile)**: ❔
  - **WebGPU**: ❔
  - **FPS Range**: ❔

  **Opera/OperaGX (Mobile)**: ❔
  - **WebGPU**: ❔
  - **FPS Range**: ❔

  **Chrome (Mobile)**: ❔
  - **WebGPU**: ❔
  - **FPS Range**: ❔

  **Brave (Mobile)**: ❔
  - **WebGPU**: ❔
  - **FPS Range**: ❔

  **Edge (Mobile)**: ❔
  - **WebGPU**: ❔
  - **FPS Range**: ❔

Game Design Document
===
---

### 1. Core Concept

- **One-liner**: "A 3D puzzle-platformer RPG where you play as a curious cat in a human world."
- **Summary**: Start as an indoor cat solving puzzles and using your curiosity to increase your courage level. Progress to outdoor exploration once enough courage has been gained, and continue exploring even more skills and environments!

### 2. Genre & Platform

- 3D Puzzle Platformer for PC or mobile (browser-based via Babylon.js).

### 3. Core Gameplay Mechanics

- **Sound Beacons**: Focus on these to collect sounds, also gaining curiosity points.
- **Scents**: Sniff to collect scents, also gaining curiosity points.
- **Courage Level**: Acts as player level, increasing with curiosity points. Unlocks areas, abilities, and also directly correlates to your cat's age, starting off as a 1 year old kitten.
- **Puzzles**: Physics-based (e.g., knock over objects) or scripted events (e.g., meow for treats). Access to certain puzzles depends on courage or specific skill levels, requiring prerequisite puzzles to be completed before continuing further.
- **Skills**: Unlocked by leveling courage:
    - **Jump**: Start low, increase height.
    - **Claw**: Climb clawable surfaces, snag less with upgrades.
    - **Zoomies**: Short sprints, extended with upgrades.
    - **Meow**: Call humans or distract them, louder with upgrades.

### 4. Goals & Objectives

- Initial goal: Escape and become an outdoor cat by leveling courage.
- Post-escape: Solve puzzles, level skills, explore new areas, and uncover secrets.

### 5. Key Features

- **Multiplayer**: Ghost cats for social/cosmetic purposes, no co-op.
- **Curiosity Points**: Earned through interactions, unlocking new skills and puzzles.
- **Skills**: Start basic and improve with levels.
- **Item Interaction**: Bite to pick up or swat to move.
- **Human NPCs**: Limited role, occasional interruptions for cuddles (escapable).

### 6. Visual Style

Flat, cel-shaded, cartoonish simplicity.

### 7. Audio Style

Atmospheric realism: nature sounds, unintelligible human speech, and object noises.

### 8. Scope & Scale

Small, web/mobile optimized, expandable as needed.

### 9. Unique Selling Point (USP)

Few cat-focused 3D RPGs combine exploration, RPG elements, and puzzles.

### 10. Inspirations/References

1. **Portal**: Immersive world-building with minimal UI.
2. **Old School RuneScape**: Rewarding skill progression unlocking new content.
3. **Stray**: Interactive, curiosity-driven open-world exploration.