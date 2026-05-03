# Travel Tracker - Projektdokumentation

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen](#4-erweiterungen)
5. [Projektorganisation](#5-projektorganisation)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang](#7-anhang)

## 1. Ausgangslage

Viele Personen möchten ihre Reisen festhalten, später wiederfinden und visuell sehen, welche Länder sie bereits besucht haben. Eine reine Liste von Reisen ist dafür zwar funktional, aber wenig anschaulich. Der Travel Tracker kombiniert deshalb eine persönliche Reiseliste mit einer interaktiven Weltkarte und einer Fotogalerie pro Reise.

- **Problem:** Besuche, Orte, Notizen und Fotos sind oft über verschiedene Apps oder Dateien verteilt. Dadurch ist schwer erkennbar, welche Länder bereits bereist wurden und welche Erinnerungen zu welcher Reise gehören.
- **Ziele:**
  - Benutzer können sich registrieren und anmelden.
  - Benutzer können eigene Reisen erfassen, bearbeiten und löschen.
  - Besuchte Länder werden auf einer interaktiven Weltkarte markiert.
  - Länder können über die Karte oder über eine Suche ausgewählt werden.
  - Pro Reise können Fotos direkt in MongoDB gespeichert und in einer Galerie angezeigt werden.
  - Bestehende Reisen ohne Fotos funktionieren weiterhin.
- **Primäre Zielgruppe:** Privatpersonen, die ihre Reisen strukturiert und visuell dokumentieren möchten.
- **Weitere Stakeholder:** Lehrpersonen oder Reviewer, welche den Prototyp, die technische Umsetzung und die Dokumentation beurteilen.

## 2. Lösungsidee

Die Anwendung ist eine SvelteKit-Webapplikation mit MongoDB als Datenbank. Nach dem Login gelangt der Benutzer auf ein Dashboard mit zwei Hauptbereichen: links die aufgezeichneten Reisen, rechts die Länder-Suche und die Weltkarte.

- **Kernfunktionalität:**
  - Registrierung, Login und Logout mit Session-Cookie.
  - Dashboard mit Weltkarte, besuchten Ländern und scrollbarer Reiseliste.
  - Länder-Suche oberhalb der Karte.
  - Neue Reise erfassen mit Land, Ort, Datum, Notizen und optionalen Fotos.
  - Reise bearbeiten oder löschen.
  - Fotogalerie mit Grid-Ansicht und fullscreen Slideshow/Lightbox.
- **Annahmen:**
  - Eine Reise gehört immer genau einem eingeloggten Benutzer.
  - Pro Reise sind maximal 10 Galerie-Fotos vorgesehen.
  - Fotos werden direkt als Base64-Daten im bestehenden Trip-Dokument gespeichert, damit kein externer Bildhost benötigt wird.
- **Abgrenzung:**
  - Es gibt keine öffentliche Teilen-Funktion.
  - Es gibt keine komplexe Routenplanung oder Karten-Navigation.
  - Die App ist ein Prototyp und keine produktionsfertige Plattform mit Rollen-/Rechteverwaltung.

## 3. Vorgehen & Artefakte

Die Umsetzung erfolgte iterativ: zuerst Authentifizierung und Basis-Dashboard, danach Trip-Verwaltung, Länder-Auswahl, Fotoverwaltung und Layout-Verbesserungen.

### 3.1 Understand & Define

- **Zielgruppenverständnis:** Die Zielgruppe möchte Reisen schnell erfassen und später übersichtlich wiederfinden. Wichtig sind eine einfache Eingabe, visuelle Orientierung über Länder und ein klarer Bezug zwischen Reise und Erinnerungsfotos.
- **Wesentliche Erkenntnisse:**
  - Die Weltkarte ist der zentrale visuelle Einstieg.
  - Die Reiseliste darf die Karte nicht in der Höhe vergrössern; viele Reisen müssen in einem scrollbaren Bereich erscheinen.
  - Die Länderauswahl muss sowohl über Karte als auch über Suche funktionieren.
  - Fotos sollen ohne externe URL hochgeladen werden können.

### 3.2 Sketch

- **Variantenüberblick:**
  - Variante 1: reine Tabellenansicht mit Reisen.
  - Variante 2: Dashboard mit Karte und Reiseliste.
  - Variante 3: Dashboard mit Karte, separater Länder-Suche und Fotogalerien.
- **Gewählte Richtung:** Variante 3, weil sie die wichtigsten Workflows verbindet: Land auswählen, Reisen sehen, neue Reise erfassen und Fotos betrachten.

### 3.3 Decide

- **Gewählte Variante & Begründung:** Das Dashboard verwendet links eine scrollbare Reiseliste und rechts eine Länder-Suche über der Weltkarte. Dadurch bleibt die Karte stabil und die Suche sichtbar, während viele Trips trotzdem zugänglich bleiben.
- **End-to-End-Ablauf:**
  1. Benutzer registriert sich oder meldet sich an.
  2. Dashboard lädt alle eigenen Reisen aus MongoDB.
  3. Besuchte Länder werden auf der Weltkarte eingefärbt.
  4. Benutzer wählt ein Land über Karte oder Suche.
  5. Die Reiseliste wird nach diesem Land gefiltert.
  6. Benutzer erfasst, bearbeitet oder löscht Reisen.
  7. Fotos werden im Edit-/New-Formular hinzugefügt und später in Galerie/Slideshow angezeigt.
- **Mockup:** Kein externes Figma-Mockup im Repository. Die UI wurde direkt im SvelteKit-Prototyp iteriert.

### 3.4 Prototype

#### 3.4.1. Entwurf (Design)

- **Informationsarchitektur:**
  - `/login`: Anmeldung.
  - `/register`: Registrierung.
  - `/dashboard`: Hauptansicht mit Trips, Länder-Suche und Weltkarte.
  - `/trip/new`: Neue Reise erfassen.
  - `/trip/[id]/edit`: Reise bearbeiten und Fotos verwalten.
  - `/logout`: Session beenden.
- **User Interface Design:**
  - Ruhiges Dashboard mit Kartenpanel und Reiseliste.
  - Länder-Suche als eigenes Panel über der Karte.
  - Trip Cards mit Ort, Land, Datum, Notizen und optionalem Fotovorschaubild.
  - Fotogalerie als Modal mit responsivem Grid.
  - Slideshow als fullscreen Lightbox mit Tastatursteuerung.
- **Designentscheidungen:**
  - Die Karte und die Trip-Liste haben eine abgestimmte Höhe.
  - Die Trip-Liste scrollt intern, damit die Karte nicht mit der Anzahl Trips wächst.
  - Die Fotofunktion ist in bestehende Trip-Formulare integriert statt als separate Seite umgesetzt.

#### 3.4.2. Umsetzung (Technik)

- **Technologie-Stack:**
  - Svelte 5 und SvelteKit.
  - TypeScript.
  - MongoDB Node Driver.
  - Argon2 für Passwort-Hashing.
  - Zod für serverseitige Validierung.
  - D3 Geo und TopoJSON für die Weltkarte.
  - `i18n-iso-countries` für Länder-Codes und Ländernamen.
- **Tooling:**
  - Vite/SvelteKit Build.
  - Lokale Entwicklung über `npm.cmd run dev` bzw. `npm run dev`.
  - Build-Prüfung über `npm.cmd run build` bzw. `npm run build`.
- **Struktur & Komponenten:**
  - `src/lib/components/WorldMap.svelte`: interaktive Weltkarte.
  - `src/lib/components/CountrySearch.svelte`: Länder-Suche oberhalb der Karte.
  - `src/lib/components/CountryPicker.svelte`: Länderauswahl in Trip-Formularen.
  - `src/lib/components/TripList.svelte`: scrollbare Liste der Reisen.
  - `src/lib/components/TripCard.svelte`: einzelne Reise-Karte.
  - `src/lib/components/PhotoManager.svelte`: Fotos im Formular hinzufügen/entfernen.
  - `src/lib/components/PhotoGrid.svelte`: Galerieansicht.
  - `src/lib/components/PhotoLightbox.svelte`: fullscreen Slideshow.
  - `src/lib/server/trips.ts`: zentrale serverseitige Trip-Logik.
  - `src/lib/db/mongo.ts`: MongoDB-Verbindung.
- **Daten & Schnittstellen:**
  - Benutzer werden in der Collection `users` gespeichert.
  - Sessions werden in der Collection `sessions` gespeichert.
  - Reisen werden in der Collection `trips` gespeichert.
  - Das Trip-Dokument enthält weiterhin die bestehenden Pflichtfelder und wurde nur optional erweitert.
  - Aktuelles Foto-Modell im Trip-Dokument:

```ts
photos?: {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string;
  caption?: string;
  uploadedAt: Date;
}[];
```

  - `data` enthält das Bild als Base64-String.
  - Gerendert wird über `data:{mimeType};base64,{data}`.
  - Fehlende Fotos werden als leeres Array behandelt.
  - Alte Reisen ohne `photos` bleiben gültig.
- **Validierung:**
  - Länder-Code ist ein ISO-Alpha-2-Code.
  - Reisedaten werden geprüft; das Enddatum darf nicht vor dem Startdatum liegen.
  - Foto-Uploads erlauben `image/jpeg`, `image/png` und `image/webp`.
  - Maximal 2 MB pro Foto.
  - Maximal 10 Fotos pro Reise.
  - Bildunterschriften sind auf 160 Zeichen begrenzt.
- **Deployment:**
  - Die App ist für SvelteKit `adapter-auto` vorbereitet.
  - `netlify.toml` ist vorhanden.
  - Eine konkrete Produktions-URL ist in diesem Repository nicht dokumentiert.
- **Besondere Entscheidungen:**
  - Fotos werden direkt im Trip-Dokument gespeichert, um keine zusätzliche Collection und keinen externen Bildhost zu benötigen.
  - Für ältere Upload-Logik existiert noch Kompatibilitätscode (`images?: string[]` und Legacy-Foto-Fallbacks), die aktive UI verwendet aber den neuen Foto-Upload.
  - Die Dashboard-Höhe wird bewusst begrenzt; nur die Reiseliste scrollt.

### 3.5 Validate

- **URL der getesteten Version:** Lokale Entwicklungsumgebung, typischerweise `http://127.0.0.1:5173/`.
- **Ziele der Prüfung:**
  - Funktioniert Registrierung/Login?
  - Werden nur eigene Reisen angezeigt?
  - Bleibt das Dashboard stabil, auch wenn viele Trips vorhanden sind?
  - Können Länder über Karte und Suche ausgewählt werden?
  - Können Fotos hochgeladen, angezeigt und entfernt werden?
- **Vorgehen:** Funktionale Tests während der Entwicklung, Build-Prüfung nach relevanten Änderungen.
- **Stichprobe:** Entwickler-/Reviewer-Test mit lokalen Testdaten.
- **Aufgaben/Szenarien:**
  - Benutzer registrieren und einloggen.
  - Neue Reise mit Land, Ort und Datum erstellen.
  - Reise bearbeiten und Foto hinzufügen.
  - Dashboard öffnen und Galerie/Slideshow verwenden.
  - Reise löschen.
- **Kennzahlen & Beobachtungen:**
  - `npm.cmd run build` wurde wiederholt erfolgreich ausgeführt.
  - Mehrere UI-Probleme wurden korrigiert, z. B. Map-Fokusrahmen, Dashboard-Höhe und doppelte Foto-Upload-Bereiche.
- **Zusammenfassung der Resultate:** Die Kernworkflows sind im aktuellen Prototyp umgesetzt. Bestehende Trips ohne Fotos funktionieren weiterhin. Die Fotogalerie verwendet nun direkt in MongoDB gespeicherte Bilddaten.
- **Abgeleitete Verbesserungen:**
  - Automatisierte Tests ergänzen.
  - Bildkomprimierung vor dem Speichern prüfen.
  - Migration oder Bereinigung alter `images`/Legacy-Foto-Daten planen, falls die App produktiv weiterentwickelt wird.

## 4. Erweiterungen

### 4.1 Interaktive Weltkarte

- **Beschreibung & Nutzen:** Die Weltkarte zeigt besuchte Länder farblich an und erlaubt die Auswahl eines Landes direkt auf der Karte.
- **Wo umgesetzt:**
  - Frontend: `src/lib/components/WorldMap.svelte`.
  - Datenbasis: Trips aus MongoDB liefern die besuchten Länder.
- **Referenz:** Dashboard unter `/dashboard`.
- **Aus Evaluation abgeleitet?:** Ja, aus dem Bedarf nach einer visuellen Übersicht statt einer reinen Liste.

### 4.2 Länder-Suche und Country Picker

- **Beschreibung & Nutzen:** Länder können über Name oder ISO-Code gesucht werden. In Formularen wird der Ländername angezeigt, gespeichert wird aber nur der ISO-Code.
- **Wo umgesetzt:**
  - `src/lib/components/CountrySearch.svelte`.
  - `src/lib/components/CountryPicker.svelte`.
  - `src/lib/countries/index.ts`.
- **Referenz:** Dashboard, New Trip und Edit Trip.
- **Aus Evaluation abgeleitet?:** Ja, weil die Eingabe eines reinen Länder-Codes für Benutzer unklar sein kann.

### 4.3 Fotogalerie und Slideshow

- **Beschreibung & Nutzen:** Benutzer können Fotos pro Reise hochladen, in einer Galerie betrachten und als Slideshow öffnen.
- **Wo umgesetzt:**
  - Frontend: `PhotoManager`, `PhotoGrid`, `PhotoLightbox`, `TripCard`.
  - Backend: `src/lib/server/trips.ts`.
  - Datenbank: optionales `photos`-Array im bestehenden Trip-Dokument.
- **Referenz:** Edit/New Trip und Dashboard-Galerie.
- **Aus Evaluation abgeleitet?:** Ja, weil Reiseerinnerungen nicht nur textlich, sondern auch visuell festgehalten werden sollen.

### 4.4 Scrollbare Reiseliste im Dashboard

- **Beschreibung & Nutzen:** Viele Trips sollen die Karte nicht vergrössern oder die Suche verdrängen. Die Reiseliste scrollt deshalb in einem festen Panel.
- **Wo umgesetzt:**
  - `src/lib/components/TripList.svelte`.
  - Layout-Regeln in `src/lib/styles/global.css`.
- **Referenz:** Dashboard.
- **Aus Evaluation abgeleitet?:** Ja, aus Layout-Problemen bei mehreren Trips.

## 5. Projektorganisation

- **Repository & Struktur:**
  - `src/routes`: SvelteKit-Seiten und Server Actions.
  - `src/lib/components`: wiederverwendbare UI-Komponenten.
  - `src/lib/models`: TypeScript-Modelle für MongoDB/Public DTOs.
  - `src/lib/server`: serverseitige Geschäftslogik.
  - `src/lib/db`: MongoDB-Verbindung.
  - `src/lib/styles/global.css`: globales Styling.
- **Lokale Installation:**

```bash
npm install
```

- **Umgebungsvariablen:**

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=travel-tracker
COOKIE_NAME=sessionId
SESSION_DAYS=30
```

Alternativ akzeptiert die MongoDB-Verbindung auch `DB_URI`, `DB_URL` oder `DB_NAME`.

- **Entwicklung starten:**

```bash
npm run dev
```

Unter Windows kann auch verwendet werden:

```bash
npm.cmd run dev
```

- **Build prüfen:**

```bash
npm run build
```

Unter Windows:

```bash
npm.cmd run build
```

- **Commit-Praxis:** Die Entwicklung wurde in kleine, beschreibende Commits aufgeteilt, z. B. Feature-, Fix-, Refactor- und Style-Commits.

## 6. KI-Deklaration

Die folgende Deklaration beschreibt den Einsatz von KI im Projekt.

### 6.1 KI-Tools

- **Eingesetzte Tools:** OpenAI ChatGPT/Codex in der Entwicklungsumgebung.
- **Zweck & Umfang:** KI wurde unterstützend eingesetzt für Code-Änderungen, Refactoring, Fehlersuche, Dokumentation, Formulierungen und Build-/Statusprüfungen.
- **Eigene Leistung:** Architekturentscheidungen, fachliche Anforderungen, Bewertung der Vorschläge und finale Abnahme lagen beim Entwickler. KI-generierte Änderungen wurden geprüft und über Builds validiert.

### 6.2 Prompt-Vorgehen

Die Prompts wurden auf konkrete Arbeitsschritte ausgerichtet, z. B. "Foto-Upload direkt im Trip-Dokument speichern", "Dashboard-Höhe stabilisieren" oder "README auf Deutsch aktualisieren". Bei technischen Änderungen wurden bestehende Dateien zuerst inspiziert und danach gezielte, kleine Änderungen umgesetzt. Die Resultate wurden jeweils mit `npm.cmd run build` geprüft.

### 6.3 Reflexion

KI war hilfreich, um wiederkehrende Implementierungsarbeiten schneller umzusetzen, Bugs systematisch zu analysieren und Dokumentation zu strukturieren. Grenzen bestehen bei projektspezifischem Kontext, UI-Feinheiten und fachlichen Entscheidungen: Diese müssen weiterhin durch den Entwickler überprüft werden. Risiken wie veraltete Annahmen, unerwünschte Nebeneffekte oder unpassende Abstraktionen wurden durch Code-Review, gezielte Diffs und Build-Prüfungen reduziert.

## 7. Anhang

- **Wichtige Bibliotheken:**
  - SvelteKit: Webframework.
  - MongoDB: Datenbank.
  - Argon2: Passwort-Hashing.
  - Zod: Validierung.
  - D3 Geo / TopoJSON: Weltkarte.
  - i18n-iso-countries: Länderinformationen.
- **Bekannte technische Hinweise:**
  - Die Weltkarte lädt TopoJSON-Daten zur Laufzeit von jsDelivr.
  - Fotos werden als Base64 direkt im Trip-Dokument gespeichert; dadurch sollte die Dateigrösse bewusst begrenzt bleiben.
  - Der Prototyp enthält noch Kompatibilität für ältere Bildfelder (`images` und Legacy-URL-Fotos), die aktive UI nutzt jedoch die neue Fotoverwaltung.
- **Nützliche Befehle:**

```bash
npm run dev
npm run build
npm run preview
```
