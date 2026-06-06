import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const DAY = {
  morning: { sky: 0xffd89b, fog: 0xf4e4c8, sun: 0xffaa44, ambient: 0.6 },
  day: { sky: 0x87ceeb, fog: 0xe8f4fc, sun: 0xffffee, ambient: 0.75 },
  evening: { sky: 0xff7e5f, fog: 0x4a3f6b, sun: 0xff6600, ambient: 0.45 },
  night: { sky: 0x0f0f23, fog: 0x16213e, sun: 0x4444ff, ambient: 0.25 },
};

export class World3D {
  constructor(container, portfolio, callbacks = {}) {
    this.P = portfolio;
    this.onLandmark = callbacks.onLandmark || (() => {});
    this.onZoneChange = callbacks.onZoneChange || (() => {});
    this.container = container;
    this.progress = 0;
    this.targetProgress = 0;
    this.pathLength = 340;
    this.landmarks = [];
    this.zones = [];
    this.lastZone = null;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = "world3d-labels";
    container.appendChild(this.labelRenderer.domElement);

    this.scooterGroup = new THREE.Group();
    this.scene.add(this.scooterGroup);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.hoverLandmark = null;

    this._buildLights();
    this._buildEnvironment();
    this._buildRoad();
    this._buildLandmarks();
    this._buildScooter();

    this.camera.position.set(0, 4.2, 12);
    this.camera.lookAt(0, 2, -20);

    container.addEventListener("pointermove", (e) => this._onPointerMove(e));
    container.addEventListener("click", (e) => this._onClick(e));

    this._resize();
    window.addEventListener("resize", () => this._resize());
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  _buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.65);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffffff, 1.1);
    this.sun.position.set(30, 50, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    this.sun.shadow.camera.left = -40;
    this.sun.shadow.camera.right = 40;
    this.sun.shadow.camera.top = 40;
    this.sun.shadow.camera.bottom = -40;
    this.scene.add(this.sun);
  }

  _buildEnvironment() {
    this.scene.fog = new THREE.FogExp2(0xe8f4fc, 0.012);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, -this.pathLength / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    for (let i = 0; i < 24; i++) {
      const m = this._mountain(
        18 + Math.random() * 25,
        0x9aacb8 + Math.floor(Math.random() * 0x050505)
      );
      const side = i % 2 === 0 ? -1 : 1;
      m.position.set(side * (35 + Math.random() * 40), 0, -i * 16 - Math.random() * 10);
      this.scene.add(m);
    }

    this.stars = new THREE.Group();
    for (let i = 0; i < 200; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      s.position.set((Math.random() - 0.5) * 120, 20 + Math.random() * 40, -Math.random() * this.pathLength);
      this.stars.add(s);
    }
    this.stars.visible = false;
    this.scene.add(this.stars);
  }

  _mountain(h, color) {
    const g = new THREE.ConeGeometry(12 + Math.random() * 8, h, 5);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 }));
    m.position.y = h / 2;
    return m;
  }

  _buildRoad() {
    this.roadGroup = new THREE.Group();
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = -t * this.pathLength;
      const curve = Math.sin(t * Math.PI * 2.5) * 3;

      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(8, this.pathLength / segments + 0.2),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 })
      );
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(curve, 0.01, z);
      seg.receiveShadow = true;
      this.roadGroup.add(seg);

      if (i % 2 === 0) {
        const dash = new THREE.Mesh(
          new THREE.PlaneGeometry(0.35, 1.8),
          new THREE.MeshBasicMaterial({ color: 0xffe600 })
        );
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(curve, 0.03, z);
        this.roadGroup.add(dash);
      }
    }
    this.scene.add(this.roadGroup);

    this.pathFn = (t) => {
      const z = -t * this.pathLength;
      const x = Math.sin(t * Math.PI * 2.5) * 3;
      return new THREE.Vector3(x, 0, z);
    };
  }

  _glassMaterial(color = 0xffffff) {
    return new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: 0.82,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });
  }

  _createPillar(w, h, d, x, z, userData, label) {
    const group = new THREE.Group();
    group.userData = { ...userData, hitMesh: null };

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this._glassMaterial());
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const accent = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.15, 0.2, d + 0.15),
      new THREE.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffe600, emissiveIntensity: 0.35 })
    );
    accent.position.y = 0.1;
    group.add(accent);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.9, 0.35, d * 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.4 })
    );
    cap.position.y = h + 0.15;
    group.add(cap);

    group.position.set(x, 0, z);

    const div = document.createElement("div");
    div.className = "world3d-label";
    div.innerHTML = `<strong>${label.title}</strong><span>${label.sub || ""}</span>`;
    const labelObj = new CSS2DObject(div);
    labelObj.position.set(0, h + 1.2, 0);
    group.add(labelObj);

    body.userData = group.userData;
    group.userData.hitMesh = body;
    this.landmarks.push(body);
    this.scene.add(group);
    return group;
  }

  _buildLandmarks() {
    const P = this.P;
    let z = 0;

    const addZone = (id, zStart, zEnd) => {
      this.zones.push({ id, zStart, zEnd });
    };

    // §1 Intro station
    z = 0;
    this._createPillar(5, 7, 4, 0, z, { type: "intro", zone: "intro" }, {
      title: "Welcome",
      sub: P.name,
    });
    addZone("intro", 0, -25);

    // §2 Career
    z = -35;
    P.experience.forEach((job, i) => {
      const side = i % 2 === 0 ? -7 : 7;
      const depth = job.tenure * 8;
      this._createPillar(3.5, 5 + depth * 0.3, 3.5, side, z, {
        type: "job",
        index: i,
        zone: "career",
      }, { title: job.company.split(" ")[0], sub: job.role });
      z -= 14 + job.tenure * 3;
    });
    addZone("career", -30, -95);

    // §3 About town
    z = -105;
    ["My Story", "Philosophy", "Education", "Values"].forEach((t, i) => {
      const side = i < 2 ? -6 : 6;
      const row = i % 2;
      this._createPillar(3, 4.5, 3, side, z - row * 10, {
        type: "town",
        town: ["story", "philosophy", "education", "values"][i],
        zone: "about",
      }, { title: t, sub: "About" });
    });
    addZone("about", -98, -130);

    // §4 Skills highway
    z = -145;
    P.skillSigns.forEach((sk, i) => {
      const side = i % 2 === 0 ? -5.5 : 5.5;
      const sign = new THREE.Group();
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 3.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 })
      );
      post.position.y = 1.75;
      sign.add(post);

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.6, 0.15),
        this._glassMaterial(0xffe600)
      );
      board.position.y = 3.2;
      board.userData = { type: "skill", index: i, zone: "skills" };
      sign.add(board);
      sign.position.set(side, 0, z - i * 5);
      this.landmarks.push(board);
      this.scene.add(sign);

      const div = document.createElement("div");
      div.className = "world3d-label world3d-label--skill";
      div.textContent = sk.name;
      const lbl = new CSS2DObject(div);
      lbl.position.set(0, 4.2, 0);
      sign.add(lbl);
    });
    addZone("skills", -138, -195);

    // §5 Projects
    z = -205;
    P.projects.forEach((proj, i) => {
      const tower = new THREE.Group();
      const h = 9 + i * 2;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, h, 4.5),
        this._glassMaterial()
      );
      mesh.position.y = h / 2;
      mesh.userData = { type: "case", index: i, zone: "projects" };
      tower.add(mesh);

      const glow = new THREE.Mesh(
        new THREE.BoxGeometry(4.7, 0.25, 4.7),
        new THREE.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffe600, emissiveIntensity: 0.5 })
      );
      glow.position.y = 0.12;
      tower.add(glow);

      tower.position.set(i === 0 ? -6 : 6, 0, z - i * 18);
      this.landmarks.push(mesh);
      this.scene.add(tower);

      const div = document.createElement("div");
      div.className = "world3d-label";
      div.innerHTML = `<strong>${proj.title.split(" ")[0]}</strong><span>${proj.tag}</span>`;
      const projLbl = new CSS2DObject(div);
      projLbl.position.set(0, h + 1, 0);
      tower.add(projLbl);
    });
    addZone("projects", -198, -245);

    // §6 Achievement bridge
    z = -255;
    const bridge = new THREE.Group();
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(8, 0.35, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffe600, emissiveIntensity: 0.4, metalness: 0.3 })
    );
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI;
    arch.position.set(0, 6, z);
    bridge.add(arch);
    P.achievements.forEach((a, i) => {
      const badge = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffe600, emissiveIntensity: 0.6 })
      );
      badge.position.set((i - 2.5) * 2.2, 7 + Math.sin(i) * 0.8, z - 1);
      badge.userData = { type: "achievement", index: i, zone: "achievements" };
      bridge.add(badge);
      this.landmarks.push(badge);
    });
    this.scene.add(bridge);
    addZone("achievements", -248, -275);

    // §7 Garage
    z = -285;
    P.garage.forEach((tool, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      this._createPillar(2.2, 3.5, 2.2, -4 + col * 4, z - row * 8, {
        type: "tool",
        index: i,
        zone: "garage",
      }, { title: tool.name, sub: "Tool" });
    });
    addZone("garage", -278, -310);

    // §8 Contact hilltop
    z = -325;
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(14, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b8f71, flatShading: true, roughness: 0.9 })
    );
    hill.position.set(0, 5, z);
    this.scene.add(hill);

    this._createPillar(5, 5, 4, 0, z - 2, { type: "contact", zone: "contact" }, {
      title: "Contact",
      sub: "Let's connect",
    });
    addZone("contact", -318, -this.pathLength);
  }

  _buildScooter() {
    const body = new THREE.Group();

    const texLoader = new THREE.TextureLoader();
    texLoader.load("assets/scooter-rider.svg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.scale.set(3.2, 2.1, 1);
      sprite.position.y = 1.8;
      body.add(sprite);
    });

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    body.add(shadow);

    this.wheelL = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.12, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    this.wheelR = this.wheelL.clone();
    this.wheelL.position.set(-0.6, 0.35, 0);
    this.wheelR.position.set(0.6, 0.35, 0);
    body.add(this.wheelL, this.wheelR);

    this.scooterGroup.add(body);
  }

  setProgress(p) {
    this.targetProgress = Math.max(0, Math.min(1, p));
  }

  jumpToZone(zoneId) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const midZ = (zone.zStart + zone.zEnd) / 2;
    const p = Math.max(0, Math.min(1, -midZ / this.pathLength));
    this.targetProgress = p;
    return p;
  }

  getZoneProgress(zoneId) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (!zone) return 0;
    return -((zone.zStart + zone.zEnd) / 2) / this.pathLength;
  }

  _updateDayPhase(p) {
    let phase = "morning";
    if (p > 0.88) phase = "night";
    else if (p > 0.68) phase = "evening";
    else if (p > 0.18) phase = "day";

    const keys = Object.keys(DAY);
    const t =
      phase === "morning" ? 0 :
      phase === "day" ? 1 :
      phase === "evening" ? 2 : 3;

    const d = DAY[phase];
    this.scene.background = new THREE.Color(d.sky);
    this.scene.fog.color.setHex(d.fog);
    this.hemi.intensity = d.ambient;
    this.sun.color.setHex(d.sun);
    this.stars.visible = phase === "night";

    document.documentElement.dataset.day = phase;
    return phase;
  }

  _updateCamera(p) {
    const pos = this.pathFn(p);
    const ahead = this.pathFn(Math.min(1, p + 0.04));
    const bob = Math.sin(this.clock.elapsedTime * 3) * 0.08;

    this.camera.position.set(pos.x - 2.5, 4.5 + bob, pos.z + 11);
    this.camera.lookAt(ahead.x, 2.5 + bob * 0.5, ahead.z - 6);

    this.scooterGroup.position.set(pos.x + 1.2, 0, pos.z + 2);
    this.scooterGroup.rotation.y = Math.atan2(ahead.x - pos.x, ahead.z - pos.z) + Math.PI;

    const speed = Math.abs(this.targetProgress - this.progress);
    if (this.wheelL) {
      this.wheelL.rotation.x += speed * 0.8;
      this.wheelR.rotation.x += speed * 0.8;
    }

    const camZ = pos.z;
    let active = "intro";
    for (const z of this.zones) {
      if (camZ <= z.zStart && camZ >= z.zEnd) {
        active = z.id;
        break;
      }
    }
    if (active !== this.lastZone) {
      this.lastZone = active;
      this.onZoneChange(active);
    }
  }

  _onPointerMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.landmarks);
    this.container.style.cursor = hits.length ? "pointer" : "default";
    this.hoverLandmark = hits[0]?.object || null;
  }

  _onClick() {
    if (!this.hoverLandmark?.userData?.type) return;
    this.onLandmark(this.hoverLandmark.userData);
  }

  _resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const dt = this.clock.getDelta();
    this.progress += (this.targetProgress - this.progress) * Math.min(1, dt * 4);

    this._updateDayPhase(this.progress);
    this._updateCamera(this.progress);

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
  }
}
