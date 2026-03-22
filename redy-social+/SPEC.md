# Social Media Manager SaaS - Technical Specification

## Project Overview
- **Project Name**: Redy Social - Professional Social Media Management Platform
- **Type**: Full-stack SaaS Web Application
- **Core Functionality**: Unified social media management platform with scheduling, analytics, AI content assistant, and unified inbox
- **Target Users**: Social media managers, marketing agencies, content creators, and businesses

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Cache/Queue**: Redis + Bull
- **Real-time**: Socket.io
- **Image Processing**: Sharp
- **Automation**: Puppeteer

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: TanStack Query
- **Drag & Drop**: @dnd-kit
- **Charts**: ApexCharts
- **Editor**: Tiptap
- **Styling**: Tailwind CSS

---

## UI/UX Specification

### Color Palette
- **Primary**: #6366F1 (Indigo)
- **Primary Dark**: #4F46E5
- **Secondary**: #10B981 (Emerald)
- **Accent**: #F59E0B (Amber)
- **Background**: #0F172A (Slate 900)
- **Surface**: #1E293B (Slate 800)
- **Surface Light**: #334155 (Slate 700)
- **Text Primary**: #F8FAFC (Slate 50)
- **Text Secondary**: #94A3B8 (Slate 400)
- **Error**: #EF4444 (Red)
- **Success**: #22C55E (Green)

### Typography
- **Font Family**: "Inter", system-ui, sans-serif
- **Headings**: 
  - H1: 32px, font-weight: 700
  - H2: 24px, font-weight: 600
  - H3: 20px, font-weight: 600
  - H4: 16px, font-weight: 600
- **Body**: 14px, font-weight: 400
- **Small**: 12px, font-weight: 400

### Layout Structure

#### Main Layout
- **Sidebar**: 260px fixed left, collapsible to 72px
- **Header**: 64px fixed top
- **Content**: Fluid, max-width 1440px centered

#### Responsive Breakpoints
- **Mobile**: < 640px (sidebar hidden, hamburger menu)
- **Tablet**: 640px - 1024px (collapsed sidebar)
- **Desktop**: > 1024px (full sidebar)

### Pages & Components

#### 1. Dashboard (Home)
- Stats cards row (4 cards): Total Followers, Engagement Rate, Posts This Month, Revenue
- Followers growth chart (line chart, 30 days)
- Upcoming posts list (next 5 scheduled)
- Quick actions: New Post, Connect Account, View Analytics

#### 2. Calendar/Scheduling
- Monthly calendar view with post indicators
- Week/Day toggle views
- Drag & drop posts between dates
- Sidebar: Draft posts, platform filters
- Quick add floating button

#### 3. Posts List
- Table view with columns: Preview, Platform, Content, Status, Date, Actions
- Filters: Platform, Status, Date Range
- Bulk actions: Delete, Reschedule, Duplicate

#### 4. Create/Edit Post Modal
- Multi-platform selector (checkboxes with icons)
- Content editor (Tiptap) with character count per platform
- Media upload zone (drag & drop)
- Preview tabs for each platform
- Schedule date/time picker
- AI Assistant button

#### 5. Analytics Dashboard
- Date range selector (7d, 30d, 90d, custom)
- Platform filter tabs
- Key metrics cards: Followers, Engagement, Reach, Impressions
- Growth charts (line)
- Top posts table
- Best times heatmap

#### 6. Unified Inbox
- Three-column layout: Conversations list | Message thread | Details
- Platform icons with color coding
- Status tabs: All, Unread, Starred, Pending
- Quick reply templates
- Reply composer with media support

#### 7. AI Content Assistant
- URL input for content extraction
- Tone selector: Professional, Casual, Friendly, Bold
- Platform-specific optimization
- Hashtag suggestions
- Translation to 10+ languages
- Regenerate/Improve buttons

#### 8. Revenue Analytics
- Platform-wise revenue cards
- Monthly revenue chart
- Revenue breakdown by source
- Export to PDF/Excel

#### 9. Settings
- Tabs: Profile, Team, Connected Accounts, Billing, API
- Connected accounts grid with connect/disconnect
- Team members table with role management

---

## Functionality Specification

### Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- Role-based access control (Super Admin, Owner, Editor, Viewer, Client)
- OAuth 2.0 for social platform connections

### Social Platform Integrations

#### Instagram
- Connect via Meta Graph API
- Features: Post, Story, Reel, Insights
- Metrics: Followers, Engagement, Reach, Impressions

#### Facebook
- Connect via Meta Graph API
- Features: Post, Story, Insights
- Metrics: Page likes, Engagement, Reach

#### Twitter/X
- Connect via Twitter API v2
- Features: Tweet, Thread, Media
- Metrics: Followers, Impressions, Engagements

#### LinkedIn
- Connect via LinkedIn Marketing API
- Features: Post, Article
- Metrics: Followers, Impressions, Clicks

#### TikTok
- Connect via TikTok for Business API
- Features: Video, Insights
- Metrics: Followers, Views, Likes, Shares

#### YouTube
- Connect via YouTube Data API + Analytics API
- Features: Video upload, Shorts
- Metrics: Subscribers, Views, Watch time, Revenue

### Post Scheduling
- Queue posts for future publication
- Time zone support
- Optimal time suggestions
- Draft saving
- Bulk scheduling via CSV

### Content Calendar
- Visual calendar with post previews
- Drag & drop rescheduling
- Color coding by platform
- Filter by platform/status/campaign

### Analytics
- Real-time data fetching
- Historical data comparison
- Custom date ranges
- Export functionality (PDF, CSV)
- Engagement rate calculations

### Unified Inbox
- Aggregate comments and messages
- Real-time notifications
- Quick reply templates
- Mark as read/star/flag

### AI Features
- Content generation from URLs
- Tone adjustment per platform
- Hashtag suggestions
- Translation
- Grammar/spell check

### Payments (Stripe)
- Subscription tiers: Free, Pro ($29), Agency ($99)
- Usage tracking
- Invoice history

---

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

### Accounts
- GET /api/accounts
- POST /api/accounts/connect/:platform
- DELETE /api/accounts/:id
- GET /api/accounts/:id/analytics

### Posts
- GET /api/posts
- POST /api/posts
- PUT /api/posts/:id
- DELETE /api/posts/:id
- POST /api/posts/bulk

### Calendar
- GET /api/calendar
- PUT /api/calendar/:postId/move

### Inbox
- GET /api/inbox
- POST /api/inbox/:id/reply
- PUT /api/inbox/:id/read

### Analytics
- GET /api/analytics/overview
- GET /api/analytics/:platform
- GET /api/analytics/competitors

### AI
- POST /api/ai/generate
- POST /api/ai/improve
- POST /api/ai/translate
- GET /api/ai/hashtags

### Billing
- GET /api/billing/subscription
- POST /api/billing/checkout
- POST /api/billing/webhook

---

## Database Schema

### Users
```sql
id, email, password_hash, name, avatar, role, created_at, updated_at
```

### Workspaces
```sql
id, name, owner_id, plan, created_at
```

### SocialAccounts
```sql
id, workspace_id, platform, platform_user_id, access_token, refresh_token, profile_data, connected_at
```

### Posts
```sql
id, workspace_id, account_id, content, media_urls, platform, type, status, scheduled_at, published_at, metrics
```

### TeamMembers
```sql
id, workspace_id, user_id, role, invited_at, joined_at
```

### InboxMessages
```sql
id, workspace_id, account_id, platform_message_id, type, content, from_user, is_read, is_starred, replied_at
```

---

## Acceptance Criteria

### Must Have (MVP)
- [ ] User can register and login
- [ ] User can connect at least 2 social platforms (Instagram, Facebook)
- [ ] User can create, schedule, edit, delete posts
- [ ] Calendar displays scheduled posts correctly
- [ ] Analytics shows basic metrics for connected accounts
- [ ] Dashboard shows key statistics

### Should Have
- [ ] Unified inbox for comments/messages
- [ ] AI content generation
- [ ] Team collaboration (add team members)
- [ ] Basic analytics charts

### Nice to Have
- [ ] All 6 platforms connected
- [ ] Revenue analytics
- [ ] Competitor tracking
- [ ] White-label option
- [ ] Mobile app

---

## Project Structure
```
/root/.openclaw/workspace/
├── SPEC.md                 # This file
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```
