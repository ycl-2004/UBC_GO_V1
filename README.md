# UBC PathFinder

Unofficial guide to getting in and graduating from UBC.

## 🚀 Overview

UBC PathFinder is a comprehensive tool to help students:
- **Calculate admission chances** with a sophisticated 4-layer evaluation model
- **Plan degree courses** with progress tracking
- **Find admission requirements** for all Canadian provinces
- **Navigate first-year** with detailed course guides

## ✨ Key Features

### 1. Admission Calculator ⭐⭐⭐
**Location**: `/ApplyInfo`

**Main Features:**
- 4-layer evaluation model for admission probability calculation
- Supports 20 UBC degree programs
- Real-time calculation (updates as you type)
- Detailed score breakdown and analysis
- Personalized improvement suggestions

**Input Parameters:**
- GPA/Average score
- Course difficulty
- Applicant type
- Grade trends
- Course completion status
- Core subject scores
- Extracurricular activity ratings
- Leadership ratings
- Volunteer service ratings
- Activity relevance
- Role depth
- Supplemental material scores

**Output Results:**
- Admission probability percentage
- Safety/Match/Reach classification
- Score breakdown
- Detailed recommendations
- Warnings and reminders

### 2. Degree Planner ⭐⭐
**Location**: `/planner`

**Main Features:**
- Multi-plan management (up to 3 plans)
- Course status tracking
- Progress visualization
- Credit calculation
- Course detail viewing

**Supported Majors:**
- 13 engineering majors with complete curriculum
- Arts faculty support

**Course Management:**
- Add/remove courses
- Status switching (Not Started/Planned/Completed)
- Course detail modal
- UBCGrades links

### 3. Requirements Finder ⭐
**Location**: `/ApplyInfo` (top of page)

**Main Features:**
- 3-step process to find requirements
- Supports 13 Canadian provinces
- Supports 20 degree programs
- Detailed requirement display
- Official resource links

**Process:**
1. Select province
2. Select degree
3. View requirements

### 4. First Year Guide ⭐
**Location**: `/first-year-guide`

**Main Features:**
- Standard first-year engineering course list
- Major prerequisite requirements
- Chain reaction course display

**Support:**
- Applied Science faculty
- 13 engineering majors

## 📊 Data Coverage

- ✅ **13 Canadian Provinces/Territories** - Complete coverage
- ✅ **20 UBC Degree Programs** - Full support
- ✅ **13 Engineering Majors** - Complete curriculum data
- ✅ **First Year Courses** - Standard curriculum and prerequisites

## 📂 File Guide

### Key Files and Their Purposes

| File/Directory | Purpose |
|----------------|---------|
| `src/components/` | Reusable React components |
| `src/pages/` | Page components |
| `src/context/AuthContext.jsx` | Authentication context |
| `src/hooks/` | Custom React hooks |
| `src/data/` | Static data files (requirements, curriculum) |
| `src/utils/` | Utility functions |
| `scraper/` | Web scraping scripts for UBC data |
| `scripts/` | Build and utility scripts |
| `Summary/` | Organized project documentation |

## 🛠️ How to Use

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Backend**: Supabase (Database + Authentication)
- **Styling**: CSS3 (Custom design system)
- **Monitoring**: Sentry
- **Deployment**: GitHub Pages

## 📁 Project Structure

```
UBC_GO_V1/
├── src/                    # Source code
│   ├── components/        # Reusable React components
│   ├── pages/             # Page components
│   ├── context/           # React context (Auth)
│   ├── hooks/             # Custom React hooks
│   ├── data/              # Static data files
│   └── utils/             # Utility functions
├── scraper/               # Web scraping scripts
├── scripts/               # Build and utility scripts
├── docs/                  # Additional documentation
│   └── planning/         # Planning documents
├── Summary/               # Organized project documentation
├── dist/                  # Build output
└── README.md              # This file
```

## 🔧 Setup Guides

### Supabase Setup

#### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

#### Step 2: Create Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://zrddkbqkuqrwukokaooc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_CaLVFrOLnK-SoPj-o7mZYg_2Aq5J1Jn
```

**Important**: `.env.local` should be in `.gitignore` and not committed to Git!

#### Step 3: Execute SQL Schema

1. Log in to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left menu
4. Open `supabase_schema.sql` file
5. Copy all content and paste into SQL Editor
6. Click **Run**

This creates:
- `profiles` table: Stores user profiles
- `degree_plans` table: Stores degree plans
- `course_status` table: Stores course completion status
- Row Level Security (RLS) policies: Ensures users can only access their own data
- Automatic triggers: Creates profile automatically when new user registers

#### Step 4: Test Connection

1. Start dev server: `npm run dev`
2. Visit `/login` page
3. Register a new account
4. Check Supabase Dashboard > **Authentication** > **Users** to confirm user created
5. Check **Table Editor** > **profiles** to confirm profile auto-created

#### Database Structure

**profiles table:**
- `id` (UUID, primary key, linked to auth.users)
- `full_name` (TEXT)
- `email` (TEXT)
- `faculty` (TEXT)
- `major` (TEXT)
- `year_level` (TEXT)
- `target_graduation_year` (TEXT)
- `student_number` (TEXT)
- `date_of_birth` (DATE)

**degree_plans table:**
- `id` (UUID, primary key)
- `user_id` (UUID, linked to profiles.id)
- `plan_name` (TEXT)
- `faculty` (TEXT)
- `major` (TEXT)
- `course_data` (JSONB) - Stores course list

**course_status table:**
- `id` (UUID, primary key)
- `user_id` (UUID, linked to profiles.id)
- `faculty` (TEXT)
- `major` (TEXT)
- `course_code` (TEXT)
- `status` (TEXT: 'not-started', 'in-progress', 'completed')

#### Security Features

- **Row Level Security (RLS)**: All tables have RLS enabled, users can only access their own data
- **Automatic Profile Creation**: Profile record created automatically when new user registers
- **Automatic Timestamps**: `created_at` and `updated_at` managed automatically

### Email Confirmation Configuration

#### Problem

By default, Supabase requires new users to confirm email before login, causing:
- Registration succeeds
- But login shows "Invalid login credentials" error

#### Solution Options

**Option 1: Disable Email Confirmation (Recommended for Development/Testing)**

1. Log in to Supabase Dashboard
2. Go to **Authentication** > **Providers** > **Email**
3. Find **"Confirm email"** option
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

New users can now login immediately without email confirmation.

**Option 2: Keep Email Confirmation (Recommended for Production)**

If email confirmation is enabled:
1. User receives confirmation email after registration
2. Click confirmation link in email
3. Then can login

**Note**: Confirmation email may be in spam folder.

**Option 3: Use Magic Link (Passwordless Login)**

Consider implementing Magic Link login where users only enter email and receive login link.

#### Check Current Settings

In Supabase Dashboard:
- **Authentication** > **Providers** > **Email**
- Check if "Confirm email" is enabled

#### Production Recommendations

- **Development**: Disable email confirmation for quick testing
- **Production**: Enable email confirmation for better security

### AI Integration Setup

#### Overview

This project integrates ChatAnywhere API (OpenAI Standard Protocol) to provide intelligent scenario comparison analysis. The system prioritizes AI analysis, and automatically falls back to weight-based estimation if API calls fail.

ChatAnywhere is an optimized API service that supports direct connection from China/overseas without VPN/proxy.

#### Setup Steps

**1. Create Environment Variables File**

Create `.env.local` in project root (this file is in `.gitignore` and won't be committed):

```bash
# .env.local
VITE_CHATANYWHERE_API_KEY=your_API_key
# VITE_CHATANYWHERE_BASE_URL is optional, usually not needed
# Development automatically uses Vite proxy, production uses default endpoint
```

**Important Notes:**
- `VITE_CHATANYWHERE_API_KEY` is required
- `VITE_CHATANYWHERE_BASE_URL` is optional, usually not needed
  - Development: Automatically uses Vite proxy (`/api-proxy/v1/chat/completions`)
  - Production: Uses default endpoint (`https://api.chatanywhere.org/v1/chat/completions`)
- Do not commit API keys to Git
- `.env.local` is in `.gitignore`
- If API key is not set, system automatically uses estimation analysis

**2. Get ChatAnywhere API Key**

1. Visit ChatAnywhere website to get API key
2. Copy key to `.env.local` file's `VITE_CHATANYWHERE_API_KEY`

**3. Vite Proxy Configuration (Already Configured)**

Project has Vite dev server proxy configured in `vite.config.js` to solve CORS issues:

```javascript
server: {
  proxy: {
    '/api-proxy': {
      target: 'https://api.chatanywhere.org',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      secure: true,
    }
  }
}
```

**How it works:**
- Development: Frontend requests `/api-proxy/v1/chat/completions`
- Vite server automatically forwards to `https://api.chatanywhere.org/v1/chat/completions`
- Avoids browser CORS restrictions

**4. Restart Dev Server**

If dev server is running, restart to load new environment variables and proxy config:

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

#### Functionality

**AI Analysis Mode**

When API key is correctly configured and API call succeeds:
- Shows blue label: "🤖 AI Precise Analysis (ChatAnywhere)"
- Uses GPT-4o-mini model for deep analysis
- Provides more accurate primary driver identification
- Generates personalized improvement suggestions

**Estimation Analysis Mode (Fallback)**

System automatically switches to estimation analysis when:
- API key not set
- API call fails (network issues, key expired, rate limit, etc.)
- API returns invalid data
- Daily request limit reached (200 requests/day)

Shows gray label: "📊 Smart Estimation"

#### Technical Implementation

**File Structure:**

```
src/
├── services/
│   └── aiAnalysisService.js    # AI service layer (uses fetch to call ChatAnywhere API)
├── utils/
│   └── scenarioComparison.js    # Analysis logic (supports AI and fallback)
└── components/
    └── ScenarioComparator.jsx   # UI component (displays analysis mode)
```

**Workflow:**

1. **Try AI Analysis First**
   - Check if API key exists
   - Call `getAIComparison()` function
   - Use fetch to send POST request to ChatAnywhere API
   - Format scenario data and send to GPT-4o-mini
   - Parse AI returned JSON result

2. **Automatic Fallback**
   - If AI call fails, automatically use `identifyPrimaryDriver()` estimation logic
   - Ensures user experience is not affected

3. **UI Status Display**
   - Display different labels based on analysis mode
   - Loading state display
   - Error handling

#### API Usage

**API Endpoints:**
- **Production**: `https://api.chatanywhere.org/v1/chat/completions`
- **Development**: `/api-proxy/v1/chat/completions` (via Vite proxy)
- **Protocol**: OpenAI Standard Protocol
- **Authentication**: Bearer Token (in Authorization header)

**Environment Auto-Detection:**
- Development (`npm run dev`): Automatically uses Vite proxy, avoids CORS issues
- Production (`npm run build`): Uses direct API call (needs backend proxy to protect API key)

**Model Selection:**
- **Primary Model**: `gpt-4o-mini` (200 requests/day)
- **Alternative Model**: `deepseek-v3` (if higher limit needed)

**Important**: 
- Do not use `gpt-4o` or `gpt-5`, they only have 5 requests/day limit
- `gpt-4o-mini` provides 200 requests/day free quota, suitable for development and use

#### Troubleshooting

**Problem: AI Analysis Not Working**

1. **Check API Key**
   - Confirm `.env.local` file exists
   - Confirm `VITE_CHATANYWHERE_API_KEY` is set
   - Confirm key format is correct (no extra spaces)

2. **Check CORS Errors (Development)**
   - If seeing CORS errors, confirm Vite dev server is running
   - Confirm `vite.config.js` has proxy configured
   - Development should use proxy path `/api-proxy/v1/chat/completions`, not direct external API call
   - If still issues, restart dev server

3. **Check Network Connection**
   - Confirm can access `https://api.chatanywhere.org`
   - ChatAnywhere optimizes connection from China/overseas, usually no VPN needed
   - If connection fails, check firewall settings

4. **Check API Status**
   - Visit [status.chatanywhere.org](https://status.chatanywhere.org) to check service status
   - Confirm API service is running normally

5. **Check Request Limits**
   - Free key has 200 requests/day limit
   - If limit reached, returns 429 error
   - Wait for next day reset or use other API key

6. **Check Browser Console**
   - Open Developer Tools (F12)
   - Check Console tab for error messages
   - Check Network tab for API request status

**Problem: Always Shows "Smart Estimation"**

- Check if `.env.local` file is correctly created
- Confirm environment variable name is `VITE_CHATANYWHERE_API_KEY` (not `CHATANYWHERE_API_KEY`)
- Restart dev server
- Check browser console for error messages
- Confirm API key is valid and not expired

**Problem: 429 Error (Rate Limit)**

- Free key has 200 requests/day limit
- If frequently refreshing page or testing, may quickly reach limit
- Solutions:
  - Wait for next day reset
  - Use multiple API keys rotation
  - Reduce unnecessary API calls

**Problem: CORS Errors**

**Development:**
- Confirm using Vite dev server (`npm run dev`)
- Confirm `vite.config.js` has proxy configured
- Code automatically uses proxy path, no manual modification needed
- If still CORS errors, restart dev server

**Production:**
- Vite proxy only works in development
- Production needs backend proxy to protect API key
- See "Production Deployment" section below

#### Security Notes

1. **Do Not Commit API Keys to Git**
   - `.env.local` is in `.gitignore`
   - Do not hardcode keys in code
   - Do not share API keys publicly

2. **Production Deployment**

   **Important**: Vite proxy only works in development. Production needs backend proxy to protect API key.

   **Option A: Use Backend Proxy (Recommended)**
   
   Create server-side proxy to hide API key:
   
   - **Vercel**: Use Serverless Functions
   - **Netlify**: Use Netlify Functions
   - **Cloudflare**: Use Cloudflare Workers
   - **Custom Server**: Node.js/Express backend
   
   **Example Vercel Serverless Function** (`api/chatanywhere.js`):
   ```javascript
   export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' })
     }
     
     const response = await fetch('https://api.chatanywhere.org/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.CHATANYWHERE_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(req.body),
     })
     
     const data = await response.json()
     res.status(response.status).json(data)
   }
   ```
   
   Then update frontend code to call `/api/chatanywhere` instead of direct external API.
   
   **Option B: Direct Call (Not Recommended)**
   
   If must call from browser:
   - Use environment variable management tools (like Vercel, Netlify environment variable settings)
   - **Warning**: API key will be exposed in client code, anyone can view and use
   - Only suitable for testing or internal tools, not for public websites

3. **API Key Rotation**
   - Regularly check API usage
   - If key leaked, immediately revoke and create new key

#### Cost Information

ChatAnywhere API provides free quota:
- **gpt-4o-mini**: 200 requests/day (free)
- **gpt-4o / gpt-5**: 5 requests/day (free, not recommended)
- After limit exceeded, need to wait for next day reset or use paid plan

**Recommendations:**
- Use `gpt-4o-mini` model for higher request limit
- Monitor API usage, avoid frequent refreshes causing limit
- Pay attention to request frequency during development

#### Advantages

1. **No VPN Needed**: ChatAnywhere optimizes connection from China/overseas, no proxy needed
2. **OpenAI Compatible**: Uses standard OpenAI API protocol, easy to integrate
3. **Stable and Reliable**: Provides status monitoring page, easy to check service status
4. **Reasonable Limits**: Free tier provides 200 requests/day limit, suitable for development and small-scale use

### GitHub Pages Deployment

#### Set GitHub Secrets

Before pushing code, you need to add Secrets in GitHub Repository Settings:

1. Go to your GitHub Repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add the following two secrets:

**Secret 1: VITE_SUPABASE_URL**
- Name: `VITE_SUPABASE_URL`
- Value: `https://zrddkbqkuqrwukokaooc.supabase.co`

**Secret 2: VITE_SUPABASE_ANON_KEY**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `sb_publishable_CaLVFrOLnK-SoPj-o7mZYg_2Aq5J1Jn`

#### Enable GitHub Pages

1. Go to Repository **Settings** > **Pages**
2. In **Source** dropdown, select **GitHub Actions**
3. Save settings

#### Deployment Process

When you push code to `main` or `master` branch:

1. GitHub Actions automatically triggers build
2. Build process uses your set Secrets to inject environment variables
3. After build completes, automatically deploys to GitHub Pages

#### Verify Deployment

After deployment completes, you can:
1. Check build status in Repository's **Actions** tab
2. Visit your GitHub Pages URL (usually `https://[username].github.io/UBC_GO_V1/`)
3. Check browser console to confirm Supabase connection is normal

#### Security Checklist

✅ `.gitignore` includes all `.env*` files
✅ GitHub Actions workflow uses Secrets instead of hardcoded values
✅ Environment variables use `VITE_` prefix (Vite requirement)
✅ Local `.env.local` file will not be committed

#### Troubleshooting

**Build Failed: Missing environment variables**
- Confirm Secrets are correctly set
- Confirm Secret names exactly match those in workflow file

**Build Succeeds But App Cannot Connect to Supabase**
- Check browser console for error messages
- Confirm URL and Key in Secrets are correct
- Confirm Supabase project settings allow your GitHub Pages domain access

## 🔧 Troubleshooting

### Environment Variable Issues

#### Current Error
```
Uncaught Error: Missing Supabase environment variables. Please check your .env.local file.
```

#### Check Steps

**1. Confirm GitHub Secrets Settings**

Go to: Repository → Settings → Secrets and variables → Actions → **Secrets** tab

Must have these two Secrets (Note: Secrets, not Variables):
- ✅ `VITE_SUPABASE_URL` = `https://zrddkbqkuqrwukokaooc.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `sb_publishable_CaLVFrOLnK-SoPj-o7mZYg_2Aq5J1Jn`

**Important:**
- Secret names must exactly match (case-sensitive)
- Must be in **Secrets** tab, not Variables
- Delete any unnecessary secrets (like `NEXT_PUBLIC_SUPABASE_URL`)

**2. Check GitHub Actions Build Logs**

1. Go to Repository → **Actions** tab
2. Click latest workflow run
3. Expand "Verify environment variables" step
4. Should see:
   ```
   ✓ Environment variables are set correctly
     VITE_SUPABASE_URL: https://zrddkbqkuqrwukokaooc...
     VITE_SUPABASE_ANON_KEY: sb_publishable_CaLVFrOLnK...
   ```

If seeing errors, Secrets are not correctly set.

**3. Re-trigger Build**

If Secrets are correctly set but build still fails:

1. Go to Actions tab
2. Click "Deploy to GitHub Pages" workflow on left
3. Click "Run workflow" button on top right
4. Select branch (usually `main`)
5. Click "Run workflow"

**4. Verify Build Output**

In build log's "Build with Vite" step, should see:
```
Building with environment variables...
VITE_SUPABASE_URL length: 45
VITE_SUPABASE_ANON_KEY length: 51
```

If length is 0, environment variables were not correctly passed.

#### Common Questions

**Q: Secrets set but build still fails**
A: 
1. Confirm Secret names exactly match (no extra spaces)
2. Confirm values are correct (no extra quotes)
3. Delete and recreate Secrets
4. Re-trigger build

**Q: Local development works, but production fails**
A: 
- Local uses `.env.local` file
- Production uses GitHub Secrets
- Confirm variable names match (both use `VITE_` prefix)

**Q: Build succeeds but website still errors**
A:
- Clear browser cache
- Check if build artifacts include environment variables (should be embedded in code by Vite)
- Confirm deploying latest build

#### Quick Fix

If all steps confirmed correct, try:

1. **Delete and Recreate Secrets**:
   - Delete existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Recreate, ensure names and values are exactly correct

2. **Manually Trigger Build**:
   - Actions → Deploy to GitHub Pages → Run workflow

3. **Check Build Logs**:
   - View "Verify environment variables" step output
   - View "Build with Vite" step output

### Supabase Connection Issues

**Error: Missing Supabase environment variables**
- Confirm `.env.local` file exists and contains correct variables
- Restart dev server (Vite needs restart to read new environment variables)

**Error: relation "profiles" does not exist**
- Confirm you've executed `supabase_schema.sql` in Supabase SQL Editor

**Login Fails**
- Check Supabase Dashboard > Authentication > Users to confirm user exists
- Confirm password is correct (Supabase requires at least 6 characters)

## ⚠️ Security Notice

### API Key Exposure Issue

#### Problem Discovery

Found `.env.local` file was previously committed in Git history, containing:
- Gemini API key
- Supabase keys

#### Actions Taken

1. ✅ Removed `.env.local` from Git tracking
2. ✅ `.gitignore` correctly configured, includes all `.env*` files
3. ✅ Code has no hardcoded API keys (uses environment variables)

#### Immediate Actions Required

### 1. Revoke and Replace API Keys (Important!)

Since API keys were exposed in Git history, **must immediately revoke and replace**:

**Gemini API Key**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Find exposed API key (was exposed in Git history)
3. **Immediately delete/revoke this key**
4. Create new API key
5. Update new key in `.env.local` file

**Supabase Keys**
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to Project Settings → API Settings
3. **Revoke exposed anon key** (if security concern)
4. Generate new anon key (if needed)
5. Update `.env.local` file

### 2. Clean Git History (Optional but Recommended)

If repository is private, can:
- Keep current state (keys removed from current version)
- Or rewrite Git history (requires force push, affects all collaborators)

If repository is public, **strongly recommend**:
- Revoke all exposed keys
- Consider creating new repository (if history contains sensitive information)

### 3. Commit Changes

```bash
git add .gitignore
git commit -m "Remove .env.local from Git tracking"
git push
```

#### Prevention Measures

**✅ Already Implemented**
- `.gitignore` includes all `.env*` files
- Code uses environment variables, no hardcoded keys

**📋 Best Practices**
1. **Never commit `.env` files**
2. **Use `.env.example` as template** (no real keys)
3. **Regularly check Git status**: `git status` to ensure no accidental sensitive file additions
4. **Use Git hooks** to prevent accidental sensitive file commits

#### Checklist

- [ ] Revoke exposed Gemini API key
- [ ] Create new Gemini API key
- [ ] Update `.env.local` file
- [ ] Revoke/replace Supabase keys (if needed)
- [ ] Commit Git changes (remove `.env.local`)
- [ ] Test new keys work correctly

#### Current Status

- ✅ `.env.local` removed from Git tracking
- ✅ `.gitignore` correctly configured
- ⚠️ **Need to revoke and replace API keys**

## ✅ Verification Status

### UBC Admission Requirements Verification Report

**Date**: December 18, 2024
**Status**: ✅ **COMPREHENSIVE VERIFICATION COMPLETE**

#### Executive Summary

All 13 Canadian provinces and 20 majors have been systematically checked and verified against the UBC official website. A total of **496 province-specific course code mappings** have been applied successfully.

#### What Was Done

**1. Fixed BC Course Code Mapping Issues**
- **Problem**: Original scraped data contained BC-specific course codes (e.g., "English Studies 12", "Pre-Calculus 12") that weren't being mapped to province-specific equivalents
- **Solution**: 
  - Added BC course code mappings to all 12 other provinces
  - Added Grade 11 course mappings (Chemistry 11, Biology 11, Physics 11)
  - Added Grade 11 Math (Pre-Calculus stream) mappings
- **Result**: All provinces now display their correct province-specific course codes

**2. Fixed Specific Issues**

**Alberta:**
- ✅ Fixed Food and Resource Economics: Removed duplicate "Math 31 (5 credits)"
- ✅ Fixed Indigenous Land Stewardship: Grade 11 Math mapped to "Math 20-1"
- ✅ All 20 majors verified

**British Columbia:**
- ✅ Added special note for Arts: "If you intend to major in Economics, you must complete Pre-Calculus 12"
- ✅ All 20 majors verified

**All Other Provinces:**
- ✅ Manitoba: All 20 majors verified
- ✅ New Brunswick: All 20 majors verified
- ✅ Newfoundland and Labrador: All 20 majors verified
- ✅ Northwest Territories: All 20 majors verified
- ✅ Nova Scotia: All 20 majors verified
- ✅ Nunavut: All 20 majors verified
- ✅ Ontario: All 20 majors verified
- ✅ Prince Edward Island: All 20 majors verified
- ✅ Quebec: All 20 majors verified (CEGEP system maintained)
- ✅ Saskatchewan: All 20 majors verified
- ✅ Yukon: All 20 majors verified

#### Course Code Mappings Applied

**Examples of Province-Specific Mappings:**

**English 12:**
- Alberta: English Language Arts 30-1, English Language Arts 30-2
- Ontario: ENG4U (English)
- Saskatchewan: English Language Arts A30, English Language Arts B30
- Quebec: A CEGEP DEC (preserved generic format for CEGEP system)

**Math 12:**
- Alberta: Math 30-1, Math 31 (5 credits)
- Ontario: MHF4U (Advanced Functions), MCV4U (Calculus and Vectors)
- Manitoba: Pre-Calculus Mathematics 40S
- Nova Scotia: Pre-Calculus 12

**Grade 11 Sciences:**
- Alberta: Chemistry 20, Biology 20, Physics 20
- Ontario: SCH3U (Chemistry), SBI3U (Biology), SPH3U (Physics)
- Manitoba: Chemistry 30S, Biology 30S, Physics 30S

#### Verification Methods

1. **Automated Mapping Scripts**:
   - `add_bc_course_mappings.py`: Added BC course code mappings
   - `add_grade11_math_mapping.py`: Added Grade 11 Math mappings
   - `add_grade11_course_mappings.py`: Added Grade 11 science course mappings
   - `apply_province_mappings.py`: Applied all mappings to data

2. **Verification Script**:
   - `verify_all_requirements.py`: Checks for unmapped BC codes and generic formats
   - Validates all 260 degree programs (13 provinces × 20 majors)

3. **Manual Verification**:
   - Cross-referenced with UBC official admission requirements page
   - Verified format consistency with website examples

#### Data Integrity

- ✅ JSON structure validated
- ✅ All provinces have complete data
- ✅ All 20 majors present in each province
- ✅ Grade 11 and Grade 12 requirements properly separated
- ✅ Special notes and additional info preserved

#### Files Modified

1. `/scraper/province_course_mappings.json` - Updated with comprehensive mappings
2. `/src/data/detailed_requirements_enhanced.json` - Applied province-specific codes
3. `/scraper/data/vancouver_detailed_requirements_enhanced.json` - Source data updated

#### Statistics

- **Provinces**: 13 ✓
- **Majors per Province**: 20 ✓
- **Total Degree Programs Checked**: 260 ✓
- **Province-Specific Mappings Applied**: 496 ✓
- **Known Issues Remaining**: 0 ✓

#### How to Re-verify

If you need to re-verify the data in the future:

```bash
cd scraper
python3 verify_all_requirements.py
```

Expected output: "✅ ALL REQUIREMENTS ARE CORRECTLY FORMATTED!"

#### Next Steps

The data is now production-ready and accurately reflects UBC's official admission requirements for all Canadian provinces and territories.

To update requirements in the future:
1. Run scraper to get latest data from UBC website
2. Run `apply_province_mappings.py` to apply province-specific codes
3. Run `verify_all_requirements.py` to validate

## 📚 Complete Project Description

### Project Overview

**UBC PathFinder** is an unofficial UBC (University of British Columbia) application and degree planning tool that helps students:
- Calculate admission probability
- Plan degree courses
- Understand admission requirements
- Track academic progress

### Core Characteristics

#### Tech Stack
- **Frontend Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Backend Service**: Supabase (Database + Authentication)
- **Styling**: CSS3 (Custom style system)
- **Error Monitoring**: Sentry
- **Design**: Responsive design, supports mobile/tablet/desktop

#### Design Features
- Modern UI/UX design
- Card-based layout system
- Visual progress display (circular progress bars, bar charts)
- Color coding system (high/medium/low probability)
- Interactive components (modals, dropdowns, collapsible panels)
- Mobile-first design

### Main Feature Modules

#### 1. HomePage

**Component Structure:**
- Hero section - Main title and subtitle
- Action Cards - Quick navigation (applicant/student flow)
- Value Proposition - Value proposition display
- Feature Preview - Feature preview
- Monetization - Commercial service display
- Footer - Footer links and disclaimer

**Features:**
- Clear user guidance
- Quick access to main features
- Display core website value

#### 2. ApplyInfoPage - ⭐ Core Feature

**2.1 Step-by-Step Admission Requirements Finder**

**Process:**
1. **Step 1**: Select province/territory
   - Supports 13 Canadian provinces/territories
   - Popular provinces: BC, Ontario, Quebec
   - Other provinces: Alberta, Manitoba, New Brunswick, etc.

2. **Step 2**: Select degree program
   - Supports 20 UBC degree programs
   - Includes: Arts, Science, Engineering, Commerce, Fine Arts, etc.

3. **Step 3**: View detailed requirements
   - General admission requirements
   - Grade 12 required courses
   - Grade 11 requirements (if applicable)
   - Recommended related courses (expandable details)
   - Additional information
   - Official resource links

**Features:**
- Real-time data loading
- Expandable course details
- Official UBC link integration
- Clear progress indicators

**2.2 Admission Probability Calculator** - ⭐⭐⭐ Core Feature

**4-Layer Evaluation Model:**

**Layer 1: Gate Check**
- Check required course completion
- Core subject minimum score requirements
- Supplemental material requirement checks
- Hard threshold validation

**Layer 2: Score Calculation**
- **Academic Score**: 0-100
  - Base GPA
  - Course difficulty bonus (Regular/AP/IB)
  - Core subject score adjustments
- **Profile Score**: 0-100
  - Extracurricular activity rating (1-5)
  - Leadership rating (1-5)
  - Volunteer service rating (1-5)
  - Grade trend adjustments
  - Activity relevance adjustments
  - Role depth adjustments
- **Supplement Score**: 0-100
  - For programs requiring portfolio/interview

**Layer 3: Probability Calculation**
- Weighted final score calculation
- Sigmoid function probability conversion
- International student adjustments
- Probability cap settings
- Confidence interval calculation

**Layer 4: Explanation Generation**
- Gate issue warnings
- Supplemental material reminders
- Core subject warnings
- Score analysis
- Top 2 improvement suggestions

**Input Parameters:**
- GPA/Average score (0-100)
- Course difficulty (Regular/AP/IB)
- Applicant type (Domestic/International)
- Grade trend (Rising/Stable/Declining)
- Course completion status (Completed/In Progress/Not Taken)
- Core subject scores (Math12, English12, Physics12, etc.)
- Extracurricular activity rating (1-5)
- Leadership rating (1-5)
- Volunteer service rating (1-5)
- Activity relevance (High/Medium/Low)
- Role depth (Founder/Executive/Member)
- Supplemental material score (0-100, for specific programs)

**Output Results:**
- Admission probability percentage (with confidence interval)
- Safety/Match/Reach classification
- Color coding (green/yellow/red)
- Score breakdown display
- Detailed analysis and recommendations
- Improvement suggestions (Top 2 Actions)
- Warnings and reminder information

**Supported Programs:**
- Applied Biology
- Applied Science (Engineering)
- Arts
- Bachelor + Master of Management
- Commerce (UBC Sauder School of Business)
- Dental Hygiene
- Design in Architecture, Landscape Architecture, and Urbanism
- Fine Arts
- Food and Resource Economics
- Food, Nutrition, and Health
- Indigenous Land Stewardship
- Indigenous Teacher Education Program (NITEP)
- International Economics
- Kinesiology
- Media Studies
- Music
- Natural Resources
- Pharmaceutical Sciences
- Science
- Urban Forestry

**Features:**
- Real-time calculation (updates as you type)
- Program-specific weight configurations
- Intelligent suggestion generation
- Detailed explanations and guidance

#### 3. PlannerPage - ⭐⭐ Core Feature

**3.1 Plan Management**
- **Create New Plan**
  - Plan naming
  - Select faculty
  - Select major
- **Switch Plans** - Quick switching between plans
- **Delete Plan** - Delete unwanted plans
- **Plan Limit** - Maximum 3 plans
- **Metadata Editing** - Edit plan name, faculty, major

**3.2 Course Management**
- **Course Status System**
  - Not Started (Not Yet)
  - Planned (Planned)
  - Completed (Completed)
- **Course Detail Modal**
  - Course description
  - Prerequisites
  - Corequisites
  - UBCGrades links
- **Course Status Toggle** - One-click status switching
- **Course Add/Remove** - Add or remove courses from plan

**3.3 Progress Tracking**
- **Overall Progress**
  - Circular progress bar showing completion percentage
  - Completed credits / Total credits
  - Remaining credits display
- **Category Progress**
  - Communication credit progress
  - Science credit progress
  - Literature credit progress
- **Course Statistics**
  - Completed courses count
  - In-progress courses count
  - Remaining courses count

**3.4 Course Data Support**
**Supported Engineering Majors (13):**
- Biomedical Engineering
- Chemical and Biological Engineering
- Civil Engineering
- Computer Engineering
- Electrical Engineering
- Engineering Physics
- Environmental Engineering
- Geological Engineering
- Integrated Engineering
- Manufacturing Engineering
- Materials Engineering
- Mechanical Engineering
- Mining Engineering

**Course View:**
- Course grid view (organized by year and term)
- Year label switching
- Term grouping display
- Course card display (code, credits, description)

**3.5 User Features**
- **Logged-in Users**: Cloud save (Supabase)
- **Guest Users**: Local storage (localStorage)
- **Auto-save Prompt**: Shows unsaved changes
- **Manual Save Button**: Manually save changes

#### 4. FirstYearGuide

**4.1 Standard First-Year Engineering Courses**
- Complete course list
- Course codes, credits, titles
- Whether included in schedule

**4.2 Supplementary Study Information**
- Humanities/Social Science elective descriptions
- Recommended course levels

**4.3 Second-Year Major Prerequisites**
- Major selector (13 engineering majors)
- Prerequisite course mapping
- Chain reaction course display (shows affected subsequent courses)

**Features:**
- Collapsible information display
- Clear table layout
- Major-specific prerequisite requirements

#### 5. User Authentication System

**5.1 Registration**
- Email registration
- Password setting (minimum 6 characters)
- Name input
- Email confirmation process

**5.2 Login**
- Email password login
- Error handling and prompts
- Session management
- Automatic login state recovery

**5.3 Logout**
- Complete cleanup (localStorage + sessionStorage)
- Force redirect to homepage

**5.4 Profile Management**
- Personal information editing
  - Full name
  - Date of birth
  - UBC student number (8 digits)
- Academic information settings
  - Faculty selection
  - Major selection
  - Year level selection
  - Target graduation year
- Degree progress display
  - Completion percentage
  - Progress bar visualization

### Data Coverage

#### Province/Territory Coverage
✅ **13 Canadian provinces/territories fully supported:**
- British Columbia (BC)
- Ontario (ON)
- Quebec (QC)
- Alberta (AB)
- Manitoba (MB)
- New Brunswick (NB)
- Newfoundland & Labrador (NL)
- Northwest Territories (NT)
- Nova Scotia (NS)
- Nunavut (NU)
- Prince Edward Island (PE)
- Saskatchewan (SK)
- Yukon (YT)

#### Degree Program Coverage
✅ **20 UBC Degree Programs:**
- Applied Biology
- Applied Science (Engineering)
- Arts
- Bachelor + Master of Management
- Commerce (UBC Sauder School of Business)
- Dental Hygiene
- Design in Architecture, Landscape Architecture, and Urbanism
- Fine Arts
- Food and Resource Economics
- Food, Nutrition, and Health
- Indigenous Land Stewardship
- Indigenous Teacher Education Program (NITEP)
- International Economics
- Kinesiology
- Media Studies
- Music
- Natural Resources
- Pharmaceutical Sciences
- Science
- Urban Forestry

#### Engineering Major Coverage
✅ **13 Engineering Majors with Complete Curriculum:**
- Biomedical Engineering
- Chemical and Biological Engineering
- Civil Engineering
- Computer Engineering
- Electrical Engineering
- Engineering Physics
- Environmental Engineering
- Geological Engineering
- Integrated Engineering
- Manufacturing Engineering
- Materials Engineering
- Mechanical Engineering
- Mining Engineering

### User Experience Features

#### Progress Indicators
- 3-step process visualization
- Step completion status display
- Clear progress feedback

#### Visual Feedback
- Color coding system
  - Green: High probability/Safety
  - Yellow: Medium probability/Match
  - Red: Low probability/Reach
- Progress bar animations
- Status badge display

#### Interaction Design
- Modal interactions
- Dropdown menus
- Collapsible panels
- Hover effects
- Click feedback

#### Information Architecture
- Clear information hierarchy
- Breadcrumb navigation
- Reset functionality
- Back buttons

#### Real-time Calculation
- Updates results as you type
- No button click needed
- Instant feedback

#### Intelligent Suggestions
- Personalized suggestions based on input
- Top 2 improvement suggestions
- Detailed explanations and guidance

### Data Persistence

#### Logged-in Users
- **Cloud Storage**: Supabase database
- **Auto Sync**: Cross-device data synchronization
- **Secure Authentication**: Supabase Auth

#### Guest Users
- **Local Storage**: localStorage
- **Temporary Save**: Valid during browser session
- **No Account Required**: Quick feature experience

### Security Features

#### Authentication Security
- Supabase Auth integration
- Email confirmation process
- Encrypted password storage
- Session management

#### Data Security
- User data isolation
- Secure API calls
- Error handling mechanisms

### Responsive Design

#### Mobile Optimization
- Touch-friendly interface
- Small screen adaptation
- Optimized navigation menu

#### Tablet Optimization
- Medium screen layout
- Optimized card display

#### Desktop Optimization
- Large screen layout
- Multi-column display
- Full feature display

### Development Tools and Configuration

#### Development Environment
- Vite build tool
- Hot Module Replacement (HMR)
- ESLint code checking
- Prettier code formatting

#### Deployment
- GitHub Pages deployment
- Automated build process
- 404 page handling

#### Monitoring
- Sentry error monitoring
- User behavior tracking

## 📚 Documentation

### Organized Documentation
All detailed documentation is organized in the `Summary/` folder:

- **📁 [Summary/](Summary/)** - Complete documentation organized by category
  - **01-Project-Status/** - Current project status and completion reports
  - **02-Problem-Solutions/** - Problem-solving documentation
  - **03-Guides/** - User guides and how-to documentation
  - **04-Scraper-Documentation/** - Scraper-related documentation

**Quick Links:**
- 📖 [Documentation Index](Summary/README.md) - Complete file index
- 🚀 [Quick Start Guide](Summary/03-Guides/README.md) - Get started quickly
- ✅ [Project Status](Summary/01-Project-Status/README.md) - Current status
- 🔧 [How to Update Requirements](Summary/03-Guides/README.md) - Update data guide

## ⚠️ Disclaimer

This website is not affiliated with the University of British Columbia. All admission probability calculations are based on historical data and trends, and do not guarantee admission. Please refer to the official UBC website for authoritative information.
