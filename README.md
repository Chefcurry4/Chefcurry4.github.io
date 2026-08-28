# Chefcurry4.github.io

**Live: <https://chefcurry4.github.io/>**

Personal site — notes and write-ups on my thesis and other projects. Static: no build step,
no dependencies, no framework. GitHub Pages serves `main` from the repository root
(`.nojekyll` is present so `assets/` is published verbatim).

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8000
```

## Layout

```
.
├── index.html                             # landing page (entry list)
├── blog/2026/observer-forecaster/         # thesis write-up
│   └── index.html
└── assets/
    ├── css/main.css                       # all styling + light/dark tokens
    └── js/
        ├── posts.js                       # THE entry list + search keywords
        └── main.js                        # theme toggle, ctrl-k search, list rendering
```

## Adding an entry

1. Copy `blog/2026/observer-forecaster/index.html` to `blog/<year>/<slug>/index.html`,
   edit the title / lede / meta block, and write inside `<div class="post-body">`.
   Keep `data-root` on `<body>` pointing back to the repo root (`../../../` at that depth).
2. Add one object to `window.SITE_POSTS` in `assets/js/posts.js`. That single object feeds
   both the landing-page list and the ctrl-k search index. `tags` show under the entry and
   rank first in search.

## Thesis page

`blog/2026/observer-forecaster/index.html` currently holds the nine section headings and a
contents list — the prose is still to be written. Each section is:

```html
<section class="section" id="part-0">
  <h2 class="section__title">Part 0 — What the model actually is</h2>
  <p class="soon">Coming soon.</p>
</section>
```

Replace the `.soon` line with ordinary `<p>` paragraphs as each section gets written.

## Design

- **Type** — Geist (Vercel) for titles, the brand and section headings, via `--font-display`.
  Reading text uses the native system stack, so it renders as Segoe UI on Windows and SF on
  macOS. Geist is the only webfont loaded.
- **Palette** — violet-black ink cooling to blue-grey for secondary text, with violet
  `--accent` for links and accents and blue `--accent-2` held in reserve.
- **Themes** — light is the default; the header toggle switches to midnight violet and the
  choice is remembered in `localStorage`.

## Keyboard

`ctrl k` / `cmd k` opens search · `↑` `↓` move · `enter` opens · `esc` closes.
