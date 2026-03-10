# ConnectNow – Real-Time Video Calling & Chat Platform

ConnectNow is a modern, responsive, production-ready full-stack application built with React, Node.js, Express, MongoDB, and Socket.io. It supports live 1-on-1 chatting, file sharing, and robust WebRTC-based video calling.

## Features
- **Authentication**: JWT-based login and registration with bcrypt password hashing.
- **Real-Time Text Chat**: Instant messaging, read receipts, and typing indicators.
- **Video Calling**: High-quality 1-on-1 video and audio calls using WebRTC.
- **Screen Sharing**: Easily broadcast your screen during an active video call.
- **File Sharing**: Upload images and documents directly in chat.
- **User Management**: Add contacts, search users, and see online/offline presence.
- **Modern UI**: Dark/Light mode support, built with Tailwind CSS v4.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, React Router, Socket.io-client, Lucide React (Icons).
- **Backend**: Node.js, Express.js, Socket.io, Multer (File Uploads).
- **Database**: MongoDB (Mongoose ORM).

## Installation Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or MongoDB Atlas URL)

### 1. Clone & Install
git clone <your-repo-url>
cd ConnectNow

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install

### 2. Environment Variables
In the `backend/` directory, create a `.env` file or use the provided one:
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/connectnow
JWT_SECRET=super_secret_connectnow_jwt_secret_key
FRONTEND_URL=http://localhost:5173

*(Make sure MongoDB is running locally on port 27017, or replace `MONGO_URI` with your Atlas Connection String).*

### 3. Run the Application
Open two terminal windows:

Terminal 1 (Backend):
cd backend
npm run dev

Terminal 2 (Frontend):
cd frontend
npm run dev

Open `http://localhost:5173` in your browser.

## API Documentation
**Auth Routes** (`/api/auth`)
- `POST /register`: Registers a new user.
- `POST /login`: Authenticates user and returns JWT.
- `GET /me`: Gets the current authenticated user's profile.

**User Routes** (`/api/users`)
- `GET /search?q=`: Search users by name/email.
- `GET /contacts`: Get authenticated user's saved contacts.
- `POST /contacts`: Add a new contact (`contactId`).
- `PUT /avatar`: Upload an updated profile picture.

**Message Routes** (`/api/messages`)
- `GET /:userId`: Fetch message history between logged-in user and specified user.
- `POST /`: Send text or file message.
- `PUT /:userId/read`: Mark unread messages as read.

## Deployment Guide
### Backend (Render or Railway)
1. Push your code to GitHub.
2. In Render, create a new "Web Service" and link your repo.
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` to Environment Variables.

### Frontend (Vercel)
1. Push your code to GitHub.
2. In Vercel, create a new Project and link the repo.
3. Framework Preset: `Vite`
4. Root Directory: `frontend`
5. Vercel automatically runs `npm run build`.

### Database (MongoDB Atlas)
1. Create a free cluster on MongoDB Atlas.
2. Add a Database User and Network Access (Allow any IP `0.0.0.0/0`).
3. Copy the Connection String into the Render/Railway `MONGO_URI` environment variable.

## Future Improvements
- Group Chat functionality.
- End-to-end encryption for text messages.
- Advanced WebRTC configuration (TURN servers for restricted networks).
- Push notifications via Service Workers.
