# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build step required. Serve with any static server:
```bash
python -m http.server 8000
# or
npx http-server
```

Then visit `http://localhost:8000`

## Architecture

### Core Framework (`js/core/`)
- **EventBus.js**: Singleton pub/sub system (`eventBus`) for decoupled component communication
- **Scene.js**: Base class for all lessons - provides SVG element creation, timeline management, and lifecycle hooks (`init()`, `setup()`, `play()`, `pause()`, `reset()`, `destroy()`)
- **Animator.js**: GSAP wrapper providing timeline control and common animation patterns (message flow, glow effects)

### Kafka Components (`js/kafka/`)
Reusable SVG visualization components: Producer, Consumer, Topic, Message, Broker. Each creates its own SVG group and handles click events for info panel display.

### Lessons (`js/lessons/`)
Each lesson extends `Scene` and implements:
- `setup()`: Create visual elements and GSAP timeline
- Uses `this.animator.createTimeline()` for animation sequences
- Components are positioned on a 1200x600 SVG viewBox

### UI Components (`js/ui/`)
- **Controls.js**: Play/pause, reset, speed slider - emits events via `eventBus`
- **InfoPanel.js**: Bootstrap offcanvas that displays component details on click
- **Navigation.js**: Lesson switching with progress tracking

### Event Flow
```
User Action → UI Component → eventBus.emit() → main.js → Scene method
```

Key events: `navigation:lessonChange`, `controls:playPause`, `controls:reset`, `controls:speedChange`, `scene:ready`

## Adding New Lessons

1. Create `js/lessons/LessonN_Name.js` extending `Scene`
2. Register in `js/main.js` `registerLessons()` with a slug key
3. Add list item to both lesson lists in `index.html` (mobile offcanvas and desktop sidebar)

## Design System

- **Producers**: Terra cotta (#C2785C → #A65D42)
- **Topics**: Sage green (#7B9E7B → #5C7A5C)
- **Consumers**: Teal (#6B9E9E → #4A7A7A)
- **Messages**: Warm amber (#D4A855)
- **Background**: Dark neutral (#1A1816)

GSAP easing: `power2.out` for most animations, `power1.inOut` for message flow.
