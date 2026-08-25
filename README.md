# Octavio Story Library — MVP

Private family web app for creating age-adapted historical and personal stories, transcribing family memories, generating watercolor illustrations, and archiving the collection in Google Drive.

## Architecture

- **StackBlitz**: browser IDE / development
- **Next.js 16 App Router**: frontend + server routes
- **Netlify**: production hosting
- **Auth.js + Google OAuth**: family login and Google Drive authorization
- **Google Drive API (`drive.file`)**: long-term human-readable archive
- **OpenAI Responses API**: story writing
- **OpenAI transcription**: voice → text for personal stories
- **GPT Image**: optional illustrations

No database is required for this first family MVP. Drive contains a lightweight `library-index.json`, each story's JSON + Markdown, family memory, and image folders. A real SQL database can be added later if the library grows enough to need complex querying.

## Drive layout created automatically

```text
Octavio Story Library/
  library-index.json
  family/
    family.json
    family.md
  stories/
    historical/
      <story-id> - <title>/
        story.json
        story.md
        illustrations/
        exports/
    personal/
      ...
```

## 1. Create OpenAI API credentials

Create an OpenAI API project/key and enable billing. **ChatGPT Plus and API usage are separate products/billing.** Put the API key only in server-side environment variables; never commit it.

## 2. Create Google OAuth credentials

In Google Cloud Console:

1. Create/select a project.
2. Enable **Google Drive API**.
3. Configure OAuth consent screen.
4. Create an OAuth Client ID of type **Web application**.
5. Add local redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
6. After deploying to Netlify, add:
   - `https://YOUR-SITE.netlify.app/api/auth/callback/google`
7. Copy Client ID and Client Secret into env vars.

The app requests `drive.file`, not full Drive access.

## 3. Configure environment

Copy `.env.example` to `.env.local` and fill:

```bash
OPENAI_API_KEY=...
AUTH_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
ALLOWED_EMAILS=you@example.com,partner@example.com
CHILD_NAME=Octavio
CHILD_BIRTH_DATE=YYYY-MM-DD
```

Generate `AUTH_SECRET` with a long random value.

## 4. Run locally / StackBlitz

```bash
npm install
npm run dev
```

StackBlitz understands the `stackblitz.startCommand` in `package.json`.

Important: Google OAuth needs a callback URL that Google accepts. For initial OAuth testing, local development or a deployed Netlify URL is often easier than an ephemeral preview URL.

## 5. Deploy to Netlify

Best workflow:

1. Push this project to GitHub.
2. Import the GitHub repository into Netlify.
3. Netlify detects Next.js automatically.
4. Add every value from `.env.local` in **Netlify → Site configuration → Environment variables**.
5. Deploy.
6. Add the final Netlify Google callback URL to the Google OAuth client configuration.

Do not put secrets in `netlify.toml` or source control.

## Current MVP features

- Google family login
- Optional allow-list of approved family email addresses
- Historical stories with high factual rigor + small narrative licenses
- Personal/family stories that use saved family context but are told as independent books
- Third-person classical narrator
- One language per story (ES/FR/EN)
- Duration always selected, with an age-based recommended default
- Voice recording and transcription for family memories
- Short closing reflection / learning
- Save story as JSON + Markdown in Drive
- Family profile with people, traits, likes, notes and memories
- Suggested illustration scenes
- Generate square watercolor illustrations
- Automatically archive generated illustrations in Drive if the story was saved first
- Library index view

## Deliberately left for Phase 2

- Photo-reference uploads for consistent family likenesses in illustrations
- Interactive interviewer that asks follow-up questions before turning a spoken memory into a story
- Story version history / editing workflow
- Favorites
- EPUB export
- Print-ready 8x8 PDF layout with bleed, cover/back cover, pagination and printer profile
- One-click Lulu/Blurb/KDP export presets
- Child-only tablet reading mode
- SQL search/database if the Drive index eventually becomes too limited

## Recommended next implementation step

Build the **book compositor**: turn a saved story + chosen illustrations into an 8x8 page plan, preview it in-browser, then export a print-ready PDF. Keep PDF generation separate from illustration generation so layouts can change without regenerating art.
