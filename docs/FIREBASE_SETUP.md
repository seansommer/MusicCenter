# Connect Music Center and Chords & Tabs

These steps connect shared sign-in, private messaging, and Sean’s Master Editor. The public songbook and its practice controls work before this setup.

## Already connected in the code

Both repositories contain Sean’s public web-app configuration for **music-center-1111**, using this Realtime Database:

https://music-center-1111-default-rtdb.firebaseio.com/

Keep `FIREBASE_CONFIG` and `FIREBASE_APP_NAME` identical in both repositories. The web configuration is intended for browser code. Do not add service-account JSON, private keys, or your Secret Word or Phrase to the code.

## 1. Enable sign-in

In the **music-center-1111** Firebase console, open **Authentication → Sign-in method** and enable **Email/Password**. The website still asks for a **Secret Word or Phrase**, not an email. The app uses synthetic account identifiers behind the scenes and never sends email.

Under Authentication settings, add `seansommer.github.io` to authorized domains. Keep email enumeration protection enabled. Leave password-policy maximum length at least 68 characters for the derived credentials; the user’s phrase is processed before submission.

## 2. Publish the database rules

Open **Realtime Database → Rules** for **music-center-1111**. Replace the rules with the complete contents of [`firebase-database.rules.json`](../firebase-database.rules.json), then choose **Publish**.

These rules protect private profiles and mailboxes and reserve song editing for authorized master UIDs. The supplied file intentionally denies everything outside `musicV1`; it is for this new Music Center database, not for an existing Game Center or SUJA database. Do not use public test-mode rules.

## 3. Enable the websites

In each GitHub repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**. Open **Actions → Verify and deploy → Run workflow** if a deployment has not succeeded. Future updates deploy automatically.

- Music Center: https://seansommer.github.io/MusicCenter/
- Chords & Tabs: https://seansommer.github.io/ChordsTabs/

## 4. Create your account and make it the master

1. Open Music Center, select **Sign in → Create an account**.
2. Use nickname **Sean** and a Secret Word or Phrase you keep private. Create it on the website, not in chat.
3. Open your musician card, expand **Account details**, and copy your **account UID**. You can also find it in Firebase Authentication’s user list.
4. In Realtime Database’s **Data** tab, create the following boolean value, replacing the placeholder with your exact UID:

   `musicV1 → admins → YOUR_UID: true`

5. Return to Chords & Tabs. Your card will say **Master**, and **Edit song** / **+ Add song** will appear.

Only the Firebase project owner/server can edit `admins`. Ordinary users cannot promote themselves or anyone else.

## 5. Check the live connection

- Create a separate test musician with a different nickname and phrase in another browser session.
- Verify that it cannot see Master Editor controls or write `songEdits`.
- Send a test message using the recipient’s exact nickname and Message ID; verify it in the receiving account.
- Sign in as Sean and make a small, intentional song edit. Preview it, publish, and confirm it appears in the other session.
- Use **Load previous version** if you want to restore the earlier chart, then publish it.

The application’s Master Editor publishes to Firebase so changes can appear live without a GitHub credential in browser code. Original song files remain in `ChordsTabs/data/songs`. **Export song JSON** saves a file that can be committed to GitHub for an additional versioned copy. A live override takes precedence over the repository file with the same song ID. When updating a song through GitHub later, reconcile any existing live override first.

## Official references

- Password authentication: https://firebase.google.com/docs/auth/web/password-auth
- Shared-origin session persistence: https://firebase.google.com/docs/auth/web/auth-state-persistence
- Realtime Database rule conditions: https://firebase.google.com/docs/database/security/rules-conditions
