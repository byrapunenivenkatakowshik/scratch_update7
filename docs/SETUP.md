# Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- Bun package manager
- Firebase account

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the Firebase configuration with your actual values

4. Set up Firebase:
   - Create a new Firebase project
   - Enable Firestore Database
   - Generate a service account key
   - Add the service account credentials to your `.env` file

5. Start the development server:
   ```bash
   bun run dev
   ```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

The frontend will run on `http://localhost:5173`

## Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate new private key
6. Copy the credentials to your backend `.env` file

## Features Implemented

- ✅ User authentication (register/login with JWT)
- ✅ Document CRUD operations
- ✅ Rich text editor with Tiptap
- ✅ Responsive design with Tailwind CSS
- ✅ Protected routes
- ✅ Auto-save functionality

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/documents` - Create document
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get specific document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── firebase.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── documents.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EditorPage.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   └── package.json
└── README.md
```