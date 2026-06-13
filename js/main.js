/* =========================================================================
   NIEMALS – interactions (GSAP)
   Replaces the old Webflow IX2 / jQuery runtime. Drives:
     • the intro curtain + first-paint reveal
     • per-image scroll reveals, parallax and the 1.3x zoom-out
     • the staggered "NIEMALS" overlay letters
     • copy / video / footer reveals
     • the mobile navigation (hamburger) that Webflow JS used to handle
   Colours, type and shadows are untouched – this only animates them.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---- Safety net -------------------------------------------------------
     If GSAP didn't load (offline / CDN blocked), reveal everything and
     wire up only the (CSS-driven) mobile nav so the page is never broken. */
  var hasGSAP = typeof window.gsap !== "undefined";
  if (!hasGSAP) {
    root.classList.remove("js-anim");
    document.body && document.body.classList.add("nm-loaded");
    initNav();
    hideLoaderImmediately();
    return;
  }

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  gsap.defaults({ ease: "power3.out", duration: 1 });

  /* =======================================================================
     NAV (mobile menu + scroll state)
     ===================================================================== */
  function initNav() {
    var wrapper = document.querySelector(".navbar_wrapper");
    var button = document.querySelector(".menu-button");
    var menu = document.querySelector(".navbar_menu.w-nav-menu");
    if (!wrapper || !button || !menu) return;

    var open = false;
    var mq = window.matchMedia("(max-width: 991px)");

    function setOpen(next) {
      open = next;
      wrapper.classList.toggle("nm-nav-open", open);
      document.body.classList.toggle("nm-menu-lock", open && mq.matches);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    }

    button.setAttribute("aria-label", "Menü");
    button.setAttribute("aria-expanded", "false");

    button.addEventListener("click", function (e) {
      e.preventDefault();
      setOpen(!open);
    });

    // Close when a link inside the menu is tapped
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (open) setOpen(false);
      });
    });

    // Reset when leaving the mobile breakpoint
    (mq.addEventListener
      ? mq.addEventListener.bind(mq, "change")
      : mq.addListener.bind(mq))(function () {
      if (!mq.matches && open) setOpen(false);
    });

    // Subtle shadow once scrolled away from the very top
    var onScroll = function () {
      wrapper.classList.toggle("nm-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* =======================================================================
     LOADER
     ===================================================================== */
  function hideLoaderImmediately() {
    var loader = document.querySelector(".nm-loader");
    if (loader) loader.style.display = "none";
  }

  /* =======================================================================
     INTRO + SCROLL ANIMATIONS
     ===================================================================== */
  // Force the page into its final, fully-visible state. Safe to call
  // any number of times. Used by the reduced-motion path and the watchdog
  // so the intro curtain can NEVER permanently block the content.
  function forceReveal() {
    document.body.classList.add("nm-loaded");
    hideLoaderImmediately();
    if (hasGSAP) {
      gsap.set(
        ".screen_bg, .navbar_inner, .scroll_img, .scroll_copy_inner, .music_content_inner, .music_image_wrapper, .footer_top-wrapper, .footer_line-divider, .rl_footer4_bottom-wrapper",
        { clearProps: "opacity,transform" }
      );
      gsap.set('.header_text[style*="opacity"]', { opacity: 1 });
    }
    root.classList.remove("js-anim");
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function initAnimations() {
    var ST = window.ScrollTrigger;

    /* --- Reduced motion: reveal instantly, skip the choreography ------- */
    if (reduceMotion) {
      forceReveal();
      return;
    }

    /* --- Build the loader letters -------------------------------------- */
    var loaderMark = document.querySelector(".nm-loader__mark");

    /* --- Intro timeline ------------------------------------------------- */
    var intro = gsap.timeline({ onComplete: settle });

    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      document.body.classList.add("nm-loaded");
      if (ST) ST.refresh();
    }

    /* If the intro can't run to completion on its own — a tab opened in the
       background pauses requestAnimationFrame, freezing GSAP's ticker, or a
       tween throws — snap the timeline to its finished state so the navbar,
       hero and paper background are NEVER stuck in their hidden start state. */
    function catchUpIntro() {
      if (settled) return;
      intro.progress(1); // jump every tween to its end (fires onComplete)
      settle(); // belt-and-suspenders if the progress() events were suppressed
    }

    /* --- Watchdog + visibility catch-up -------------------------------- */
    var watchdog = window.setTimeout(catchUpIntro, 3500);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) catchUpIntro();
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) catchUpIntro();
    });

    if (loaderMark) {
      var letters = loaderMark.querySelectorAll("span");
      intro
        .from(letters, {
          yPercent: 110,
          opacity: 0,
          duration: 0.7,
          stagger: 0.05,
          ease: "power4.out",
        })
        .to(letters, {
          yPercent: -110,
          opacity: 0,
          duration: 0.5,
          stagger: 0.03,
          ease: "power3.in",
          delay: 0.25,
        })
        .to(
          ".nm-loader",
          { opacity: 0, duration: 0.6, ease: "power2.inOut" },
          "-=0.2"
        );
    }

    // Paper background settles in behind everything
    intro.to(
      ".screen_bg",
      { opacity: 1, duration: 1.4, ease: "power2.out" },
      loaderMark ? "-=1.0" : 0
    );

    // Navbar drops in
    intro.from(
      ".navbar_inner",
      { y: -28, opacity: 0, duration: 0.9 },
      "-=1.1"
    );

    // First (header) image reveal
    var headerImgDiv = document.querySelector(".scroll_img_div.header");
    if (headerImgDiv) {
      var headerImg = headerImgDiv.querySelector(".scroll_img");
      intro.fromTo(
        headerImg,
        { opacity: 0, scale: 1.18 },
        { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" },
        "-=0.9"
      );
      // Header overlay letters stagger in straight away
      var headerLetters = headerImgDiv.querySelectorAll(
        '.header_text[style*="opacity"]'
      );
      if (headerLetters.length) {
        intro.to(
          headerLetters,
          { opacity: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" },
          "-=0.8"
        );
      }
    }

    if (!ST) {
      // No ScrollTrigger -> just reveal remaining content
      gsap.set(
        ".scroll_img, .scroll_copy_inner, .music_content_inner, .music_image_wrapper, .footer_top-wrapper, .footer_line-divider, .rl_footer4_bottom-wrapper",
        { clearProps: "opacity" }
      );
      root.classList.remove("js-anim");
      return;
    }

    /* --- Per-image reveals + parallax (skip the header img, already in) - */
    gsap.utils.toArray(".scroll_img_div").forEach(function (div) {
      if (div.classList.contains("header")) return;
      var img = div.querySelector(".scroll_img");
      if (!img) return;

      // Does the markup ask for the 1.3x zoom-out? (inline scale3d)
      var styleAttr = img.getAttribute("style") || "";
      var wantsZoom = /scale3d\(1\.3/.test(styleAttr);
      img.style.removeProperty("transform"); // hand control to GSAP

      gsap.fromTo(
        img,
        { opacity: 0, scale: wantsZoom ? 1.3 : 1.12 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: div,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Gentle parallax drift while the image travels through the viewport
      gsap.fromTo(
        img,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: div,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    });

    /* --- "NIEMALS" overlay letters: stagger in on enter ---------------- */
    gsap.utils.toArray(".scroll_logo_container").forEach(function (container) {
      // skip the header containers (handled in the intro timeline)
      if (container.closest(".scroll_img_div.header")) return;
      var letters = container.querySelectorAll('.header_text[style*="opacity"]');
      if (!letters.length) return;
      gsap.to(letters, {
        opacity: 1,
        duration: 0.7,
        stagger: 0.07,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    });

    /* --- Copy blocks ---------------------------------------------------- */
    gsap.utils.toArray(".scroll_copy_inner").forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    /* --- Video section -------------------------------------------------- */
    var musicText = document.querySelector(".music_content_inner");
    var musicVideo = document.querySelector(".music_image_wrapper");
    if (musicText || musicVideo) {
      var mt = gsap.timeline({
        scrollTrigger: {
          trigger: ".music_component",
          start: "top 78%",
          toggleActions: "play none none none",
        },
      });
      if (musicText)
        mt.fromTo(
          musicText,
          { opacity: 0, x: -32 },
          { opacity: 1, x: 0, duration: 1 },
          0
        );
      if (musicVideo)
        mt.fromTo(
          musicVideo,
          { opacity: 0, y: 40, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1.1 },
          0.1
        );
    }

    /* --- Footer --------------------------------------------------------- */
    var footerBits = [
      ".footer_top-wrapper",
      ".footer_line-divider",
      ".rl_footer4_bottom-wrapper",
    ]
      .map(function (s) {
        return document.querySelector(s);
      })
      .filter(Boolean);
    if (footerBits.length) {
      gsap.fromTo(
        footerBits,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".footer_component",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }

  /* =======================================================================
     BOOT
     ===================================================================== */
  function boot() {
    initNav();
    initAnimations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
