# CollabCanvas Final - Task List & Implementation Guide

## 📁 Current Project File Structure (From MVP)

```
collab-canvas/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx ✅ (MVP complete)
│   │   ├── CanvasObject.tsx ✅ (MVP complete)
│   │   ├── CanvasBackground.tsx ✅ (MVP complete)
│   │   ├── Toolbar.tsx ✅ (MVP complete)
│   │   ├── PresenceList.tsx ✅ (MVP complete)
│   │   ├── MultiplayerCursor.tsx ✅ (MVP complete)
│   │   └── Auth/
│   │       ├── Login.tsx ✅
│   │       ├── Register.tsx ✅
│   │       └── AuthProvider.tsx ✅
│   ├── hooks/
│   │   ├── useCanvas.ts ✅ (MVP complete)
│   │   ├── usePresence.ts ✅ (MVP complete)
│   │   ├── useRectangles.ts ✅ (MVP complete)
│   │   └── useAuth.ts ✅ (MVP complete)
│   ├── services/
│   │   ├── firebase.ts ✅ (MVP complete)
│   │   ├── canvasService.ts ✅ (MVP complete)
│   │   ├── rectanglesService.ts ✅ (MVP complete)
│   │   └── presenceService.ts ✅ (MVP complete)
│   ├── utils/
│   │   └── canvasHelpers.ts ✅ (MVP complete)
│   ├── App.tsx ✅
│   ├── main.tsx ✅
│   ├── App.css ✅
│   └── index.css ✅
├── tests/
│   └── unit/
│       ├── services/
│       │   └── canvasService.test.ts ✅
│       ├── hooks/
│       │   ├── useAuth.test.ts ✅
│       │   └── usePresence.test.ts ✅
│       ├── components/
│       │   ├── CanvasObject.test.tsx ✅
│       │   └── Toolbar.test.tsx ✅
│       └── utils/
│           └── canvasHelpers.test.ts ✅
├── package.json ✅
├── vite.config.ts ✅
├── vitest.config.ts ✅
├── firebase.json ✅
├── firestore.rules ✅
├── vercel.json ✅
└── README.md ✅
```

---

## 📁 NEW Files for Final Implementation

```
collab-canvas/
├── src/
│   ├── components/
│   │   ├── shapes/
│   │   │   ├── Circle.tsx 🆕 (PR #11)
│   │   │   ├── Line.tsx 🆕 (PR #11)
│   │   │   └── Text.tsx 🆕 (PR #11)
│   │   ├── tools/
│   │   │   ├── TransformControls.tsx 🆕 (PR #12)
│   │   │   ├── SelectionBox.tsx 🆕 (PR #13)
│   │   │   └── PropertiesPanel.tsx 🆕 (PR #12)
│   │   ├── features/
│   │   │   ├── UndoRedo/
│   │   │   │   ├── UndoRedoManager.tsx 🆕 (PR #14)
│   │   │   │   └── UndoRedoButton.tsx 🆕 (PR #14)
│   │   │   ├── KeyboardShortcuts/
│   │   │   │   ├── ShortcutsPanel.tsx 🆕 (PR #15)
│   │   │   │   └── ShortcutsOverlay.tsx 🆕 (PR #15)
│   │   │   ├── Grid/
│   │   │   │   ├── GridOverlay.tsx 🆕 (PR #16)
│   │   │   │   ├── SnapToGrid.tsx 🆕 (PR #16)
│   │   │   │   └── SmartGuides.tsx 🆕 (PR #16)
│   │   │   ├── Alignment/
│   │   │   │   ├── AlignmentTools.tsx 🆕 (PR #17)
│   │   │   │   └── AlignmentButton.tsx 🆕 (PR #17)
│   │   │   ├── ZIndex/
│   │   │   │   └── ZIndexControls.tsx 🆕 (PR #18)
│   │   │   ├── Comments/
│   │   │   │   ├── CommentPin.tsx 🆕 (PR #19)
│   │   │   │   ├── CommentThread.tsx 🆕 (PR #19)
│   │   │   │   ├── CommentInput.tsx 🆕 (PR #19)
│   │   │   │   └── CommentsPanel.tsx 🆕 (PR #19)
│   │   │   └── AI/
│   │   │       ├── AICommandInput.tsx 🆕 (PR #20)
│   │   │       ├── AICommandHistory.tsx 🆕 (PR #20)
│   │   │       ├── AILoadingIndicator.tsx 🆕 (PR #20)
│   │   │       └── AIErrorDisplay.tsx 🆕 (PR #20)
│   ├── hooks/
│   │   ├── useShapes.ts 🆕 (PR #11) - Replaces useRectangles
│   │   ├── useSelection.ts 🆕 (PR #13)
│   │   ├── useTransform.ts 🆕 (PR #12)
│   │   ├── useUndoRedo.ts 🆕 (PR #14)
│   │   ├── useKeyboardShortcuts.ts 🆕 (PR #15)
│   │   ├── useGrid.ts 🆕 (PR #16)
│   │   ├── useAlignment.ts 🆕 (PR #17)
│   │   ├── useZIndex.ts 🆕 (PR #18)
│   │   ├── useComments.ts 🆕 (PR #19)
│   │   └── useAI.ts 🆕 (PR #20)
│   ├── services/
│   │   ├── shapesService.ts 🆕 (PR #11) - Replaces rectanglesService
│   │   ├── commandService.ts 🆕 (PR #14) - For undo/redo
│   │   ├── alignmentService.ts 🆕 (PR #17)
│   │   ├── commentsService.ts 🆕 (PR #19)
│   │   └── aiService.ts 🆕 (PR #20)
│   ├── types/
│   │   ├── shapes.ts 🆕 (PR #11)
│   │   ├── commands.ts 🆕 (PR #14)
│   │   ├── comments.ts 🆕 (PR #19)
│   │   └── ai.ts 🆕 (PR #20)
│   └── utils/
│       ├── shapeHelpers.ts 🆕 (PR #11)
│       ├── transformHelpers.ts 🆕 (PR #12)
│       ├── selectionHelpers.ts 🆕 (PR #13)
│       ├── alignmentHelpers.ts 🆕 (PR #17)
│       └── aiHelpers.ts 🆕 (PR #20)
├── tests/
│   └── unit/
│       ├── hooks/
│       │   ├── useShapes.test.ts 🆕
│       │   ├── useUndoRedo.test.ts 🆕
│       │   ├── useAlignment.test.ts 🆕
│       │   └── useAI.test.ts 🆕
│       ├── services/
│       │   ├── shapesService.test.ts 🆕
│       │   ├── commandService.test.ts 🆕
│       │   ├── commentsService.test.ts 🆕
│       │   └── aiService.test.ts 🆕
│       └── utils/
│           ├── transformHelpers.test.ts 🆕
│           ├── alignmentHelpers.test.ts 🆕
│           └── aiHelpers.test.ts 🆕
└── functions/ 🆕 (Optional: Firebase Functions for AI)
    ├── src/
    │   └── ai.ts 🆕 (PR #20)
    └── package.json 🆕
```

---

## 🎯 PERFORMANCE-FIRST PR Implementation Plan

### 🚀 PHASE 1: CRITICAL PERFORMANCE & ARCHITECTURE (Days 1-2)

### PR #11: Firebase Realtime Database Smooth Cursors ⚡ CRITICAL
**Goal:** Switch cursor movement and object dragging from throttled Firestore to Firebase Realtime Database for smooth, real-time animations

**Files to Create:**
- `src/services/realtimeCursorService.ts` - RTDB cursor service replacing Firestore operations
- `src/services/realtimeObjectService.ts` - Real-time object dragging updates (future)
- `tests/unit/services/realtimeCursorService.test.ts` - RTDB cursor service tests

**Files to Modify:**
- `src/services/firebase.ts` - Add RTDB initialization with URL: `https://collab-canvas-2e4c5-default-rtdb.firebaseio.com/`
- `src/hooks/usePresence.ts` - Remove 50ms throttling, use RTDB service for real-time updates
- `src/components/CanvasObject.tsx` - Add RTDB updates during dragging (future enhancement)
- `src/hooks/useRectangles.ts` - Listen to RTDB during drag, persist to Firestore on dragEnd (future)
- Database security rules - Configure RTDB rules for presence and object movement data

**Database Schema Design:**
```json
{
  "presence": {
    "userId1": {
      "displayName": "User Name",
      "cursorX": 150,
      "cursorY": 200,
      "color": "#ff0000", 
      "lastSeen": timestamp,
      "isActive": true
    }
  },
  "objectMovements": {
    "rectangleId1": {
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 100,
      "isDragging": true,
      "draggedBy": "userId1"
    }
  }
}
```

**Implementation Phases:**
- **Phase 1**: RTDB setup and cursor movement (immediate smooth cursor fix)
- **Phase 2**: Real-time object dragging with dual RTDB/Firestore storage
- **Phase 3**: Real-time resizing and transform operations

**Tasks:**
- [x] 11.1: Configure Firebase Realtime Database in firebase.ts with provided URL ✅
- [x] 11.2: Create RTDB security rules for presence and object movement data ✅
- [x] 11.3: Create realtimeCursorService.ts to replace Firestore cursor operations ✅
- [x] 11.4: Remove throttling from usePresence.ts and integrate RTDB service ✅
- [x] 11.5: Test smooth cursor movement with multiple users ✅
- [x] 11.6: Create realtimeObjectService.ts for real-time object dragging ✅
- [x] 11.7: Update CanvasObject.tsx for real-time position updates during drag ✅
- [x] 11.8: Implement dual storage: RTDB for live updates, Firestore for persistence ✅
- [x] 11.9: Update useRectangles.ts to listen to RTDB during dragging ✅
- [x] 11.10: Test smooth object dragging with persistence to Firestore ✅
- [x] 11.11: Optimize RTDB connection management and cleanup ✅
- [x] 11.12: Add real-time resizing with smooth cursor tracking ✅ (BONUS)
- [x] 11.13: Fix snap-back prevention with grace periods ✅ (BONUS)
- [x] 11.14: Deploy RTDB security rules to production ✅ (BONUS)

**Acceptance Criteria:**
- [x] Cursor movement is smooth and real-time (no more 50ms throttling) ✅
- [x] Cursor latency improved from 50ms to ~10-20ms ✅
- [x] Object dragging provides smooth visual feedback in real-time ✅
- [x] Object resizing provides smooth visual feedback in real-time ✅
- [x] Final object positions persist to Firestore after drag/resize ends ✅
- [x] Multiple users see smooth animations simultaneously ✅
- [x] Cursor tracking works during drag and resize operations ✅
- [x] RTDB connection management is robust (connect/disconnect/reconnect) ✅
- [x] No data loss during network interruptions ✅
- [x] All RTDB operations are properly secured ✅
- [x] Grace period prevents snap-back visual artifacts ✅

**🎉 COMPLETE: All RTDB phases implemented and production-ready!**

---

### PR #12: AI Canvas Agent Architecture ⚡ CRITICAL
**Goal:** Build AI infrastructure and core command system (high architectural impact)

**Files to Create:**
- `src/components/features/AI/AICommandInput.tsx` - Chat-style input interface
- `src/components/features/AI/AILoadingIndicator.tsx` - Loading state component
- `src/components/features/AI/AIErrorDisplay.tsx` - Error message component
- `src/hooks/useAI.ts` - AI command processing and state management
- `src/services/aiService.ts` - AI API integration and function calling
- `src/types/ai.ts` - AI command types and interfaces
- `src/utils/aiHelpers.ts` - AI command parsing and validation
- `functions/src/ai.ts` - Firebase Function for AI endpoint (optional)
- `tests/unit/services/aiService.test.ts` - AI service tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Integrate AI command panel
- `src/services/rectanglesService.ts` - Make methods AI-callable
- `firestore.rules` - Add rules for AI command queue (if storing)
- `package.json` - Add OpenAI or Anthropic dependencies

**Tasks:**
- [ ] 12.1: Set up OpenAI or Anthropic Claude API integration
- [ ] 12.2: Design function calling schema for canvas operations
- [ ] 12.3: Create aiService with command parsing and execution
- [ ] 12.4: Implement createRectangle() AI function
- [ ] 12.5: Implement moveShape() AI function  
- [ ] 12.6: Implement getCanvasState() for AI context
- [ ] 12.7: Create AICommandInput UI component
- [ ] 12.8: Build useAI hook for command processing
- [ ] 12.9: Add AI command queue for multi-user scenarios
- [ ] 12.10: Implement complex command: "create a login form"
- [ ] 12.11: Ensure AI-generated objects sync to all users
- [ ] 12.12: Add comprehensive error handling and loading states
- [ ] 12.13: Write unit tests for AI service
- [ ] 12.14: Test 4-6 distinct AI command types
- [ ] 12.15: Test concurrent AI usage with multiple users
- [ ] 12.16: Optimize for sub-2s AI response times

**Acceptance Criteria:**
- [ ] 4-6 distinct AI commands work reliably
- [ ] Simple commands respond in <2 seconds
- [ ] Complex commands generate multiple objects correctly
- [ ] AI-generated objects sync to all users immediately
- [ ] Multiple users can use AI simultaneously without conflicts
- [ ] Error handling is robust and user-friendly
- [ ] 85%+ success rate on valid commands
- [ ] All tests pass

---

### 🎨 PHASE 2: EXPANDED CANVAS FEATURES (Days 3-4)

### PR #13: Additional Shape Types (Circles, Lines, Text)
**Goal:** Expand from rectangles-only to multiple shape types (built on optimized foundation)

**Files to Create:**
- `src/components/shapes/Circle.tsx` - Circle rendering component
- `src/components/shapes/Line.tsx` - Line rendering component  
- `src/components/shapes/Text.tsx` - Text rendering and editing component
- `src/types/shapes.ts` - TypeScript interfaces for all shape types
- `src/services/shapesService.ts` - Replace rectanglesService with multi-shape support
- `src/hooks/useShapes.ts` - Replace useRectangles with multi-shape hook
- `src/utils/shapeHelpers.ts` - Helper functions for shape operations
- `tests/unit/services/shapesService.test.ts` - Tests for new service

**Files to Modify:**
- `src/components/Canvas.tsx` - Update to render all shape types
- `src/components/CanvasObject.tsx` - Update to handle different shape types
- `src/components/Toolbar.tsx` - Add shape selection tools (circle, line, text)
- `src/hooks/useCanvas.ts` - Update creation logic for multiple shapes
- `firestore.rules` - Update rules if needed for new shape types

**Tasks:**
- [ ] 13.1: Define TypeScript interfaces for Circle, Line, Text shapes
- [ ] 13.2: Create Circle component with proper rendering (optimized)
- [ ] 13.3: Create Line component with endpoints
- [ ] 13.4: Create Text component with inline editing
- [ ] 13.5: Update Toolbar with shape selection buttons
- [ ] 13.6: Refactor shapesService to handle all shape types (use performance utilities)
- [ ] 13.7: Update useShapes hook for multi-shape CRUD (with batching)
- [ ] 13.8: Update Canvas to render different shape types (with viewport culling)
- [ ] 13.9: Ensure all shapes work with existing performance optimizations
- [ ] 13.10: Write unit tests for shape operations
- [ ] 13.11: Test shape creation and syncing in production

**Acceptance Criteria:**
- [ ] Users can create circles, lines, and text layers
- [ ] All shape types sync in real-time with optimized performance
- [ ] Shape-specific properties work correctly
- [ ] Text can be edited inline
- [ ] All shapes work with viewport culling and object pooling
- [ ] Performance remains >60 FPS with mixed shape types
- [ ] All tests pass

---

### PR #14: Undo/Redo System (Tier 1 Feature)
**Goal:** Implement command pattern for undo/redo functionality

**Files to Create:**
- `src/services/commandService.ts` - Command pattern implementation
- `src/hooks/useUndoRedo.ts` - Undo/redo state management
- `src/types/commands.ts` - Command interfaces
- `src/components/features/UndoRedo/UndoRedoManager.tsx` - Central manager
- `src/components/features/UndoRedo/UndoRedoButton.tsx` - UI buttons
- `tests/unit/services/commandService.test.ts` - Command service tests
- `tests/unit/hooks/useUndoRedo.test.ts` - Hook tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Integrate undo/redo
- `src/components/Toolbar.tsx` - Add undo/redo buttons
- `src/services/shapesService.ts` - Wrap operations in commands
- `src/hooks/useKeyboardShortcuts.ts` - Add Cmd+Z, Cmd+Shift+Z

**Tasks:**
- [ ] 14.1: Define Command interface (execute, undo)
- [ ] 14.2: Create commandService with undo/redo stacks
- [ ] 14.3: Implement CreateShapeCommand
- [ ] 14.4: Implement MoveShapeCommand
- [ ] 14.5: Implement ResizeShapeCommand
- [ ] 14.6: Implement RotateShapeCommand
- [ ] 14.7: Implement DeleteShapeCommand
- [ ] 14.8: Implement UpdateStyleCommand
- [ ] 14.9: Create useUndoRedo hook
- [ ] 14.10: Add keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
- [ ] 14.11: Create undo/redo UI buttons
- [ ] 14.12: Test undo/redo with various operations
- [ ] 14.13: Write comprehensive unit tests

**Acceptance Criteria:**
- [ ] Cmd+Z undoes last operation
- [ ] Cmd+Shift+Z redoes undone operation
- [ ] Stack preserves 50+ operations
- [ ] All major operations are undoable
- [ ] Works reliably with real-time sync
- [ ] All tests pass

---

### PR #15: Keyboard Shortcuts (Tier 1 Feature)
**Goal:** Add comprehensive keyboard shortcuts for power users

**Files to Create:**
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard event handling
- `src/components/features/KeyboardShortcuts/ShortcutsPanel.tsx` - Shortcuts reference
- `src/components/features/KeyboardShortcuts/ShortcutsOverlay.tsx` - ? key overlay
- `tests/unit/hooks/useKeyboardShortcuts.test.ts` - Shortcut tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Register keyboard listeners
- `src/components/Toolbar.tsx` - Show shortcut hints
- `src/hooks/useSelection.ts` - Add arrow key nudging

**Tasks:**
- [ ] 15.1: Create useKeyboardShortcuts hook
- [ ] 15.2: Implement Delete/Backspace for deletion
- [ ] 15.3: Implement Cmd/Ctrl+D for duplicate
- [ ] 15.4: Implement arrow keys for nudging (1px, 10px with Shift)
- [ ] 15.5: Implement Cmd/Ctrl+C for copy
- [ ] 15.6: Implement Cmd/Ctrl+V for paste
- [ ] 15.7: Implement Cmd/Ctrl+A for select all
- [ ] 15.8: Create ShortcutsPanel component
- [ ] 15.9: Add ? key to show shortcuts overlay
- [ ] 15.10: Add visual feedback for shortcut actions
- [ ] 15.11: Handle shortcut conflicts with browser
- [ ] 15.12: Write unit tests for shortcuts
- [ ] 15.13: Test shortcuts with multi-select

**Acceptance Criteria:**
- [ ] All listed shortcuts work consistently
- [ ] Shortcuts panel accessible via ? key
- [ ] No conflicts with browser shortcuts
- [ ] Shortcuts work with multi-select
- [ ] Visual feedback for actions
- [ ] All tests pass

---

### PR #16: Snap-to-Grid & Smart Guides (Tier 1 Feature)
**Goal:** Add grid overlay and snapping functionality

**Files to Create:**
- `src/components/features/Grid/GridOverlay.tsx` - Visible grid
- `src/components/features/Grid/SnapToGrid.tsx` - Snap logic component
- `src/components/features/Grid/SmartGuides.tsx` - Alignment guides
- `src/hooks/useGrid.ts` - Grid state and snap logic
- `tests/unit/hooks/useGrid.test.ts` - Grid tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Integrate grid overlay
- `src/components/CanvasObject.tsx` - Apply snap during drag
- `src/components/Toolbar.tsx` - Add grid toggle button
- `src/utils/canvasHelpers.ts` - Add snap calculations

**Tasks:**
- [ ] 16.1: Create GridOverlay component
- [ ] 16.2: Implement grid rendering (adjusts with zoom)
- [ ] 16.3: Add grid toggle button to toolbar
- [ ] 16.4: Create useGrid hook with snap logic
- [ ] 16.5: Implement snap-to-grid during drag
- [ ] 16.6: Set snap threshold (5-10px)
- [ ] 16.7: Create SmartGuides component
- [ ] 16.8: Implement smart guide detection (align with other objects)
- [ ] 16.9: Show visual feedback when snapping
- [ ] 16.10: Add grid configuration (spacing, visibility)
- [ ] 16.11: Write unit tests for snap logic
- [ ] 16.12: Test grid with various zoom levels

**Acceptance Criteria:**
- [ ] Grid overlay displays correctly
- [ ] Objects snap to grid when enabled
- [ ] Smart guides appear during drag
- [ ] Snap tolerance feels natural
- [ ] Toggle controls are accessible
- [ ] All tests pass

---

### PR #17: Alignment Tools (Tier 2 Feature)
**Goal:** Add alignment and distribution tools for multi-select

**Files to Create:**
- `src/components/features/Alignment/AlignmentTools.tsx` - Alignment toolbar
- `src/components/features/Alignment/AlignmentButton.tsx` - Individual buttons
- `src/hooks/useAlignment.ts` - Alignment logic
- `src/services/alignmentService.ts` - Alignment calculations
- `src/utils/alignmentHelpers.ts` - Math helpers
- `tests/unit/services/alignmentService.test.ts` - Tests
- `tests/unit/utils/alignmentHelpers.test.ts` - Helper tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Integrate alignment toolbar
- `src/components/Toolbar.tsx` - Add alignment section
- `src/hooks/useSelection.ts` - Track selection bounds

**Tasks:**
- [ ] 17.1: Create alignmentHelpers with bounding box logic
- [ ] 17.2: Implement alignLeft() function
- [ ] 17.3: Implement alignRight() function
- [ ] 17.4: Implement alignCenter() function (horizontal)
- [ ] 17.5: Implement alignTop() function
- [ ] 17.6: Implement alignBottom() function
- [ ] 17.7: Implement alignMiddle() function (vertical)
- [ ] 17.8: Implement distributeHorizontally() function
- [ ] 17.9: Implement distributeVertically() function
- [ ] 17.10: Create AlignmentTools UI component
- [ ] 17.11: Create useAlignment hook
- [ ] 17.12: Add alignment to undo/redo system
- [ ] 17.13: Write comprehensive unit tests
- [ ] 17.14: Test alignment with various selections

**Acceptance Criteria:**
- [ ] All 6+ alignment operations work correctly
- [ ] Alignment relative to selection bounds
- [ ] Distribution creates even spacing
- [ ] UI controls are intuitive
- [ ] Operations undo/redo correctly
- [ ] All tests pass

---

### PR #18: Z-Index Management (Tier 2 Feature)
**Goal:** Add layer ordering controls

**Files to Create:**
- `src/components/features/ZIndex/ZIndexControls.tsx` - Z-index buttons
- `src/hooks/useZIndex.ts` - Z-index management
- `tests/unit/hooks/useZIndex.test.ts` - Tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Render shapes in z-index order
- `src/components/Toolbar.tsx` - Add z-index controls
- `src/services/shapesService.ts` - Add z-index updates
- `src/types/shapes.ts` - Add zIndex property
- `src/hooks/useKeyboardShortcuts.ts` - Add Cmd+], Cmd+[ shortcuts

**Tasks:**
- [ ] 18.1: Add zIndex property to shape types
- [ ] 18.2: Create useZIndex hook
- [ ] 18.3: Implement bringToFront() function
- [ ] 18.4: Implement sendToBack() function
- [ ] 18.5: Implement bringForward() function
- [ ] 18.6: Implement sendBackward() function
- [ ] 18.7: Create ZIndexControls component
- [ ] 18.8: Add keyboard shortcuts (Cmd+], Cmd+[, etc.)
- [ ] 18.9: Add right-click context menu integration
- [ ] 18.10: Update Canvas rendering to respect z-index
- [ ] 18.11: Sync z-index changes to all users
- [ ] 18.12: Add z-index to undo/redo system
- [ ] 18.13: Write unit tests
- [ ] 18.14: Test z-index with multiple shapes

**Acceptance Criteria:**
- [ ] All z-index operations work correctly
- [ ] Keyboard shortcuts function properly
- [ ] Context menu provides easy access
- [ ] Z-index changes sync across users
- [ ] Visual feedback shows layer changes
- [ ] All tests pass

---

### PR #19: Collaborative Comments (Tier 3 Feature)
**Goal:** Add commenting system for collaboration

**Files to Create:**
- `src/components/features/Comments/CommentPin.tsx` - Comment marker on canvas
- `src/components/features/Comments/CommentThread.tsx` - Comment display
- `src/components/features/Comments/CommentInput.tsx` - New comment input
- `src/components/features/Comments/CommentsPanel.tsx` - Sidebar panel
- `src/hooks/useComments.ts` - Comments state management
- `src/services/commentsService.ts` - Firestore comments CRUD
- `src/types/comments.ts` - Comment interfaces
- `tests/unit/services/commentsService.test.ts` - Tests
- `tests/unit/hooks/useComments.test.ts` - Hook tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Render comment pins
- `src/components/Toolbar.tsx` - Add comment mode toggle
- `firestore.rules` - Add rules for comments collection
- `src/App.css` - Comment styling

**Tasks:**
- [ ] 19.1: Design Firestore comments schema
- [ ] 19.2: Create commentsService with CRUD operations
- [ ] 19.3: Implement useComments hook
- [ ] 19.4: Create CommentPin component
- [ ] 19.5: Create CommentThread component with replies
- [ ] 19.6: Create CommentInput component
- [ ] 19.7: Create CommentsPanel sidebar
- [ ] 19.8: Implement click-to-add comment functionality
- [ ] 19.9: Add resolve/unresolve functionality
- [ ] 19.10: Implement comment threading (replies)
- [ ] 19.11: Add show/hide comments toggle
- [ ] 19.12: Sync comments in real-time to all users
- [ ] 19.13: Add user avatars and timestamps
- [ ] 19.14: Write unit tests for comments
- [ ] 19.15: Test comments with multiple users

**Acceptance Criteria:**
- [ ] Users can add comments at any position
- [ ] Comments display with author and timestamp
- [ ] Comments sync in real-time to all users
- [ ] Comments can be resolved/unresolved
- [ ] Replies to comments work correctly
- [ ] Comment visibility can be toggled
- [ ] All tests pass

---

### PR #20: AI Canvas Agent
**Goal:** Build natural language interface for canvas manipulation

**Files to Create:**
- `src/components/features/AI/AICommandInput.tsx` - Chat-style input
- `src/components/features/AI/AICommandHistory.tsx` - Command history
- `src/components/features/AI/AILoadingIndicator.tsx` - Loading state
- `src/components/features/AI/AIErrorDisplay.tsx` - Error messages
- `src/hooks/useAI.ts` - AI state management
- `src/services/aiService.ts` - AI API calls
- `src/types/ai.ts` - AI command types
- `src/utils/aiHelpers.ts` - AI helper functions
- `functions/src/ai.ts` - Firebase Function for AI endpoint (optional)
- `tests/unit/services/aiService.test.ts` - Tests
- `tests/unit/hooks/useAI.test.ts` - Hook tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Integrate AI panel
- `src/services/shapesService.ts` - Add AI-callable methods
- `firestore.rules` - Add rules for AI commands (if storing)

**Tasks:**
- [ ] 20.1: Set up OpenAI or Anthropic API integration
- [ ] 20.2: Define function calling schema
- [ ] 20.3: Create aiService with command parsing
- [ ] 20.4: Implement createShape() AI function
- [ ] 20.5: Implement moveShape() AI function
- [ ] 20.6: Implement resizeShape() AI function
- [ ] 20.7: Implement rotateShape() AI function
- [ ] 20.8: Implement arrangeInRow() AI function
- [ ] 20.9: Implement createGrid() AI function
- [ ] 20.10: Implement getCanvasState() for context
- [ ] 20.11: Implement complex command: "create login form"
- [ ] 20.12: Implement complex command: "create navigation bar"
- [ ] 20.13: Create AICommandInput UI component
- [ ] 20.14: Create useAI hook for command execution
- [ ] 20.15: Add loading states and error handling
- [ ] 20.16: Create AICommandHistory component
- [ ] 20.17: Implement AI command queue for multi-user
- [ ] 20.18: Ensure AI-generated objects sync to all users
- [ ] 20.19: Add success/error feedback messages
- [ ] 20.20: Write unit tests for AI service
- [ ] 20.21: Test 6-8 distinct commands
- [ ] 20.22: Test complex multi-step commands
- [ ] 20.23: Test concurrent AI usage
- [ ] 20.24: Optimize for sub-2s response times

**Acceptance Criteria:**
- [ ] 6-8 distinct command types work
- [ ] Creation commands execute correctly
- [ ] Manipulation commands work reliably
- [ ] Layout commands arrange objects properly
- [ ] Complex commands generate 3+ elements
- [ ] AI responses are <2s for simple commands
- [ ] Multiple users can use AI simultaneously
- [ ] AI-generated objects sync to all users
- [ ] Error handling is robust
- [ ] 85%+ accuracy on valid commands
- [ ] All tests pass

---

### PR #21: Performance Optimization
**Goal:** Meet 500+ objects, 5+ users, 60 FPS targets

**Files to Create:**
- `src/utils/performanceHelpers.ts` - Performance utilities
- `tests/unit/utils/performanceHelpers.test.ts` - Tests

**Files to Modify:**
- `src/components/Canvas.tsx` - Viewport culling
- `src/components/CanvasObject.tsx` - Render optimization
- `src/hooks/useShapes.ts` - Batch updates
- `src/hooks/usePresence.ts` - Throttle improvements
- `src/services/shapesService.ts` - Batched writes

**Tasks:**
- [ ] 21.1: Implement viewport culling (only render visible objects)
- [ ] 21.2: Add object pooling for create/delete
- [ ] 21.3: Implement spatial indexing (quadtree)
- [ ] 21.4: Optimize cursor position updates (reduce frequency)
- [ ] 21.5: Implement batched Firestore writes
- [ ] 21.6: Add debouncing for rapid shape updates
- [ ] 21.7: Profile render performance with React DevTools
- [ ] 21.8: Optimize re-renders with React.memo
- [ ] 21.9: Add lazy loading for off-screen components
- [ ] 21.10: Implement efficient collision detection
- [ ] 21.11: Optimize z-index sorting algorithm
- [ ] 21.12: Test with 500+ objects
- [ ] 21.13: Test with 5+ concurrent users
- [ ] 21.14: Measure and maintain 60 FPS
- [ ] 21.15: Monitor memory usage
- [ ] 21.16: Write performance tests

**Acceptance Criteria:**
- [ ] 500+ objects load without lag
- [ ] Pan/zoom maintains 60 FPS
- [ ] Object manipulation is smooth at scale
- [ ] 5+ users can edit simultaneously without lag
- [ ] Memory usage stays stable
- [ ] Network usage is efficient
- [ ] All performance targets met

---

### PR #22: UI/UX Polish & Design System
**Goal:** Professional design system with smooth animations

**Files to Create:**
- `src/styles/design-system.css` - Design tokens and variables
- `src/styles/animations.css` - Animation definitions
- `src/components/ui/Button.tsx` - Reusable button component
- `src/components/ui/IconButton.tsx` - Icon button component
- `src/components/ui/Tooltip.tsx` - Tooltip component
- `src/components/ui/Modal.tsx` - Modal component

**Files to Modify:**
- `src/App.css` - Integrate design system
- `src/index.css` - Global styles update
- `src/components/Toolbar.tsx` - Apply design system
- `src/components/PresenceList.tsx` - Polish styling
- All feature components - Consistent styling

**Tasks:**
- [ ] 22.1: Define design system tokens (colors, spacing, typography)
- [ ] 22.2: Create reusable Button component
- [ ] 22.3: Create IconButton component
- [ ] 22.4: Create Tooltip component
- [ ] 22.5: Add hover states to all interactive elements
- [ ] 22.6: Implement smooth transitions (200-300ms)
- [ ] 22.7: Add loading states for async operations
- [ ] 22.8: Create Modal component for dialogs
- [ ] 22.9: Add micro-interactions (button clicks, selections)
- [ ] 22.10: Implement consistent error messages
- [ ] 22.11: Add empty states with helpful messages
- [ ] 22.12: Polish toolbar design
- [ ] 22.13: Polish presence list styling
- [ ] 22.14: Add dark mode support (optional)
- [ ] 22.15: Ensure responsive design
- [ ] 22.16: Add focus indicators for accessibility
- [ ] 22.17: Test across different screen sizes

**Acceptance Criteria:**
- [ ] UI follows consistent design language
- [ ] All interactive elements have hover/active states
- [ ] Loading states are clear and non-blocking
- [ ] Transitions are smooth (200-300ms)
- [ ] Overall polish feels production-ready
- [ ] Responsive across common screen sizes
- [ ] Focus indicators visible for keyboard navigation

---

### PR #23: Documentation & Demo Video
**Goal:** Comprehensive documentation and video demonstration

**Files to Create:**
- `AI_DEVELOPMENT_LOG.md` - Required AI development log
- `ARCHITECTURE.md` - System architecture documentation
- `DEPLOYMENT.md` - Deployment guide
- `FEATURES.md` - Feature documentation
- `demo-video.mp4` - 3-5 minute demo video

**Files to Modify:**
- `README.md` - Update with all final features
- `package.json` - Update scripts and dependencies list

**Tasks:**
- [ ] 23.1: Write AI Development Log (1 page)
  - Tools & Workflow used
  - 3-5 effective prompting strategies
  - Code analysis (AI vs hand-written %)
  - Strengths & limitations
  - Key learnings
- [ ] 23.2: Update README with complete feature list
- [ ] 23.3: Document setup instructions
- [ ] 23.4: Document deployment process
- [ ] 23.5: Create architecture documentation
- [ ] 23.6: Document Firestore data model
- [ ] 23.7: Document API endpoints (if any)
- [ ] 23.8: Create FEATURES.md with usage guide
- [ ] 23.9: Add screenshots to documentation
- [ ] 23.10: Record demo video (3-5 minutes)
  - Real-time collaboration with 2+ users (both screens)
  - Multiple AI commands executing
  - Advanced features walkthrough
  - Architecture explanation
  - Clear audio and video quality
- [ ] 23.11: Add known limitations section
- [ ] 23.12: Add troubleshooting guide
- [ ] 23.13: Review and polish all documentation

**Acceptance Criteria:**
- [ ] AI Development Log is complete and insightful
- [ ] README has clear setup instructions
- [ ] Architecture is well-documented
- [ ] Demo video shows all required content
- [ ] Video quality is clear (audio and video)
- [ ] Documentation is professional and comprehensive

---

### PR #24: Final Testing & Bug Fixes
**Goal:** Comprehensive testing and final polish

**Files to Modify:**
- All components and services - Bug fixes
- All tests - Update and expand coverage

**Tasks:**
- [ ] 24.1: Test all shape types (create, edit, delete)
- [ ] 24.2: Test all transform operations
- [ ] 24.3: Test multi-select thoroughly
- [ ] 24.4: Test undo/redo with all operations
- [ ] 24.5: Test all keyboard shortcuts
- [ ] 24.6: Test grid and snap functionality
- [ ] 24.7: Test alignment tools with various selections
- [ ] 24.8: Test z-index operations
- [ ] 24.9: Test commenting system
- [ ] 24.10: Test all 6-8 AI commands
- [ ] 24.11: Test complex AI commands
- [ ] 24.12: Test concurrent AI usage
- [ ] 24.13: Test with 2+ users simultaneously
- [ ] 24.14: Test persistence (refresh, disconnect)
- [ ] 24.15: Test with 500+ objects
- [ ] 24.16: Test with 5+ concurrent users
- [ ] 24.17: Test performance (60 FPS maintained)
- [ ] 24.18: Test on multiple browsers
- [ ] 24.19: Test on different screen sizes
- [ ] 24.20: Fix all identified bugs
- [ ] 24.21: Run full test suite
- [ ] 24.22: Verify all acceptance criteria
- [ ] 24.23: Load testing in production
- [ ] 24.24: Final QA pass

**Acceptance Criteria:**
- [ ] All features work as expected
- [ ] No critical bugs remain
- [ ] All unit tests pass
- [ ] Performance targets met
- [ ] Multi-user collaboration is stable
- [ ] Production app is reliable

---

### PR #25: Final Production Deployment
**Goal:** Deploy complete application to production

**Files to Modify:**
- `vercel.json` - Final deployment configuration
- `firebase.json` - Production settings
- `firestore.rules` - Final security rules
- `package.json` - Production dependencies

**Tasks:**
- [ ] 25.1: Review Firestore security rules
- [ ] 25.2: Review Firebase indexes
- [ ] 25.3: Optimize production build
- [ ] 25.4: Configure production environment variables
- [ ] 25.5: Deploy to Vercel
- [ ] 25.6: Verify deployment successful
- [ ] 25.7: Test all features in production
- [ ] 25.8: Test with multiple users in production
- [ ] 25.9: Monitor for errors
- [ ] 25.10: Verify performance in production
- [ ] 25.11: Update README with production URL
- [ ] 25.12: Submit final application

**Acceptance Criteria:**
- [ ] Application deployed and accessible
- [ ] All features work in production
- [ ] Multi-user collaboration stable
- [ ] Performance meets targets
- [ ] No critical errors
- [ ] Ready for submission

---

## 📊 Testing Checklist

### Real-Time Collaboration Tests
- [ ] 2+ users can edit simultaneously without conflicts
- [ ] Object sync is <100ms
- [ ] Cursor sync is <50ms
- [ ] User refresh mid-edit preserves state
- [ ] Network drop recovers gracefully
- [ ] All users disconnect → canvas persists

### Canvas Functionality Tests
- [ ] All shape types can be created and manipulated
- [ ] Multi-select works with shift-click and drag
- [ ] Transforms (move, resize, rotate) work correctly
- [ ] Undo/redo works reliably
- [ ] Keyboard shortcuts function properly
- [ ] Grid and snap work as expected
- [ ] Alignment tools work correctly
- [ ] Z-index management functions properly
- [ ] Comments sync and thread correctly

### AI Agent Tests
- [ ] 6-8 distinct commands execute successfully
- [ ] Complex commands generate appropriate layouts
- [ ] AI responses are <2s for simple commands
- [ ] Multiple users can use AI simultaneously
- [ ] AI-generated objects sync to all users
- [ ] Error handling works for invalid commands

### Performance Tests
- [ ] 500+ objects load and render smoothly
- [ ] Pan/zoom maintains 60 FPS at scale
- [ ] 5+ concurrent users without degradation
- [ ] Memory usage is stable over time
- [ ] Network bandwidth is reasonable

---

## 🎯 Grade Target Breakdown

### Core Collaborative Infrastructure (28/30 points)
- ✅ Real-time sync working (MVP complete)
- ✅ Conflict resolution implemented (MVP complete)
- ✅ Persistence & reconnection working (MVP complete)
- 🔄 Polish and optimization (PR #21)

### Canvas Features & Performance (18/20 points)
- 🔄 Multiple shape types (PR #11)
- 🔄 Advanced transforms (PR #12)
- 🔄 Multi-select (PR #13)
- 🔄 Performance optimization (PR #21)

### Advanced Figma Features (13/15 points)
- 🔄 Undo/Redo (PR #14) - Tier 1
- 🔄 Keyboard Shortcuts (PR #15) - Tier 1
- 🔄 Snap-to-Grid (PR #16) - Tier 1
- 🔄 Alignment Tools (PR #17) - Tier 2
- 🔄 Z-Index Management (PR #18) - Tier 2
- 🔄 Collaborative Comments (PR #19) - Tier 3

### AI Canvas Agent (23/25 points)
- 🔄 6-8 command types (PR #20)
- 🔄 Complex execution (PR #20)
- 🔄 Performance & reliability (PR #20)

### Technical Implementation (9/10 points)
- ✅ Architecture quality (MVP foundation)
- ✅ Authentication & security (MVP complete)
- 🔄 Code quality maintenance (All PRs)

### Documentation & Submission (5/5 points)
- 🔄 Repository & setup (PR #23)
- 🔄 Demo video (PR #23)
- 🔄 AI development log (PR #23)

### Bonus Points (+3 points)
- 🔄 Innovation (AI features, unique implementations)
- 🔄 Polish (PR #22 - design system)
- 🔄 Scale (PR #21 - exceeding performance targets)

**Target Total: 99/100 points (A grade)**

---

## 📅 PERFORMANCE-FIRST 6-Day Timeline ⚡

### Day 1: Critical Architecture Foundation
- Complete PR #11 (Performance Architecture Foundation) ⚡ CRITICAL
  - Profile current performance issues
  - Implement viewport culling
  - Create object pooling system
  - Add batching and throttling
  - Test with 100+ objects

### Day 2: AI Agent Infrastructure  
- Complete PR #12 (AI Canvas Agent Architecture) ⚡ CRITICAL
  - Set up AI API integration
  - Build function calling system
  - Implement 4-6 core AI commands
  - Test multi-user AI usage
  - Optimize for <2s response times

**🔥 CRITICAL CHECKPOINT: Performance and AI foundation must be solid by end of Day 2**

### Day 3: Expanded Canvas Features
- Complete PR #13 (Additional Shape Types)
  - Build on optimized foundation
  - Ensure shapes work with performance layer
- Start PR #14 (Undo/Redo) or PR #15 (Keyboard Shortcuts)

### Day 4: Tier 1 Features
- Complete remaining from Day 3
- Complete 2-3 Tier 1 features (choose best fit):
  - PR #14 (Undo/Redo)
  - PR #15 (Keyboard Shortcuts) 
  - PR #16 (Snap-to-Grid)

### Day 5: Tier 2/3 Features + Polish
- Complete 1-2 Tier 2 features:
  - PR #17 (Alignment Tools)
  - PR #18 (Z-Index Management)
- Start Tier 3 feature: PR #19 (Collaborative Comments)
- UI/UX Polish (PR #22)

### Day 6: Final Testing & Submission
- Complete documentation (PR #23)
- Comprehensive testing (PR #24)
- Final production deployment (PR #25)
- Record demo video
- Submit project

**🎯 Success Metrics by Day:**
- **Day 1**: 60 FPS with 100+ objects
- **Day 2**: AI commands working with multi-user sync  
- **Day 3**: Multiple shape types + 1 Tier 1 feature
- **Day 4**: 3 Tier 1 features total
- **Day 5**: 6+ total advanced features
- **Day 6**: Production-ready with documentation

---

## 🚨 CRITICAL REMINDERS - PERFORMANCE FIRST

1. **PERFORMANCE IS CRITICAL** ⚡ - MVP is already laggy, fix architecture FIRST
2. **Day 1-2 Are Make-or-Break** - Performance + AI foundation must be solid
3. **Don't Add Features to Broken Foundation** - Fix perf before expanding
4. **Test Performance Continuously** - Monitor FPS, memory, network after each change
5. **MVP Foundation is Solid** ✅ - Build on it, don't break the working parts
6. **Quality Over Quantity** - 4 excellent features > 8 laggy ones  
7. **AI Must Be Reliable** - Focus on working commands over complex features
8. **Deploy Often** - Deploy after major PRs for validation
9. **Reserve Day 6** - Only testing and bug fixes, no new features
10. **Fail Fast** - If performance fixes don't work by Day 1 end, pivot strategy

### 🚨 PERFORMANCE BENCHMARKS (MUST MEET):
- **Current State**: Laggy with basic rectangles
- **Day 1 Target**: 60 FPS with 100+ rectangles  
- **Day 2 Target**: AI + performance both working
- **Final Target**: 60 FPS with 200+ mixed objects + 5 users

### 🚨 BACKUP PLAN IF PERFORMANCE FAILS:
- **Plan B**: Focus on fewer objects but perfect UX (50 objects max)
- **Plan C**: Simplify AI to basic commands only
- **Plan D**: Cut complex features, perfect the basics

---

## 📝 Notes

- **Commit Strategy:** Commit after completing each subtask
- **Branch Strategy:** Create feature branches for each PR
- **Testing:** Write tests as you implement features
- **Code Review:** Self-review code before merging
- **Production Testing:** Test every major feature in production
- **Backup:** Keep MVP working at all times - have rollback plan

**Remember: The goal is A grade (90-100 points), not perfection. Ship excellent features, not everything.**