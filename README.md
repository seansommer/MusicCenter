# Music Center

A warm, comfortable home for our music apps. The record-and-note icon, walnut listening room, amber lighting, and muted teal palette are original artwork created for this project.

- Hub: https://seansommer.github.io/MusicCenter/
- First app: https://seansommer.github.io/ChordsTabs/
- Companion repository: https://github.com/seansommer/ChordsTabs

## What is ready

The responsive hub, shared header, musician-card and message interfaces, light/dark modes, share artwork, app icons, and install manifest are implemented. Chords & Tabs can be used as a guest immediately after Pages is enabled.

The collection uses square app icons, like Game Center. Chords & Tabs opens in a full-viewport player inside the hub, so the installed Music Center does not leave its app scope or add an outer app toolbar. Use the record icon inside Chords & Tabs to return home. Normal browser tabs can still show their own address bars.

**Both apps are configured for the `music-center-1111` Firebase project.** Accounts, private messages, and the live Master Editor still require Email/Password authentication to be enabled, the supplied database rules to be published, and your account UID to be granted master access. Follow the setup guide below; these console settings are not changed by a GitHub deployment.

## Launch on GitHub Pages

In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**. Then open **Actions → Verify and deploy → Run workflow**. Future pushes to `main` run tests, build, and deploy automatically. Repository names and public paths are case sensitive: use `MusicCenter` and `ChordsTabs` exactly.

## Connect accounts and master editing

Follow [Firebase setup](docs/FIREBASE_SETUP.md). Both apps use the same **new, dedicated** Firebase web app, named Firebase instance `MUSIC_CENTER_V1`, and `musicV1` database namespace. Do not paste these rules over a Game Center or SUJA production database.

Sign in with **Nickname + Secret Word or Phrase**. The phrase can contain letters, spaces, digits, or symbols and does not need to be an email address. Nicknames are case insensitive, while phrase capitalization and spaces are significant. A long unique phrase is recommended. There is no email-based recovery.

Authentication is backed by Firebase Authentication: the app derives a synthetic, non-deliverable account identifier from the nickname and stretches the phrase with PBKDF2-SHA256. Firebase verifies the derived password. The raw phrase and derived credentials are never placed in the Realtime Database, GitHub files, URLs, or our localStorage keys. Firebase owns its persistent authentication session. This is a bearer credential, not a public/private cryptographic key pair.

Music Center has a separate account system from the existing game hubs. The two new apps share one sign-in on `seansommer.github.io`, because they use the same Firebase configuration, app name, and browser-local persistence. Other origins, private-browser sessions, and some installed-app contexts can require another sign-in.

A 16-character Message ID plus nickname is required to address another musician. Messages are read only by their mailbox owner. The UI shows the latest 100; removing a message removes only your own mailbox copy. No messages have been sent as part of development.

Master access comes from a Firebase UID allowlist that browser clients cannot change. A nickname, the first signup, a URL parameter, or browser storage cannot grant it. The master can edit and add songs; this does not grant access to other users’ private mailboxes.

## Project structure

- `index.html`, `styles.css`: responsive hub and shared dialogs.
- `src/identity.js`: phrase credentials and Message IDs.
- `src/community.js`: Firebase identity, messages, and authorized song publishing.
- `src/ui.js`: shared header, theme, musician card, login, and messages.
- `firebase-database.rules.json`: default-deny database rules, owned mailboxes, master-only publishing.
- `docs/ARTWORK.json`: artwork prompts and asset mapping.

`src/config.js`, `identity.js`, `community.js`, `theme-boot.js`, and `ui.js` are version-matched copies in the two repositories. Keep them synchronized when changing the shared account contract. Shared style rules are copied too; app-specific rules can be split later if needed.

## Development

Node 22 or later:

```sh
npm test
npm run build
```

The static build has no package installation requirement. It checks syntax, local imports, HTML assets, manifest icons, and song-file validity before writing `dist/`. Test-only packages are used by the database-rule emulator suite:

```sh
npm ci
npm run test:rules
```

It checks real Firebase rules against an isolated demo project, including forged identities, private mailbox reads, unauthorized master promotion, and song revision conflicts. It never sends production messages or changes a live database.

The app does not register a service worker in this first version, so published chart corrections are not hidden behind an old offline cache. Home-screen installation is provided by the manifest; online access is required.

Created by Sean.
