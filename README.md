# Thumbnail Tool 🎨

An AI-powered SaaS application for generating emotion-based YouTube thumbnails using Gemini AI.

## Features

- 📸 **Reference Image Upload** - Upload 10-20 images, AI selects the best 3-5
- 🧠 **Emotion-Based Concepts** - Generate 10 thumbnail ideas focused on viewer emotions
- ⚡ **Queue System** - Background processing for thumbnail generation
- 🎯 **Quality Options** - Fast ($0.05) or HD ($0.24) generation modes
- 📦 **Batch Download** - Download multiple thumbnails as ZIP
- 🔒 **Secure** - Row-Level Security (RLS) enabled on all tables

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase (Database + Storage + Auth), Vercel KV (Queue)
- **AI**: Gemini API (Vision Analysis + Concept Generation + Image Generation)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Gemini API key
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/osama0561/thumbnail-tool.git
cd thumbnail-tool
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
- Supabase URL and keys
- Gemini API key
- Vercel KV credentials (optional for local dev)

4. Setup Supabase database:

Run the migrations in order in your Supabase SQL Editor:
```sql
-- Run these files in order:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_storage_buckets.sql
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

- `user_profiles` - User accounts with quota tracking
- `uploaded_images` - Reference images with AI quality scores
- `thumbnail_concepts` - Generated concept ideas
- `generation_queue` - Background job queue
- `generated_thumbnails` - Final thumbnail outputs
- `usage_logs` - API cost tracking

## Project Structure

```
thumbnail-tool/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login/signup)
│   ├── dashboard/         # Protected app routes
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── upload/           # Image upload
│   ├── concepts/         # Concept generation
│   ├── generate/         # Queue & generation
│   └── gallery/          # Gallery & download
├── lib/                   # Utilities
│   ├── supabase/         # Supabase clients
│   ├── gemini/           # Gemini AI integration
│   ├── queue/            # Queue management
│   └── utils/            # Helper functions
├── types/                 # TypeScript types
└── supabase/             # Database migrations
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Enable Vercel KV database
5. Deploy!

### Environment Variables (Production)

Set these in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- Vercel KV credentials (auto-configured)

## Cost Optimization

Per user (optimized):
- Image analysis: ~$0.005
- Concept generation: ~$0.01
- Thumbnails (3x Fast mode): ~$0.15
- **Total: ~$0.165/user**

## Security

- ✅ Row-Level Security (RLS) enabled on all tables
- ✅ API keys stored server-side only
- ✅ File validation (server-side)
- ✅ User-specific storage folders
- ✅ Rate limiting with exponential backoff

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
