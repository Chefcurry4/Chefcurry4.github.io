/* ---------------------------------------------------------------------------
   Theme toggle + ctrl-k keyword search. No build step, no dependencies.
   Every page carries `data-root` on <body> so links work from any depth and
   from the file:// protocol as well as from a served site.
   --------------------------------------------------------------------------- */
(function () {
  "use strict";

  var STORAGE_KEY = "site-theme";

  /* Line-art calendar that inherits the surrounding text colour. */
  var CALENDAR_ICON =
    '<svg class="tag__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' +
    '<rect x="3.25" y="5" width="17.5" height="15.75" rx="3" />' +
    '<path d="M3.25 9.75h17.5M8.25 3.25v3.5M15.75 3.25v3.5" />' +
    '<circle cx="8.6" cy="14.4" r="1.05" fill="currentColor" stroke="none" />' +
    "</svg>";

  /* ------------------------------------------------------------- theming -- */
  function preferredTheme() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (err) {
      /* private mode: fall back to the default below */
    }
    return "light"; /* light is the default; the header toggle opts into midnight */
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      /* nothing to persist to; the in-page toggle still works */
    }
  }

  applyTheme(preferredTheme());

  /* ---------------------------------------------------------- post index -- */
  function postIndex() {
    var posts = window.SITE_POSTS || [];
    return posts.map(function (post) {
      var haystack = [post.title, post.description]
        .concat(post.tags || [], [post.year || ""])
        .join(" ")
        .toLowerCase();
      return { post: post, haystack: haystack };
    });
  }

  function scoreEntry(entry, query) {
    var title = entry.post.title.toLowerCase();
    if (title.indexOf(query) !== -1) return 0;
    var tagHit = (entry.post.tags || []).some(function (tag) {
      return tag.toLowerCase().indexOf(query) !== -1;
    });
    if (tagHit) return 1;
    return entry.haystack.indexOf(query) !== -1 ? 2 : -1;
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function highlight(text, query) {
    var safe = escapeHtml(text);
    if (!query) return safe;
    var at = safe.toLowerCase().indexOf(query);
    if (at === -1) return safe;
    return (
      safe.slice(0, at) +
      "<mark>" +
      safe.slice(at, at + query.length) +
      "</mark>" +
      safe.slice(at + query.length)
    );
  }

  /* --------------------------------------------------------------- search -- */
  function setupSearch(root) {
    var overlay = document.getElementById("search-overlay");
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    if (!overlay || !input || !results) return;

    var index = postIndex();
    var active = 0;

    function render(query) {
      var matches = index;
      if (query) {
        matches = index
          .map(function (entry) {
            return { entry: entry, score: scoreEntry(entry, query) };
          })
          .filter(function (hit) {
            return hit.score >= 0;
          })
          .sort(function (a, b) {
            return a.score - b.score;
          })
          .map(function (hit) {
            return hit.entry;
          });
      }

      if (!matches.length) {
        results.innerHTML = '<li class="search-empty">No entries match that keyword.</li>';
        return;
      }

      active = 0;
      results.innerHTML = matches
        .map(function (entry, i) {
          var post = entry.post;
          var meta = [post.date].concat(post.tags || []).join("  ·  ");
          return (
            '<li class="' +
            (i === 0 ? "is-active" : "") +
            '"><a href="' +
            root +
            post.url +
            '"><span class="search-results__title">' +
            highlight(post.title, query) +
            '</span><span class="search-results__meta">' +
            highlight(meta, query) +
            "</span></a></li>"
          );
        })
        .join("");
    }

    function move(delta) {
      var items = results.querySelectorAll("li");
      if (!items.length || items[0].classList.contains("search-empty")) return;
      items[active] && items[active].classList.remove("is-active");
      active = (active + delta + items.length) % items.length;
      items[active].classList.add("is-active");
      items[active].scrollIntoView({ block: "nearest" });
    }

    function open() {
      overlay.classList.add("is-open");
      input.value = "";
      render("");
      input.focus();
    }

    function close() {
      overlay.classList.remove("is-open");
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-search-open]"), function (btn) {
      btn.addEventListener("click", open);
    });

    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) close();
    });

    input.addEventListener("input", function () {
      render(input.value.trim().toLowerCase());
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "Enter") {
        var link = results.querySelector("li.is-active a");
        if (link) {
          event.preventDefault();
          window.location.href = link.getAttribute("href");
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      var isOpen = overlay.classList.contains("is-open");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        isOpen ? close() : open();
      } else if (event.key === "Escape" && isOpen) {
        close();
      }
    });
  }

  /* ------------------------------------------------------------ post list -- */
  function renderPostList(root) {
    var list = document.getElementById("post-list");
    if (!list) return;

    list.innerHTML = (window.SITE_POSTS || [])
      .map(function (post) {
        var tags = (post.tags || [])
          .map(function (tag) {
            return (
              '<button type="button" class="tag tag--link" data-tag="' +
              escapeHtml(tag) +
              '">#&hairsp;' +
              escapeHtml(tag) +
              "</button>"
            );
          })
          .join("");
        var yearChip =
          '<span class="tag tag--year">' +
          CALENDAR_ICON +
          escapeHtml(post.year || "") +
          "</span>" +
          (tags ? '<span class="tag-sep">·</span>' : "");
        return (
          '<hr /><article class="post-item">' +
          '<h2 class="post-item__title"><a href="' +
          root +
          post.url +
          '">' +
          escapeHtml(post.title) +
          "</a></h2>" +
          '<p class="post-item__desc">' +
          escapeHtml(post.description) +
          "</p>" +
          '<div class="post-item__meta"><span>' +
          escapeHtml(post.readTime || "") +
          "</span><span>·</span><span>" +
          escapeHtml(post.date) +
          "</span></div>" +
          '<div class="post-item__tags">' +
          yearChip +
          tags +
          "</div></article>"
        );
      })
      .join("");
  }


  /* ----------------------------------------------------- contents rail ---
     Highlights the section you are currently reading, Overleaf-style.
     Falls back silently on pages with no rail.
     --------------------------------------------------------------------- */
  function setupContentsRail() {
    var links = [].slice.call(document.querySelectorAll(".post-toc__list a"));
    if (!links.length) return;

    var sections = links
      .map(function (a) {
        var el = document.getElementById(a.getAttribute("href").slice(1));
        return el ? { el: el, link: a } : null;
      })
      .filter(Boolean);
    if (!sections.length) return;

    var current = null;
    var holdUntil = 0; /* scroll-driven updates stay quiet while a clicked jump settles */

    function mark(entry) {
      if (entry === current) return;
      if (current) current.link.classList.remove("is-current");
      entry.link.classList.add("is-current");
      current = entry;
    }

    /* Clicking an entry selects it outright; sections near the page bottom can
       never scroll up into the reading band, so the observer alone would skip
       them. */
    sections.forEach(function (entry) {
      entry.link.addEventListener("click", function () {
        mark(entry);
        holdUntil = Date.now() + 1000;
      });
    });

    function atPageBottom() {
      var doc = document.documentElement;
      return window.innerHeight + window.pageYOffset >= doc.scrollHeight - 2;
    }

    function markFromViewport() {
      if (Date.now() < holdUntil) return;
      if (atPageBottom()) {
        mark(sections[sections.length - 1]);
        return;
      }
      /* the last chapter whose heading has crossed the trigger line wins;
         the line sits low enough that a section jumped to via the rail
         (which lands just under the header) still counts as its own */
      var line = window.innerHeight * 0.3;
      var pick = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.getBoundingClientRect().top <= line) pick = sections[i];
      }
      mark(pick);
    }

    var ticking = false;
    function onViewportChange() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        markFromViewport();
      });
    }

    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    markFromViewport();
  }

  /* ------------------------------------------------------------ tag graph --
     Obsidian-style force graph of posts and their tags. Opened by clicking
     any #tag chip; built lazily so pages without tags pay nothing.
     ----------------------------------------------------------------------- */
  function setupTagGraph(root) {
    var overlay = null;
    var canvas = null;
    var ctx = null;
    var focusEl = null;
    var nodes = [];
    var edges = [];
    var neighbors = [];
    var focusTag = null;
    var hovered = -1;
    var dragged = -1;
    var moved = false;
    var raf = 0;

    var FONT = '12px Geist, "Segoe UI", system-ui, sans-serif';

    function shorten(text) {
      return text.length > 36 ? text.slice(0, 35).replace(/\s+\S*$/, "") + "…" : text;
    }

    function palette() {
      var cs = getComputedStyle(document.documentElement);
      function v(name) {
        return cs.getPropertyValue(name).trim();
      }
      return {
        accent: v("--accent"),
        text: v("--text-muted"),
        faint: v("--text-faint"),
        rule: v("--rule"),
      };
    }

    function size() {
      var dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function buildGraph() {
      var posts = window.SITE_POSTS || [];
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      var tagIndex = {};
      nodes = [];
      edges = [];
      posts.forEach(function (post, i) {
        var a = (i / Math.max(posts.length, 1)) * Math.PI * 2;
        nodes.push({
          kind: "post",
          label: shorten(post.title),
          url: root + post.url,
          x: w / 2 + Math.cos(a) * 30,
          y: h / 2 + Math.sin(a) * 30,
          vx: 0,
          vy: 0,
          r: 11,
        });
      });
      posts.forEach(function (post, i) {
        (post.tags || []).forEach(function (tag) {
          if (!(tag in tagIndex)) {
            var a = (nodes.length * 2.4) % (Math.PI * 2); /* golden-angle spread */
            tagIndex[tag] = nodes.length;
            nodes.push({
              kind: "tag",
              tag: tag,
              label: "#" + tag,
              x: w / 2 + Math.cos(a) * 120,
              y: h / 2 + Math.sin(a) * 120,
              vx: 0,
              vy: 0,
              r: 6.5,
            });
          }
          edges.push([i, tagIndex[tag]]);
        });
      });
      neighbors = nodes.map(function () {
        return {};
      });
      edges.forEach(function (e) {
        neighbors[e[0]][e[1]] = true;
        neighbors[e[1]][e[0]] = true;
      });
    }

    function step() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      var i;
      var j;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          var a = nodes[i];
          var b = nodes[j];
          var dx = b.x - a.x;
          var dy = b.y - a.y;
          var d2 = dx * dx + dy * dy + 60;
          var f = 2600 / (d2 * Math.sqrt(d2));
          a.vx -= f * dx;
          a.vy -= f * dy;
          b.vx += f * dx;
          b.vy += f * dy;
        }
      }
      edges.forEach(function (e) {
        var a = nodes[e[0]];
        var b = nodes[e[1]];
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = ((d - 105) * 0.015) / d;
        a.vx += f * dx;
        a.vy += f * dy;
        b.vx -= f * dx;
        b.vy -= f * dy;
      });
      nodes.forEach(function (n, k) {
        if (k === dragged) {
          n.vx = 0;
          n.vy = 0;
          return;
        }
        n.vx = (n.vx + (w / 2 - n.x) * 0.004) * 0.85;
        n.vy = (n.vy + (h / 2 - n.y) * 0.004) * 0.85;
        n.x += n.vx;
        n.y += n.vy;
      });
    }

    function draw() {
      var pal = palette();
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      var dimming = hovered >= 0;
      edges.forEach(function (e) {
        var on = !dimming || e[0] === hovered || e[1] === hovered;
        ctx.globalAlpha = on ? 0.9 : 0.15;
        ctx.strokeStyle = pal.rule;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodes[e[0]].x, nodes[e[0]].y);
        ctx.lineTo(nodes[e[1]].x, nodes[e[1]].y);
        ctx.stroke();
      });
      ctx.font = FONT;
      ctx.textAlign = "center";
      nodes.forEach(function (n, k) {
        var on = !dimming || k === hovered || neighbors[hovered][k];
        var alpha = on ? 1 : 0.15;
        var isFocus = n.kind === "tag" && n.tag === focusTag;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = n.kind === "post" || isFocus ? pal.accent : pal.faint;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        if (isFocus) {
          ctx.globalAlpha = alpha * 0.35;
          ctx.strokeStyle = pal.accent;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + 4.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = alpha;
        }
        ctx.fillStyle = isFocus ? pal.accent : n.kind === "post" ? pal.text : pal.faint;
        ctx.fillText(n.label, n.x, n.y + n.r + 16);
      });
      ctx.globalAlpha = 1;
    }

    function loop() {
      step();
      draw();
      raf = window.requestAnimationFrame(loop);
    }

    function localXY(event) {
      var rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function nodeAt(x, y) {
      for (var i = nodes.length - 1; i >= 0; i--) {
        var dx = x - nodes[i].x;
        var dy = y - nodes[i].y;
        var reach = nodes[i].r + 7;
        if (dx * dx + dy * dy <= reach * reach) return i;
      }
      return -1;
    }

    function close() {
      window.cancelAnimationFrame(raf);
      overlay.classList.remove("is-open");
    }

    function ensureOverlay() {
      if (overlay) return;
      overlay = document.createElement("div");
      overlay.className = "graph-overlay";
      overlay.innerHTML =
        '<div class="graph-panel">' +
        '<div class="graph-panel__bar"><span class="graph-panel__focus"></span>' +
        '<span class="graph-panel__hint">drag nodes · click a note to open it · esc</span></div>' +
        "<canvas></canvas></div>";
      document.body.appendChild(overlay);
      canvas = overlay.querySelector("canvas");
      focusEl = overlay.querySelector(".graph-panel__focus");
      ctx = canvas.getContext("2d");

      var downX = 0;
      var downY = 0;
      canvas.addEventListener("mousedown", function (event) {
        var p = localXY(event);
        dragged = nodeAt(p.x, p.y);
        moved = false;
        downX = p.x;
        downY = p.y;
      });
      canvas.addEventListener("mousemove", function (event) {
        var p = localXY(event);
        if (dragged >= 0) {
          var dx = p.x - downX;
          var dy = p.y - downY;
          if (dx * dx + dy * dy > 16) moved = true; /* a real drag, not click jitter */
          if (moved) {
            nodes[dragged].x = p.x;
            nodes[dragged].y = p.y;
          }
        } else {
          hovered = nodeAt(p.x, p.y);
          canvas.style.cursor = hovered >= 0 ? "pointer" : "default";
        }
      });
      canvas.addEventListener("mouseup", function () {
        if (dragged >= 0 && !moved) {
          var n = nodes[dragged];
          if (n.kind === "post") {
            window.location.href = n.url;
          } else {
            focusTag = n.tag;
            focusEl.textContent = "#" + n.tag;
          }
        }
        dragged = -1;
      });
      canvas.addEventListener("mouseleave", function () {
        hovered = -1;
        dragged = -1;
      });
      overlay.addEventListener("mousedown", function (event) {
        if (event.target === overlay) close();
      });
      window.addEventListener("resize", function () {
        if (overlay.classList.contains("is-open")) size();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && overlay.classList.contains("is-open")) close();
      });
    }

    function open(tag) {
      ensureOverlay();
      overlay.classList.add("is-open");
      focusTag = tag;
      focusEl.textContent = "#" + tag;
      size();
      buildGraph();
      hovered = -1;
      dragged = -1;
      window.cancelAnimationFrame(raf);
      loop();
    }

    document.addEventListener("click", function (event) {
      var chip = event.target.closest ? event.target.closest("[data-tag]") : null;
      if (chip) open(chip.getAttribute("data-tag"));
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.body.getAttribute("data-root") || "./";
    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) toggle.addEventListener("click", toggleTheme);
    renderPostList(root);
    setupSearch(root);
    setupContentsRail();
    setupTagGraph(root);
  });
})();
