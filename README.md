# Mud Pies 🥧

A fun, physics-based throwing game inspired by Google Doodle Action Gnomes and Angry Birds.

## About

Mud Pies is a simple browser-based game where you throw mud pies as far as possible! Created as a passion project by [@live-by-unix](https://github.com/live-by-unix).

## Features

- 🎮 **Physics-based gameplay** - Realistic projectile motion with gravity
- 💨 **Dynamic wind system** - Wind conditions change to affect your throws
- 📊 **Score tracking** - Track your highest score and last run's distance
- 📱 **Responsive design** - Works on desktop and mobile devices
- 🎯 **Touch & keyboard support** - Play with mouse, touch, or keyboard
- 🌐 **Progressive Web App** - Install as an app and play offline
- ⏱️ **Real-time stopwatch** - See how long your throw lasts

## How to Play

1. **Aim** - Click and drag the mud pie to set your angle
2. **Power up** - Pull back further for more power (watch the power bar change color)
3. **Release** - Let go to throw the mud pie
4. **Watch** - The camera follows your throw while the stopwatch tracks flight time
5. **Compete** - Try to beat your highest score!

### Keyboard Shortcuts

- **Space** - Play again after a throw
- **R** - Return to menu
- **M** - Toggle music on/off

## Technology Stack

- **HTML5** - Structure and semantic markup
- **CSS3** - Responsive styling with gradients and animations
- **Vanilla JavaScript** - Game logic and physics simulation
- **Canvas API** - Game rendering
- **Service Worker** - Offline support and PWA functionality

## Installation

### Play Online

Visit the live game at [mudpies.pages.dev](https://mudpies.pages.dev)

### Install as App

1. Open the game in your browser
2. Click the browser menu (⋮ or ⋯)
3. Select "Install app" or "Add to Home Screen"
4. Enjoy offline gameplay!

## Local Development

```bash
# Clone the repository
git clone https://github.com/live-by-unix/mudpies.git
cd mudpies

# Start a local server (Python 3)
python -m http.server 8000

# Or with Node.js (http-server)
npx http-server

# Open http://localhost:8000 in your browser
```

## File Structure

```
mudpies/
├── index.html          # Main game page
├── about.html          # About page
├── script.js           # Game logic and physics
├── style.css           # Styling
├── sw.js               # Service worker for offline support
├── manifest.json       # PWA manifest
├── README.md           # This file
├── LICENSE             # MIT License
└── assets/
    ├── mudpie.png      # Game icon
    ├── music.mp3       # Background music
    └── splat.wav       # Sound effect
```

## Game Mechanics

### Physics

- **Gravity**: 0.5 pixels/frame²
- **Drag mechanics**: Pull distance limited to 400 pixels
- **Power multiplier**: 0.35× pull distance
- **Wind effects**: Ranges from -0.3 to +0.3 with smooth transitions

### Scoring

Distance is calculated as: `Math.floor(Math.abs(mudPie.x - mudPie.startX) / 10)` meters

- Highest score is saved to localStorage
- Last run's score is also tracked
- Reset button clears all progress

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- 60 FPS game loop using `requestAnimationFrame`
- Optimized canvas rendering
- Efficient splat particle effects
- Smooth camera following with easing

## Accessibility

- Keyboard controls for full playability
- Touch support for mobile devices
- Clear visual feedback (power bar, distance display)
- High contrast colors for readability

## Future Ideas

- [ ] Multiple difficulty levels
- [ ] Obstacles and targets
- [ ] Leaderboard system
- [ ] Sound settings
- [ ] Different mud pie types
- [ ] Power-ups
- [ ] Multiplayer mode
- [ ] Custom themes

## Contributing

Feel free to fork, modify, and improve! If you have suggestions or find bugs, please open an issue.

## License

MIT License - See [LICENSE](LICENSE) file for details

## Credits

- Inspired by [Google Doodle Action Gnomes](https://www.google.com/doodles/) and [Angry Birds](https://www.angrybirds.com/)
- Background vectors from [Vecteezy](https://www.vecteezy.com/)
- Created with ❤️ by [@live-by-unix](https://github.com/live-by-unix)

## Play Now

🎮 **[mudpies.pages.dev](https://mudpies.pages.dev)**

Have fun throwing mud pies! 🥧
