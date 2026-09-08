# SPX Discipline — iPhone Installable PWA

## Run locally
1. Install Node.js.
2. Open Terminal in this folder.
3. Run:
   npm install
   npm run dev

## Install on iPhone
For iPhone installation, the app must be served from a public HTTPS URL.

Easy options:
- Vercel
- Netlify
- Cloudflare Pages

Once deployed:
1. Open the HTTPS site in Safari on your iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Tap Add.

The app will launch full-screen from your Home Screen and can continue working offline after the first successful load.

Your daily trade data is stored locally in Safari/iPhone storage.
