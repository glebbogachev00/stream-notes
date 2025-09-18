# [stream] · self-managing notes

[stream] is a minimal note notebook. Active notes auto-expire, but you can keep what matters, sort with folders, and capture lightweight todos without disrupting your flow.

## Feature highlights

- **Ephemeral capture** – active notes self-delete after 24 h (or a custom timer per note)
- **Saved collections** – move anything you want to keep into the saved tab
- **Inline todos** – mark any note as a todo, tick it off, or clear it straight from the list
- **Folders** – optional folder filter works across active and saved notes
- **Sync** – opt‑in Supabase/local backend sync keeps multiple devices aligned
- **SAMO / art mode** – transform notes into Basquiat-inspired art cards
- **Multi-theme** – white, beige, dark, matrix, and edge themes
- **Keyboard-friendly** – quick add, save, move, and format with shortcuts

## Quick start

```bash
# Install dependencies
npm install

# Start the UI
npm start

# Lint before pushing
npm run lint

# Run unit tests (Jest)
npm test

# Build for production
npm run build
```

The optional sync backend lives in `server/`. To run it locally:

```bash
cd server
npm install
npm run dev
```

Then create a `.env` next to `package.json` with any of the following:

- `REACT_APP_SYNC_URL` – custom HTTP sync endpoint (defaults to Supabase when signed in)
- `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` – enable email one-time code login
- `GROQ_API_KEY` (server-side) – unlock Flow Formatting + Talk to Stream via the proxy handler

Open the in-app settings → “sync across devices” to enable or disable syncing and view the current status. Sync is off by default.

## Project layout

- `src/` – React app (hooks, contexts, components, utils)
- `server/` – optional sync service (SQLite + Supabase support)
- `public/` – static assets and service worker
- `scripts/` – development helpers

## Contribution checklist

1. `npm run lint`
2. `npm test`
3. Keep UI copy in lowercase (house style)
4. Only add comments where intent is non-obvious

Issues and pull requests are welcome. Please add tests when fixing bugs and reference any related tickets.

## Philosophy

In our age of information overload, [stream] embraces ephemerality. Most notes don’t need to live forever. By automatically clearing away old thoughts, the app keeps you focused on what matters now while still letting you save the essential ideas—or turn them into todos and art.

## License

Licensed under the [Apache License, Version 2.0](LICENSE). You’re free to ship commercial products built on top of [stream]; just keep license headers intact and share improvements when you can.

---

Built with ❤️ by [@glebbogachev00](https://github.com/glebbogachev00)
