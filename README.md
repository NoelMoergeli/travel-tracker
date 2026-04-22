# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.1 create --template minimal --no-types --install npm travel-tracker
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

---

# Travel Tracker — Projektbasis

Diese Vorlage wurde erweitert, um als Grundlage für ein Semesterprojekt "Travel Tracker" zu dienen (SvelteKit + TypeScript + MongoDB). Ziel ist ein prototypischer, aber gut strukturierter Code, der Authentifizierung, Trip-Modelle und eine interaktive Kartenintegration erlaubt.

Kurzer Quickstart

1. Kopiere `.env.example` nach `.env` und passe `MONGODB_URI` und `SESSION_SECRET` an.
2. Installiere Abhängigkeiten: `npm install`
3. Starte die Dev-Umgebung: `npm run dev`

Enthaltene Dateien (erste Basis):
- `tsconfig.json` — TypeScript-Konfiguration
- `src/lib/db/mongo.ts` — MongoDB-Connector (Singleton)
- `src/lib/models/*` — TypeScript-Interfaces für `User`, `Trip`, `Session`
- `.env.example` — Vorlage für Environment-Variablen

Weitere Schritte: Implementierung von Auth-Endpoints, Session-Hooks, Trip-CRUD und der interaktiven Karte.


