(function () {
  var cfg = window.MYSTAND || {};
  var price = cfg.PRICE_LABEL || "R$ 247";
  var checkout = (cfg.CHECKOUT_URL || "").trim();
  var company = cfg.COMPANY_NAME || "Família ComNext";

  function qs(sel, root) {
    return (root || document).querySelectorAll(sel);
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function eventId(name) {
    try {
      if (window.crypto && crypto.randomUUID) return name + "_" + crypto.randomUUID();
    } catch (e) {}
    return name + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  function track(event, extra) {
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", event, extra || {}, { eventID: eventId(event) });
      }
    } catch (e) {}
  }

  function pageKind() {
    var p = (location.pathname || "").toLowerCase();
    if (/contato\.html/.test(p)) return "contato";
    if (/ir-pagar\.html/.test(p)) return "pagar";
    if (/obrigado\.html/.test(p)) return "obrigado";
    if (/index\.html$/.test(p) || /\/kdp\/?$/.test(p) || /\/$/.test(p) || p === "") return "landing";
    return "other";
  }

  function pagarHref() {
    return /\/legal\//.test(location.pathname) ? "../ir-pagar.html" : "ir-pagar.html";
  }

  function offerPayload() {
    return {
      content_name: "My Stand codigo-fonte",
      content_ids: ["mystand-fonte"],
      content_type: "product",
      value: cfg.PRICE || 247,
      currency: "BRL"
    };
  }

  function injectPixel(id) {
    if (!id || window.fbq) return;
    var n = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    var first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(s, first);
    n("init", id);
    n("track", "PageView");
  }

  function fillLegal() {
    qs("[data-company]").forEach(function (el) {
      el.textContent = company;
    });
    var map = {
      LEGAL_NAME: cfg.LEGAL_NAME,
      CNPJ: cfg.CNPJ,
      ADDRESS: cfg.ADDRESS,
      EMAIL: cfg.EMAIL,
      PHONE: cfg.PHONE
    };
    Object.keys(map).forEach(function (key) {
      var val = (map[key] || "").trim();
      qs("[data-legal='" + key + "']").forEach(function (el) {
        if (val) {
          el.textContent = val;
          el.hidden = false;
          if (el.parentElement && el.parentElement.hasAttribute("data-legal-row")) {
            el.parentElement.hidden = false;
          }
        } else {
          var row = el.closest("[data-legal-row]");
          if (row) row.hidden = true;
        }
      });
      qs("a[data-legal-href='" + key + "']").forEach(function (el) {
        var row = el.closest("[data-legal-row]");
        if (!val) {
          el.hidden = true;
          if (row) row.hidden = true;
          return;
        }
        if (key === "EMAIL") el.href = "mailto:" + val;
        if (key === "PHONE") el.href = "tel:" + val.replace(/\s/g, "");
        el.textContent = val;
        el.hidden = false;
        if (row) row.hidden = false;
      });
    });
  }

  function wireCtas() {
    qs("[data-price]").forEach(function (el) {
      el.textContent = price;
    });

    qs("[data-checkout]").forEach(function (el) {
      if (checkout) {
        el.setAttribute("href", checkout);
        el.setAttribute("rel", "noopener noreferrer");
        el.removeAttribute("target");
        el.classList.remove("is-wait");
        el.addEventListener("click", function () {
          track("InitiateCheckout", offerPayload());
        });
      } else {
        el.setAttribute("href", "#oferta");
        el.classList.remove("is-wait");
      }
    });
  }

  function nav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var panel = document.querySelector(".nav-panel");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("nav-open", open);
      });
      panel.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          panel.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.classList.remove("nav-open");
        });
      });
    }
    var onScroll = function () {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function reveal() {
    var nodes = qs("[data-reveal]");
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function studioCarousel() {
    var shell = document.querySelector("[data-studio]");
    if (!shell) return;

    var track = shell.querySelector(".studio-track");
    var cards = track ? Array.prototype.slice.call(track.querySelectorAll(".studio-card")) : [];
    var prev = shell.querySelector("[data-studio-prev]");
    var next = shell.querySelector("[data-studio-next]");
    var dotsBox = shell.querySelector("[data-studio-dots]");
    if (!track || !cards.length) return;

    var imgBase = (shell.getAttribute("data-img") || "img/").replace(/\/?$/, "/");
    var index = 0;
    var ticking = false;

    function boot() {
      if (shell.getAttribute("data-ready") === "1") return;
      shell.setAttribute("data-ready", "1");
      shell.classList.add("is-booted");
      buildDots();
      hydrateAround(0);
      goTo(nearestIndex(), false);
      bind();
    }

    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = "";
      cards.forEach(function (card, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "studio-dot";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-label", "Ir para o card " + (i + 1) + " de " + cards.length);
        btn.addEventListener("click", function () {
          goTo(i, true);
        });
        dotsBox.appendChild(btn);
      });
    }

    function hydrateCard(card) {
      if (!card || card.getAttribute("data-hydrated") === "1") return;
      card.setAttribute("data-hydrated", "1");
      var visual = card.querySelector(".studio-visual");
      var img = card.querySelector("img[data-file]");
      if (!visual) return;
      if (!img) {
        visual.classList.add("is-ready");
        return;
      }
      var file = img.getAttribute("data-file") || "";
      var fallback = img.getAttribute("data-fallback") || file;
      function ready() {
        visual.classList.add("is-ready");
      }
      img.addEventListener("load", ready);
      img.addEventListener("error", function () {
        if (img.getAttribute("data-tried-fallback") === "1") {
          ready();
          return;
        }
        img.setAttribute("data-tried-fallback", "1");
        img.src = imgBase + fallback;
      });
      img.src = imgBase + file;
      if (img.complete && img.naturalWidth) ready();
    }

    function hydrateAround(i) {
      hydrateCard(cards[i]);
      hydrateCard(cards[i + 1]);
      hydrateCard(cards[i - 1]);
    }

    function nearestIndex() {
      var origin = cards[0].offsetLeft;
      var left = track.scrollLeft;
      var best = 0;
      var dist = Infinity;
      cards.forEach(function (card, i) {
        var d = Math.abs(card.offsetLeft - origin - left);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      return best;
    }

    function goTo(i, smooth) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      index = i;
      hydrateAround(i);
      track.scrollTo({
        left: cards[i].offsetLeft - cards[0].offsetLeft,
        behavior: smooth ? "smooth" : "auto"
      });
      paint();
    }

    function paint() {
      cards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === index);
      });
      if (dotsBox) {
        Array.prototype.forEach.call(dotsBox.children, function (dot, i) {
          dot.classList.toggle("is-on", i === index);
          dot.setAttribute("aria-selected", i === index ? "true" : "false");
        });
      }
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === cards.length - 1;
    }

    function bind() {
      if (prev) {
        prev.addEventListener("click", function () {
          goTo(index - 1, true);
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          goTo(index + 1, true);
        });
      }
      track.addEventListener(
        "scroll",
        function () {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(function () {
            index = nearestIndex();
            hydrateAround(index);
            paint();
            ticking = false;
          });
        },
        { passive: true }
      );
      track.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(index + 1, true);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(index - 1, true);
        }
      });
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach(hydrateCard);
    }

    if (!("IntersectionObserver" in window)) {
      boot();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            boot();
            io.disconnect();
          }
        });
      },
      { rootMargin: "280px 0px" }
    );
    io.observe(shell);
  }

  function funnelPages() {
    var kind = pageKind();
    if (kind === "landing") {
      track("ViewContent", offerPayload());
      return;
    }
    if (kind === "contato") {
      track("Lead", { content_name: "Contato My Stand" });
      return;
    }
    if (kind === "pagar") {
      if (checkout) {
        track("InitiateCheckout", offerPayload());
        window.setTimeout(function () {
          location.replace(checkout);
        }, 450);
      } else {
        location.replace("index.html#oferta");
      }
      return;
    }
    if (kind === "obrigado") {
      track("Purchase", offerPayload());
    }
  }

  ready(function () {
    if (cfg.PIXEL_ID) injectPixel(cfg.PIXEL_ID);
    fillLegal();
    wireCtas();
    nav();
    reveal();
    studioCarousel();
    funnelPages();
  });
})();
