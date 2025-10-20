# 🎨 CollabCanvas - Comprehensive Feature Guide

**Version**: 1.0  
**Last Updated**: October 2025  
**Live Demo**: https://collab-canvas-miriam.vercel.app

---

## Table of Contents

1. [Real-time Collaboration](#real-time-collaboration)
2. [Shape & Design Tools](#shape--design-tools)
3. [AI Canvas Agent](#ai-canvas-agent)
4. [Audio Rambles](#audio-rambles)
5. [Comments System](#comments-system)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Canvas Navigation](#canvas-navigation)
8. [Editing & History](#editing--history)
9. [Advanced Features](#advanced-features)
10. [Performance & Optimization](#performance--optimization)

---

## Real-time Collaboration

### 🎯 Multiplayer Editing

**Description**: Multiple users can work on the same canvas simultaneously with instant synchronization.

**Features**:
- Create, move, resize, and rotate shapes in real-time
- See changes from other users appear instantly (10-20ms latency via Firebase RTDB)
- Optimistic updates with automatic conflict resolution
- Smooth experience even with 10+ concurrent users

**Use Cases**:
- Team design sessions
- Remote workshops
- Collaborative brainstorming
- Design reviews

---

### 👁️ Live Cursors

**Description**: See where other users are pointing and moving on the canvas.

**Features**:
- Real-time cursor positions with <20ms latency
- User names displayed next to cursors
- Color-coded by user for easy identification
- Smooth animation and movement
- Automatic cleanup when users leave

**Technical Details**:
- Uses Firebase Realtime Database for minimal latency
- Updates at ~60fps for smooth movement
- Efficient delta-only updates

---

### 👥 Presence Awareness

**Description**: Know who's currently online and active on the canvas.

**Features**:
- Live user count in the header
- User list panel showing all active users
- Color-coded user avatars
- Online/offline status indicators
- Last seen timestamps

**Presence Panel**:
```
Current Users (3)
━━━━━━━━━━━━━━━━━
👤 Alice (You) 🟢
👤 Bob 🟢
👤 Charlie 🟢
```

---

### 🔒 Collaborative Locking

**Description**: Prevent editing conflicts by automatically locking objects when in use.

**Features**:
- Automatic lock acquisition when selecting shapes
- Visual indicators (red dashed border, lock label)
- "Locked by [User]" tooltips
- Automatic release on deselection or disconnect
- Cannot select/edit objects locked by others

**Lock States**:
- 🟢 **Unlocked**: Available for editing
- 🔴 **Locked by Other**: Cannot edit, shows lock indicator
- 🟡 **Locked by You**: You have exclusive edit access

**Use Cases**:
- Prevent accidental overwrites in team sessions
- Indicate which objects are being worked on
- Coordinate work on complex designs

---

## Shape & Design Tools

### 🔷 Shape Types

**Supported Shapes**:

#### 1. **Rectangles**
- Adjustable width and height
- Border and fill colors
- Rounded corners (optional)
- Transform controls (resize, rotate)
- Keyboard: Press `R` to activate rectangle tool

#### 2. **Circles**
- Adjustable radius
- Border and fill colors
- Transform controls
- Keyboard: Press `C` to activate circle tool

#### 3. **Lines**
- Two-point lines with endpoints
- Adjustable thickness
- Color customization
- Straight or curved (optional)
- Keyboard: Press `L` to activate line tool

#### 4. **Text**
- Rich text editing
- Font size (8-72px)
- Font family selection
- Color customization
- Multi-line support
- Keyboard: Press `T` to activate text tool

---

### 🎯 Selection Tools

**Selection Methods**:

1. **Single Selection**: Click on any shape
2. **Multi-Select**: 
   - Hold Shift + Click to add to selection
   - Drag to create selection box
   - Cmd/Ctrl+A to select all
3. **Selection by Type**: Select all shapes of same type
4. **Selection by Color**: Select all shapes with same color

**Selection Features**:
- Visual selection box with dashed border
- Transform handles on selected objects
- Bounding box for multi-select
- Selection count indicator
- Quick actions toolbar for selected objects

---

### 🔧 Transform Controls

**Available Transformations**:

- **Move**: Drag shapes to new positions
- **Resize**: Drag corner/edge handles
- **Rotate**: Drag rotation handle or use keyboard
- **Scale**: Proportional or free scaling
- **Flip**: Horizontal/vertical flip (via context menu)

**Smart Features**:
- Shift+Drag for constrained proportions
- Alt+Drag to resize from center
- Grid snapping (toggleable)
- Smart guides for alignment
- Numeric input for precise values

---

### 🔗 Connection Arrows

**Description**: Link shapes with arrows to show relationships and flow.

**Features**:
- Click "Connect" button, then click two shapes to connect
- Automatic arrow positioning (center to center)
- Arrows update when shapes move
- Customizable arrow color and thickness
- Delete connections independently

**Use Cases**:
- Flowcharts and diagrams
- Process flows
- Mind maps
- Organization charts
- UI/UX wireframe connections

**Keyboard Shortcut**: Press `N` to activate connection tool

---

### 📐 Alignment Tools

**Alignment Options**:

**Horizontal**:
- Align Left (Cmd/Ctrl+Shift+L)
- Align Center (Cmd/Ctrl+Shift+C)
- Align Right (Cmd/Ctrl+Shift+R)

**Vertical**:
- Align Top (Cmd/Ctrl+Shift+T)
- Align Middle (Cmd/Ctrl+Shift+M)
- Align Bottom (Cmd/Ctrl+Shift+B)

**Distribution**:
- Distribute Horizontally (Cmd/Ctrl+Shift+H)
- Distribute Vertically (Cmd/Ctrl+Shift+V)

**Requirements**: Need 2+ shapes selected for alignment, 3+ for distribution

---

### 📚 Z-Index (Layer Management)

**Layer Controls**:

- **Bring to Front**: Cmd/Ctrl+Shift+]
- **Bring Forward**: ]
- **Send Backward**: [
- **Send to Back**: Cmd/Ctrl+Shift+[

**Features**:
- Visual feedback in layers panel
- Drag to reorder layers
- Right-click context menu for layer actions
- Automatic z-index management
- Layer count indicator

---

### 📏 Grid & Smart Guides

**Grid System**:
- Toggle grid overlay (Cmd/Ctrl+')
- Adjustable grid size (10px, 20px, 50px)
- Snap to grid (toggle with Cmd/Ctrl+;)
- Visual grid lines
- Grid opacity control

**Smart Guides**:
- Show alignment guides when dragging
- Distance indicators between objects
- Center alignment guides
- Edge alignment guides
- Automatic guide display/hide

---

## AI Canvas Agent

### 🤖 Natural Language Commands

**Description**: Create and manipulate shapes using plain English commands.

**Powered By**: OpenAI GPT-4o-mini via secure Vercel serverless functions

**Response Time**: <2 seconds for most commands

---

### 📝 Command Categories

#### 1. **Shape Creation**

Create shapes using natural language:

```
Examples:
- "create a red rectangle at 100, 100"
- "add a blue circle with 50px radius"
- "draw a line from 0,0 to 100,100"
- "add text that says 'Hello World'"
```

**Supported Properties**:
- Position (x, y coordinates)
- Size (width, height, radius)
- Color (names or hex codes)
- Text content and font size

---

#### 2. **Selection Commands**

Select objects intelligently:

```
Examples:
- "select all red shapes"
- "select objects in the top half"
- "select all circles"
- "select everything"
```

**Selection Methods**:
- By color
- By position (top/bottom/left/right half)
- By type
- Select all

---

#### 3. **Bulk Operations**

Perform actions on multiple selected objects:

```
Examples:
- "move selected objects 50 pixels right"
- "delete selected objects"
- "change selected objects to blue"
- "move everything down 20 pixels"
```

**Supported Operations**:
- Move (with direction and distance)
- Delete
- Change color

---

#### 4. **Resize Operations**

Scale or resize shapes:

```
Examples:
- "make the circle twice as big"
- "resize the rectangle to 300x200"
- "scale selected objects by 1.5"
- "make it smaller"
```

**Resize Methods**:
- Scale factor (1.5x, 2x, 0.5x)
- Specific dimensions (width x height)
- Relative terms (bigger, smaller)

---

#### 5. **Rotate Operations**

Rotate shapes by degrees:

```
Examples:
- "rotate the text 45 degrees"
- "rotate selected objects 90 degrees"
- "turn it clockwise"
```

**Features**:
- Degree-based rotation
- Clockwise/counterclockwise
- Absolute or relative rotation

---

#### 6. **Alignment Operations**

Align multiple objects:

```
Examples:
- "align all selected objects to the left"
- "center these shapes horizontally"
- "align to the top"
```

**Alignment Types**:
- Left, center, right (horizontal)
- Top, middle, bottom (vertical)

---

#### 7. **Distribution Operations**

Evenly space objects:

```
Examples:
- "distribute selected objects evenly horizontally"
- "space these circles vertically"
- "distribute with equal gaps"
```

**Requirements**: 3+ objects selected

---

#### 8. **Z-Index Operations**

Manage layer order:

```
Examples:
- "bring the red rectangle to front"
- "send this to the back"
- "move the text above everything"
```

**Layer Operations**:
- Bring to front
- Send to back
- Bring forward
- Send backward

---

### 🎭 Complex Multi-Step Commands

**Description**: AI can break down complex requests into multiple sequential actions.

**Examples**:

#### Create a Login Form
```
Command: "create a login form"

AI generates:
1. Username label (text)
2. Username input box (rectangle)
3. Password label (text)
4. Password input box (rectangle)
5. Login button (rectangle)
All properly aligned and positioned
```

#### Build a Navigation Bar
```
Command: "create a navigation bar with Home, About, Services, Contact"

AI generates:
1. Background rectangle
2. Four text elements (Home, About, Services, Contact)
3. All evenly distributed horizontally
4. Properly aligned and styled
```

#### Create a Card Layout
```
Command: "build a card layout with title, image, and description"

AI generates:
1. Card background (rectangle)
2. Title text at top
3. Image placeholder (rectangle)
4. Description text at bottom
All arranged vertically with proper spacing
```

---

### ⚡ AI Features

- **Undo/Redo Support**: All AI operations are fully undoable
- **Real-time Sync**: AI-created shapes sync to all users instantly
- **Error Handling**: Clear error messages for invalid commands
- **Command History**: View past commands and reuse them
- **Context Awareness**: AI understands canvas state and relative positions
- **Smart Defaults**: Reasonable defaults when properties not specified

---

## Audio Rambles

### 🎙️ Voice Recordings

**Description**: Attach voice recordings to shapes for narrated walkthroughs.

**Features**:
- Record up to 30 seconds per shape
- Click record button on selected shape
- Real-time recording timer
- Waveform animation during recording
- Upload to Firebase Storage automatically

**Recording Flow**:
1. Select a shape
2. Click 🎤 Record button
3. Grant microphone permission (first time)
4. Speak your narration
5. Click ⏹️ Stop button
6. Audio automatically uploads and saves

---

### 🔊 Audio Playback

**Playback Controls**:
- ▶️ Play: Play individual shape audio
- ⏸️ Pause: Pause playback
- 🔄 Replay: Play again
- 🗑️ Delete: Remove recording

**Audio Indicator**:
- 🎵 icon appears on shapes with audio
- Duration displayed (e.g., "15s")
- Visual waveform during playback

---

### 🎬 Ramble Sequences

**Description**: Create sequential audio tours through your design.

**How it Works**:
1. Record audio on multiple shapes
2. Connect shapes with connection arrows
3. Mark first shape as "Ramble Start" ⭐
4. Click "Play Rambles" button
5. Audio plays sequentially following connections

**Ramble Player**:
```
Ramble Player
━━━━━━━━━━━━━━━━━
▶️ Playing: Shape 1 (1/5)
━━━━━━━━━━━━━━━━━
⏮️ Previous  ⏸️ Pause  ⏭️ Next
━━━━━━━━━━━━━━━━━
Progress: [=========>  ] 60%
```

**Use Cases**:
- Design presentations
- Tutorial walkthroughs
- User testing feedback
- Design reviews
- Onboarding flows

---

### 📱 Audio Technical Details

**Supported Formats**:
- WebM (Chrome, Firefox, Edge)
- MP4 (Safari)
- Automatic format detection

**Storage**:
- Firebase Storage with CORS enabled
- Organized by canvas ID
- Automatic cleanup on re-recording

**Browser Support**:
- Chrome 49+: ✅
- Firefox 25+: ✅
- Safari 14.1+: ✅
- Edge 79+: ✅

---

## Comments System

### 💬 Comment Pins

**Description**: Add comments anywhere on the canvas for feedback and discussion.

**Features**:
- Click "Add Comment" button, then click canvas position
- Pin icon shows comment location
- Color-coded by author
- Attach to specific shapes or float freely
- Unresolved comment counter

**Comment Pin Indicators**:
- 💬 Blue: Unresolved comment
- ✅ Green: Resolved comment
- 🔴 Red: Urgent/important (marked by author)

---

### 🗨️ Threaded Conversations

**Comment Features**:
- Full conversation threads
- Reply to comments
- Edit your comments
- Delete your comments
- Resolve/unresolve discussions
- Timestamp and author info

**Comment Thread Example**:
```
💬 Alice • 2 hours ago
"Should we make this button bigger?"

  ↳ Bob • 1 hour ago
    "Yes, let's increase it to 120x40"
    
  ↳ Alice • 30 min ago
    "Done! Updated the button size"
    [Mark as Resolved ✅]
```

---

### 🎯 Comment Actions

**Available Actions**:
- 📍 Pin to canvas position
- 📎 Attach to shape
- 💬 Reply to thread
- ✅ Mark as resolved
- 🗑️ Delete comment
- 🔔 Notification on new replies (planned)

---

## Keyboard Shortcuts

### ⌨️ Complete Shortcut Reference

**Press `?` to show shortcuts panel in-app**

---

#### General

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts |
| `Esc` | Clear selection / Cancel |
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` | Redo |
| `Cmd/Ctrl+Y` | Redo (alternative) |

---

#### Selection

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+A` | Select all |
| `Shift+Click` | Add to selection |
| `Esc` | Clear selection |
| Click | Select single object |
| Drag | Selection box |

---

#### Clipboard

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+C` | Copy |
| `Cmd/Ctrl+V` | Paste |
| `Cmd/Ctrl+X` | Cut |
| `Cmd/Ctrl+D` | Duplicate |

---

#### Editing

| Shortcut | Action |
|----------|--------|
| `Delete` or `Backspace` | Delete selected |
| `Arrow Keys` | Nudge 1px |
| `Shift+Arrow` | Nudge 10px |

---

#### Layers (Z-Index)

| Shortcut | Action |
|----------|--------|
| `]` | Bring forward |
| `[` | Send backward |
| `Cmd/Ctrl+Shift+]` | Bring to front |
| `Cmd/Ctrl+Shift+[` | Send to back |

---

#### Alignment

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+L` | Align left |
| `Cmd/Ctrl+Shift+C` | Align center |
| `Cmd/Ctrl+Shift+R` | Align right |
| `Cmd/Ctrl+Shift+T` | Align top |
| `Cmd/Ctrl+Shift+M` | Align middle |
| `Cmd/Ctrl+Shift+B` | Align bottom |
| `Cmd/Ctrl+Shift+H` | Distribute horizontally |
| `Cmd/Ctrl+Shift+V` | Distribute vertically |

---

#### Tools

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `R` | Rectangle tool |
| `C` | Circle tool |
| `L` | Line tool |
| `T` | Text tool |
| `N` | Connection tool |

---

#### View

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+'` | Toggle grid |
| `Cmd/Ctrl+;` | Toggle snap to grid |
| `Space+Drag` | Pan canvas |
| `Cmd/Ctrl+0` | Reset zoom |
| `Cmd/Ctrl++` | Zoom in |
| `Cmd/Ctrl+-` | Zoom out |

---

## Canvas Navigation

### 🗺️ Pan & Zoom

**Pan**:
- Space + Drag to pan
- Scroll wheel to pan vertically
- Shift + Scroll to pan horizontally
- Touch gestures on mobile

**Zoom**:
- Cmd/Ctrl + Scroll to zoom
- Pinch gesture on trackpad/mobile
- Cmd/Ctrl + Plus/Minus keys
- Zoom slider in toolbar

**Canvas Size**: 5000x5000 pixels

---

### 🎯 View Controls

**Zoom Levels**:
- Min: 10% (view entire canvas)
- Max: 400% (detailed editing)
- Default: 100%
- Fit to screen option

**Position Indicator**:
- Shows current view position
- Mini-map (planned feature)
- Jump to coordinates

---

## Editing & History

### ⏮️ Undo/Redo System

**Features**:
- Unlimited undo/redo history
- Command pattern implementation
- Undo/redo for all operations
- Visual history timeline (planned)
- Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)

**Supported Operations**:
- Shape creation/deletion
- Move, resize, rotate
- Color changes
- Alignment and distribution
- Z-index changes
- Connection creation/deletion
- All AI operations

---

### 📋 Copy/Paste/Duplicate

**Copy/Paste**:
- Copy: Cmd/Ctrl+C
- Paste: Cmd/Ctrl+V (pastes at mouse position)
- Cut: Cmd/Ctrl+X
- Cross-canvas paste support

**Duplicate**:
- Cmd/Ctrl+D to duplicate
- Creates copy with slight offset
- Preserves all properties
- Works with multi-select

---

### 🔄 Bulk Operations

**Supported Bulk Actions**:

1. **Bulk Move**:
   - Select multiple objects
   - Drag to move all together
   - Keyboard: Arrow keys for nudge

2. **Bulk Delete**:
   - Select multiple objects
   - Press Delete/Backspace
   - Or right-click → Delete

3. **Bulk Color Change**:
   - Select multiple objects
   - Choose color from palette
   - All objects update

4. **Bulk Alignment**:
   - Select 2+ objects
   - Use alignment buttons/shortcuts
   - All align to same position

---

## Advanced Features

### 🔍 Context Menus

**Right-click on shapes for quick actions**:

Available Actions:
- ✂️ Cut
- 📋 Copy
- 📑 Duplicate
- 🗑️ Delete
- 🎨 Change Color
- 📐 Flip Horizontal/Vertical
- 📚 Bring to Front / Send to Back
- 🔒 Lock Shape (planned)
- 📝 Add Comment
- 🔗 Create Connection

---

### 🎨 Color System

**Color Picker**:
- Preset color palette
- Custom hex color input
- Recent colors history
- Color by name (in AI commands)

**Color Features**:
- Transparent fills (40% opacity)
- Solid borders
- Color inheritance
- Random color assignment

---

### 🔄 Real-time Sync

**Synchronization Details**:
- Cursor updates: 10-20ms latency (RTDB)
- Shape updates: <50ms latency (Firestore)
- Presence updates: Real-time (RTDB)
- Audio uploads: Immediate (Storage)

**Conflict Resolution**:
- Optimistic updates
- Automatic rollback on errors
- Last-write-wins for simultaneous edits
- Lock system prevents conflicts

---

### 🎯 Multi-Canvas Support

**Canvas Management**:
- Create new canvases
- Share canvas links
- Canvas URL with unique ID
- Switch between canvases
- Canvas list (planned)

**Sharing**:
- Click "Share" button
- Copy shareable link
- Anyone with link can join
- Real-time collaboration

---

## Performance & Optimization

### ⚡ Performance Features

**Rendering Optimizations**:
- Viewport culling (only render visible objects)
- Layer-based rendering (Konva.js)
- Lazy loading for large canvases
- Efficient re-renders with React.memo
- Debounced updates for expensive operations

**Network Optimizations**:
- Firebase RTDB for real-time (10-20ms)
- Firestore for persistence
- Batch writes for multiple operations
- Delta-only cursor updates
- Connection pooling

---

### 📊 Performance Metrics

**Tested Performance**:
- 500+ shapes rendered smoothly
- 10+ concurrent users without lag
- 60fps canvas rendering
- <2s AI response times
- Sub-50ms real-time updates

**Bundle Optimization**:
- Code splitting by route
- Lazy loading components
- Tree shaking unused code
- Minification and compression
- Optimized asset loading

---

## Feature Comparison

### CollabCanvas vs Competitors

| Feature | CollabCanvas | Figma | Miro | Whiteboard |
|---------|-------------|-------|------|-----------|
| Real-time Collaboration | ✅ | ✅ | ✅ | ✅ |
| AI Commands | ✅ | ❌ | ❌ | ❌ |
| Audio Rambles | ✅ | ❌ | ❌ | ❌ |
| Voice Narration | ✅ | ❌ | ✅ | ❌ |
| Comments | ✅ | ✅ | ✅ | ✅ |
| Keyboard Shortcuts | ✅ (30+) | ✅ | ✅ | ✅ |
| Connection Arrows | ✅ | ✅ | ✅ | ✅ |
| Collaborative Locking | ✅ | ✅ | ❌ | ❌ |
| Undo/Redo | ✅ | ✅ | ✅ | ✅ |
| Open Source | ✅ | ❌ | ❌ | ❌ |
| Self-hostable | ✅ | ❌ | ❌ | ❌ |

---

## Coming Soon

### 🚀 Planned Features

- **Image Upload**: Import images into canvas
- **Export Options**: PNG, SVG, PDF export
- **Templates**: Pre-built design templates
- **Version History**: Time-travel debugging
- **Permissions**: Role-based access control
- **API Access**: REST API for integrations
- **Webhooks**: Event notifications
- **Plugins**: Extension system
- **Mobile App**: Native iOS/Android apps

---

## Getting Started

### Quick Start Guide

1. **Open App**: https://collab-canvas-miriam.vercel.app
2. **Sign Up/Login**: Create account or use existing
3. **Create Canvas**: Click "New Canvas" button
4. **Add Shapes**: Use toolbar or AI commands
5. **Invite Team**: Share canvas link
6. **Collaborate**: Edit together in real-time!

### Keyboard Shortcuts Quick Reference

Press `?` in-app to view all shortcuts.

### Need Help?

- 📖 [Full Documentation](./README.md)
- 🏗️ [Architecture Guide](./ARCHITECTURE.md)
- 🛠️ [Development Setup](./DEV_SETUP.md)
- 🤖 [AI Setup](./AI_SETUP.md)
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Questions?** Create an issue on [GitHub](https://github.com/miriamsimone/collab-canvas)

