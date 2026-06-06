document.getElementById("year").textContent = String(new Date().getFullYear());

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Smooth scroll */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMobileMenu();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });
});

/* Top bar scroll state */
const topBar = document.getElementById("top-bar");
const onScroll = () => {
  if (topBar) topBar.classList.toggle("is-scrolled", window.scrollY > 40);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* Scroll progress */
const progressBar = document.getElementById("scroll-progress-bar");
const updateProgress = () => {
  if (!progressBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
};
updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });

/* Back to top */
const backTop = document.getElementById("back-top");
if (backTop) {
  const toggleTop = () => backTop.classList.toggle("is-visible", window.scrollY > 500);
  toggleTop();
  window.addEventListener("scroll", toggleTop, { passive: true });
  backTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
}

/* Mobile menu */
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

function closeMobileMenu() {
  if (!menuToggle || !mobileMenu) return;
  menuToggle.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenu.classList.remove("is-open");
}

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("is-open", open);
  });
}

/* Toast + copy */
const toast = document.getElementById("toast");
let toastTimer;

const showToast = (msg) => {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
};

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.getAttribute("data-copy");
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      showToast("Email copied");
    } catch {
      showToast(value);
    }
  });
});

/* Scroll reveal */
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length && !prefersReducedMotion) {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        obs.unobserve(e.target);
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );
  revealEls.forEach((el) => obs.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* Active section — rail + nav */
const sectionIds = ["about", "skills", "experience", "education", "projects", "contact"];
const railLinks = document.querySelectorAll(".rail-nav__link");
const topNavLinks = document.querySelectorAll(".top-bar__nav a");

const setActiveSection = () => {
  const scrollY = window.scrollY + 140;
  let current = sectionIds[0];
  sectionIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) current = id;
  });
  railLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.section === current);
  });
};

setActiveSection();
window.addEventListener("scroll", setActiveSection, { passive: true });

/* Experience tabs */
const expTabs = document.querySelectorAll(".exp-tab");
const expSlides = document.querySelectorAll(".exp-slide");

expTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const id = tab.dataset.exp;
    expTabs.forEach((t) => {
      t.classList.toggle("is-active", t === tab);
      t.setAttribute("aria-selected", String(t === tab));
    });
    expSlides.forEach((slide) => {
      const match = slide.dataset.exp === id;
      slide.hidden = !match;
      slide.classList.toggle("is-active", match);
    });
  });
});

/* Skill chips toggle */
document.querySelectorAll(".skill-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("is-active");
  });
});

/* Count-up stats */
const countEls = document.querySelectorAll("[data-count]");
const animateCount = (el) => {
  const target = Number(el.dataset.count) || 0;
  const suffix = el.dataset.suffix || "";
  const duration = 1200;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if (countEls.length && !prefersReducedMotion) {
  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        animateCount(e.target);
        countObs.unobserve(e.target);
      });
    },
    { threshold: 0.4 }
  );
  countEls.forEach((el) => countObs.observe(el));
} else {
  countEls.forEach((el) => {
    el.textContent = (el.dataset.count || "0") + (el.dataset.suffix || "");
  });
}

/* Custom cursor */
const cursor = document.getElementById("cursor");
const hoverTargets = "a, button, .skill-chip, .exp-tab, .project-card";

if (cursor && canHover && !prefersReducedMotion) {
  document.body.classList.add("is-cursor-on");
  let mx = 0;
  let my = 0;
  let cx = 0;
  let cy = 0;

  window.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
    },
    { passive: true }
  );

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.add("is-cursor-hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(hoverTargets)) {
      document.body.classList.remove("is-cursor-hover");
    }
  });

  const loop = () => {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* 3D tilt */
document.querySelectorAll(".tilt").forEach((el) => {
  if (!canHover || prefersReducedMotion) return;
  el.addEventListener("mousemove", (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});
