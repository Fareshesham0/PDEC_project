# Personal Data Exposure Checker

A privacy-preserving web app that checks whether an email or password has appeared in known breach datasets.

## Tech Stack

1. Next.js + React frontend
2. Vercel-compatible API routes under `src/pages/api/*`
3. npm workspaces
4. XposedOrNot for email breach checks
5. Have I Been Pwned Pwned Passwords for password checks

## Local Setup

Install dependencies:

```sh
npm install
```

Run the app locally:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

## XposedOrNot API Setup

This project uses the official XposedOrNot free email breach endpoint:

```txt
GET https://api.xposedornot.com/v1/check-email/[email]
```

According to the XposedOrNot API documentation, most endpoints are public, email breach checks return JSON, and the public API limit is 1 request per second. Domain breach endpoints are the ones that require an `x-api-key` header.

The app already calls XposedOrNot from the server-side Vercel Function at `/api/check`, so the key is not exposed in browser code.

If you have a XposedOrNot API key for authenticated/domain features, keep it in this server-side environment variable:

```sh
XPOSEDORNOT_API_KEY=your_key_here
```

For local development, copy `.env.example` to `.env.local` and fill in the value.

For Vercel:

1. Open your Vercel project.
2. Go to Settings -> Environment Variables.
3. Add `XPOSEDORNOT_API_KEY`.
4. Redeploy the project.

The app can still call XposedOrNot without a key, but adding the key is better for reliability.

API reference: https://xposedornot.com/api_doc

## Deploy To Vercel

This repo includes `vercel.json`, so Vercel can build it from the repo root.

Use these settings when importing the GitHub repository into Vercel:

1. Framework Preset: `Next.js`
2. Root Directory: repo root
3. Install Command: `npm install`
4. Build Command: `npm run build`
5. Output Directory: auto-detected by Next.js

Optional environment variables:

1. `XPOSEDORNOT_API_KEY`
2. `HIBP_API_KEY`
3. `RESEND_API_KEY`
4. `RESEND_FROM_EMAIL`

## Push To Your Own GitHub Repo

Create a new empty repository in your own GitHub account first. Do not initialize it with a README, `.gitignore`, or license because this project already has those files.

Then connect this local project to your new repo:

```sh
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

If GitHub asks for a password, use a GitHub personal access token instead of your account password.
