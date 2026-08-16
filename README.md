q# Project-FriDay

**Project Friday** is a sci-fi dark futuristic authentication system and secure data vault built with React.js, Node.js/Express, and local MongoDB.

## Features (Stage 1)
- **Sign In & Create Account**: Account creation supporting **Name**, **Email**, **Password**, and **Passkey**.
- **Level 2 Passkey Challenge**: Secondary security verification prompt requiring the user's secret passkey after initial email/password login.
- **Encrypted Vault Dashboard**: View profile details and system status upon successful Level 2 passkey authentication.
- **Local MongoDB**: Connection to local `mongodb://127.0.0.1:27017/project_friday` database using Mongoose.

## Getting Started

### Backend
```bash
cd server
npm install
npm start
```

### Frontend
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:3000` to access Project Friday!
