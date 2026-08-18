# CoBoard - Collaborative Realtime Kanban Board

CoBoard is a MERN-based task management system with instant synchronization. Designed as a premium glassmorphic application, it facilitates real-time Kanban column movements, collaborator presence, activity tracking typing indicators, and flexible board metadata filtering.

## Tech Stack

- **Frontend**: React (Vite), Socket.io Client, Zustand, Axios, Vanilla CSS (Design system), Lucide Icons.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io Server, JWT Auth, Bcrypt.

## Architecture Highlights

1. **Native HTML5 Drag and Drop**: Implemented without external dependency libraries. Highly responsive and allows complete styling overlays during drag states.
2. **Fractional Positioning System**: Task ordering positions are sorted dynamically by numerical floats (`position = (taskAbove + taskBelow) / 2`). This allows zero-cost column reorders without modifying surrounding records in MongoDB.
3. **Optimistic UI Updates**: Card drag-and-drops and details changes reflect instantly on the sender's client. Sockets trigger instant broadcasts, synchronizing other board viewers without full-screen page reloads.

## Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB running locally on `mongodb://127.0.0.1:27017/trello-clone` or a MongoDB Atlas URI.

### Steps

1. **Clone & Open Project Workspace**:
   ```bash
   cd trello-clone
   ```

2. **Setup Backend**:
   Navigate to the backend directory, install packages, verify or customize `.env` configurations:
   ```bash
   cd backend
   npm install
   ```
   *Your `.env` in `backend/.env` is set up with defaults. Customize `MONGO_URI` or `PORT` if needed.*

3. **Setup Frontend**:
   Navigate to the frontend directory, install packages, verify `.env` configuration:
   ```bash
   cd ../frontend
   npm install
   ```
   *Your `.env` in `frontend/.env` is configured to connect to `http://localhost:5000` by default.*

## Running the Application

### 1. Launch Backend Server
In the `backend/` directory:
```bash
npm run dev
```
The server will start on port `5000` and database connection state will log.

### 2. Launch Frontend Client
In the `frontend/` directory:
```bash
npm run dev
```
The Vite bundler will start and serve the client on `http://localhost:5173`.

## Testing Collaboration
Open two separate browser sessions (e.g. Chrome normal and Incognito, or Firefox and Chrome):
1. **User A**: Register and login. Create a new Board (e.g., "Sprint planning").
2. **User B**: Register and login.
3. **In User A's board**: Click **Invite**, search for User B (by username or email) and invite them to the board.
4. **User B**: The board will show in User B's dashboard list. Select the board.
5. **Verify**:
   - Both user avatars are shown with green online status indicators in the board header.
   - User A opens a task card, and focuses on text fields to type. User B will immediately see *"User A is typing..."*.
   - Drag task cards to other columns or reorder them. The transition synchronizes on both screens instantly.
