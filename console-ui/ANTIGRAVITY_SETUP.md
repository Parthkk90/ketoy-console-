# Antigravity Component Setup

## Installation Note

If the Three.js dependencies are not automatically installed, please run:

```bash
npm install three @react-three/fiber
```

or

```bash
yarn add three @react-three/fiber
```

or

```bash
pnpm add three @react-three/fiber
```

or

```bash
bun add three @react-three/fiber
```

## Features Added

### 1. Interactive Particle Background
- Added Antigravity component with Three.js and React Three Fiber
- Particles react to mouse movement creating a magnetic ring effect
- Auto-animation when mouse is idle
- Green particles (#22c55e) matching Ketoy brand

### 2. Dark Black Background
- Changed entire app background to pure black (#000000)
- Updated all pages and components for consistency
- Added backdrop blur to auth form for better contrast

### 3. Component Files
- **src/components/Antigravity.jsx** - Main particle animation component
- **src/pages/AuthPage.jsx** - Updated with animated background

## Configuration

The Antigravity component on the AuthPage uses these settings:
- 300 particles
- Box particle shape
- Green color (#22c55e - Ketoy brand color)
- Auto-animation enabled
- Magnetic radius: 10
- Ring radius: 10

## Customization

You can adjust the particle behavior by modifying the props in AuthPage.jsx:

```jsx
<Antigravity
  count={300}              // Number of particles
  magnetRadius={10}        // Mouse interaction radius
  ringRadius={10}          // Ring formation radius
  waveSpeed={0.4}         // Speed of wave animation
  waveAmplitude={1}       // Wave strength
  particleSize={1.5}      // Particle size
  lerpSpeed={0.05}        // Smoothing factor
  color="#22c55e"         // Ketoy green
  autoAnimate             // Enable auto-animation
  particleShape="box"     // Shape: box, sphere, capsule, tetrahedron
  fieldStrength={10}      // Magnetic field strength
/>
```

## Performance

The component uses:
- Instanced meshes for efficient rendering
- requestAnimationFrame for smooth animations
- Optimized particle calculations

## Browser Compatibility

Requires:
- WebGL support
- Modern browser (Chrome, Firefox, Safari, Edge)
- Hardware acceleration enabled
