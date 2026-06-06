document.getElementById("year").textContent = String(new Date().getFullYear());

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Smooth in-page navigation */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });
});

/* Sticky header */
const header = document.getElementById("site-header");
if (header) {
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* Scroll progress */
const progressBar = document.getElementById("scroll-progress-bar");
const updateProgress = () => {
  if (!progressBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${pct}%`;
};
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });

/* Back to top */
const backToTop = document.getElementById("back-to-top");
if (backToTop) {
  const toggleTop = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 480);
  };
  toggleTop();
  window.addEventListener("scroll", toggleTop, { passive: true });
  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });
}

/* Toast */
const toast = document.getElementById("toast");
let toastTimer;
const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
};

/* Copy email */
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.getAttribute("data-copy");
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast("Email copied to clipboard");
    } catch {
      showToast("Copy: " + value);
    }
  });
});

/* Scroll reveal */
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* Active nav */
const sections = ["about", "skills", "experience", "education", "projects", "contact"];
const navLinks = document.querySelectorAll(".main-nav a[href^='#']");

if (navLinks.length) {
  const sectionEls = sections
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = () => {
    const scrollY = window.scrollY + 120;
    let current = "about";
    sectionEls.forEach((section) => {
      if (section.offsetTop <= scrollY) current = section.id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute("href")?.slice(1);
      link.classList.toggle("is-active", href === current);
    });
  };

  setActive();
  window.addEventListener("scroll", setActive, { passive: true });
}

/* Hero rotating words */
const rotateRoot = document.querySelector(".hero-rotate");
if (rotateRoot && !prefersReducedMotion) {
  const words = [...rotateRoot.querySelectorAll(".hero-rotate__word")];
  let index = 0;

  setInterval(() => {
    const current = words[index];
    current.classList.remove("is-active");
    current.classList.add("is-exit");

    index = (index + 1) % words.length;
    const next = words[index];

    words.forEach((w) => {
      if (w !== next) w.classList.remove("is-active", "is-exit");
    });

    next.classList.add("is-active");
    setTimeout(() => current.classList.remove("is-exit"), 550);
  }, 2800);
}

/* Count-up stats */
const countEls = document.querySelectorAll("[data-count]");
if (countEls.length && !prefersReducedMotion) {
  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-count")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.classList.add("is-done");
    };

    requestAnimationFrame(tick);
  };

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  countEls.forEach((el) => countObserver.observe(el));
} else {
  countEls.forEach((el) => {
    const target = el.getAttribute("data-count");
    const suffix = el.getAttribute("data-suffix") || "";
    if (target) el.textContent = target + suffix;
  });
}

/* Timeline line draw on scroll */
const timelineSections = document.querySelectorAll(".timeline-section");
const updateTimeline = () => {
  timelineSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const start = vh * 0.2;
    const end = rect.height + vh * 0.3;
    const scrolled = Math.min(Math.max(start - rect.top, 0), end);
    const progress = end > 0 ? scrolled / end : 0;
    section.style.setProperty("--timeline-progress", String(Math.min(progress, 1)));
  });
};
updateTimeline();
window.addEventListener("scroll", updateTimeline, { passive: true });

/* Tag pop on click */
document.querySelectorAll(".tag-list--interactive li").forEach((tag) => {
  tag.addEventListener("click", () => {
    tag.classList.add("is-popped");
    setTimeout(() => tag.classList.remove("is-popped"), 420);
  });
});

/* Cursor glow + parallax deco */
const cursorGlow = document.getElementById("cursor-glow");
const pageDeco = document.getElementById("page-deco");

if (canHover && !prefersReducedMotion) {
  document.body.classList.add("is-cursor-active");

  let mouseX = 0;
  let mouseY = 0;
  let glowX = 0;
  let glowY = 0;

  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (pageDeco) {
        const dx = (e.clientX / window.innerWidth - 0.5) * 16;
        const dy = (e.clientY / window.innerHeight - 0.5) * 16;
        pageDeco.style.setProperty("--deco-x", `${dx}px`);
        pageDeco.style.setProperty("--deco-y", `${dy}px`);
      }
    },
    { passive: true }
  );

  if (pageDeco) {
    pageDeco.style.transform = "translate(var(--deco-x, 0), var(--deco-y, 0))";
  }

  const animateGlow = () => {
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    if (cursorGlow) {
      cursorGlow.style.transform = `translate(${glowX}px, ${glowY}px)`;
    }
    requestAnimationFrame(animateGlow);
  };
  animateGlow();
}

/* 3D tilt on line-art frames */
const tiltTargets = document.querySelectorAll(".tilt-target");
if (tiltTargets.length && canHover && !prefersReducedMotion) {
  tiltTargets.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

/* Subtle magnetic pull on links/buttons */
const magneticEls = document.querySelectorAll(".magnetic");
if (magneticEls.length && canHover && !prefersReducedMotion) {
  magneticEls.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}
