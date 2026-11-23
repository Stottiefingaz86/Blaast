# Google sign-in (Gmail)

Blaast OAuth: `/api/auth/google` → `/api/auth/google/callback`.

**Error 400: redirect_uri_mismatch** means the URI Blaast sends is not listed
exactly in Google Cloud (scheme + host + path must match).

## One-time Google Cloud setup

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth 2.0 Client ID** → Application type **Web application**.
3. Authorized JavaScript origins (add every host you use):
   - `http://localhost:3000`
   - `https://blaast-five.vercel.app`
4. Authorized redirect URIs (must match exactly — no trailing slash):
   - `http://localhost:3000/api/auth/google/callback`
   - `https://blaast-five.vercel.app/api/auth/google/callback`
5. Copy Client ID + Client Secret.
6. If the app is in **Testing**, add your Gmail under **OAuth consent screen → Test users**.

## Env (local + Vercel)

```bash
GOOGLE_CLIENT_ID=….apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=…
NEXT_PUBLIC_GOOGLE_CLIENT_ID=….apps.googleusercontent.com   # same as CLIENT_ID — shows the button
NEXT_PUBLIC_APP_URL=https://blaast-five.vercel.app          # prod origin for OAuth
```

- Localhost always uses `http://localhost:3000/...` as redirect_uri (even if
  `NEXT_PUBLIC_APP_URL` points at Vercel).
- Production uses `NEXT_PUBLIC_APP_URL` — keep it on the production host and
  register that host’s callback in Google Cloud.

Set the same keys on Vercel (Production), then redeploy.

Until these are set, email/password login still works.
