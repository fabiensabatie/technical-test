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
  difficulty?: "easy" | "medium" | "hard";
  theme?: string;
  playerCount?: number;
  // ... whatever makes sense for YOUR experience
}
```

These props can be changed in real-time in the test playground!

---

## 🎮 My Implementation: Interactive Checkers Game

I've created a fully functional **multiplayer Checkers game** with real-time synchronization and extensive customization options.

### ✨ Core Features

- **Full Checkers gameplay**: Standard 8x8 board with proper piece movement and capture rules
- **King promotion**: Pieces become kings when reaching the opposite end
- **Win conditions**: Game ends when a player has no pieces or no valid moves
- **Interactive UI**: Click to select pieces, see valid moves highlighted
- **Real-time multiplayer**: Live synchronization using @mexty/realtime
- **Player assignment**: Automatic player 1/player 2 assignment and spectator support
- **Move validation**: Only valid moves allowed, proper turn management

### 🎛️ Customizable Props

```typescript
interface BlockProps {
  playerOneColor?: string; // Player 1 piece color (default: "#dc2626")
  playerTwoColor?: string; // Player 2 piece color (default: "#1d4ed8")
  boardTheme?: "classic" | "modern" | "neon"; // Visual themes
  roomId?: string; // Multiplayer room identifier (default: "checkers-default-room")
  showMoveHistory?: boolean; // Display move history sidebar (default: true)
  onVisualSettingsChange?: (settings) => void; // Callback for prop synchronization
}
```

### 🔄 Real-time Multiplayer Features

- **Live synchronization**: All visual settings (colors, theme) sync across players in real-time
- **Bidirectional props sync**: When any player changes colors/theme, all players see the updates
- **Turn-based gameplay**: Proper multiplayer turn management
- **Player status tracking**: Shows connection status and player assignments
- **Spectator mode**: Support for viewers who aren't actively playing
- **Room-based sessions**: Multiple games can run simultaneously in different rooms

### 💅 Visual Themes & Polish

- **Three visual themes**:
  - Classic (amber/brown traditional checkers)
  - Modern (clean gray/white minimalist)
  - Neon (vibrant purple/blue gaming style)
- **Smooth animations**: Hover effects, piece selection feedback
- **Move history tracking**: Complete game log with descriptive move notation
- **Captured pieces display**: Visual feedback of captured pieces by color
- **Responsive design**: Clean layout with game board and informational sidebar
- **Game status indicators**: Current player display, winner announcements, connection status

### 🎯 Example Configurations

**Classic Red vs Blue:**

```json
{
  "boardTheme": "classic",
  "playerOneColor": "#dc2626",
  "playerTwoColor": "#1d4ed8",
  "roomId": "classic-room",
  "showMoveHistory": true
}
```

**Modern Minimalist:**

```json
{
  "boardTheme": "modern",
  "playerOneColor": "#374151",
  "playerTwoColor": "#6b7280",
  "roomId": "modern-room",
  "showMoveHistory": false
}
```

**Neon Gaming Style:**

```json
{
  "boardTheme": "neon",
  "playerOneColor": "#ec4899",
  "playerTwoColor": "#10b981",
  "roomId": "neon-arena-1",
  "showMoveHistory": true
}
```

### 🔧 Technical Implementation

- **React 19** with TypeScript and modern hooks (useState, useEffect, useCallback, useMemo, useRef)
- **@mexty/realtime** integration for seamless multiplayer state management
- **Component composition**: Modular design with Square, GameStatus, CapturedPieces, MoveHistory, and Sidebar components
- **Props synchronization**: Advanced bidirectional sync system allowing any player to update visual settings
- **Module Federation**: Proper webpack setup for microfrontend integration
- **State management**: Clean separation between local interaction state and shared multiplayer state

### 🎮 How to Test

1. **Build the project**: `npm run build`
2. **Start test server**: `npm run test`
3. **Open two browser tabs** at `http://localhost:3002`
4. **Test multiplayer**: Make moves in one tab, see updates in the other
5. **Test prop sync**: Change colors/theme in one tab's props editor, watch the other tab update automatically

This implementation demonstrates advanced React patterns, real-time multiplayer architecture, comprehensive game logic, and polished user experience - showcasing full-stack development skills in an engaging, interactive format.

## ⏱️ Time Guideline

This test is designed to take **2-4 hours**. Focus on:

1. ✨ Core interactive experience (60% of time)
2. 🎛️ Props customization (20% of time)
3. 💅 Polish and UX (20% of time)

**Quality over quantity!** A well-executed simple experience is better than a complex but buggy one.

Good luck and have fun! 🚀
