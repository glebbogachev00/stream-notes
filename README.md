# [stream] - self-managing notes

A minimal note-taking app where thoughts flow away after 24 hours.

## Features

- **Self-managing notes**: Notes automatically delete after 24 hours
- **Quick capture**: Simple interface for rapid note-taking  
- **Save important thoughts**: One-click save to rescue notes from auto-deletion
- **Four beautiful themes**: Switch between white, black, grey, and beige themes
- **Minimal design**: Clean, distraction-free interface inspired by modern design principles
- **Responsive**: Works seamlessly on desktop and mobile

## Themes

Click the theme toggle in the top-right to cycle through:
- **[white]** - Clean white background  
- **[black]** - Dark mode
- **[grey]** - Soft grey tones
- **[beige]** - Warm beige aesthetic

## Usage

1. **Write**: Click the input area and start typing
2. **Save quickly**: Press Enter to save (Shift+Enter for new lines)  
3. **Let thoughts flow**: Notes automatically expire in 24 hours
4. **Rescue important ideas**: Click "save" to keep notes permanently
5. **Switch themes**: Toggle between the four color schemes

## Technical Details

- Built with React 18 and modern hooks
- Styled with Tailwind CSS
- Data stored locally (localStorage)
- No backend required
- Automatic cleanup on app load

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# (optional) Run the sync backend
cd server
npm install
npm run dev
```

### Enabling sync across devices

1. Start the sync backend (`cd server && npm run dev`). By default it listens on `http://localhost:4000` and stores data in `server/stream-sync.db`.
2. Expose the backend URL to the client by creating a `.env` file in the project root with `REACT_APP_SYNC_URL=http://localhost:4000` (or your deployed URL).
3. (Optional) Configure Supabase magic-link login for a friendlier sync flow: add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` to your `.env`/Vercel project. This makes the “sign in to sync” button email a one-time code and use the Supabase user ID as the sync identifier automatically.
4. Open the app settings → “sync across devices” and either sign in with email (Supabase), or enable sync with the shared ID. Use the same ID on every device/browser you want to keep in sync.

The backend stores simple key/value snapshots corresponding to the app’s `localStorage` keys. Sync traffic is opt-in and disabled by default.

## Philosophy

In our age of information overload, [stream] embraces the ephemeral nature of thoughts. Most notes don't need to live forever. By automatically clearing away old thoughts, the app keeps you focused on what matters now while still allowing you to save the truly important ideas.

Let your thoughts flow like a stream - some will naturally drift away, others you'll choose to keep.

---

Built with ❤️ by [@glebbogachev00](https://github.com/glebbogachev00)
