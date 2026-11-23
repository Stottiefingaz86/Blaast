# Google sign-in (Gmail)

Blaast already implements OAuth at `/api/auth/google` → `/api/auth/google/callback`.

## One-time Google Cloud setup

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth 2.0 Client ID** → Application type **Web application**.
3. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://blaast-five.vercel.app`
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://blaast-five.vercel.app/api/auth/google/callback`
5. Copy Client ID + Client Secret.

## Env (local + Vercel)

```bash
GOOGLE_CLIENT_ID=….apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=…
NEXT_PUBLIC_GOOGLE_CLIENT_ID=….apps.googleusercontent.com   # same as CLIENT_ID — shows the button
```

Set the same three on Vercel (Production / Preview / Development), then redeploy.

Until these are set, email/password login still works; the Google button explains that sign-in isn’t configured.
