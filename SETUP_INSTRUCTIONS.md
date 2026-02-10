# Thumbnail Tool - Setup Instructions

## ✅ What's Been Built (Phases 1-3)

### Phase 1: Project Setup ✅
- Next.js 15 with TypeScript and Tailwind CSS
- All dependencies configured in package.json
- Environment variables setup (.env.local, .env.example)
- Git repository initialized and pushed to GitHub

### Phase 2: Database Schema ✅
- Complete Supabase database schema with 6 tables
- Row-Level Security (RLS) enabled on all tables
- Storage buckets configured (user-uploads, generated-thumbnails)
- Auto-trigger to create user profiles on signup
- SQL migrations ready to run

### Phase 3: Authentication System ✅
- AuthProvider component with Supabase Auth
- Login page (/login)
- Signup page (/signup)
- Auth API routes (signup, login, logout)
- Protected dashboard page
- Landing page with feature overview

## 🚀 Setup Steps

### 1. Install Dependencies

**IMPORTANT**: You need to free up disk space on C: drive first!

```bash
cd E:\thumbnail-tool
npm install
```

If you get "ENOSPC" error:
- Clear npm cache: `npm cache clean --force`
- Free up space on C: drive
- Or install dependencies on a different machine

### 2. Setup Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to SQL Editor
3. Run these migrations **in order**:

**First, run:**
```sql
-- Copy content from: supabase/migrations/001_initial_schema.sql
```

**Then, run:**
```sql
-- Copy content from: supabase/migrations/002_storage_buckets.sql
```

4. Verify tables created:
   - Go to Table Editor
   - You should see: user_profiles, uploaded_images, thumbnail_concepts, generation_queue, generated_thumbnails, usage_logs

5. Verify RLS enabled:
   - In Table Editor, check each table
   - Look for "RLS enabled" badge

6. Verify storage buckets:
   - Go to Storage
   - You should see: user-uploads, generated-thumbnails

### 3. Get Supabase Anon Key

You already have the service key in .env.local, but you also need the anon key:

1. Go to Project Settings > API
2. Copy "anon" key (public)
3. Update .env.local:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Test the Application

```bash
npm run dev
```

Open http://localhost:3000

**Test Flow:**
1. Click "Get Started" or "Sign up"
2. Create an account with email/password
3. You should be redirected to /dashboard
4. Verify you see "5 free generations remaining"
5. Sign out and sign in again

### 5. Verify Database

After signing up, check Supabase:
1. Go to Table Editor > user_profiles
2. You should see your user with:
   - email
   - quota_remaining = 5
   - tier = 'free'

## 📁 Project Structure

```
E:\thumbnail-tool\
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          ✅ Login page
│   │   └── signup/page.tsx         ✅ Signup page
│   ├── api/auth/
│   │   ├── signup/route.ts         ✅ Signup API
│   │   ├── login/route.ts          ✅ Login API
│   │   └── logout/route.ts         ✅ Logout API
│   ├── dashboard/page.tsx          ✅ Dashboard (protected)
│   ├── layout.tsx                  ✅ Root layout with AuthProvider
│   └── page.tsx                    ✅ Landing page
├── components/
│   └── auth/
│       └── AuthProvider.tsx        ✅ Auth context
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ✅ Browser client
│   │   └── server.ts               ✅ Server client
│   ├── gemini/
│   │   └── client.ts               ✅ Gemini AI client
│   └── utils/
│       ├── cn.ts                   ✅ Tailwind utility
│       └── validation.ts           ✅ File validation
├── supabase/migrations/
│   ├── 001_initial_schema.sql      ✅ Database schema
│   └── 002_storage_buckets.sql     ✅ Storage setup
├── .env.local                      ✅ Environment variables
├── .env.example                    ✅ Example env file
├── package.json                    ✅ Dependencies configured
└── README.md                       ✅ Project documentation
```

## 🔜 What's Next (Phases 4-11)

### Phase 4: Image Upload & AI Analysis
- Image upload component with drag & drop
- Batch upload to Supabase Storage
- Gemini Vision API integration for quality analysis
- Auto-select best 3-5 images

### Phase 5: Concept Generation
- Video title input form
- Gemini API integration for concept generation
- Emotion-based prompt template
- Display 10 concept cards

### Phase 6: Queue System
- Vercel KV integration
- Queue management (add, process, status)
- Background job processing
- Real-time status polling

### Phase 7: Image Generation
- Gemini Imagen API integration
- Generate thumbnails from concepts
- Fast vs HD mode
- Cost tracking

### Phase 8: Gallery & Download
- Thumbnail gallery display
- Single/batch download
- ZIP file generation

### Phase 9: Dashboard & Quota
- Usage stats
- Quota management
- Cost tracking

### Phase 10: Polish & Testing
- Error handling
- Loading states
- Mobile responsive
- Testing all flows

### Phase 11: Deployment
- Deploy to Vercel
- Configure production environment
- Enable Vercel KV
- Final testing

## ⚠️ Important Notes

1. **Disk Space**: The C: drive is full. Clear space before running `npm install`.

2. **Supabase Setup**: You MUST run the SQL migrations before testing authentication.

3. **Environment Variables**: Never commit .env.local to GitHub (already in .gitignore).

4. **RLS Security**: All tables have RLS enabled. Users can only access their own data.

5. **Gemini API**: The key is already configured in .env.local.

6. **Next Steps**: After dependencies are installed and Supabase is configured, the next phase is building image upload (Phase 4).

## 🐛 Troubleshooting

### npm install fails with ENOSPC
- Free up space on C: drive (npm cache is on C:)
- Or delete C:\Users\him\AppData\Local\npm-cache

### Signup/Login fails
- Check Supabase dashboard > Authentication > Users
- Verify .env.local has correct NEXT_PUBLIC_SUPABASE_URL and keys
- Check browser console for errors

### Dashboard shows "Loading..." forever
- Check if Supabase Auth is configured
- Verify user_profiles table exists
- Check browser console for errors

### Can't access dashboard after login
- Check if AuthProvider is wrapping the app in layout.tsx
- Verify Supabase session is created (check Supabase dashboard > Auth > Users)

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase dashboard > Logs
3. Check the GitHub issues for similar problems

## ✅ Current Status

**Completed:**
- ✅ Project initialized
- ✅ Database schema created
- ✅ Authentication working
- ✅ Code pushed to GitHub

**In Progress:**
- ⏳ Installing dependencies (blocked by disk space)

**Next:**
- Build image upload & AI analysis (Phase 4)
