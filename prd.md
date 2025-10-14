# CollabCanvas MVP - Product Requirements Document

## Executive Summary

CollabCanvas MVP is a real-time collaborative design canvas that enables multiple users to create, manipulate, and view design elements simultaneously. The MVP focuses exclusively on establishing bulletproof multiplayer infrastructure within a 24-hour development window.

**Timeline:** 24 hours to MVP checkpoint  
**Success Criteria:** Solid collaborative foundation with real-time sync between 2+ users

---

## User Stories

### Core User Flows

**As a designer**, I want to:
- Create an account and log in so that my work is associated with my identity
- See a large workspace where I can create design elements
- Pan and zoom smoothly across the canvas to navigate my designs
- Create rectangles to build my design
- Move objects around the canvas by dragging them
- See who else is currently online and editing the canvas
- See other users' cursors with their names in real-time
- Watch as other users create and move objects instantly on my screen
- Have my work persist when I disconnect and reconnect
- Return to find all my previous work intact even if everyone has left

**As a collaborative team member**, I want to:
- Work simultaneously with teammates without conflicts or lag
- Know immediately when someone joins or leaves the session
- See smooth, real-time updates of others' actions without refreshing
- Trust that my edits won't be lost when multiple people work at once

---

## Key Features for MVP

### 1. Canvas Workspace
**Priority:** Critical  
**Description:** Large workspace with smooth pan and zoom navigation

**Requirements:**
- Viewport area of at least 5000x5000 pixels (doesn't need infinite scroll)
- Smooth 60 FPS pan using mouse drag or trackpad
- Zoom in/out using scroll wheel or pinch gesture
- Visual indication of canvas bounds
- Mini-map or coordinates display (nice-to-have)

**Acceptance Criteria:**
- [ ] Users can pan smoothly without lag
- [ ] Zoom maintains 60 FPS performance
- [ ] Canvas feels spacious and navigable

---

### 2. Rectangle Creation & Manipulation
**Priority:** Critical  
**Description:** Users can create and move rectangles on the shared canvas

**Requirements:**
- Support for rectangle creation and manipulation
- Click to create rectangles
- Click to select rectangles
- Drag to move selected rectangles
- Visual indication of selected state (outline, handles, etc.)

**Acceptance Criteria:**
- [ ] Users can create rectangles with consistent behavior
- [ ] Rectangles can be selected with clear visual feedback
- [ ] Selected rectangles can be moved smoothly
- [ ] Rectangle positions update in real-time for all users

---

### 3. Real-Time Synchronization
**Priority:** Critical  
**Description:** All user actions broadcast and sync across clients in real-time

**Requirements:**
- Rectangle creation syncs to all users in real-time
- Rectangle movement syncs continuously during drag
- No visual glitches or "jumping" objects
- Handle simultaneous edits with last-write-wins strategy
- Queue updates during network interruption and sync on reconnect

**Acceptance Criteria:**
- [ ] User A creates a rectangle, User B sees it quickly
- [ ] User A drags a rectangle, User B sees smooth movement
- [ ] Two users can edit different rectangles simultaneously
- [ ] Last edit wins when two users edit the same rectangle
- [ ] Sync recovery works after temporary disconnection

---

### 4. Multiplayer Cursors
**Priority:** Critical  
**Description:** See other users' cursor positions with name labels

**Requirements:**
- Display cursor position for each connected user
- Show user name label near cursor (or on hover)
- Update cursor positions smoothly in real-time
- Different color per user for easy identification
- Hide cursor when user is inactive/disconnected

**Acceptance Criteria:**
- [ ] Each user sees all other active cursors
- [ ] Cursors move smoothly without lag
- [ ] User names are clearly visible
- [ ] Cursors disappear when users leave

---

### 5. Presence Awareness
**Priority:** Critical  
**Description:** Show who is currently online and editing

**Requirements:**
- Display list of active users (sidebar or header)
- Show user status (online/offline)
- Update presence in real-time when users join/leave
- Show user count at minimum
- Visual indicator of "who's here"

**Acceptance Criteria:**
- [ ] Users can see who else is online
- [ ] Presence updates immediately on join/leave
- [ ] Clear visual design for presence UI
- [ ] Accurate user count display

---

### 6. User Authentication
**Priority:** Critical  
**Description:** Users have accounts and identifiable names

**Requirements:**
- Simple authentication (email/password or social login)
- User profile with display name
- Session persistence (stay logged in)
- Secure authentication flow
- Username displayed in multiplayer cursors and presence

**Acceptance Criteria:**
- [ ] Users can create accounts
- [ ] Users can log in/out
- [ ] User identity persists across sessions
- [ ] Usernames appear in cursor labels

---

### 7. State Persistence
**Priority:** Critical  
**Description:** Canvas state survives disconnects and page refreshes

**Requirements:**
- Save canvas state to database on every change
- Load existing state on page load/reconnect
- Persist object properties (position, size, color, type)
- Handle concurrent updates without data loss
- Maintain state even if all users disconnect

**Acceptance Criteria:**
- [ ] User refreshes page, all objects remain
- [ ] All users leave and return, work is intact
- [ ] No data loss during rapid simultaneous edits
- [ ] State loads within 2 seconds on reconnect

---

### 8. Deployment
**Priority:** Critical  
**Description:** Publicly accessible application for testing

**Requirements:**
- Deployed to production environment
- Publicly accessible URL
- Support for 5+ concurrent users
- Stable and reliable uptime
- Acceptable load times (<3 seconds initial load)

**Acceptance Criteria:**
- [ ] Application accessible via public URL
- [ ] 5 users can connect simultaneously without issues
- [ ] No crashes under normal load
- [ ] Reasonable performance on standard hardware

---

## Data Model

### User
```
User {
  id: string (UUID)
  email: string
  displayName: string
  createdAt: timestamp
  lastActive: timestamp
}
```

### Canvas
```
Canvas {
  id: string (fixed: "shared")
  name: string ("Shared Canvas")
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Rectangle
```
Rectangle {
  id: string (UUID)
  type: "rectangle"
  x: number
  y: number
  width: number
  height: number
  rotation: number (default: 0)
  color: string (hex)
  
  // Metadata
  createdBy: string (User.id)
  createdAt: timestamp
  updatedAt: timestamp
  updatedBy: string (User.id)
}
```

### Presence
```
Presence {
  userId: string (User.id)
  displayName: string
  cursorX: number
  cursorY: number
  isActive: boolean
  lastSeen: timestamp
  color: string (hex, for cursor color)
}
```

### Session
```
Session {
  id: string
  userId: string (User.id)
  connectedAt: timestamp
  lastHeartbeat: timestamp
}
```

---

## Proposed Tech Stacks

### Option 1: Firebase Stack (Recommended)
**Components:**
- **Backend:** Firebase Firestore (real-time database) + Firebase Auth
- **Frontend:** React + Konva.js (canvas library)
- **Hosting:** Firebase Hosting
- **Real-time:** Firestore real-time listeners

**Pros:**
- ✅ Built-in real-time sync with Firestore listeners
- ✅ Authentication completely handled
- ✅ Minimal backend code required (serverless)
- ✅ Easy deployment and scaling
- ✅ Free tier supports MVP requirements
- ✅ Fast time-to-market (perfect for 24hr MVP)
- ✅ Automatic conflict resolution
- ✅ Built-in persistence

**Cons:**
- ❌ Firestore query limitations for complex operations
- ❌ Vendor lock-in to Google ecosystem
- ❌ Costs can scale unpredictably with usage
- ❌ Less control over data architecture

**Best For:** Rapid MVP development with minimal backend complexity

---

### Option 2: Supabase Stack
**Components:**
- **Backend:** Supabase (PostgreSQL) + Supabase Realtime
- **Frontend:** React + Konva.js
- **Hosting:** Vercel
- **Real-time:** Supabase Realtime (WebSocket-based)

**Pros:**
- ✅ Open-source alternative to Firebase
- ✅ PostgreSQL provides robust relational data model
- ✅ Real-time subscriptions via WebSockets
- ✅ Built-in auth and row-level security
- ✅ Better for complex queries than Firestore
- ✅ Self-hosting option available
- ✅ More predictable pricing

**Cons:**
- ❌ Slightly more setup than Firebase
- ❌ Real-time subscriptions have learning curve
- ❌ Requires understanding of PostgreSQL
- ❌ Less mature ecosystem than Firebase

**Best For:** Teams comfortable with SQL who want flexibility

---

### Option 3: Custom WebSocket Stack
**Components:**
- **Backend:** Node.js + Express + Socket.io + MongoDB/PostgreSQL
- **Frontend:** React + Konva.js
- **Hosting:** Backend on Render/Railway, Frontend on Vercel
- **Real-time:** Socket.io for WebSocket connections

**Pros:**
- ✅ Complete control over architecture
- ✅ Optimized real-time performance
- ✅ No vendor lock-in
- ✅ Can fine-tune sync logic precisely
- ✅ Better understanding of system internals
- ✅ Flexibility for custom features

**Cons:**
- ❌ Requires building auth from scratch
- ❌ Must implement persistence layer manually
- ❌ More code to write and maintain
- ❌ Scaling requires more DevOps work
- ❌ Slower time-to-market (risky for 24hr MVP)
- ❌ Must handle reconnection logic manually

**Best For:** Experienced teams prioritizing control and performance

---

### Option 4: Partykit Stack
**Components:**
- **Backend:** Partykit (multiplayer backend platform)
- **Frontend:** React + Konva.js
- **Hosting:** Partykit servers + Vercel frontend
- **Real-time:** Partykit's built-in WebSocket rooms

**Pros:**
- ✅ Built specifically for real-time multiplayer
- ✅ Handles presence and sync out of the box
- ✅ Room-based architecture perfect for canvases
- ✅ Excellent DX for collaborative apps
- ✅ Automatic scaling
- ✅ Low latency by design

**Cons:**
- ❌ Newer platform, smaller community
- ❌ Must integrate separate auth solution
- ❌ Less documentation than Firebase/Supabase
- ❌ Requires separate database for persistence
- ❌ Learning curve for Partykit patterns

**Best For:** Teams focused specifically on multiplayer experiences

---

## Recommended Stack: Firebase (Option 1)

**Rationale:**

For a 24-hour MVP, **Firebase** is the clear winner because:

1. **Speed to Market:** Firestore's real-time listeners eliminate the need to write sync logic manually. You can focus on canvas features instead of infrastructure.

2. **Zero Backend Code:** Authentication, database, and real-time sync are handled by Firebase SDKs. This means fewer moving parts and faster iteration.

3. **Proven for Multiplayer:** Firestore powers real-time collaborative apps at scale. Conflict resolution and offline support are built-in.

4. **Simple Deployment:** Firebase Hosting deploys with one command. No server management, no DevOps complexity.

5. **Free Tier Sufficient:** The Spark plan covers MVP requirements (5+ users, reasonable operations). Costs only matter if you scale significantly.

6. **De-risked MVP:** With Firebase, your biggest risk (real-time sync) is largely handled. You can focus on canvas UX and proving the concept.

**Alternative Consideration:**  
If your team is already experienced with WebSockets and wants maximum control, **Option 3 (Custom Stack)** could work, but it significantly increases the risk of missing the 24-hour MVP deadline.

For teams comfortable with SQL and wanting more flexibility post-MVP, **Option 2 (Supabase)** is a strong choice, but Firebase still wins for raw speed.

---

## Technical Architecture (Firebase Stack)

### Frontend
- **React** for UI components
- **Konva.js** for canvas rendering and object manipulation
- **Firebase SDK** for auth and Firestore access
- **Zustand or Context API** for local state management

### Backend
- **Firestore Collections:**
  - `users/` - user profiles
  - `canvas/` - shared canvas document
  - `canvas/shapes/` - subcollection for rectangles
  - `canvas/presence/` - real-time presence data

### Real-time Sync Flow
1. User performs action (create/move rectangle)
2. Update local state optimistically
3. Write to Firestore
4. Firestore broadcasts to all listeners
5. Other clients receive update and render

### Presence System
- Each client writes cursor position to `canvas/presence/{userId}`
- Use heartbeat + onbeforeunload to remove stale presence
- Listen to presence collection for live updates

---

## Performance Requirements

- **Frame Rate:** Maintain smooth performance during pan, zoom, and rectangle manipulation
- **Sync Responsiveness:** 
  - Rectangle changes sync smoothly across users
  - Cursor positions update in real-time
- **Capacity:**
  - Support many rectangles without performance drops
  - Support 5+ concurrent users without degradation
- **Load Time:** Initial canvas loads quickly

---

## Testing Scenarios

### Scenario 1: Basic Collaboration
1. User A and User B open canvas in separate browsers
2. User A creates a rectangle
3. Verify User B sees it quickly
4. User B moves the rectangle
5. Verify User A sees the movement in real-time

### Scenario 2: Persistence
1. User A creates 5 rectangles
2. User A refreshes browser
3. Verify all 5 rectangles reappear
4. User A and User B both close browsers
5. User A returns
6. Verify all rectangles still present

### Scenario 3: Concurrent Editing
1. User A and User B both create rectangles rapidly
2. Verify no rectangles are lost
3. User A and User B both move the same rectangle
4. Verify last edit wins without crashes

### Scenario 4: Presence & Cursors
1. User A joins canvas
2. User B joins canvas
3. Verify both see each other in presence list
4. User A moves cursor
5. Verify User B sees cursor movement with name label
6. User B disconnects
7. Verify User A sees User B leave presence list

---

## Out of Scope for MVP

The following are explicitly **NOT** included in the 24-hour MVP:

- Multiple shape types (rectangles only)
- Multiple canvases (single shared canvas only)
- Resize and rotate operations
- Multi-select and bulk operations
- Layer management (z-index control)
- Undo/redo
- Copy/paste/duplicate
- Color picker or style panel
- Export functionality
- Canvas sharing/permissions
- AI agent features
- Advanced shapes (polygons, arrows, etc.)
- Rich text editing
- Image uploads
- Comments or annotations

These features may be added in the 7-day final version, but MVP must focus exclusively on proving the collaborative infrastructure works.

---

## Success Metrics

The MVP is successful if:

- ✅ 2+ users can edit simultaneously in real-time
- ✅ Rectangle changes and cursor movements sync smoothly across users
- ✅ State persists across disconnects
- ✅ Application is deployed and publicly accessible
- ✅ Smooth performance maintained during all interactions
- ✅ Authentication works reliably
- ✅ Presence awareness is accurate

---

## Risks & Mitigation

### Risk 1: Real-time Sync Complexity
**Mitigation:** Use Firebase Firestore with built-in listeners to avoid building sync from scratch.

### Risk 2: Performance Degradation
**Mitigation:** Use Konva.js for efficient canvas rendering. Profile early and often. Limit MVP to rectangles only.

### Risk 3: Concurrent Edit Conflicts
**Mitigation:** Implement last-write-wins strategy. Document behavior clearly. Firestore handles this automatically.

### Risk 4: Deployment Issues
**Mitigation:** Use Firebase Hosting for one-command deployment. Test deployment early in the 24 hours.

### Risk 5: Scope Creep
**Mitigation:** Ruthlessly cut features. Only implement the 8 required MVP features. Save everything else for post-MVP.

---

## Development Milestones (24-Hour Timeline)

**Hours 0-6:** Foundation
- Set up Firebase project and authentication
- Create basic React app with Konva.js canvas
- Implement pan and zoom

**Hours 6-12:** Core Multiplayer
- Implement rectangle creation
- Add Firestore sync for rectangles
- Build multiplayer cursor system

**Hours 12-18:** Presence & Polish
- Add presence awareness UI
- Implement state persistence
- Test sync with multiple browsers

**Hours 18-24:** Testing & Deployment
- Basic testing and optimization
- Deploy to Firebase Hosting
- Final QA with 2+ users

---

## Conclusion

This PRD defines a focused, achievable MVP that proves the core value proposition: bulletproof real-time collaborative editing. By using Firebase and limiting scope to essential features, we maximize the chances of delivering a working, deployed product within 24 hours.

The MVP prioritizes infrastructure over features, establishing a solid foundation for future development.