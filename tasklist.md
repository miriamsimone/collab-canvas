# CollabCanvas MVP - Task List & PR Checklist

## Project File Structure

```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx
│   │   ├── CanvasObject.jsx
│   │   ├── Toolbar.jsx
│   │   ├── PresenceList.jsx
│   │   ├── CursorOverlay.jsx
│   │   └── Auth/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       └── AuthProvider.jsx
│   ├── hooks/
│   │   ├── useCanvas.js
│   │   ├── usePresence.js
│   │   ├── useShapes.js
│   │   └── useAuth.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── canvasService.js
│   │   ├── shapeService.js
│   │   └── presenceService.js
│   ├── utils/
│   │   ├── colors.js
│   │   └── canvasHelpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── shapeService.test.js
│   │   │   ├── presenceService.test.js
│   │   │   └── canvasService.test.js
│   │   ├── hooks/
│   │   │   ├── useAuth.test.js
│   │   │   ├── useShapes.test.js
│   │   │   └── usePresence.test.js
│   │   └── utils/
│   │       ├── colors.test.js
│   │       └── canvasHelpers.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── shapeSync.test.js
│       ├── cursorSync.test.js
│       └── persistence.test.js
├── public/
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── vitest.config.js
├── firebase.json
├── .firebaserc
└── README.md
```

---

## PR Checklist

### PR #0: Firebase Project Setup & Security Rules
**Goal:** Create Firebase project and configure security rules before development

- [ ] **Subtask 0.1:** Create Firebase project in console
  - **Files:** None (Firebase Console)
  - Create new Firebase project
  - Enable Firestore Database
  - Enable Firebase Authentication
  - Note project ID for later configuration

- [ ] **Subtask 0.2:** Configure Firestore security rules
  - **Files:** `firestore.rules` (Firebase Console)
  - Create security rules for single shared canvas
  - Rules for `users`, `canvas`, `shapes`, `presence` collections
  - Allow authenticated users to read/write to shared canvas

- [ ] **Subtask 0.3:** Set up Firebase Authentication
  - **Files:** None (Firebase Console)
  - Enable Email/Password authentication
  - Configure auth settings
  - Note configuration details for development

**Acceptance Criteria:**
- Firebase project created and configured
- Firestore security rules allow authenticated access to shared canvas
- Authentication provider enabled
- Project ready for SDK integration

---

### PR #1: Project Setup & Firebase Configuration
**Goal:** Initialize React project and configure Firebase services

- [ ] **Subtask 1.1:** Initialize Vite + React project
  - **Files:** `package.json`, `vite.config.js`, `index.html`
  - Create new Vite React app
  - Install core dependencies: `react`, `react-dom`, `vite`

- [ ] **Subtask 1.2:** Install Firebase and canvas dependencies
  - **Files:** `package.json`
  - Install: `firebase`, `konva`, `react-konva`
  - Install dev dependencies: `eslint`, `prettier`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`

- [ ] **Subtask 1.3:** Configure Firebase SDK
  - **Files:** `src/services/firebase.js`, `.env.example`, `.firebaserc`, `firebase.json`
  - Add Firebase config from existing project (created in PR #0)
  - Initialize Firebase SDK in `firebase.js`
  - Configure connection to single shared canvas
  - Set up `.env.example` with Firebase credentials

- [ ] **Subtask 1.5:** Configure Git and deployment
  - **Files:** `.gitignore`, `README.md`, `vitest.config.js`
  - Add `.env` to `.gitignore`
  - Create README with setup instructions
  - Initialize git repository
  - Configure Vitest for testing

**Acceptance Criteria:**
- Project runs locally with `npm run dev`
- Firebase is connected and configured
- `.env` file working with Firebase credentials
- Test runner configured with `npm test`

---

### PR #2: Authentication System & First Deployment
**Goal:** Implement user authentication and deploy working auth system to production

- [ ] **Subtask 2.1:** Create Firebase Auth service
  - **Files:** `src/services/firebase.js`, `src/hooks/useAuth.js`
  - Implement `signUp()`, `signIn()`, `signOut()` functions
  - Add auth state listener
  - Create `useAuth` hook for auth state management

- [ ] **Subtask 2.2:** Build Login component
  - **Files:** `src/components/Auth/Login.jsx`
  - Create login form (email + password)
  - Handle login errors
  - Add loading states

- [ ] **Subtask 2.3:** Build Register component
  - **Files:** `src/components/Auth/Register.jsx`
  - Create registration form
  - Validate display name
  - Create user document in `users` collection on signup

- [ ] **Subtask 2.4:** Create AuthProvider context
  - **Files:** `src/components/Auth/AuthProvider.jsx`
  - Wrap app with auth context
  - Provide user state globally
  - Handle loading/authenticated/unauthenticated states

- [ ] **Subtask 2.5:** Add protected routing
  - **Files:** `src/App.jsx`
  - Redirect unauthenticated users to login
  - Redirect authenticated users to canvas
  - Show loading spinner during auth check

- [ ] **Subtask 2.6:** Write unit tests for auth
  - **Files:** `tests/unit/hooks/useAuth.test.js`
  - Test `signUp()` success and error cases
  - Test `signIn()` success and error cases
  - Test `signOut()` functionality
  - Test auth state persistence

- [ ] **Subtask 2.7:** Configure Firebase Hosting
  - **Files:** `firebase.json`, `.firebaserc`, `package.json`
  - Set up hosting configuration for SPA
  - Configure build output directory
  - Add build script to package.json
  - Set up redirects/rewrites for client-side routing

- [ ] **Subtask 2.8:** Deploy Auth MVP
  - **Files:** None (deployment action)
  - Build production version
  - Deploy to Firebase Hosting
  - Test authentication in production environment
  - Verify all auth flows work with production Firebase

**Acceptance Criteria:**
- Users can register with email/password
- Users can log in and see their display name
- Authentication state persists on refresh
- Protected routes work correctly
- Auth unit tests pass
- **🚀 Application is deployed and publicly accessible**
- **🚀 Authentication works in production environment**
- **🚀 Users can sign up and log in via public URL**

---

### PR #3: Canvas Workspace with Pan & Zoom + Deploy
**Goal:** Create basic canvas with pan and zoom, deploy Canvas MVP

- [ ] **Subtask 3.1:** Create Canvas component structure
  - **Files:** `src/components/Canvas.jsx`
  - Set up Konva Stage and Layer
  - Define canvas dimensions (5000x5000)
  - Create viewport container

- [ ] **Subtask 3.2:** Implement pan functionality
  - **Files:** `src/components/Canvas.jsx`, `src/hooks/useCanvas.js`
  - Add drag listener to Stage
  - Track stage position state
  - Implement smooth panning with mouse drag

- [ ] **Subtask 3.3:** Implement zoom functionality
  - **Files:** `src/components/Canvas.jsx`, `src/hooks/useCanvas.js`
  - Add wheel event listener
  - Implement zoom centered on cursor position
  - Set min/max zoom limits (e.g., 0.1x - 3x)

- [ ] **Subtask 3.4:** Add canvas background and coordinate utilities
  - **Files:** `src/components/Canvas.jsx`, `src/utils/canvasHelpers.js`
  - Add grid or solid background
  - Visual indication of canvas edges
  - Create coordinate conversion utilities (screen ↔ canvas coordinates)
  - Handle coordinate transformation with pan/zoom
  - Optional: minimap or coordinate display

- [ ] **Subtask 3.5:** Style and layout canvas page
  - **Files:** `src/App.jsx`, `src/index.css`
  - Full-screen canvas layout
  - Remove default margins/padding
  - Add canvas container styling

- [ ] **Subtask 3.6:** Write unit tests for canvas helpers
  - **Files:** `tests/unit/utils/canvasHelpers.test.js`
  - Test coordinate conversion functions (screen ↔ canvas)
  - Test zoom calculations
  - Test boundary detection
  - Test coordinate transformations with pan/zoom

- [ ] **Subtask 3.7:** Deploy Canvas MVP
  - **Files:** None (deployment action)
  - Build and deploy updated application
  - Test canvas functionality in production
  - Verify pan and zoom work on different devices/browsers
  - Check performance on mobile devices

**Acceptance Criteria:**
- Canvas renders at 5000x5000 pixels
- Users can pan smoothly by dragging
- Zoom in/out works with scroll wheel
- Canvas feels responsive and spacious
- Canvas helper tests pass
- **🚀 Canvas functionality works in production**
- **🚀 Pan/zoom performance verified on multiple devices**

---

### PR #4: Rectangle Creation & Selection
**Goal:** Allow users to create and select rectangles

- [ ] **Subtask 4.1:** Create Toolbar component
  - **Files:** `src/components/Toolbar.jsx`
  - Add button for creating rectangles
  - Style toolbar (fixed position)
  - Track active tool state

- [ ] **Subtask 4.2:** Implement shape creation logic
  - **Files:** `src/components/Canvas.jsx`, `src/hooks/useCanvas.js`
  - Add click handler to create shape at cursor position
  - Generate unique shape ID
  - Set default properties (size, color)

- [ ] **Subtask 4.3:** Create CanvasObject component
  - **Files:** `src/components/CanvasObject.jsx`
  - Render Konva Rectangle shapes
  - Apply position, size, color properties
  - Handle rectangle rendering logic

- [ ] **Subtask 4.4:** Implement shape selection
  - **Files:** `src/components/CanvasObject.jsx`, `src/hooks/useCanvas.js`
  - Add click handler to select shapes
  - Track selected shape ID in state
  - Show visual selection indicator (border/outline)

- [ ] **Subtask 4.5:** Implement shape movement
  - **Files:** `src/components/CanvasObject.jsx`
  - Enable Konva draggable property on selected shapes
  - Update shape position on drag end
  - Show visual feedback during drag

- [ ] **Subtask 4.6:** Write unit tests for shape operations
  - **Files:** `tests/unit/hooks/useCanvas.test.js`
  - Test shape creation logic
  - Test shape selection logic
  - Test coordinate calculations

**Acceptance Criteria:**
- Users can create rectangles by clicking
- Clicking a rectangle selects it with visual feedback
- Selected rectangles can be dragged to move them
- Rectangle creation and movement feel intuitive
- Shape operation tests pass

---

### PR #5: Firestore Shape Sync + Collaborative MVP Deploy
**Goal:** Sync shape data to Firestore and deploy collaborative editing MVP

- [ ] **Subtask 5.1:** Create shape service
  - **Files:** `src/services/shapeService.js`
  - Implement `createShape(shapeData)` for shared canvas
  - Implement `updateShape(shapeId, updates)`
  - Implement `deleteShape(shapeId)`
  - Implement `getShapes()` listener for shared canvas

- [ ] **Subtask 5.2:** Create useShapes hook
  - **Files:** `src/hooks/useShapes.js`
  - Subscribe to `canvas/shapes` collection (shared canvas)
  - Return shapes array and CRUD functions
  - Handle real-time updates from Firestore

- [ ] **Subtask 5.3:** Connect shape creation to Firestore
  - **Files:** `src/components/Canvas.jsx`, `src/hooks/useCanvas.js`
  - Call `createShape()` when user creates shape
  - Add optimistic update for local state
  - Handle creation errors

- [ ] **Subtask 5.4:** Connect shape updates to Firestore
  - **Files:** `src/components/CanvasObject.jsx`
  - Call `updateShape()` on drag end
  - Debounce rapid updates if needed
  - Update `updatedAt` and `updatedBy` fields

- [ ] **Subtask 5.5:** Render shapes from Firestore
  - **Files:** `src/components/Canvas.jsx`
  - Map over shapes from `useShapes` hook
  - Render CanvasObject for each shape
  - Handle empty state (no shapes)

- [ ] **Subtask 5.6:** Write unit tests for shape service
  - **Files:** `tests/unit/services/shapeService.test.js`
  - Test `createShape()` function
  - Test `updateShape()` function
  - Test `deleteShape()` function
  - Mock Firestore calls

- [ ] **Subtask 5.7:** Write integration test for shape sync
  - **Files:** `tests/integration/shapeSync.test.js`
  - Test shape creation syncs across users
  - Test shape updates sync across users
  - Test concurrent shape operations

- [ ] **Subtask 5.8:** Deploy Collaborative MVP
  - **Files:** None (deployment action)
  - Deploy real-time collaborative editing
  - Test multi-user rectangle creation and editing
  - Verify sync performance with multiple simultaneous users
  - Test persistence across browser refreshes

**Acceptance Criteria:**
- Shapes are saved to Firestore on creation
- Shape positions update in Firestore when moved
- Multiple browser windows see same shapes
- Shape changes sync between users
- Shape service unit tests pass
- Shape sync integration test passes
- **🚀 Real-time collaboration works in production**
- **🚀 Multiple users can edit simultaneously via public URL**
- **🚀 Rectangles sync smoothly between users**

---

### PR #6: Multiplayer Cursors
**Goal:** Show real-time cursor positions for all users

- [ ] **Subtask 6.1:** Create presence service
  - **Files:** `src/services/presenceService.js`
  - Implement `updateCursorPosition(userId, x, y)` for shared canvas
  - Implement `initializePresence(userId, displayName)`
  - Implement `removePresence(userId)`
  - Implement `getPresence()` listener for shared canvas

- [ ] **Subtask 6.2:** Create usePresence hook
  - **Files:** `src/hooks/usePresence.js`
  - Subscribe to `canvas/presence` collection (shared canvas)
  - Initialize presence on mount
  - Clean up presence on unmount
  - Return presence array and update function

- [ ] **Subtask 6.3:** Track cursor movement
  - **Files:** `src/components/Canvas.jsx`
  - Add mousemove listener to Stage
  - Convert screen coordinates to canvas coordinates using helpers
  - Throttle cursor updates for smooth performance
  - Call `updateCursorPosition()` with coordinates

- [ ] **Subtask 6.4:** Create CursorOverlay component
  - **Files:** `src/components/CursorOverlay.jsx`
  - Render cursor for each user in presence
  - Display user name label near cursor
  - Apply unique color per user
  - Position cursors correctly based on zoom/pan

- [ ] **Subtask 6.5:** Generate unique cursor colors
  - **Files:** `src/utils/colors.js`
  - Create color assignment function
  - Ensure good contrast and visibility
  - Assign color on presence initialization

- [ ] **Subtask 6.6:** Write unit tests for presence service
  - **Files:** `tests/unit/services/presenceService.test.js`
  - Test `updateCursorPosition()` function
  - Test `initializePresence()` function
  - Test `removePresence()` function
  - Mock Firestore calls

- [ ] **Subtask 6.7:** Write unit tests for color utility
  - **Files:** `tests/unit/utils/colors.test.js`
  - Test color generation
  - Test color uniqueness
  - Test color contrast

- [ ] **Subtask 6.8:** Write integration test for cursor sync
  - **Files:** `tests/integration/cursorSync.test.js`
  - Test cursor positions sync across users
  - Test cursor appears when user joins
  - Test cursor disappears when user leaves

**Acceptance Criteria:**
- Each user sees other users' cursors
- Cursors move smoothly in real-time
- User names display near cursors
- Cursors have unique, visible colors
- Presence service unit tests pass
- Color utility tests pass
- Cursor sync integration test passes

---

### PR #7: Presence Awareness UI + Full Multiplayer Deploy
**Goal:** Complete presence UI and deploy full multiplayer experience

- [ ] **Subtask 7.1:** Create PresenceList component
  - **Files:** `src/components/PresenceList.jsx`
  - Display list of active users
  - Show user display names
  - Show user count
  - Style as sidebar or header

- [ ] **Subtask 7.2:** Connect PresenceList to usePresence
  - **Files:** `src/components/PresenceList.jsx`
  - Map over presence data from hook
  - Filter out current user (optional)
  - Show online indicators

- [ ] **Subtask 7.3:** Add presence heartbeat and disconnect handling
  - **Files:** `src/hooks/usePresence.js`
  - Update `lastSeen` timestamp every 5 seconds
  - Mark user as active
  - Handle tab visibility changes
  - Add `onbeforeunload` event listener to clean up presence
  - Add window focus/blur handling for presence status

- [ ] **Subtask 7.4:** Clean up stale presence
  - **Files:** `src/services/presenceService.js`, `src/hooks/usePresence.js`
  - Remove presence documents older than 15 seconds (heartbeat-based)
  - Implement cleanup on `onbeforeunload` event
  - Handle browser close/refresh scenarios
  - Add periodic cleanup for abandoned sessions

- [ ] **Subtask 7.5:** Integrate PresenceList into app layout
  - **Files:** `src/App.jsx`, `src/index.css`
  - Position PresenceList in UI
  - Make responsive
  - Add open/close toggle (optional)

- [ ] **Subtask 7.6:** Write unit tests for presence hook
  - **Files:** `tests/unit/hooks/usePresence.test.js`
  - Test presence initialization
  - Test heartbeat updates
  - Test cleanup on unmount
  - Mock Firestore listeners

- [ ] **Subtask 7.7:** Deploy Full Multiplayer MVP
  - **Files:** None (deployment action)
  - Deploy complete multiplayer experience
  - Test cursors, presence, and rectangles with 3+ users
  - Verify presence cleanup works correctly
  - Test user join/leave scenarios in production
  - Validate cursor accuracy across different screen sizes

**Acceptance Criteria:**
- Users see accurate list of who's online
- User count updates in real-time
- Disconnected users removed within 15 seconds
- UI clearly shows presence information
- Presence hook unit tests pass
- **🚀 Complete multiplayer experience works in production**
- **🚀 Cursors, presence, and collaboration tested with multiple users**
- **🚀 All multiplayer features work reliably via public URL**

---

### PR #8: State Persistence & Reconnection
**Goal:** Ensure canvas state survives disconnects and refreshes

- [ ] **Subtask 8.1:** Implement shared canvas initialization
  - **Files:** `src/services/canvasService.js`
  - Implement `initializeSharedCanvas()`
  - Implement `getSharedCanvas()`
  - Ensure shared canvas document exists on app initialization

- [ ] **Subtask 8.2:** Load shared canvas state on mount
  - **Files:** `src/components/Canvas.jsx`, `src/hooks/useCanvas.js`
  - Subscribe to shared canvas document
  - Load shapes on component mount
  - Show loading spinner while fetching data

- [ ] **Subtask 8.3:** Handle user reconnection
  - **Files:** `src/hooks/usePresence.js`, `src/hooks/useShapes.js`
  - Re-initialize presence on reconnect
  - Re-subscribe to Firestore listeners
  - Handle offline/online events

- [ ] **Subtask 8.4:** Test persistence scenarios
  - **Files:** Testing checklist (no code changes)
  - User refreshes page → shapes remain
  - All users disconnect → shapes remain
  - User loses connection briefly → reconnects smoothly

- [ ] **Subtask 8.5:** Add error handling and retry logic
  - **Files:** `src/services/firebase.js`, `src/hooks/useShapes.js`
  - Handle Firestore errors gracefully
  - Show user-friendly error messages
  - Retry failed operations

- [ ] **Subtask 8.6:** Write unit tests for canvas service
  - **Files:** `tests/unit/services/canvasService.test.js`
  - Test `initializeSharedCanvas()` function
  - Test `getSharedCanvas()` function
  - Mock Firestore calls

- [ ] **Subtask 8.7:** Write integration test for persistence
  - **Files:** `tests/integration/persistence.test.js`
  - Test state persists after refresh
  - Test state persists after all users disconnect
  - Test reconnection behavior

**Acceptance Criteria:**
- Canvas state loads correctly on page refresh
- All users can disconnect and reconnect without data loss
- Shapes persist even when all users leave
- Errors are handled gracefully
- Canvas service unit tests pass
- Persistence integration test passes

---

### PR #9: Production Optimization & CI/CD
**Goal:** Optimize for production and set up automated testing/deployment

- [ ] **Subtask 9.1:** Production performance optimization
  - **Files:** `vite.config.js`, `package.json`, various components
  - Optimize bundle size and code splitting
  - Add production-specific configurations
  - Implement lazy loading for non-critical components
  - Optimize Firebase configuration for production

- [ ] **Subtask 9.2:** Environment configuration
  - **Files:** `.env.production`, `firebase.json`
  - Set up production environment variables
  - Configure production Firebase settings
  - Optimize Firestore security rules for performance
  - Set up proper error logging and monitoring

- [ ] **Subtask 9.3:** Set up CI/CD pipeline
  - **Files:** `.github/workflows/deploy.yml`, `.github/workflows/test.yml`
  - Configure automated testing on PR
  - Set up automated deployment on main branch merge
  - Add build and test status checks
  - Configure deployment previews for PRs

- [ ] **Subtask 9.4:** Production monitoring and analytics
  - **Files:** `src/services/analytics.js`, Firebase Console
  - Set up error monitoring and reporting
  - Configure performance monitoring
  - Add basic usage analytics
  - Set up uptime monitoring

- [ ] **Subtask 9.5:** Documentation and final testing
  - **Files:** `README.md`
  - Update README with complete setup instructions
  - Document deployment process and CI/CD
  - Add troubleshooting section
  - Create contributor guidelines

- [ ] **Subtask 9.6:** Final production deployment
  - **Files:** None (deployment action)
  - Deploy optimized version through CI/CD
  - Perform comprehensive production testing
  - Verify all optimizations work correctly
  - Validate monitoring and analytics

**Acceptance Criteria:**
- Production bundle is optimized for performance
- CI/CD pipeline automatically tests and deploys
- Error monitoring and analytics are operational
- Application handles production load efficiently
- All tests pass automatically in CI/CD
- **🚀 Fully optimized and monitored production application**

---

### PR #10: Testing, Bug Fixes & Polish
**Goal:** Test MVP thoroughly and fix any issues

- [ ] **Subtask 10.1:** Test two-user collaboration
  - **Files:** Bug fixes as needed
  - Open two browsers, test simultaneous editing
  - Verify shapes sync correctly
  - Verify cursors sync correctly
  - Fix any sync issues

- [ ] **Subtask 10.2:** Test persistence scenarios
  - **Files:** Bug fixes as needed
  - Test page refresh with shapes
  - Test all users disconnecting
  - Test rapid reconnection
  - Fix any persistence issues

- [ ] **Subtask 10.3:** Test with 5+ concurrent users
  - **Files:** Bug fixes as needed
  - Verify application remains stable
  - Check sync works smoothly with multiple users
  - Fix any scaling issues

- [ ] **Subtask 10.4:** Basic optimization
  - **Files:** Various components as needed
  - Profile render performance
  - Optimize unnecessary re-renders
  - Add basic throttling for smooth user experience

- [ ] **Subtask 10.5:** UI/UX polish
  - **Files:** `src/index.css`, component files
  - Improve visual design
  - Add loading states
  - Add helpful error messages
  - Improve mobile responsiveness (nice-to-have)

- [ ] **Subtask 10.6:** Verify all tests pass
  - **Files:** All test files
  - Run full unit test suite
  - Run full integration test suite
  - Fix any failing tests
  - Achieve reasonable test coverage (>70%)

**Acceptance Criteria:**
- All testing scenarios from PRD pass
- No critical bugs remain
- Application feels responsive and stable
- User experience feels polished
- All unit and integration tests pass
- Test coverage is reasonable (>70%)

---

## Notes

- **PR Strategy:** Each PR should be focused and independently testable
- **Deploy Early & Often:** Deploy after PRs 2, 3, 5, 7, and 9 for continuous validation
- **Commit Often:** Commit after completing each subtask
- **Test As You Go:** Don't wait until the end to test multiplayer features
- **Test in Production:** Use each deployment to validate functionality with real users
- **Document Decisions:** Add comments for non-obvious implementation choices
- **Performance First:** If any PR causes performance issues, fix before moving on

---

## Deployment Milestones

**🚀 Deploy #1 - Auth MVP (After PR #2):**
- [ ] Authentication system working in production
- [ ] Users can sign up and log in via public URL

**🚀 Deploy #2 - Canvas MVP (After PR #3):**
- [ ] Canvas with pan/zoom working in production
- [ ] Verified on multiple devices and browsers

**🚀 Deploy #3 - Collaborative MVP (After PR #5):**
- [ ] Real-time rectangle collaboration working
- [ ] Multiple users can edit simultaneously

**🚀 Deploy #4 - Full Multiplayer MVP (After PR #7):**
- [ ] Complete multiplayer experience with cursors and presence
- [ ] All collaborative features working reliably

**🚀 Deploy #5 - Production MVP (After PR #9):**
- [ ] Optimized, monitored, and production-ready application

---

## Final Completion Checklist

MVP is complete when all PRs are merged and:

- [ ] All 11 PRs (0-10) merged to main branch
- [ ] **5 successful production deployments completed**
- [ ] 2+ users can edit simultaneously
- [ ] Rectangles sync in real-time between users
- [ ] Cursors sync smoothly between users
- [ ] Authentication works reliably
- [ ] State persists across disconnects
- [ ] All testing scenarios pass
- [ ] CI/CD pipeline operational
- [ ] Production monitoring active
- [ ] README updated with demo URL and setup instructions
- [ ] All unit tests pass (>70% coverage)
- [ ] All integration tests pass