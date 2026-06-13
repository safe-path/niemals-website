# NIEMALS – Website

Statischer Nachbau der Band-Website [niemalsmusik.de](https://www.niemalsmusik.de/),
migriert weg von Webflow. Reines HTML/CSS/JS, ohne Build-Step, deploybar auf Vercel.

Design, Farben, Schatten, Design-Tokens und Bilder sind **1:1 vom Original übernommen**
(die Original-Webflow-Stylesheets werden unverändert genutzt). Die Webflow-Laufzeit
(jQuery + Webflow IX2) wurde entfernt und die Interaktionen durch
[GSAP](https://gsap.com/) + ScrollTrigger ersetzt – inklusive verfeinerter
Lade-Animation.

## Struktur

```
niemals-clone/
├── index.html                 # Startseite
├── datenschutz.html           # /datenschutz
├── datenschutzerklarung.html  # /datenschutzerklarung (im Footer als „Impressum“ verlinkt)
├── 404.html
├── css/
│   ├── niemals.css            # Original-Webflow-Styles (nur Font-URL lokalisiert) – NICHT verändern
│   └── custom.css             # Eigene Ergänzungen: Ladeanimation, mobiles Menü, Reduced-Motion
├── js/
│   └── main.js                # GSAP-Animationen + mobile Navigation (ersetzt Webflow IX2)
├── assets/
│   ├── images/                # Alle Bilder inkl. responsiver srcset-Varianten
│   ├── fonts/                 # Boska Variable (self-hosted)
│   └── video/
└── vercel.json                # Clean URLs + Cache-Header
```

## Lokale Vorschau

```bash
cd niemals-clone
python3 -m http.server 8131
# -> http://localhost:8131
```

## Deployment (Vercel)

Statisches Projekt, kein Framework / Build-Command nötig.

```bash
npm i -g vercel      # falls noch nicht installiert
vercel               # Preview-Deploy
vercel --prod        # Produktiv-Deploy
```

`vercel.json` aktiviert `cleanUrls`, sodass `/datenschutz` die Datei
`datenschutz.html` ausliefert (genau wie beim Original).

## Schriften

| Schrift            | Verwendung               | Quelle                                   |
|--------------------|--------------------------|------------------------------------------|
| Georgia            | Wortmarke „NIEMALS“      | System-Schrift                           |
| Droid Serif        | Fließtext                | Google Fonts (WebFont Loader)            |
| Superclarendon     | Body / Überschriften     | **Adobe Fonts (Typekit-Kit `hfi7ivv`)**  |
| Boska Variable     | (deklariert)             | self-hosted unter `assets/fonts/`        |

> **Wichtig nach dem Deploy:** Das Adobe-Fonts-Kit `hfi7ivv` ist domaingebunden.
> Damit *Superclarendon* auch unter der neuen (Vercel-)Domain lädt, die Domain in den
> Adobe-Fonts-Kit-Einstellungen als erlaubte Domain hinzufügen. Andernfalls greift der
> Fallback `sans-serif`.

## Hinweise

- Google Analytics (`G-NG7B3PHR6D`) wurde aus dem Original übernommen.
- `prefers-reduced-motion` wird respektiert – Animationen werden dann übersprungen.
- Fällt GSAP (CDN) aus, zeigt eine Sicherheitsroutine trotzdem die komplette Seite.
