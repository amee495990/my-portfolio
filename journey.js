import { World3D } from "./world3d.js";

const P = window.PORTFOLIO;
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const landing = document.getElementById("landing");
const journey = document.getElementById("journey");
const canvasHost = document.getElementById("canvas-host");
const scrollSpacer = document.getElementById("scroll-spacer");
const hudFill = document.getElementById("hud-fill");
const hudKm = document.getElementById("hud-km");
const hudNav = document.getElementById("hud-nav");
const glassPanel = document.getElementById("glass-panel");
const panelInner = document.getElementById("panel-inner");
const caseModal = document.getElementById("case-modal");
const caseBody = document.getElementById("case-body");
const toast = document.getElementById("toast");

let world3d = null;
let maxScroll = 0;
let journeyActive = false;

function initLanding() {
  document.getElementById("landing-intro").textContent = P.intro;
  const chips = document.getElementById("landing-chips");
  P.focus.forEach((f) => {
    const s = document.createElement("span");
    s.textContent = f;
    chips.appendChild(s);
  });
}

function buildHudNav() {
  hudNav.innerHTML = P.sections
    .map(
      (s) =>
        `<button type="button" class="hud__jump" data-jump="${s.id}" title="${s.label}">${s.label.split(" ")[0]}</button>`
    )
    .join("");
  hudNav.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => jumpToSection(btn.dataset.jump));
  });
}

function measureScroll() {
  scrollSpacer.style.height = prefersReducedMotion ? "100vh" : "550vh";
  maxScroll = scrollSpacer.offsetHeight - window.innerHeight;
}

function showPanel(html) {
  panelInner.innerHTML = html;
  glassPanel.hidden = false;
}

function handleLandmark(data) {
  const { type, index, town } = data;

  if (type === "job") {
    const j = P.experience[index];
    showPanel(`
      <span class="pill">${j.role}</span>
      <h2>${j.company}</h2>
      <p class="panel-meta">${j.period} · ${j.location}</p>
      <ul>${j.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
      <img src="${j.art}" alt="" class="panel-art" />`);
  } else if (type === "skill") {
    const s = P.skillSigns[index];
    showPanel(`
      <h2>${s.name}</h2>
      <div class="skill-meter"><span style="width:${s.level}%"></span></div>
      <p>Proficiency ${s.level}% across enterprise SaaS & AI product workflows.</p>`);
  } else if (type === "tool") {
    const t = P.garage[index];
    showPanel(`<h2>${t.name}</h2><p>${t.desc}</p>`);
  } else if (type === "case") {
    openCase(index);
  } else if (type === "town") {
    const map = {
      story: ["My Story", P.intro],
      philosophy: ["Design Philosophy", P.philosophy],
      education: [
        "Education",
        P.education.map((e) => `${e.degree} — ${e.school} (${e.year})`).join("<br>"),
      ],
      values: ["What Drives Me", "Research-driven craft, scalable systems, and products people actually use."],
    };
    const [title, body] = map[town] || ["About", ""];
    showPanel(`<h2>${title}</h2><p>${body}</p>`);
  } else if (type === "intro") {
    showPanel(`
      <span class="pill">${P.title}</span>
      <h2>${P.name}</h2>
      <p>${P.intro}</p>
      <p class="panel-meta">${P.philosophy}</p>`);
  } else if (type === "contact") {
    const c = P.contact;
    showPanel(`
      <h2>Let's Build Something Amazing Together</h2>
      <p>${c.lead}</p>
      <p><a href="mailto:${c.email}">${c.email}</a></p>
      <p><a href="tel:${c.phone.replace(/\s/g, "")}">${c.phone}</a></p>
      <p>${c.location} · ${c.languages}</p>`);
  } else if (type === "achievement") {
    const a = P.achievements[index];
    showPanel(`<h2>${a.title}</h2><p>${a.desc}</p>`);
  }
}

function onZoneChange(zoneId) {
  hudNav.querySelectorAll(".hud__jump").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.jump === zoneId);
  });

  if (zoneId === "intro") {
    showPanel(`
      <span class="pill">${P.title}</span>
      <h2>Welcome to My Design Journey</h2>
      <p>${P.philosophy}</p>
      <p class="panel-meta">Click landmarks or keep scrolling forward.</p>`);
  } else if (zoneId === "achievements") {
    showPanel(`
      <h2>Achievement Bridge</h2>
      <ul>${P.achievements.map((a) => `<li><strong>${a.title}</strong> — ${a.desc}</li>`).join("")}</ul>`);
  } else if (zoneId === "contact") {
    glassPanel.hidden = true;
  }
}

function openCase(i) {
  const p = P.projects[i];
  caseBody.innerHTML = `
    <span class="pill">${p.tag}</span>
    <h2 id="case-title">${p.title}</h2>
    <p class="panel-meta">${p.client}</p>
    <img src="${p.art}" alt="" class="case-art" />
    <h3>Overview</h3><p>${p.overview}</p>
    <h3>Problem</h3><p>${p.problem}</p>
    <h3>Process</h3><p>${p.process}</p>
    <h3>Outcome</h3><p>${p.outcome}</p>`;
  caseModal.showModal();
}

function update() {
  if (!journeyActive || !world3d) return;
  const progress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
  world3d.setProgress(progress);
  hudFill.style.width = progress * 100 + "%";
  hudKm.textContent = Math.round(progress * 100) + " km";
}

function jumpToSection(id) {
  if (!world3d) return;
  const p = world3d.jumpToZone(id);
  if (p == null) return;
  const targetScroll = p * maxScroll;
  window.scrollTo({ top: targetScroll, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

function startJourney() {
  landing.classList.add("landing--exit");
  setTimeout(() => {
    landing.hidden = true;
    journey.hidden = false;
    journeyActive = true;
    document.body.classList.add("journey-active");

    measureScroll();

    if (!world3d) {
      world3d = new World3D(canvasHost, P, {
        onLandmark: handleLandmark,
        onZoneChange,
      });
    }

    window.scrollTo(0, 0);
    update();
  }, prefersReducedMotion ? 0 : 900);
}

function exitJourney() {
  journey.hidden = true;
  landing.hidden = false;
  landing.classList.remove("landing--exit");
  journeyActive = false;
  document.body.classList.remove("journey-active");
  window.scrollTo(0, 0);
}

document.getElementById("btn-start").addEventListener("click", startJourney);
document.getElementById("btn-exit").addEventListener("click", exitJourney);
document.getElementById("panel-close").addEventListener("click", () => {
  glassPanel.hidden = true;
});
document.getElementById("case-close").addEventListener("click", () => caseModal.close());

window.addEventListener("scroll", update, { passive: true });
window.addEventListener("resize", () => {
  measureScroll();
  update();
});

window.addEventListener("keydown", (e) => {
  if (!journeyActive) return;
  const step = window.innerHeight * 0.35;
  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    window.scrollBy({ top: step, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    window.scrollBy({ top: -step, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }
  if (e.key === "Escape") {
    glassPanel.hidden = true;
    caseModal.close();
  }
});

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const v = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(v);
      showToast("Email copied");
    } catch {
      showToast(v);
    }
  });
});

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

if (prefersReducedMotion) {
  document.documentElement.classList.add("reduced-motion");
}

initLanding();
buildHudNav();
measureScroll();
