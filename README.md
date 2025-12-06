# Kafka Flow Visualizer

An interactive, beautiful web-based visualization tool for learning Apache Kafka concepts. Built with modern web technologies and designed for developers who want to understand Kafka visually.

![Kafka Flow Visualizer](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Interactive Lessons**: Step-by-step visualization of Kafka concepts
- **Smooth Animations**: Professional-grade animations using GSAP
- **Click to Learn**: Click on any component to see detailed explanations
- **Playback Controls**: Play, pause, reset, and adjust animation speed
- **Modern Design**: Dark mode aesthetic with polished UI
- **Mobile Responsive**: Works on desktop and mobile devices
- **No Backend Required**: Pure client-side application

## Lessons

1. **The Basics** - Learn the fundamental Producer → Topic → Consumer flow
2. **Partitions** - Understand how messages distribute across partitions
3. **Partitions with Keys** - See how message keys ensure ordering
4. **Sticky Partitioner** - Learn about partition batching strategies
5. **Consumer Groups** - See how multiple consumers work together
6. **Offsets & Lag** - Visualize offset tracking and consumer lag
7. **Rebalancing** - Watch what happens when consumers join/leave

## Technology Stack

- **HTML5/CSS3** - Structure and styling
- **Vanilla JavaScript (ES6+)** - No framework overhead
- **GSAP 3** - Smooth, professional animations
- **SVG** - Crisp, scalable graphics

## Project Structure

```
kafka-flow-visualizer/
├── index.html              # Main entry point
├── css/
│   ├── main.css           # Theme, colors, base styles
│   ├── layout.css         # Grid, header, sidebar
│   └── components.css     # Buttons, panels, cards
├── js/
│   ├── main.js            # Application bootstrap
│   ├── core/
│   │   ├── EventBus.js    # Pub/sub event system
│   │   ├── Animator.js    # GSAP animation wrapper
│   │   └── Scene.js       # Base scene class
│   ├── kafka/
│   │   ├── Producer.js    # Producer visualization
│   │   ├── Topic.js       # Topic visualization
│   │   ├── Consumer.js    # Consumer visualization
│   │   ├── Message.js     # Message entity
│   │   └── Broker.js      # Broker visualization
│   ├── lessons/
│   │   ├── Lesson1_Basics.js
│   │   ├── Lesson2_Partitions.js
│   │   ├── Lesson3_PartitionsWithKeys.js
│   │   ├── Lesson4_PartitionerStrategies.js
│   │   ├── Lesson5_ConsumerGroups.js
│   │   ├── Lesson6_Offsets.js
│   │   └── Lesson7_Rebalancing.js
│   └── ui/
│       ├── Controls.js    # Playback controls
│       ├── InfoPanel.js   # Information sidebar
│       └── Navigation.js  # Lesson navigation
└── README.md
```

## Development

### Local Development

Simply open `index.html` in a modern browser. No build step required!

For live reload during development, you can use any static server:

```bash
# Python 3
python -m http.server 8000

# Node.js (with http-server)
npx http-server

# VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then visit `http://localhost:8000`

### Adding New Lessons

1. Create a new lesson file in `js/lessons/`:

```javascript
import { Scene } from '../core/Scene.js';

export class Lesson2_YourLesson extends Scene {
    constructor(canvas) {
        super(canvas, {
            title: 'Your Lesson Title',
            description: 'Brief description...'
        });
    }

    async setup() {
        // Create your visualization
    }
}
```

2. Register it in `js/main.js`:

```javascript
import { Lesson2_YourLesson } from './lessons/Lesson2_YourLesson.js';

registerLessons() {
    this.lessons.set('basics', Lesson1_Basics);
    this.lessons.set('your-lesson', Lesson2_YourLesson);  // Add here
}
```

3. Update the sidebar in `index.html`

## Design Philosophy

### Color Palette

- **Producers**: Terra cotta (#C2785C → #A65D42)
- **Topics**: Sage green (#7B9E7B → #5C7A5C)
- **Consumers**: Teal (#6B9E9E → #4A7A7A)
- **Messages**: Warm amber (#D4A855) - stands out as data in motion

### Animation Principles

- **Easing**: Natural, physics-based motion (power2.out, power1.inOut)
- **Timing**: Smooth but not too slow (0.8-1.5s for message flow)
- **Feedback**: Visual response to all interactions
- **Looping**: Seamless infinite loops for continuous learning

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

(ES6 modules and CSS custom properties required)

## Contributing

This is a teaching tool! Contributions are welcome:

1. **New Lessons**: Add visualizations for more Kafka concepts
2. **Improvements**: Better animations, clearer explanations
3. **Bug Fixes**: Report issues or submit fixes
4. **Design**: UI/UX improvements

## License

MIT License - See [LICENSE](LICENSE) file

## Acknowledgments

- Built with [GSAP](https://greensock.com/gsap/) for animations
- Inspired by the need for better Kafka educational resources
- Color palette influenced by Linear and Stripe design systems

## Contact

Created by [@williajm](https://github.com/williajm)

---

**Learn Kafka Visually** 🚀