STUDY HUB OFFICIAL — COMPLETE WEBSITE + SECURE DUAL ADMIN
DATE: November 1, 2026
FIREBASE PROJECT: studyhubofficial-2e2de

IMPORTANT — READ THIS FIRST
---------------------------
Is ZIP mein complete code hai, lekin live website 100% work tabhi karegi
jab aap Firebase Authentication, Firestore rules aur private Cloud Function DEPLOY
kar chuke hon. Main aapke Firebase console par deploy nahi kar sakta.

VERY IMPORTANT SECURITY WARNING
--------------------------------
Aapki pehle upload ki hui firebase-adminsdk JSON file mein PRIVATE KEY thi.
Is key ko compromised assume karein. Google Cloud Console > IAM & Admin >
Service Accounts > [firebase-adminsdk-fbsvc...] > Keys se old key DELETE
karein aur Firebase Console se fresh key generate karein.
Old JSON ko public site, ChatGPT ya GitHub par kabhi upload na karein.
Is package mein old JSON, private key, ya plaintext admin passwords NAHI hain.

PACKAGE CONTENTS
----------------
public/index.html                  Complete website (public HTML)
functions/index.js                Private second-admin authentication endpoint
functions/package.json            Firebase Functions dependencies
firestore.rules                   Read/write security rules
firebase.json                     Firebase Hosting + Functions + Firestore
.firebaserc                       Project binding
private-setup/setup-first-admin.cjs  First admin create/password reset (local)
private-setup/change-second-password.cjs  Second password rotation (local)
private-setup/package.json        Admin SDK dependency

LOGIN 1: ehtshamulhaq100@gmail.com
  Firebase Authentication Email/Password, email_verified true.
  Set/reset its actual password on your own device with private setup script below.
LOGIN 2: studyhubofficialadmin@gmail.com
  PRIVATE Cloud Function validates provided second password using salted scrypt
  verifier. THIS EMAIL IS NOT a separate Firebase Email/Password login.
  It receives a Firebase custom signed session token; same dashboard/data.
  Since the second password was shared in chat, change it after deploying.

STEP 0 — PREREQUISITES
----------------------
- Node.js 20 or 22 (LTS)
- Firebase CLI: npm install -g firebase-tools
- Project Owner/Editor access to Firebase project studyhubofficial-2e2de
- Cloud Firestore Database created (Production mode + deploy supplied rules)
- Firebase Authentication -> Sign-in method -> Email/Password ENABLED
- Firebase Cloud Functions requires Blaze billing plan to deploy.
- Existing hosting domain authorized in Firebase Authentication -> Settings ->
  Authorized domains. HTTPS required on deployed site.
- If existing Firestore rules support other apps, MERGE first: deploying the
  supplied rules alone will REPLACE existing project rules.

STEP 1 — LOG IN TO CLI
----------------------
Unzip the file. Open Windows PowerShell in extracted project root.
  npm install -g firebase-tools
  firebase login
  firebase use studyhubofficial-2e2de

STEP 2 — DEPLOY PRIVATE SECOND ADMIN + RULES + SITE
---------------------------------------------------
PowerShell / CMD in extracted project ROOT:
  cd functions
  npm install
  cd ..
  firebase deploy --only functions:studyhubSecondaryLogin,firestore:rules,hosting --project studyhubofficial-2e2de

If your website is hosted outside Firebase Hosting:
  firebase deploy --only functions:studyhubSecondaryLogin,firestore:rules --project studyhubofficial-2e2de
  Then upload ONLY public/index.html to your HTTPS website as index.html.
  Do not upload functions, private-setup, service account JSON, or rules publicly.

STEP 3 — FIX FIRST ADMIN LOGIN (PRIVATE SETUP)
----------------------------------------------
First revoke old compromised key. Generate a NEW service-account JSON on your
OWN PC: Firebase Console > Project Settings > Service Accounts > Generate Key.
Save it somewhere private, NOT inside website/public folder or repo.

In PowerShell, replace path with YOUR actual private JSON path:
  $env:GOOGLE_APPLICATION_CREDENTIALS='C:\PRIVATE\newServiceAccount.json'
  cd private-setup
  npm install
  node setup-first-admin.cjs
  cd ..
  Remove-Item Env:GOOGLE_APPLICATION_CREDENTIALS

The script asks you to type the First Admin password (hidden) twice.
It creates/updates the user on Firebase server and verifies/enables it.
You can use a fresh, strong password rather than old chat-shared credentials.

STEP 4 — LOG IN
---------------
1. Open deployed website, click Management / More options / Admin sign in.
2. First email: ehtshamulhaq100@gmail.com + the first Firebase password you set.
   OR second email: studyhubofficialadmin@gmail.com + your second password.
3. After VALID login the same Support desk overview dashboard opens automatically.
4. Wrong password or unconfigured Firebase -> NO admin access.

STEP 5 — TEST REQUESTS & COUNTERS
---------------------------------
1. Log out; visit Contact, Course, or Projects form and fill required fields.
2. Click SEND. Wait for Firebase reference "SH-..." confirmation.
3. Log in and open Management: new request appears under Total / New.
4. Open request and set In Process; change to Closed to test both counters.
5. Already saved old inquiries missing statuses? Click Sync request counters.

SECOND ADMIN PASSWORD ROTATION (VERY RECOMMENDED)
------------------------------------------------
From project root, on your own PC:
  node private-setup/change-second-password.cjs
  firebase deploy --only functions:studyhubSecondaryLogin --project studyhubofficial-2e2de
This creates new per-password salt and hash; plaintext never appears in HTML.

NOTES & LIMITATIONS
-------------------
- ONLY HTML cannot securely conceal a login password from browser Inspect.
- Firebase web API key IS public and is not an admin secret; service-account
  private key must NEVER be in HTML or public hosting.
- Firestore rules protect private inquiries on Firebase's servers.
- Website domain and network, Firebase billing, Cloud Function permissions,
  key restrictions and rules MUST be configured before live login can work.
- If Firebase custom token generation says IAM signing permission denied,
  check Service Account Token Creator permissions of your Cloud Function
  runtime service account in Google Cloud IAM.
- As the second password was posted in chat, consider it compromised and
  rotate it via the provided private script after testing.
- Do not upload the entire ZIP into your web hosting public_html folder.

TROUBLESHOOTING
---------------
"auth/invalid-credential" / "invalid-login-credentials" on first admin:
  Run Step 3; use the exact password set in Firebase Auth.
"Private Admin service unreachable":
  Run Step 2; check Cloud Functions deployed and billing enabled.
"permission-denied" on dashboard or send:
  Verify Firestore DB exists, update rules, check Auth role and rule merge.
"auth/invalid-api-key":
  Compare Firebase apiKey under Project settings > Your apps (case-sensitive).
"auth/unauthorized-domain":
  Add live website domain under Authentication > Settings > Authorized domains.
"Request NOT saved":
  Check browser console for Firestore permission-denied and exact rules.

TESTING
-------
- Static HTML/JS syntax, private verifier, and browser mock tests are run
  while building this file. These do NOT test your live Firebase project.
- Run tests/basic-check.js from project root (requires Node.js).
