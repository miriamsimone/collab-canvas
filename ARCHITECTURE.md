# 🏗️ CollabCanvas Architecture Documentation

## System Overview

CollabCanvas is a real-time collaborative design platform built on a modern React + Firebase architecture with AI-powered natural language commands. The system uses a dual-database approach for optimal performance: Firebase Realtime Database (RTDB) for ultra-low latency updates and Firestore for persistent data storage.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │   Canvas     │  │   Toolbar    │  │  AI Panel    │  │Comments ││
│  │   (Konva.js) │  │   (Tools)    │  │  (Input)     │  │ (Pins)  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────────────┐
│                      State Management Layer                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Custom Hooks (React)                                          │ │
│  │  • useCanvas      • useShapes       • useSelection            │ │
│  │  • usePresence    • useAI           • useComments             │ │
│  │  • useUndoRedo    • useGrid         • useKeyboardShortcuts    │ │
│  │  • useZIndex      • useAlignment                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────────────┐
│                         Services Layer                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  • shapesService.ts          - Firestore CRUD for shapes      │ │
│  │  • commentsService.ts        - Firestore comments             │ │
│  │  • realtimeCursorService.ts  - RTDB cursor tracking           │ │
│  │  • realtimeObjectService.ts  - RTDB object dragging           │ │
│  │  • presenceService.ts        - User presence management       │ │
│  │  • commandService.ts         - Undo/redo command pattern      │ │
│  │  • aiService.ts              - AI API client                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                ↕
┌──────────────┬──────────────────┬──────────────────┬───────────────┐
│   Firebase   │    Firebase      │   Firebase       │  Vercel API   │
│   Firestore  │    RTDB          │   Auth           │  Routes       │
│              │                  │                  │               │
│  • Shapes    │  • Cursors       │  • Users         │  /ai/command  │
│  • Comments  │  • Dragging      │  • Sessions      │     ↓         │
│  • Users     │  • Presence      │                  │  OpenAI GPT-4 │
└──────────────┴──────────────────┴──────────────────┴───────────────┘
```

---

## Core Architecture Patterns

### 1. Dual Database Architecture

**Problem**: Firestore has ~100-200ms latency which causes choppy cursor movement and dragging.

**Solution**: Use RTDB for real-time updates, Firestore for persistence.

```typescript
// Cursor Updates: RTDB only (no persistence needed)
updateCursorPosition(x, y) → RTDB /presence/{userId}

// Object Dragging: RTDB + Firestore
onDragStart() → RTDB /objectMovements/{shapeId} (real-time position)
onDragEnd()   → Firestore /shapes/{shapeId} (persist final position)
              → RTDB delete (clean up temporary data)

// Shape Creation: Firestore only
createShape() → Firestore /shapes/{shapeId}
```

**Benefits**:
- 10-20ms cursor latency (RTDB) vs 100-200ms (Firestore)
- Smooth real-time dragging across all users
- Persistent data storage with Firestore
- Reduced Firestore write costs

### 2. Command Pattern for Undo/Redo

All canvas mutations go through a command interface:

```typescript
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  getDescription(): string;
}

// Example: CreateShapeCommand
class CreateShapeCommand implements Command {
  execute() {
    // Create shape in Firestore
    await shapesService.createShape(this.shape);
  }
  
  undo() {
    // Delete shape from Firestore
    await shapesService.deleteShape(this.shape.id);
  }
}

// Usage
const command = new CreateShapeCommand(shape, userId);
await commandService.executeCommand(command);

// Later: Undo
await commandService.undo();
```

**Supported Commands**:
- CreateShapeCommand
- DeleteShapeCommand
- MoveShapeCommand
- ResizeShapeCommand
- RotateShapeCommand
- ChangeColorCommand
- AlignShapesCommand
- BatchCommand (multiple commands as one)

### 3. Hook-Based State Management

Each feature domain has a dedicated hook:

```typescript
// Shape Management
const { shapes, createRectangle, updateShape, deleteShapes } = useShapes();

// Selection
const { selectObject, clearSelection, getSelectedObjects } = useSelection();

// Undo/Redo
const { executeCommand, undo, redo, canUndo, canRedo } = useUndoRedo();

// AI Commands
const { sendCommand, isLoading, error, history } = useAI({
  onCreateRectangle: handleAICreateRectangle,
  onSelectObjects: handleAISelect,
  // ... other handlers
});
```

**Benefits**:
- Separation of concerns
- Reusable across components
- Testable in isolation
- Clear data flow

### 4. Optimistic Updates with Rollback

For better UX, we update the UI immediately and rollback on errors:

```typescript
// 1. Update UI optimistically
updateLocalState(newValue);

// 2. Attempt server update
try {
  await firestore.update(newValue);
} catch (error) {
  // 3. Rollback on failure
  updateLocalState(oldValue);
  showError("Update failed");
}
```

---

## Data Models

### Shape Model

```typescript
interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text';
  x: number;
  y: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  zIndex: number;
  
  // Type-specific fields
  width?: number;      // rectangle, text
  height?: number;     // rectangle, text
  radius?: number;     // circle
  points?: number[];   // line (deprecated - use x2, y2)
  x2?: number;         // line endpoint x
  y2?: number;         // line endpoint y
  text?: string;       // text content
  fontSize?: number;   // text size (8-72px)
  fontFamily?: string; // text font
  
  // Style
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;   // rotation in degrees
  
  // Audio Rambles
  audioUrl?: string;       // Firebase Storage URL for audio recording
  audioDuration?: number;  // Recording duration in seconds (max 30s)
  isRambleStart?: boolean; // Mark as start of ramble sequence
  
  // Connections
  connections?: string[];  // Array of connection IDs linking this shape
  
  // Collaborative Locking
  lockedBy?: {
    userId: string;
    userName: string;
    userColor: string;
    timestamp: number;
  };
}
```

### Presence Model

```typescript
interface PresenceData {
  userId: string;
  displayName: string;
  color: string;
  cursorX: number;
  cursorY: number;
  lastSeen: number;
  isActive: boolean;
}

// RTDB Structure
/presence/
  {userId}/
    displayName: "John Doe"
    color: "#FF5733"
    cursorX: 150
    cursorY: 200
    lastSeen: 1699123456789
    isActive: true
```

### Comment Model

```typescript
interface Comment {
  id: string;
  canvasId: string;
  objectId?: string;  // Optional: attach to shape
  x: number;
  y: number;
  text: string;
  authorId: string;
  authorName: string;
  authorColor?: string;
  timestamp: number;
  resolved: boolean;
  replies: CommentReply[];
}

interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}
```

### Connection Model

```typescript
interface Connection {
  id: string;
  canvasId: string;
  fromShapeId: string;  // Source shape ID
  toShapeId: string;    // Target shape ID
  createdBy: string;
  createdAt: number;
  
  // Visual properties
  color?: string;       // Arrow color
  strokeWidth?: number; // Arrow thickness
  
  // Connection points (optional override)
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
}
```

---

## Audio Rambles Architecture

### Overview

Audio Rambles allow users to attach voice recordings to shapes and play them back sequentially, creating narrated walkthroughs of designs.

### Recording Flow

```
1. User selects shape → AudioControls component appears
                       ↓
2. Click record → Request microphone permission
                       ↓
3. Record audio → MediaRecorder API (max 30 seconds)
                       ↓
4. Stop recording → Create audio Blob
                       ↓
5. Upload to Firebase Storage → Get download URL
                       ↓
6. Update shape in Firestore → audioUrl + audioDuration
```

### Ramble Sequence Playback

```
1. User clicks "Ramble" → RamblePlayer component opens
                       ↓
2. Find all shapes with isRambleStart: true
                       ↓
3. For each ramble start → Follow connection arrows
                       ↓
4. Collect audio URLs → Build playback sequence
                       ↓
5. Play sequentially → Auto-advance on audio end
                       ↓
6. Visual feedback → Highlight currently playing shape
```

### Audio Service Implementation

```typescript
class AudioRecordingService {
  // Record audio from microphone
  async startRecording(
    onTimeUpdate?: (seconds: number) => void,
    onMaxTimeReached?: () => void
  ): Promise<void>;
  
  // Stop and return audio blob
  async stopRecording(): Promise<Blob>;
  
  // Upload to Firebase Storage
  async uploadToStorage(
    blob: Blob, 
    shapeId: string, 
    canvasId: string
  ): Promise<string>;
  
  // Play audio from URL
  async playAudio(
    url: string, 
    onEnded?: () => void
  ): Promise<void>;
  
  // Delete from Firebase Storage
  async deleteAudio(url: string): Promise<void>;
}
```

### Storage Structure

```
Firebase Storage:
/canvas-audio/
  {canvasId}/
    {shapeId}-{timestamp}.webm  (or .mp4, .ogg depending on browser)
```

### Key Features

- **Max Recording Time**: 30 seconds (configurable)
- **Format**: WebM (Chrome/Firefox) or MP4 (Safari) - automatic detection
- **CORS Configuration**: Required for browser uploads (see STORAGE_SETUP.md)
- **Cleanup**: Old recordings deleted when re-recording
- **Permissions**: User must grant microphone access

### Browser Compatibility

| Browser | MediaRecorder Support | Audio Format |
|---------|----------------------|--------------|
| Chrome 49+ | ✅ Yes | WebM (VP8) |
| Firefox 25+ | ✅ Yes | WebM (VP8) |
| Safari 14.1+ | ✅ Yes | MP4 (H.264) |
| Edge 79+ | ✅ Yes | WebM (VP8) |

---

## AI Integration Architecture

### Request Flow

```
1. User types command → AICommandInput component
                       ↓
2. useAI hook processes → aiService.sendCommand()
                       ↓
3. POST /api/ai/command → Vercel serverless function
                       ↓
4. OpenAI GPT-4 API → Structured JSON response (Zod validated)
                       ↓
5. Parse actions → Execute handlers in Canvas.tsx
                       ↓
6. Update Firestore → Real-time sync to all users
```

### AI Response Schema

```typescript
interface AICommandResponse {
  isValidCommand: boolean;
  explanation: string;
  actions: AIAction[];
}

interface AIAction {
  type: 'createRectangle' | 'createCircle' | 'createLine' | 
        'createText' | 'selectObjects' | 'bulkOperation' | 
        'moveShape' | 'resizeShape' | 'rotateShape' | 
        'alignObjects' | 'distributeObjects' | 'zIndex';
  parameters: Record<string, any>;
}
```

### Prompt Engineering

The AI system prompt includes:
- Shape type examples
- Coordinate system explanation
- Color format requirements (hex codes)
- Multi-step command patterns
- Error handling guidance

---

## Real-Time Synchronization

### Cursor Updates (RTDB)

```typescript
// Update frequency: ~60fps
const updateCursor = (x: number, y: number) => {
  rtdb.ref(`presence/${userId}`).update({
    cursorX: x,
    cursorY: y,
    lastSeen: Date.now()
  });
};

// Listen to all cursors
rtdb.ref('presence').on('value', (snapshot) => {
  const cursors = snapshot.val();
  renderCursors(cursors);
});
```

### Object Dragging (RTDB → Firestore)

```typescript
// During drag: Update RTDB only
onDragMove(shapeId, x, y) {
  rtdb.ref(`objectMovements/${shapeId}`).set({
    x, y,
    isDragging: true,
    draggedBy: userId
  });
}

// On drag end: Persist to Firestore
onDragEnd(shapeId, x, y) {
  // 1. Update Firestore
  await firestore.collection('shapes').doc(shapeId).update({ x, y });
  
  // 2. Clean up RTDB
  await rtdb.ref(`objectMovements/${shapeId}`).remove();
}
```

### Shape Creation (Firestore)

```typescript
// Create shape
await firestore.collection('shapes').add(shape);

// All clients listen for changes
firestore.collection('shapes')
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        addShapeToCanvas(change.doc.data());
      }
    });
  });
```

---

## Performance Optimizations

### 1. Code Splitting

```typescript
// Lazy load heavy components
const AIPanel = lazy(() => import('./features/AI/AIPanel'));
const CommentsPanel = lazy(() => import('./features/Comments/CommentsPanel'));
```

### 2. Memoization

```typescript
// Expensive computations
const selectedObjects = useMemo(() => 
  shapes.filter(shape => selection.includes(shape.id)),
  [shapes, selection]
);

// Component rendering
const ShapeComponent = memo(({ shape, isSelected }) => {
  // Only re-renders when props change
});
```

### 3. Debouncing

```typescript
// Debounce expensive operations
const debouncedUpdate = useDebouncedCallback(
  (value) => updateFirestore(value),
  500
);
```

### 4. Konva Layer Optimization

```typescript
<Stage>
  {/* Static background - rarely updates */}
  <Layer>
    <CanvasBackground />
    <GridOverlay />
  </Layer>
  
  {/* Dynamic shapes - updates frequently */}
  <Layer>
    {shapes.map(shape => <Shape key={shape.id} />)}
  </Layer>
  
  {/* Cursors - updates constantly */}
  <Layer>
    {cursors.map(cursor => <Cursor key={cursor.id} />)}
  </Layer>
</Stage>
```

---

## Security Architecture

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Shapes: Authenticated users can CRUD
    match /canvas/shared/shapes/{shapeId} {
      allow read, write: if request.auth != null;
    }
    
    // Comments: Authenticated read/create, author delete
    match /canvasComments/{commentId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
    }
    
    // Users: Own profile read/write, others read-only
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

### RTDB Security Rules

```json
{
  "rules": {
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "objectMovements": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

---

## Error Handling

### Levels of Error Handling

1. **Service Layer**: Try/catch with logging
```typescript
async createShape(shape: Shape) {
  try {
    return await firestore.collection('shapes').add(shape);
  } catch (error) {
    console.error('Failed to create shape:', error);
    throw new ShapeCreationError(error);
  }
}
```

2. **Hook Layer**: State management
```typescript
const [error, setError] = useState<string | null>(null);

try {
  await createShape(shape);
} catch (err) {
  setError('Failed to create shape');
}
```

3. **Component Layer**: User feedback
```typescript
{error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
```

---

## Testing Strategy

### Unit Tests
- Services: Mock Firebase SDK
- Hooks: React Testing Library with custom render
- Utils: Pure function testing

### Integration Tests
- Multi-hook interactions
- Command pattern execution
- Real-time data flow

### E2E Tests (Manual)
- Multi-user scenarios
- AI command execution
- Undo/redo flows
- Real-time synchronization

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel CDN                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Static Assets (React SPA)                       │  │
│  │  • index.html  • bundle.js  • styles.css         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Serverless Functions                            │  │
│  │  • /api/ai/command.ts → OpenAI GPT-4            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              Firebase (Google Cloud)                     │
│  • Firestore: Persistent data storage                   │
│  • RTDB: Real-time cursor/drag updates                  │
│  • Auth: User authentication                             │
│  • Storage: Future file uploads                          │
└─────────────────────────────────────────────────────────┘
```

---

## Scaling Considerations

### Current Capacity
- **Concurrent Users**: 10-20 tested
- **Objects**: 500+ shapes tested
- **Latency**: 10-20ms (RTDB), 100-200ms (Firestore)

### Future Scaling
1. **Pagination**: Load shapes in viewport only
2. **Sharding**: Multiple canvas documents
3. **CDN**: Static asset optimization
4. **Caching**: Redis for frequently accessed data
5. **Load Balancing**: Multiple Firebase projects

---

## Technology Decisions

### Why Konva.js?
- ✅ High performance canvas rendering
- ✅ React integration via react-konva
- ✅ Transform controls built-in
- ✅ Layer-based rendering
- ❌ Bundle size (~300KB)

### Why Firebase?
- ✅ Real-time capabilities (RTDB)
- ✅ Managed infrastructure
- ✅ Generous free tier
- ✅ Simple security rules
- ❌ Vendor lock-in
- ❌ Complex pricing at scale

### Why TypeScript?
- ✅ Type safety catches bugs early
- ✅ Better IDE support
- ✅ Self-documenting code
- ✅ Easier refactoring
- ❌ Build complexity

---

## Future Architecture Enhancements

1. **WebRTC for Ultra-Low Latency**: Sub-10ms cursor updates
2. **IndexedDB for Offline Support**: Local-first architecture
3. **WebWorkers for Heavy Computation**: AI processing, image manipulation
4. **WebAssembly for Performance**: Complex shape calculations
5. **GraphQL for Flexible Queries**: Replace REST API
6. **Event Sourcing**: Audit trail and time travel debugging

---

**Last Updated**: October 2025  
**Version**: 1.0

