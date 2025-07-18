# Tech Stack Overview

## Database System

### Firebase Firestore (Primary Database)
- **Type**: NoSQL Cloud Database
- **Location**: `backend/config/firebase.js`
- **Usage**: Stores users, documents, and collaboration data
- **Features**:
  - Real-time synchronization
  - Automatic scaling
  - Built-in security rules
  - Offline support

### Collections Structure
```javascript
// Users Collection
{
  email: string,
  name: string,
  password: string (bcrypt hashed),
  userId: string,
  createdAt: Date,
  updatedAt: Date
}

// Documents Collection
{
  title: string,
  content: string,
  isPublic: boolean,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date,
  collaborators: Array[string],
  permissions: Object,
  activeUsers: Array,
  lastActivity: Date
}
```

## Authentication System

### JWT (JSON Web Tokens) - Primary Auth
- **Location**: `backend/middleware/auth.js`
- **Features**:
  - Token-based authentication
  - 7-day expiration (configurable)
  - Bearer token authorization
  - Password hashing with bcrypt

### Firebase Authentication - Secondary
- **Location**: `backend/middleware/auth.js`
- **Features**:
  - ID token verification
  - Integration with Firebase Auth service
  - Fallback authentication method

## Real-time Communication

### Socket.IO (Primary)
- **Location**: `backend/server.js`, `frontend/src/hooks/useSocket.js`
- **Features**:
  - Document collaboration
  - Real-time content sync
  - User presence tracking
  - Auto-save functionality

### WebRTC (Peer-to-Peer)
- **Location**: `frontend/src/hooks/useWebRTC.js`
- **Features**:
  - Direct peer communication
  - Lower latency
  - Cursor position sharing
  - Data channels for content sync

## Frontend Framework

### React with Context API
- **Authentication**: `frontend/src/contexts/AuthContext.jsx`
- **Theme Management**: `frontend/src/contexts/ThemeContext.jsx`
- **Rich Text Editor**: TipTap + ProseMirror
- **Routing**: React Router DOM
- **State Management**: React Context + useState/useEffect

## Backend Framework

### Express.js
- **Web Framework**: RESTful API endpoints
- **Middleware**: Authentication, validation, error handling
- **Security**: Helmet, CORS, input validation
- **Logging**: Morgan for request logging

## Key Dependencies

### Backend
- `firebase-admin`: Firebase Admin SDK
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `socket.io`: Real-time communication
- `express`: Web framework
- `cors`: Cross-origin support
- `helmet`: Security headers

### Frontend
- `firebase`: Firebase client SDK
- `axios`: HTTP client
- `socket.io-client`: Socket.IO client
- `@tiptap/react`: Rich text editor
- `react-router-dom`: Client routing

## Security Features

### Authentication Security
- Password hashing (bcrypt, 10 salt rounds)
- JWT secret-based token signing
- Bearer token authorization
- Firebase ID token verification
- Automatic token expiration

### Data Security
- Input validation and sanitization
- Role-based access control
- Document permission system
- Public/private access control
- CORS configuration

### Real-time Security
- WebSocket authentication
- WebRTC peer verification
- Secure room management
- User presence validation

## Cloud Infrastructure

### Firebase Services Used
- **Firestore**: Primary database
- **Firebase Auth**: Optional authentication
- **Firebase Realtime Database**: Real-time features
- **Firebase Admin SDK**: Server-side operations

### Hosting & Deployment
- **Frontend**: Can be deployed to Firebase Hosting, Vercel, or Netlify
- **Backend**: Can be deployed to Firebase Functions, Heroku, or any Node.js host
- **Database**: Hosted on Google Cloud (Firebase)

## Performance Optimizations

### Frontend Optimizations
- Component memoization
- Debounced search (300ms)
- Throttled cursor updates (100ms)
- Lazy loading of components

### Backend Optimizations
- Pagination support
- Server-side filtering
- Connection pooling
- Caching headers

### Real-time Optimizations
- WebRTC for low-latency communication
- Socket.IO rooms for scalability
- Debounced auto-save (2 seconds)
- Optimistic UI updates

## Development vs Production

### Development
- Local environment variables
- Debug logging enabled
- Hot module replacement
- Development Firebase project

### Production
- Secure environment variables
- Production Firebase project
- Minified assets
- Performance monitoring
- Error tracking

This architecture provides a modern, scalable real-time collaborative document editing experience with robust security and performance features.