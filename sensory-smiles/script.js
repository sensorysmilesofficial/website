(() => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const backdrop = document.querySelector(".nav-backdrop");

  const setOpen = (open) => {
    if (!toggle || !nav || !backdrop) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close Menu" : "Open Menu");
    nav.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    nav.hidden = !open;
    backdrop.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  backdrop?.addEventListener("click", () => setOpen(false));

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  // Location cards: pulse on click; follow real links when set
  document.querySelectorAll(".location-card[href]").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.remove("is-pressed");
      void card.offsetWidth;
      card.classList.add("is-pressed");
    });

    card.addEventListener("animationend", () => {
      card.classList.remove("is-pressed");
    });
  });

  // Homepage title: pin over the hero image, fade out at the image's
  // top edge (same idea as the white caption fade), and release when
  // the white mission card arrives.
  const title = document.querySelector(".hero-title");
  const missionCard = document.querySelector(".mission-card");
  const header = document.querySelector(".site-header");
  const caption = document.querySelector(".hero-frame figcaption");
  const heroFrame = document.querySelector(".hero-frame");

  if (title && missionCard && header) {
    const spacer = document.createElement("div");
    spacer.className = "hero-title-spacer";
    spacer.setAttribute("aria-hidden", "true");
    title.after(spacer);

    let naturalTop = 0;

    const measure = () => {
      const pinned = title.classList.contains("is-pinned");
      if (pinned) {
        title.classList.remove("is-pinned");
        title.style.top = "";
        title.style.opacity = "";
        spacer.style.height = "0px";
      }
      naturalTop = title.getBoundingClientRect().top + window.scrollY;
      if (pinned) update();
    };

    const update = () => {
      const headerH = header.offsetHeight;
      const titleH = title.offsetHeight;
      const missionTop = missionCard.getBoundingClientRect().top;
      const startY = naturalTop - headerH;
      const titleBottom = headerH + titleH;

      if (caption) {
        const captionTop = caption.getBoundingClientRect().top;
        const fadeStart = titleBottom + 56;
        const fadeEnd = titleBottom + 8;
        if (captionTop >= fadeStart) {
          caption.style.opacity = "1";
        } else if (captionTop <= fadeEnd) {
          caption.style.opacity = "0";
        } else {
          const t = (captionTop - fadeEnd) / (fadeStart - fadeEnd);
          caption.style.opacity = String(Math.max(0, Math.min(1, t)));
        }
      }

      // Fade the title as the hero image's top edge reaches the header.
      if (heroFrame) {
        const frameTop = heroFrame.getBoundingClientRect().top;
        const titleFadeStart = headerH + 40;
        const titleFadeEnd = headerH - 12;
        if (frameTop >= titleFadeStart) {
          title.style.opacity = "1";
        } else if (frameTop <= titleFadeEnd) {
          title.style.opacity = "0";
        } else {
          const t =
            (frameTop - titleFadeEnd) / (titleFadeStart - titleFadeEnd);
          title.style.opacity = String(Math.max(0, Math.min(1, t)));
        }
      }

      if (window.scrollY < startY) {
        title.classList.remove("is-pinned");
        title.style.top = "";
        spacer.style.height = "0px";
        return;
      }

      // Stay fixed under the header; only release when the white
      // mission card reaches the title.
      const holdUntil = headerH + titleH * 0.2;
      const pinnedTop =
        missionTop > holdUntil ? headerH : missionTop - titleH;

      spacer.style.height = `${titleH}px`;
      title.classList.add("is-pinned");
      title.style.top = `${pinnedTop}px`;
    };

    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      update();
    });
  }
  // Match about story photo stack height to the text column
  const storyCopy = document.querySelector(".about-story-copy");
  const storyMedia = document.querySelector(".about-story-media");
  if (storyCopy && storyMedia) {
    const figures = [...storyMedia.querySelectorAll(".about-side")];
    const imgs = [...storyMedia.querySelectorAll("img")];
    let balanceTimer = 0;

    const resetBalance = () => {
      storyMedia.style.gap = "";
      figures.forEach((fig) => {
        fig.style.height = "";
      });
      imgs.forEach((img) => {
        img.style.height = "";
        img.style.aspectRatio = "";
      });
    };

    const balanceColumns = () => {
      resetBalance();
      if (window.matchMedia("(max-width: 760px)").matches) return;
      if (!figures.length) return;

      const copyH = storyCopy.getBoundingClientRect().height;
      const gap = parseFloat(getComputedStyle(storyMedia).gap) || 16;
      const available = Math.max(160, copyH);
      const each = (available - gap * (figures.length - 1)) / figures.length;
      if (each < 96) return;

      figures.forEach((fig) => {
        fig.style.height = `${each}px`;
        const img = fig.querySelector("img");
        if (img) {
          img.style.height = "100%";
          img.style.aspectRatio = "auto";
        }
      });
    };

    const scheduleBalance = () => {
      window.clearTimeout(balanceTimer);
      balanceTimer = window.setTimeout(() => {
        requestAnimationFrame(balanceColumns);
      }, 50);
    };

    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", scheduleBalance, { once: true });
    });
    if (document.fonts?.ready) document.fonts.ready.then(scheduleBalance);
    window.addEventListener("resize", scheduleBalance);
    scheduleBalance();
    window.setTimeout(scheduleBalance, 350);
  }

  // About page sliding photo strip (loops)
  const carousel = document.querySelector(".about-carousel");
  if (carousel) {
    const track = carousel.querySelector(".about-carousel-track");
    const slides = [...carousel.querySelectorAll(".about-carousel-slide")];
    const prev = carousel.querySelector(".about-carousel-btn.prev");
    const next = carousel.querySelector(".about-carousel-btn.next");
    let index = 0;

    const visibleCount = () => {
      if (window.matchMedia("(max-width: 760px)").matches) return 2;
      return 3;
    };

    const maxIndex = () => Math.max(0, slides.length - visibleCount());

    const update = () => {
      if (!track || !slides.length) return;
      const slide = slides[0];
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const step = slide.getBoundingClientRect().width + gap;
      track.style.transform = `translateX(-${index * step}px)`;
    };

    prev?.addEventListener("click", () => {
      const max = maxIndex();
      index = index <= 0 ? max : index - 1;
      update();
    });
    next?.addEventListener("click", () => {
      const max = maxIndex();
      index = index >= max ? 0 : index + 1;
      update();
    });

    window.addEventListener("resize", update);
    update();
  }
})();
