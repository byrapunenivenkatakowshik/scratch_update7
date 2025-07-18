# Notion Clone - Real-Time Collaborative Document Editor

A full-stack web application inspired by Notion.com that enables real-time collaborative document editing.

## Features

- **User Authentication**: JWT-based authentication with Firebase integration
- **Real-time Collaboration**: WebRTC for peer-to-peer collaboration
- **Rich Text Editor**: Tiptap-based WYSIWYG editor with block-based editing
- **Document Management**: Create, edit, delete, and organize documents
- **Sharing & Permissions**: Share documents with role-based access control
- **Responsive Design**: Cross-browser compatible with light/dark themes

## Tech Stack

### Frontend
- React (Latest stable version)
- Tailwind CSS
- Tiptap (Rich text editor)
- WebRTC

### Backend
- Node.js with Express.js
- JWT for authentication
- Firebase Authentication
- Firebase Firestore
- Socket.io (fallback for WebRTC)

## Project Structure

```
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend
├── docs/             # Documentation
├── tests/            # Test files
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up Firebase configuration
4. Start the development servers

## Use Cases

1. Personal + shared note-taking
2. Collaborative documents
3. Classroom shared notes
4. Real-time updates

## Core Features Implementation

1. Authentication system
2. Tiptap rich text editor
3. WebRTC synchronization
4. Sidebar and editor layout
5. Document sharing and user invitations
6. Light and dark mode themes