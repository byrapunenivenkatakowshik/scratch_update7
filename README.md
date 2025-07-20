# 🚀 Real-Time Collaborative Document Editor

A modern, feature-rich collaborative document editing platform built with React and Node.js. Think Notion meets Google Docs with real-time collaboration, comments, suggestions, and live user presence.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

### 🎯 Core Features
- ✅ **Real-Time Collaborative Editing** - Multiple users can edit simultaneously with live cursor tracking
- ✅ **Rich Text Editor** - TipTap-powered WYSIWYG editor with advanced formatting
- ✅ **Smart Comments** - Add, reply, and resolve comments on any text selection
- ✅ **Suggestion System** - Propose changes for review and approval
- ✅ **User Presence** - See who's online with live cursor and mouse positions
- ✅ **Document Management** - Create, organize, share, and manage documents
- ✅ **Secure Authentication** - JWT-based auth with bcrypt password hashing

### 🔧 Technical Features
- ⚡ **Real-Time Sync** - Socket.IO for instant updates across all users
- 🌐 **WebRTC Support** - Peer-to-peer backup communication
- 🎨 **Responsive Design** - Works seamlessly on desktop and mobile
- 🌙 **Theme Support** - Light and dark mode toggle
- 🔐 **Role-Based Access** - Owner, editor, and viewer permission levels
- 📱 **Progressive Web App** - Installable web application

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Backend       │◄──►│   Firebase      │
│   (React)       │    │   (Node.js)     │    │   (Firestore)   │
│   Port: 5173    │    │   Port: 5000    │    │   Cloud         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Socket.IO + WebRTC
           Real-time Collaboration
```

### Tech Stack
- **Frontend**: React 18, TipTap, Socket.IO Client, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, Socket.IO, JWT, bcryptjs
- **Database**: Firebase Firestore
- **Real-time**: Socket.IO + WebRTC fallback

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Firebase Account** - [Create here](https://console.firebase.google.com/)

### 📥 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/collaboration-tool.git
   cd collaboration-tool
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Install test dependencies**
   ```bash
   cd ../tests
   npm install
   ```

### 🔧 Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name (e.g., "collaboration-tool")
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In Firebase Console, click "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location closest to your users

3. **Enable Authentication**
   - Click "Authentication" in the sidebar
   - Go to "Sign-in method" tab
   - Enable "Email/Password" authentication

4. **Generate Service Account**
   - Click the gear icon ⚙️ → "Project settings"
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Download the JSON file
   - ⚠️ **Keep this file secure and never commit it to Git**

### 🌍 Environment Configuration

1. **Backend Environment Setup**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Configure Backend `.env`**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Firebase Configuration (from your service account JSON)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
   ```

   > 💡 **Tip**: Generate a secure JWT secret with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

3. **Frontend Configuration**
   - The frontend automatically connects to `http://localhost:5000` in development
   - For production, update `frontend/src/config/config.js`

### 🏃‍♂️ Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   ✅ You should see: "Server running on port 5000"

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   ✅ You should see: "Local: http://localhost:5173/"

3. **Access the Application**
   - Open your browser and go to [http://localhost:5173](http://localhost:5173)
   - Create an account or login
   - Start collaborating!

### 🧪 Running Tests

```bash
cd tests
npm test
```

This runs the complete test suite including:
- Authentication tests
- Document management tests
- Comment system tests

---

## 📁 Project Structure

```
collaboration-tool/
├── README.md                    # This file
├── backend/                     # Node.js backend
│   ├── config/                  # Firebase & configuration
│   │   ├── firebase.js          # Firebase Admin SDK setup
│   │   └── mockFirebase.js      # Mock Firebase for development
│   ├── middleware/              # Express middleware
│   │   └── auth.js              # JWT authentication middleware
│   ├── routes/                  # API route handlers
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── comments.js          # Comment system API
│   │   └── documents.js         # Document management API
│   ├── server.js                # Main server file
│   └── package.json             # Backend dependencies
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Editor.jsx       # TipTap rich text editor
│   │   │   ├── CommentSidebar.jsx # Comment management
│   │   │   ├── SuggestionSidebar.jsx # Suggestion system
│   │   │   └── ...              # Other components
│   │   ├── contexts/            # React contexts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   └── styles/              # CSS styles
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
├── docs/                        # Documentation
│   ├── API_DOCUMENTATION.md     # Complete API reference
│   ├── ARCHITECTURE.md          # System architecture details
│   ├── DEPLOYMENT_GUIDE.md      # Production deployment guide
│   └── ENHANCED_ARCHITECTURE.md # Detailed technical architecture
└── tests/                       # Test suite
    ├── auth.test.js             # Authentication tests
    ├── comments.test.js         # Comment system tests
    ├── documents.test.js        # Document management tests
    └── setup.js                 # Test configuration
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Documents
- `GET /api/documents` - List user's documents
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get specific document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Comments
- `GET /api/comments/document/:documentId` - Get document comments
- `POST /api/comments/document/:documentId` - Add new comment
- `PUT /api/comments/:commentId/resolve` - Resolve/unresolve comment

> 📖 **Full API Documentation**: See [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

---

## 🌐 Real-Time Features

### Socket.IO Events

**Client → Server**
- `join-document` - Join document editing session
- `content-change` - Send document content changes
- `cursor-position` - Send cursor position updates
- `comment-added` - Broadcast new comment

**Server → Client**
- `content-updated` - Receive content changes
- `user-joined` - User joined notification
- `comment-notification` - New comment notification

---

## 🛠️ Development

### Development Scripts

**Backend**
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-restart)
```

**Frontend**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Check code quality
```

### Code Style & Linting

The project includes ESLint configuration for consistent code style:
```bash
cd frontend
npm run lint       # Check for linting errors
```

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`, update API documentation
2. **Frontend**: Add components in `frontend/src/components/`, update styles
3. **Database**: Update Firestore collections, add proper indexes
4. **Tests**: Add tests in `tests/` directory

---

## 🚨 Troubleshooting

### Common Issues

**Backend won't start**
- ✅ Check if port 5000 is already in use
- ✅ Verify Firebase credentials in `.env`
- ✅ Ensure Firestore is enabled in Firebase Console

**Frontend can't connect to backend**
- ✅ Ensure backend is running on port 5000
- ✅ Check CORS settings in backend
- ✅ Verify API URL in frontend config

**Authentication not working**
- ✅ Check JWT_SECRET in `.env`
- ✅ Verify Firebase Auth is enabled
- ✅ Clear browser localStorage and try again

**Real-time features not working**
- ✅ Check Socket.IO connection in browser dev tools
- ✅ Verify both frontend and backend are running
- ✅ Check firewall settings

### Getting Help

- 📖 **Documentation**: Check the [docs/](./docs/) folder
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Discussions**: Use GitHub Discussions for questions

---

## 📚 Documentation

- [📖 API Documentation](./docs/API_DOCUMENTATION.md) - Complete API reference
- [🏗️ Architecture Guide](./docs/ARCHITECTURE.md) - System architecture overview
- [🚀 Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [🔧 Enhanced Architecture](./docs/ENHANCED_ARCHITECTURE.md) - Detailed technical architecture

---

