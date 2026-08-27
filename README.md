# site/

Static personal site — no build step, no dependencies. Open `site/index.html` directly,
or serve the folder:

```bash
python -m http.server 8000 --directory site
```

## Layout

```
site/
├── index.html                                  # landing page (entry list)
├── blog/2026/observer-forecaster/index.html    # thesis entry (content still blank)
└── assets/
    ├── css/main.css                            # all styling + light/dark tokens
    └── js/
        ├── posts.js                            # THE entry list + search keywords
        └── main.js                             # theme toggle, ctrl-k search, list rendering
```

## Adding an entry

1. Copy `blog/2026/observer-forecaster/index.html` to `blog/<year>/<slug>/index.html`,
   edit the title / lede / meta block, and write inside `<div class="post-body">`.
   Keep `data-root` on `<body>` pointing back to `site/` (`../../../` at that depth).
2. Add one object to `window.SITE_POSTS` in `assets/js/posts.js`. That single object feeds
   both the landing-page list and the ctrl-k search index. `tags` show under the entry and
   rank first in search — they start empty, fill them in with your own keywords.

## Notes

- Light (white/violet) is the default theme; the header toggle switches to midnight
  violet and the choice is remembered in `localStorage`.
- `ctrl k` / `cmd k` opens search; `↑` `↓` move, `enter` opens, `esc` closes.
- The affiliation field on the thesis page lives in the post
  `.post-meta` block.
