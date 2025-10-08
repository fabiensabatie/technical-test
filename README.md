# Mexty Technical Test - Interactive Block

Welcome to the Mexty technical test! Your mission is to create an **interactive, customizable experience** as a reusable block.
See examples on [Mexty's marketplace](https://workspace.mexty.ai/marketplace)

## 🎯 Objective

Create an engaging, interactive experience that can be **customized through props** and works on a specific topic of your choice.

### Requirements

✅ **Must have:**
- An interactive experience that users can engage with
- **Props support** - the experience must be customizable via props (difficulty, theme, settings, etc.)
- Use **@mexty/realtime** for multiplayer/realtime features (already included in dependencies)
- Work on a specific topic (education, entertainment, productivity, etc.)
- Be creative and show your skills!

❌ **Forbidden:**
- Quiz/QCM formats
- Crossword puzzles
- Any basic question-answer systems

### Ideas to Inspire You

Think beyond traditional educational formats! Here are some directions:

- **Collaborative Drawing/Art** - Create together in real-time (customizable: canvas size, brush types, themes)
- **Memory/Matching Games** - Find pairs, sequences (customizable: difficulty, card types, themes)
- **Escape Room Puzzles** - Logic puzzles, pattern matching (customizable: puzzle type, difficulty)
- **Interactive Storytelling** - Branching narratives (customizable: story theme, choices)
- **Music/Rhythm Experiences** - Create or play music together (customizable: instruments, tempo)
- **Strategy Games** - Chess variants, board games (customizable: rules, board size)
- **Simulation Experiences** - Physics, chemistry, biology simulations (customizable: parameters)
- **Word Games** - Hangman variants, word associations (customizable: word lists, difficulty)
- **3D Experiences** - Like the included example! (customizable: model, animations, camera)

**Be creative!** The best submissions show technical skills AND innovative thinking.

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

```bash
npm run dev
```

Opens Vite development server at `http://localhost:5173` with hot reload.

**This is where you build your block!** Edit `src/block.tsx` and `src/App.tsx`.

### 3. Build Your Module

```bash
npm run build
```

Creates the production webpack bundle with Module Federation in the `dist/` folder.

### 4. Test Your Built Module

```bash
npm run test
```

Opens test playground at `http://localhost:3002` where you can:
- ✅ Load your built webpack federation module
- ✅ Test props customization in real-time
- ✅ Verify everything works as expected

**Important:** Always run `npm run build` before `npm run test` to test the latest version!

## 📝 What to Submit

1. Your completed code in the `src/` folder
2. A brief description of your experience in this README (add it below)
3. Example props that showcase different configurations
4. Make sure `npm run build` && `npm run test` works!

## 🏗️ Project Structure

```
src/
├── index.tsx     # Entry point for development
├── App.tsx       # Exports the mount function for Module Federation
├── block.tsx     # Your main Block component (customize this!)
└── styles.css    # Your styles
```

## 📚 Available Libraries

Already included in this project:
- **React 19** with TypeScript
- **@mexty/realtime** - For multiplayer/realtime features
- **@react-three/fiber** & **@react-three/drei** - For 3D experiences
- **Three.js** - 3D graphics
- **Zustand** - State management
- **Tailwind CSS** - Via CDN (see index.html)

Need more? Add them to `package.json`!

## 💡 Props System

Your block receives props through the `BlockProps` interface. Example:

```typescript
interface BlockProps {
  // Define your customizable properties here!
  difficulty?: 'easy' | 'medium' | 'hard';
  theme?: string;
  playerCount?: number;
  // ... whatever makes sense for YOUR experience
}
```

These props can be changed in real-time in the test playground!

---

## 🎨 My Implementation: Advanced Collaborative Drawing Canvas

I've created a **high-performance real-time collaborative drawing application** that allows multiple users to draw together on a shared canvas with advanced optimization and smooth user experience.

### ✨ Features

**🎨 Advanced Drawing Experience:**

- **Real-time collaborative drawing** with multiple users
- **Smooth quadratic curve rendering** for natural brush strokes
- **Dynamic brush and eraser tools** with live preview cursors
- **10 preset colors** (Black, Red, Green, Blue, Yellow, Magenta, Cyan, Orange, Purple, Pink)
- **Adjustable brush size** (1-20px) with visual feedback
- **Intelligent stroke optimization** with distance-based point sampling
- **Canvas clearing** with instant synchronization

**🚀 Performance Optimizations:**

- **60FPS rendering** with frame-rate throttling
- **Offscreen canvas support** for improved performance
- **Stroke batching and grouping** by color/size for efficient rendering
- **Smart stroke pruning** when approaching limits (removes 10% oldest strokes)
- **Throttled cursor updates** (30fps drawing, 10fps idle)
- **Efficient re-rendering** only when canvas is dirty

**👥 Advanced Multiplayer Features:**

- **Live cursor tracking** with user identification (shows last 4 chars of user ID)
- **Real-time stroke synchronization** using @mexty/realtime
- **Color-coded user cursors** matching their drawing color
- **Automatic cursor timeout** (5 seconds) for inactive users
- **Connection status monitoring** with visual indicators
- **Active user count** and stroke statistics

**🎛️ Comprehensive Props System:**

- `canvasWidth` & `canvasHeight` - Canvas dimensions (default: 800x600)
- `brushSize` - Initial brush size 1-20px (default: 3)
- `brushColor` - Starting brush color (default: "#000000")
- `backgroundColor` - Canvas background color (default: "#ffffff")
- `enableEraser` - Enable/disable eraser tool (default: true)
- `maxStrokes` - Maximum strokes before auto-cleanup (default: 1000)
- `showCursors` - Show other users' cursors (default: true)
- `documentId` - Unique collaboration room ID (default: "default-canvas")

**💅 Premium UX Features:**

- **Responsive design** that scales to any container size
- **Full touch device support** with gesture prevention
- **Visual tool previews** (brush circle, eraser circle)
- **Live statistics dashboard** (stroke count, active users, connection status)
- **Smooth animations** for tool switching and cursor movements
- **Accessibility support** with ARIA labels and keyboard navigation
- **Clean, modern interface** with Tailwind CSS styling

### 🚀 Example Props Configurations

**Large Art Studio:**

```json
{
  "canvasWidth": 1200,
  "canvasHeight": 800,
  "maxStrokes": 2000,
  "brushSize": 5,
  "documentId": "art-studio-main"
}
```

**Compact Drawing Pad:**

```json
{
  "canvasWidth": 400,
  "canvasHeight": 300,
  "brushSize": 2,
  "maxStrokes": 500,
  "showCursors": true
}
```

**Bold Art Mode:**

```json
{
  "brushSize": 12,
  "brushColor": "#ff0000",
  "backgroundColor": "#f0f0f0",
  "maxStrokes": 300
}
```

**Mobile-Optimized:**

```json
{
  "canvasWidth": 350,
  "canvasHeight": 250,
  "brushSize": 4,
  "enableEraser": false,
  "maxStrokes": 200
}
```

**Whiteboard Mode:**

```json
{
  "canvasWidth": 1000,
  "canvasHeight": 700,
  "brushColor": "#000000",
  "backgroundColor": "#ffffff",
  "brushSize": 3,
  "documentId": "whiteboard-session-1"
}
```

### 🔧 Technical Highlights

- **Optimized rendering pipeline** with grouped stroke rendering
- **Smart memory management** with automatic stroke pruning
- **Efficient state management** preventing unnecessary re-renders
- **Advanced cursor tracking** with position-based update throttling
- **Touch-optimized** event handling for mobile devices
- **Real-time collaboration** powered by @mexty/realtime

The application demonstrates advanced React optimization techniques, sophisticated canvas rendering, and seamless real-time collaboration capabilities.

## ⏱️ Time Guideline

This test is designed to take **2-4 hours**. Focus on:
1. ✨ Core interactive experience (60% of time)
2. 🎛️ Props customization (20% of time)
3. 💅 Polish and UX (20% of time)

**Quality over quantity!** A well-executed simple experience is better than a complex but buggy one.

Good luck and have fun! 🚀
