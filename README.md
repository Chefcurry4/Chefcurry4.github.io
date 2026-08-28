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

## Thesis page building blocks

The thesis entry is scaffolded with section titles only — the prose is still to be written.
Classes available inside `.post-body`:

| Class | What it is |
|---|---|
| `.abstract` | violet-to-blue washed block with an `.abstract__label` |
| `.contents` + `.contents__list` | the contents rail; `.contents__num` is the blue part label |
| `.section` + `.section__head` | one part; `__eyebrow` (blue, mono), `__title`, `__standfirst` |
| `.questions` | the bordered question table; each `li` holds `.questions__id`, `.questions__q`, `.questions__scope` |
| `.todo` | dashed "not yet written" pill — delete as each section is filled in |
| `.timeline` | vertical rail; `data-state="done"` or `data-state="now"` on an `li` fills/haloes its dot |

Write prose as plain `<p>` inside a `.section`. Labels and scope notes use `<div>`, not `<p>`,
so `.post-body p` margins don't fight them.

## Design

- **Type** — Geist (Vercel) for titles, brand, section heads and question text via
  `--font-display`; Geist Mono for eyebrows and labels; Roboto stays the body face.
- **Palette** — violet-black ink (`--text`) cooling to blue-grey for secondary text,
  violet `--accent` carrying structure and blue `--accent-2` carrying the annotative layer
  (eyebrows, part labels, timeline dots).
- **Themes** — light is the default; the header toggle switches to midnight violet and the
  choice is remembered in `localStorage`. Both themes are defined explicitly.

## Keyboard

`ctrl k` / `cmd k` opens search · `↑` `↓` move · `enter` opens · `esc` closes.
