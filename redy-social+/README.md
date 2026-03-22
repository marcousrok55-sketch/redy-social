# Redy Social 🦞

Professional Social Media Management Platform - Manage all your social media accounts from one place.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📅 **Content Calendar** - Visual scheduling with drag & drop
- 📊 **Analytics Dashboard** - Track followers, engagement, and growth
- 📬 **Unified Inbox** - All comments & messages in one place
- 🤖 **AI Content Assistant** - Generate and improve posts with AI
- 🔗 **Multi-Platform Support** - Instagram, Facebook, Twitter, LinkedIn, TikTok, YouTube
- 👥 **Team Collaboration** - Invite team members with roles
- 💳 **Subscription Management** - Stripe integration for billing

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Cache/Queue**: Redis + Bull
- **Real-time**: Socket.io

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: TanStack Query
- **Drag & Drop**: @dnd-kit
- **Charts**: ApexCharts
- **Editor**: Tiptap
- **Styling**: Tailwind CSS

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or Supabase)
- Redis (optional, for queues)

### Installation

1. **Clone and install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Configure environment:**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit .env with your database URL and API keys

# Frontend
cp frontend/.env.example frontend/.env
```

3. **Start the development servers:**

```bash
# Terminal 1 - Backend (port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

4. **Open browser:**
```
http://localhost:5173
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/redy_social
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Social Accounts
- `GET /api/accounts` - List connected accounts
- `POST /api/accounts/connect/:platform` - Connect platform
- `DELETE /api/accounts/:id` - Disconnect account

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Calendar
- `GET /api/calendar` - Get calendar view
- `PUT /api/calendar/:postId/move` - Reschedule post

### Analytics
- `GET /api/analytics/overview` - Overview stats
- `GET /api/analytics/:platform` - Platform-specific

### AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/improve` - Improve content

## Project Structure

```
redy-social/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Redis, Socket config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helpers
│   │   └── index.js         # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/       # API calls
│   │   ├── types/           # TypeScript types
│   │   ├── contexts/        # React contexts
│   │   └── App.tsx          # Root component
│   ├── package.json
│   └── vite.config.ts
├── SPEC.md                   # Technical specification
└── README.md
```

## Deployment

### Docker

```bash
# Build and run
docker-compose up -d
```

### Manual

1. Build frontend: `cd frontend && npm run build`
2. Serve static files from `frontend/dist`
3. Start backend: `cd backend && npm start`

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit your changes
4. Push to the branch
5. Create Pull Request

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using React, Node.js, and PostgreSQL
