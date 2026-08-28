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
            return '<span class="tag">#&hairsp;' + escapeHtml(tag) + "</span>";
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
    function mark(entry) {
      if (entry === current) return;
      if (current) current.link.classList.remove("is-current");
      entry.link.classList.add("is-current");
      current = entry;
    }

    if (!("IntersectionObserver" in window)) {
      mark(sections[0]);
      return;
    }

    var seen = {};
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          seen[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
        });
        // the topmost section still on screen wins
        for (var i = 0; i < sections.length; i++) {
          if (seen[sections[i].el.id] > 0) {
            mark(sections[i]);
            return;
          }
        }
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 1] }
    );

    sections.forEach(function (s) {
      observer.observe(s.el);
    });
    mark(sections[0]);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.body.getAttribute("data-root") || "./";
    var toggle = document.querySelector("[data-theme-toggle]");
    if (toggle) toggle.addEventListener("click", toggleTheme);
    renderPostList(root);
    setupSearch(root);
    setupContentsRail();
  });
})();
