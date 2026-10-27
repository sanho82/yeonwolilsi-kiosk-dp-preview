(() => {
  const ASSET_V = "20261027a";
  // JIODI JDK Phk / YMDT320. 1 unit = 1 cm.
  // Cabinet 610 × 1612 mm. Screen 744.4 mm sits under a short crown (handle + camera),
  // matching the product photos — CAD's 430 mm header was visually too tall.
  const KIOSK = {
    w: 61,
    d: 65.17,
    h: 157.2,
    baseW: 63,
    baseD: 67,
    baseH: 4,
    crown: 15,
  };
  const SCREEN = {
    w: 41.87,
    h: 74.44,
    y: KIOSK.baseH + KIOSK.h - 15 - 74.44 / 2,
  };
  const TOP_POP = {
    pxW: 1200,
    pxH: 800,
    w: 60,
    h: 40,
  };
  const SIDE_POP = {
    pxW: 512,
    pxH: 1024,
    w: 15,
    h: 30,
    asset: "assets/side-left.png",
  };
  const SIDE_POSTER = {
    pxW: 1024,
    pxH: 834,
    w: 45,
    h: 36.65,
    asset: "assets/side-poster.png",
  };
  const X_BANNER = {
    pxW: 2835,
    pxH: 8505,
    w: 60,
    h: 180,
  };
  const QUOTE_POPS = [
    {
      key: "quote0",
      side: "left",
      place: "top",
      w: 15,
      h: 5,
      lines: ["주머니 자리 있죠?", "행운 한 장 넣어드립니다"],
      bg: "#fff6e8",
      ink: "#1a120c",
      accent: "#c4a574",
    },
    {
      key: "quote1",
      side: "right",
      place: "top",
      w: 15,
      h: 5,
      asset: "assets/quote-howto.png",
      lines: ["2분만에 뽑는 내 운세굿즈"],
      bg: "#fff8f4",
      ink: "#1c3fa8",
      accent: "#f4b6c8",
    },
  ];
  const CONCEPTS = [
    {
      id: "c1",
      title: "키오스크 DP",
      sub: "",
      floor: "",
      lede: "각 요소에 도안을 올리면 3D에 바로 반영됩니다.",
    },
  ];
  const POP_ASSETS = {
    c1: {
      front: "assets/c1-front.png",
      back: "assets/c1-back.png",
      left: "assets/c1-left.png",
      right: "assets/c1-right.png",
    },
  };
  const UNIT_X = { c1: 0 };
  const SCREENS = [
    { id: "s1", src: `assets/ui/screen-1.jpg?v=${ASSET_V}` },
    { id: "s2", src: `assets/ui/screen-2.jpg?v=${ASSET_V}` },
    { id: "s3", src: `assets/ui/screen-3.jpg?v=${ASSET_V}` },
    { id: "s4", src: `assets/ui/screen-4.jpg?v=${ASSET_V}` },
  ];
  const screenTexCache = {};
  const XBANNERS = [
    { id: "x1", src: `assets/ui/xb-1.jpg?v=${ASSET_V}` },
    { id: "x2", src: `assets/ui/xb-2.jpg?v=${ASSET_V}` },
    { id: "x3", src: `assets/ui/xb-3.jpg?v=${ASSET_V}` },
  ];
  const xbTexCache = {};
  const SOLO = new URLSearchParams(location.search);
  const isSolo = SOLO.has("solo") || SOLO.has("preview");

  const state = {
    view: "hero",
    autoRotate: false,
    selected: "c1",
    screen: "s1",
    xbanner: "x1",
    xbanner2: "x2",
    xbCount: 1,
    skip: {
      top: false,
      back: false,
      sideLeft: false,
      sideRight: false,
      posterLeft: false,
      posterRight: false,
    },
  };

  const viewport = document.getElementById("viewport");
  const stageLabel = document.getElementById("stageLabel");

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x141311, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141311, 2200, 4600);

  const orbitCam = new THREE.PerspectiveCamera(36, 1, 1, 6000);

  const controls = new THREE.OrbitControls(orbitCam, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.15;
  controls.minDistance = 120;
  controls.maxDistance = 900;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;
  controls.target.set(-12, 90, 0);

  const views = {
    hero: { pos: [170, 130, 300], target: [-12, 90, 0], label: "3/4 뷰" },
    front: { pos: [0, 110, 320], target: [0, 85, 0], label: "정면" },
    left: { pos: [-280, 120, 160], target: [0, 85, 0], label: "좌측" },
    right: { pos: [280, 120, 160], target: [0, 85, 0], label: "우측" },
    back: { pos: [0, 130, -320], target: [0, 85, 0], label: "후면" },
  };

  function mulberry32(a) {
    return () => {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function canvasTexture(canvas, crisp = false) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    if (crisp) {
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
    }
    tex.needsUpdate = true;
    return tex;
  }

  function clearGroup(group) {
    while (group.children.length) group.remove(group.children[0]);
  }

  function drawShards(ctx, w, h, seed, density, edgeBias) {
    const rand = mulberry32(seed);
    ctx.fillStyle = "#f3eee6";
    ctx.fillRect(0, 0, w, h);

    const count = density;
    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const nx = x / w;
      const ny = y / h;
      const edge = Math.min(nx, 1 - nx, ny, 1 - ny);
      if (edgeBias && edge > 0.22 + rand() * 0.18 && ny > 0.18 && ny < 0.72) continue;

      const size = 28 + rand() * 90;
      const sides = 4 + Math.floor(rand() * 3);
      const rot = rand() * Math.PI;
      const filled = rand() > 0.22;
      ctx.beginPath();
      for (let s = 0; s < sides; s++) {
        const a = rot + (s / sides) * Math.PI * 2;
        const r = size * (0.55 + rand() * 0.55);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.lineWidth = 5 + rand() * 4;
      ctx.strokeStyle = "#11110f";
      if (filled) {
        ctx.fillStyle = rand() > 0.85 ? "#2a2a28" : "#11110f";
        ctx.fill();
      }
      ctx.stroke();
    }
  }

  function makeBodyTexture(kind) {
    const w = 1024;
    const h = 2048;
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    const seed = kind === "front" ? 11 : kind === "back" ? 29 : kind === "left" ? 47 : 73;
    drawShards(ctx, w, h, seed, kind === "front" ? 70 : 110, kind === "front");

    if (kind === "front") {
      const screenV0 = (SCREEN.y - SCREEN.h / 2 - KIOSK.baseH) / KIOSK.h;
      const screenV1 = (SCREEN.y + SCREEN.h / 2 - KIOSK.baseH) / KIOSK.h;
      const yTop = h * (1 - screenV1);
      const yBot = h * (1 - screenV0);
      ctx.fillStyle = "#11110f";
      ctx.fillRect(w * 0.12, yTop, w * 0.76, yBot - yTop);
      const wordY = yBot + (h - yBot) * 0.28;
      ctx.fillStyle = "#1a1916";
      ctx.font = '700 88px "Noto Serif KR", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("연월일시", w / 2, wordY);
      ctx.fillStyle = "#11110f";
      const holeW = w * 0.62;
      const holeH = h * 0.028;
      const holeY = h * 0.018;
      roundRectPath(ctx, (w - holeW) / 2, holeY, holeW, holeH, holeH / 2);
      ctx.fill();
    }

    if (kind === "left" || kind === "right") {
      const cx = w / 2;
      const cy = h * 0.48;
      ctx.fillStyle = "#f3eee6";
      ctx.beginPath();
      ctx.arc(cx, cy, 210, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#11110f";
      ctx.lineWidth = 10;
      [[-70, -70], [70, -70], [-70, 70], [70, 58]].forEach(([dx, dy], i) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, i === 3 ? 42 : 36, 0, Math.PI * 2);
        if (i === 3) ctx.fill();
        ctx.stroke();
      });
    }

    return c;
  }

  async function loadScreenTex(id) {
    if (!screenTexCache[id]) {
      const item = SCREENS.find((s) => s.id === id) || SCREENS[0];
      screenTexCache[id] = await loadImageTexture(item.src);
    }
    return screenTexCache[id];
  }

  async function setScreen(id) {
    if (!SCREENS.some((s) => s.id === id)) return;
    state.screen = id;
    const tex = await loadScreenTex(id);
    units.forEach((unit) => {
      if (!unit.screenMesh) return;
      unit.screenMesh.material.map = tex;
      unit.screenMesh.material.needsUpdate = true;
    });
    document.querySelectorAll('input[name="screen"]').forEach((el) => {
      el.checked = el.value === id;
    });
  }

  async function loadXBannerTex(id) {
    if (!xbTexCache[id]) {
      const item = XBANNERS.find((s) => s.id === id) || XBANNERS[0];
      xbTexCache[id] = await loadImageTexture(item.src);
    }
    return xbTexCache[id];
  }

  async function setXBanner(slot, id) {
    if (!XBANNERS.some((s) => s.id === id)) return;
    const key = slot === 2 ? "xbanner2" : "xbanner";
    state[key] = id;
    const tex = await loadXBannerTex(id);
    units.forEach((unit) => {
      const mesh = unit.sideMeshes[key];
      if (!mesh) return;
      mesh.material.map = tex;
      mesh.material.needsUpdate = true;
    });
    document.querySelectorAll(`input[name="${key}"]`).forEach((el) => {
      el.checked = el.value === id;
    });
  }

  function setXbCount(n, moveCam = true) {
    state.xbCount = n === 2 ? 2 : 1;
    const two = state.xbCount === 2;
    units.forEach((unit) => {
      if (unit.attach.xbanner2) unit.attach.xbanner2.visible = two;
    });
    document.querySelectorAll("[data-xb-count]").forEach((btn) => {
      btn.classList.toggle("is-on", Number(btn.dataset.xbCount) === state.xbCount);
    });
    document.querySelectorAll(".xb-label-1").forEach((el) => {
      el.hidden = !two;
    });
    const slot2 = document.getElementById("xbSlot2");
    if (slot2) slot2.hidden = !two;
    views.hero = two
      ? { pos: [205, 150, 360], target: [-55, 90, 0], label: "3/4 뷰" }
      : { pos: [170, 130, 300], target: [-12, 90, 0], label: "3/4 뷰" };
    if (moveCam && state.view === "hero") setCameraView("hero");
  }

  function loadImageTexture(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 8;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        resolve(tex);
      };
      img.onerror = () => reject(new Error(url));
      img.src = url;
    });
  }

  function defaultPopArt(face, wmm, hmm) {
    const w = 1600;
    const h = Math.max(400, Math.round(1600 * (hmm / wmm)));
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#11110f";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(232, 211, 174, 0.35)";
    ctx.lineWidth = 18;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    ctx.fillStyle = "#e8d3ae";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (face === "front" || face === "back") {
      ctx.font = '500 42px "Noto Sans KR", sans-serif';
      ctx.fillText(
        face === "front" ? "우주가 당신을 위해 적어 둔 이야기" : "지금 이 순간의 운명",
        w / 2,
        h * 0.28
      );
      ctx.fillStyle = "#f4efe6";
      ctx.font = `700 ${Math.min(220, h * 0.42)}px "Noto Serif KR", serif`;
      ctx.fillText("연월일시", w / 2, h * 0.55);
      ctx.fillStyle = "#e8d3ae";
      ctx.font = '500 36px "Noto Sans KR", sans-serif';
      ctx.fillText(face === "front" ? "사진을 찍고, 운명을 펼치다" : "YEONWOLILSI", w / 2, h * 0.78);
    } else {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#f4efe6";
      ctx.font = `700 ${Math.min(140, w * 0.18)}px "Noto Serif KR", serif`;
      ctx.fillText("연월일시", 0, -16);
      ctx.fillStyle = "#e8d3ae";
      ctx.font = '500 32px "Noto Sans KR", sans-serif';
      ctx.fillText(face === "left" ? "운명을 만나다" : "이 순간의 이야기", 0, 70);
      ctx.restore();
    }
    return c;
  }

  function defaultSidePopArt() {
    const w = SIDE_POP.pxW;
    const h = SIDE_POP.pxH;
    const s = w / 720;
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#161412";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(232, 211, 174, 0.45)";
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(18 * s, 18 * s, w - 36 * s, h - 36 * s);

    ctx.fillStyle = "#e8d3ae";
    ctx.textAlign = "center";
    ctx.font = `500 ${28 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("운명의 혼수는 어떠할까요", w / 2, 70 * s);
    ctx.fillStyle = "#f4efe6";
    ctx.font = `700 ${54 * s}px "Noto Serif KR", serif`;
    ctx.fillText("연월일시", w / 2, 140 * s);
    ctx.fillStyle = "#c4a574";
    ctx.font = `500 ${24 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("이렇게 나옵니다", w / 2, 184 * s);

    const cols = 2;
    const rows = 3;
    const gap = 20 * s;
    const top = 210 * s;
    const bottom = h - 200 * s;
    const pad = 40 * s;
    const cellW = (w - pad * 2 - gap) / cols;
    const cellH = (bottom - top - gap * (rows - 1)) / rows;
    const colors = ["#3a2a28", "#2c3340", "#3a3424", "#2a3030", "#3a2834"];
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = pad + col * (cellW + gap);
        const y = top + r * (cellH + gap);
        ctx.fillStyle = "#f4efe6";
        ctx.fillRect(x, y, cellW, cellH);
        ctx.fillStyle = colors[(r * 2 + col) % colors.length];
        ctx.fillRect(x + 10 * s, y + 10 * s, cellW - 20 * s, cellH - 42 * s);
        ctx.fillStyle = "#1a1916";
        ctx.font = `600 ${18 * s}px "Noto Sans KR", sans-serif`;
        ctx.fillText(["연애운", "재물운", "사주풀이", "합격운", "관상", "궁합"][r * 2 + col], x + cellW / 2, y + cellH - 16 * s);
      }
    }

    const qr = 116 * s;
    ctx.strokeStyle = "#e8d3ae";
    ctx.lineWidth = 6 * s;
    ctx.strokeRect(w / 2 - qr / 2, h - 160 * s, qr, qr);
    ctx.fillStyle = "#e8d3ae";
    ctx.font = `500 ${22 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("QR", w / 2, h - 98 * s);
    ctx.font = `500 ${20 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("더 많은 샘플 보기", w / 2, h - 36 * s);
    return c;
  }

  function defaultSidePosterArt() {
    const w = SIDE_POSTER.pxW;
    const h = SIDE_POSTER.pxH;
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff8f0";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#f6c2d4";
    roundRectPath(ctx, w * 0.18, h * 0.72, w * 0.64, h * 0.16, h * 0.08);
    ctx.fill();

    ctx.fillStyle = "#1b4fd8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(h * 0.18)}px "Noto Sans KR", sans-serif`;
    ctx.fillText("언제 잘 풀릴지", w * 0.62, h * 0.38);
    ctx.fillText("궁금하다면", w * 0.62, h * 0.56);
    ctx.font = `700 ${Math.round(h * 0.07)}px "Noto Sans KR", sans-serif`;
    ctx.fillText("사주 관상 스튜디오", w / 2, h * 0.8);

    ctx.strokeStyle = "#1b4fd8";
    ctx.lineWidth = 12;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.26, h * 0.36);
    ctx.lineTo(w * 0.14, h * 0.47);
    ctx.lineTo(w * 0.26, h * 0.58);
    ctx.moveTo(w * 0.14, h * 0.47);
    ctx.lineTo(w * 0.30, h * 0.47);
    ctx.stroke();
    return c;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function defaultQuoteArt(card) {
    const w = 1800;
    const h = Math.round(1800 * (card.h / card.w));
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const pad = 14;
    roundRectPath(ctx, pad, pad, w - pad * 2, h - pad * 2, 36);
    ctx.fillStyle = card.bg;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = card.accent;
    ctx.stroke();

    const maxW = w - 96;
    const maxH = card.lines.length > 1 ? h * 0.34 : h * 0.62;
    let size = Math.round(h * 0.46);
    const longest = card.lines.reduce((a, b) => (a.length >= b.length ? a : b));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${size}px "Noto Sans KR", sans-serif`;
    while (size > 36 && (ctx.measureText(longest).width > maxW || size > maxH)) {
      size -= 1;
      ctx.font = `700 ${size}px "Noto Sans KR", sans-serif`;
    }
    ctx.fillStyle = card.ink;
    const lh = size + 14;
    const blockH = card.lines.length * lh - 14;
    const startY = h / 2 - blockH / 2 + size / 2;
    card.lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, startY + i * lh);
    });
    return c;
  }

  function defaultXBannerArt(label) {
    const w = 945;
    const h = Math.round((w * X_BANNER.pxH) / X_BANNER.pxW);
    const s = w / 945;
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#161412";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(232, 211, 174, 0.45)";
    ctx.lineWidth = 10 * s;
    ctx.strokeRect(20 * s, 20 * s, w - 40 * s, h - 40 * s);

    ctx.fillStyle = "#e8d3ae";
    ctx.textAlign = "center";
    ctx.font = `500 ${28 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText(label, w / 2, 140 * s);
    ctx.fillStyle = "#f4efe6";
    ctx.font = `700 ${72 * s}px "Noto Serif KR", serif`;
    ctx.fillText("연월일시", w / 2, 240 * s);
    ctx.fillStyle = "#c4a574";
    ctx.font = `500 ${26 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("사진을 찍고, 운명을 펼치다", w / 2, 310 * s);

    ctx.fillStyle = "#f4efe6";
    ctx.font = `600 ${36 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("X 배너", w / 2, h * 0.5);
    ctx.fillStyle = "#e8d3ae";
    ctx.font = `500 ${24 * s}px "Noto Sans KR", sans-serif`;
    ctx.fillText("2,835 × 8,505 px", w / 2, h * 0.5 + 48 * s);
    ctx.fillText("도안을 넣어 보세요", w / 2, h * 0.5 + 86 * s);
    return c;
  }

  function imageAsCanvas(img) {
    const c = makeCanvas(img.width, img.height);
    c.getContext("2d").drawImage(img, 0, 0);
    return c;
  }

  function imageToCanvas(img, tw, th) {
    const c = makeCanvas(tw, th);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#11110f";
    ctx.fillRect(0, 0, tw, th);
    const scale = Math.max(tw / img.width, th / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
    return c;
  }

  function fitPreview(canvasEl, source) {
    const ctx = canvasEl.getContext("2d");
    const r = window.devicePixelRatio || 1;
    const w = Math.max(2, Math.floor(canvasEl.clientWidth * r));
    const h = Math.max(2, Math.floor(canvasEl.clientHeight * r));
    canvasEl.width = w;
    canvasEl.height = h;
    ctx.fillStyle = "#2a2723";
    ctx.fillRect(0, 0, w, h);
    if (!source) return;
    const scale = Math.max(w / source.width, h / source.height);
    const dw = source.width * scale;
    const dh = source.height * scale;
    ctx.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function isSidePoster(face) {
    return face === "posterLeft" || face === "posterRight";
  }

  function isSideDisp(face) {
    return face === "sideLeft" || face === "sideRight";
  }

  function isCrisp(key) {
    return (
      isSideDisp(key) ||
      key === "front" ||
      key === "back" ||
      key === "left" ||
      key === "right" ||
      String(key).startsWith("quote") ||
      key === "xbanner" ||
      isSidePoster(key)
    );
  }

  function stdMat(map, extra = {}) {
    return new THREE.MeshStandardMaterial({
      map,
      roughness: 0.55,
      metalness: 0.04,
      ...extra,
    });
  }

  function box(w, h, d, material, shadow = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    return mesh;
  }

  function pole(ax, ay, az, bx, by, bz, radius, material) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = Math.max(dir.length(), 0.01);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = true;
    return mesh;
  }

  function makeFloorLabel(text) {
    const w = 768;
    const h = 200;
    const c = makeCanvas(w, h);
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    roundRectPath(ctx, 20, 36, w - 40, 128, 32);
    ctx.fillStyle = "rgba(17, 17, 15, 0.88)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#c4a574";
    ctx.stroke();
    ctx.fillStyle = "#e8d3ae";
    ctx.font = '700 92px "Noto Sans KR", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 2);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 16.8),
      new THREE.MeshBasicMaterial({
        map: canvasTexture(c, true),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    mesh.position.set(0, KIOSK.baseH + KIOSK.h + TOP_POP.h + 10, 0);
    return mesh;
  }

  const root = new THREE.Group();
  scene.add(root);

  const hemi = new THREE.HemisphereLight(0xfff3e0, 0x2a2620, 0.7);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff6ea, 1.05);
  key.position.set(120, 240, 140);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -520;
  key.shadow.camera.right = 520;
  key.shadow.camera.top = 240;
  key.shadow.camera.bottom = -60;
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 900;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe4ff, 0.35);
  fill.position.set(-180, 90, 50);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.28);
  rim.position.set(20, 130, -200);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1100, 64),
    new THREE.ShadowMaterial({ opacity: 0.32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  function quoteCard(face) {
    return QUOTE_POPS.find((card) => card.key === face);
  }

  function setMap(unit, key, canvas) {
    if (unit.texCache[key]) unit.texCache[key].dispose();
    const tex = canvasTexture(canvas, isCrisp(key));
    unit.texCache[key] = tex;
    unit.maps[key] = canvas;
    if (unit.mats[key]) {
      unit.mats[key].map = tex;
      unit.mats[key].needsUpdate = true;
    }
    if (unit.id !== state.selected) return;
    const slot = editorPanel.querySelector(`.face-slot[data-face="${key}"] canvas`);
    if (slot) fitPreview(slot, canvas);
  }

  function createUnit(concept) {
    const group = new THREE.Group();
    group.position.x = UNIT_X[concept.id];
    root.add(group);
    const bodyGroup = new THREE.Group();
    const popGroup = new THREE.Group();
    group.add(bodyGroup);
    group.add(popGroup);
    const floorLabel = makeFloorLabel(concept.floor);
    group.add(floorLabel);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(28, 32, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc4a574,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    group.add(ring);
    return {
      id: concept.id,
      concept,
      label: concept.floor,
      group,
      bodyGroup,
      popGroup,
      floorLabel,
      ring,
      bodyMesh: null,
      mats: {},
      texCache: {},
      maps: {},
      popMeshes: {},
      sideMeshes: {},
      attach: {},
      pop: { w: TOP_POP.w, h: TOP_POP.h, d: KIOSK.d },
    };
  }

  const editorPanel = document.getElementById("editorPanel");
  const units = CONCEPTS.map((concept) => createUnit(concept));

  function selectedUnit() {
    return units.find((unit) => unit.id === state.selected) || units[0];
  }

  function refreshPanelPreviews(unit) {
    editorPanel.querySelectorAll(".face-slot canvas").forEach((c) => {
      fitPreview(c, unit.maps[c.parentElement.dataset.face]);
    });
  }

  function setSelected(id) {
    if (!units.some((unit) => unit.id === id)) return;
    state.selected = id;
    const unit = selectedUnit();
    units.forEach((item) => {
      item.group.visible = item.id === id;
      item.group.position.x = 0;
      item.ring.material.opacity = 0;
      if (item.floorLabel) item.floorLabel.visible = false;
    });
    refreshPanelPreviews(unit);
  }

  function markFace(mesh, unit, face) {
    mesh.userData.unit = unit.id;
    mesh.userData.face = face;
  }

  function addXBannerStand(unit, parent, bannerX, matKey) {
    const bw = X_BANNER.w;
    const bh = X_BANNER.h;
    const bannerLift = 0;
    const bannerY = bannerLift + bh / 2;
    const bannerZ = 4;
    const ink = new THREE.MeshStandardMaterial({ color: 0x11110f, roughness: 0.4 });
    const metal = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.78,
      roughness: 0.28,
    });
    const footX = bw * 0.36;
    const footZ = 12;
    [
      [bannerX - 7, bannerLift + 1.5, bannerZ, bannerX - footX, 0.4, bannerZ + footZ],
      [bannerX + 7, bannerLift + 1.5, bannerZ, bannerX + footX, 0.4, bannerZ + footZ],
      [bannerX - 7, bannerLift + 1.5, bannerZ, bannerX - footX, 0.4, bannerZ - footZ],
      [bannerX + 7, bannerLift + 1.5, bannerZ, bannerX + footX, 0.4, bannerZ - footZ],
      [bannerX - footX, 0.5, bannerZ + footZ, bannerX + footX, 0.5, bannerZ - footZ],
      [bannerX + footX, 0.5, bannerZ + footZ, bannerX - footX, 0.5, bannerZ - footZ],
    ].forEach(([ax, ay, az, bx, by, bz], i) => {
      parent.add(pole(ax, ay, az, bx, by, bz, i < 4 ? 0.48 : 0.36, metal));
    });
    const fabric = box(bw, bh, 0.4, ink);
    fabric.position.set(bannerX, bannerY, bannerZ);
    parent.add(fabric);
    unit.mats[matKey] = new THREE.MeshBasicMaterial({
      map: unit.texCache[matKey] || null,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const bannerFace = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), unit.mats[matKey]);
    bannerFace.position.set(bannerX, bannerY, bannerZ + 0.24);
    bannerFace.castShadow = false;
    markFace(bannerFace, unit, "xbanner");
    bannerFace.renderOrder = 3;
    parent.add(bannerFace);
    unit.sideMeshes[matKey] = bannerFace;
    const grommetMat = new THREE.MeshStandardMaterial({
      color: 0xc5c5c5,
      metalness: 0.82,
      roughness: 0.22,
    });
    const gx = bw / 2 - 2.4;
    const gy = bh / 2 - 2.4;
    [
      [-gx, gy],
      [gx, gy],
      [-gx, -gy],
      [gx, -gy],
    ].forEach(([dx, dy]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.18, 8, 16), grommetMat);
      ring.position.set(bannerX + dx, bannerY + dy, bannerZ + 0.32);
      parent.add(ring);
    });
  }

  function buildBody(unit, screenTex) {
    clearGroup(unit.bodyGroup);
    Object.keys(unit.sideMeshes).forEach((key) => {
      delete unit.sideMeshes[key];
    });
    const { w, d, h, baseW, baseD, baseH } = KIOSK;
    const cream = new THREE.MeshStandardMaterial({
      color: 0xf3eee6,
      roughness: 0.42,
      metalness: 0.02,
    });
    const ink = new THREE.MeshStandardMaterial({ color: 0x11110f, roughness: 0.4 });
    const mats = unit.mats;

    mats.bodyRight = stdMat(null);
    mats.bodyLeft = stdMat(null);
    mats.bodyTop = cream.clone();
    mats.bodyBottom = ink.clone();
    mats.bodyFront = stdMat(null);
    mats.bodyBack = stdMat(null);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
      mats.bodyRight,
      mats.bodyLeft,
      mats.bodyTop,
      mats.bodyBottom,
      mats.bodyFront,
      mats.bodyBack,
    ]);
    body.position.y = baseH + h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.unit = unit.id;
    unit.bodyGroup.add(body);
    unit.bodyMesh = body;

    const base = box(baseW, baseH, baseD, cream);
    base.position.y = baseH / 2;
    unit.bodyGroup.add(base);

    const screenW = SCREEN.w;
    const screenH = SCREEN.h;
    const screenX = 0;
    const screenY = SCREEN.y;
    const sideW = SIDE_POP.w;
    const sideH = SIDE_POP.h;
    const gap = 0.8;
    const minOverhang = sideW / 3;
    const popRight = -screenW / 2 - gap;
    let popLeft = popRight - sideW;
    const kioskLeft = -w / 2;
    if (kioskLeft - popLeft < minOverhang) {
      popLeft = kioskLeft - minOverhang;
    }
    const sideY = screenY + screenH / 2 - sideH / 2;
    const popDepth = 1.4;
    const popZ = d / 2 + popDepth / 2 + 0.35;
    const screenMat = screenTex
      ? new THREE.MeshBasicMaterial({ map: screenTex })
      : new THREE.MeshBasicMaterial({ color: 0xf3d7b0 });
    const bezelPad = 2.2;
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(screenW + bezelPad * 2, screenH + bezelPad * 2),
      new THREE.MeshStandardMaterial({ color: 0xf3eee6, roughness: 0.4 })
    );
    frame.position.set(screenX, screenY, d / 2 + 0.18);
    unit.bodyGroup.add(frame);
    const bezel = new THREE.Mesh(
      new THREE.PlaneGeometry(screenW + 0.9, screenH + 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0e0e0c, roughness: 0.28, emissive: 0x1a4a52, emissiveIntensity: 0.18 })
    );
    bezel.position.set(screenX, screenY, d / 2 + 0.22);
    unit.bodyGroup.add(bezel);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
    screen.position.set(screenX, screenY, d / 2 + 0.28);
    unit.bodyGroup.add(screen);
    unit.screenMesh = screen;
    screen.renderOrder = 3;
    bezel.renderOrder = 2;
    frame.renderOrder = 1;

    unit.attach = {};
    const addAttach = (name) => {
      const g = new THREE.Group();
      g.name = name;
      unit.bodyGroup.add(g);
      unit.attach[name] = g;
      return g;
    };
    [
      ["sideLeft", -1],
      ["sideRight", 1],
    ].forEach(([key, side]) => {
      let centerX = side * (screenW / 2 + gap + sideW / 2);
      const kioskEdge = side * (w / 2);
      const outerEdge = centerX + side * (sideW / 2);
      if (side * (outerEdge - kioskEdge) < minOverhang) {
        centerX = kioskEdge + side * (minOverhang - sideW / 2);
      }
      const g = addAttach(key);
      const sideBoard = box(sideW, sideH, popDepth, ink);
      sideBoard.position.set(centerX, sideY, popZ);
      g.add(sideBoard);
      mats[key] = new THREE.MeshBasicMaterial({
        map: unit.texCache[key] || null,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const sideFace = new THREE.Mesh(new THREE.PlaneGeometry(sideW * 0.995, sideH * 0.995), mats[key]);
      sideFace.position.set(centerX, sideY, popZ + popDepth / 2 + 0.04);
      sideFace.castShadow = false;
      markFace(sideFace, unit, key);
      sideFace.renderOrder = 3;
      g.add(sideFace);
      unit.sideMeshes[key] = sideFace;
      if (unit.maps[key] && unit.texCache[key]) {
        mats[key].map = unit.texCache[key];
        mats[key].needsUpdate = true;
      }
    });

    const postersG = addAttach("posters");
    const posterW = SIDE_POSTER.w;
    const posterH = SIDE_POSTER.h;
    const posterThick = 0.8;
    const posterY = screenY + screenH / 2 - posterH / 2;
    [
      ["posterLeft", -1],
      ["posterRight", 1],
    ].forEach(([key, side]) => {
      const g = new THREE.Group();
      postersG.add(g);
      unit.attach[key] = g;
      const board = box(posterThick, posterH, posterW, ink);
      board.position.set(side * (w / 2 + posterThick / 2 + 0.02), posterY, 0);
      g.add(board);
      mats[key] = new THREE.MeshBasicMaterial({
        map: unit.texCache[key] || null,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const posterFace = new THREE.Mesh(
        new THREE.PlaneGeometry(posterW * 0.995, posterH * 0.995),
        mats[key]
      );
      posterFace.position.set(side * (w / 2 + posterThick + 0.05), posterY, 0);
      posterFace.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      posterFace.castShadow = false;
      markFace(posterFace, unit, key);
      posterFace.renderOrder = 3;
      g.add(posterFace);
      unit.sideMeshes[key] = posterFace;
      if (unit.maps[key] && unit.texCache[key]) {
        mats[key].map = unit.texCache[key];
        mats[key].needsUpdate = true;
      }
    });

    const handleW = 38;
    const handleHoleH = 3.8;
    const handleY = baseH + h - 2.6 - handleHoleH / 2;
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x11110f });
    [
      d / 2 + 0.36,
      -d / 2 - 0.36,
    ].forEach((z, i) => {
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(handleW, handleHoleH), holeMat);
      hole.position.set(0, handleY, z);
      if (i === 1) hole.rotation.y = Math.PI;
      unit.bodyGroup.add(hole);
    });

    const cam = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.2, metalness: 0.4 })
    );
    cam.position.set(screenX, screenY + screenH / 2 + 2.4, d / 2 + 0.4);
    unit.bodyGroup.add(cam);

    const slotY = baseH + 16.8;
    const well = box(24, 7.2, 5.5, ink);
    well.position.set(0, slotY, d / 2 - 1);
    unit.bodyGroup.add(well);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(20.5, 4.6),
      new THREE.MeshBasicMaterial({ color: 0x9ad7ff })
    );
    glow.position.set(0, slotY, d / 2 + 0.22);
    unit.bodyGroup.add(glow);

    const xbG = addAttach("xbanner");
    const xbG2 = addAttach("xbanner2");
    const bw = X_BANNER.w;
    const bannerX = popLeft - 12 - bw / 2;
    const bannerX2 = bannerX - bw - 16;
    addXBannerStand(unit, xbG, bannerX, "xbanner");
    addXBannerStand(unit, xbG2, bannerX2, "xbanner2");
    xbG2.visible = state.xbCount === 2;

    ["bodyFront", "bodyBack", "bodyLeft", "bodyRight"].forEach((key) => {
      if (unit.maps[key]) setMap(unit, key, unit.maps[key]);
    });
  }

  function buildPop(unit) {
    clearGroup(unit.popGroup);
    const { w, h, d } = unit.pop;
    const t = 0.7;
    const y = KIOSK.baseH + KIOSK.h + h / 2 + 0.2;

    const board = new THREE.MeshStandardMaterial({
      color: 0x11110f,
      roughness: 0.55,
    });
    const core = box(w - t, h - t, d - t, board);
    core.position.y = y;
    unit.popGroup.add(core);

    const faces = [
      ["front", w, h, [0, y, d / 2 + 0.02], [0, 0, 0]],
      ["back", w, h, [0, y, -d / 2 - 0.02], [0, Math.PI, 0]],
      ["right", d, h, [w / 2 + 0.02, y, 0], [0, Math.PI / 2, 0]],
      ["left", d, h, [-w / 2 - 0.02, y, 0], [0, -Math.PI / 2, 0]],
    ];

    faces.forEach(([face, fw, fh, pos, rot]) => {
      unit.mats[face] = new THREE.MeshBasicMaterial({
        map: unit.texCache[face] || null,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), unit.mats[face]);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.castShadow = true;
      markFace(mesh, unit, face);
      unit.popGroup.add(mesh);
      unit.popMeshes[face] = mesh;
    });

    const lid = box(w, t, d, board, false);
    lid.position.y = y + h / 2 - t / 2;
    unit.popGroup.add(lid);

    Object.keys(unit.popMeshes).forEach((face) => {
      if (unit.maps[face] && unit.texCache[face]) {
        unit.mats[face].map = unit.texCache[face];
        unit.mats[face].needsUpdate = true;
      }
    });
  }

  function applyDefaultPop(unit) {
    ["front", "back", "left", "right"].forEach((face) => {
      const wmm = face === "left" || face === "right" ? unit.pop.d * 10 : unit.pop.w * 10;
      const hmm = unit.pop.h * 10;
      setMap(unit, face, defaultPopArt(face, wmm, hmm));
    });
    const assets = POP_ASSETS[unit.id] || {};
    const cache = {};
    const faces = Object.keys(assets);
    return faces.reduce((chain, face) => {
      const path = assets[face];
      return chain.then(async () => {
        if (!(path in cache)) {
          cache[path] = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `${path}?v=${ASSET_V}`;
          });
        }
        if (cache[path]) applyPopImage(unit, face, cache[path]);
      });
    }, Promise.resolve());
  }

  function applyDefaultBody(unit) {
    setMap(unit, "bodyFront", makeBodyTexture("front"));
    setMap(unit, "bodyBack", makeBodyTexture("back"));
    setMap(unit, "bodyLeft", makeBodyTexture("left"));
    setMap(unit, "bodyRight", makeBodyTexture("right"));
  }

  function loadUnitFace(unit, face, fallback) {
    const img = new Image();
    img.onload = () => applyPopImage(unit, face, img);
    img.onerror = fallback;
    img.src = `assets/${unit.id}-${face}.png?v=${ASSET_V}`;
  }

  function applyDefaultSidePop(unit) {
    loadUnitFace(unit, "sideLeft", () => setMap(unit, "sideLeft", defaultSidePopArt()));
    loadUnitFace(unit, "sideRight", () => setMap(unit, "sideRight", defaultSidePopArt()));
  }

  function applyDefaultSidePosters(unit) {
    loadUnitFace(unit, "posterLeft", () => setMap(unit, "posterLeft", defaultSidePosterArt()));
    loadUnitFace(unit, "posterRight", () => setMap(unit, "posterRight", defaultSidePosterArt()));
  }

  function applyDefaultQuotes(unit) {
    QUOTE_POPS.forEach((card) => {
      loadUnitFace(unit, card.key, () => setMap(unit, card.key, defaultQuoteArt(card)));
    });
  }

  function applyDefaultXBanner(unit) {
    loadUnitFace(unit, "xbanner", () => setMap(unit, "xbanner", defaultXBannerArt(unit.label)));
  }

  function targetSize(unit, face) {
    const quote = quoteCard(face);
    if (quote) {
      const tw = 1800;
      return [tw, Math.max(2, Math.round(tw * (quote.h / quote.w)))];
    }
    if (isSideDisp(face)) {
      return [SIDE_POP.pxW, SIDE_POP.pxH];
    }
    if (isSidePoster(face)) {
      return [SIDE_POSTER.pxW, SIDE_POSTER.pxH];
    }
    if (face === "xbanner") {
      return [X_BANNER.pxW, X_BANNER.pxH];
    }
    const side = face === "left" || face === "right";
    const tw = TOP_POP.pxW;
    if (!side) {
      return [tw, Math.max(2, Math.round(tw * (unit.pop.h / unit.pop.w)))];
    }
    const th = Math.round(tw * (unit.pop.h / unit.pop.d));
    return [tw, Math.max(2, th)];
  }

  function persistFace(unit, face) {
    const canvas = unit.maps[face];
    if (!canvas || !canvas.toDataURL) return;
    fetch("/__save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${unit.id}-${face}.png`,
        data: canvas.toDataURL("image/png"),
      }),
    }).catch(() => {});
  }

  function applyPopImage(unit, face, img, persist = false) {
    if (face === "front" || face === "back") {
      setMap(unit, face, imageAsCanvas(img));
    } else if (isSideDisp(face) || face === "xbanner" || quoteCard(face) || isSidePoster(face)) {
      setMap(unit, face, imageAsCanvas(img));
    } else {
      const [tw, th] = targetSize(unit, face);
      setMap(unit, face, imageToCanvas(img, tw, th));
    }
    if (persist) persistFace(unit, face);
  }

  function allPickMeshes() {
    return units.flatMap((unit) =>
      [...Object.values(unit.popMeshes), ...Object.values(unit.sideMeshes), unit.bodyMesh].filter(Boolean)
    );
  }

  function lockYawOnly() {
    const polar = controls.getPolarAngle();
    controls.minPolarAngle = polar;
    controls.maxPolarAngle = polar;
  }

  function setCameraView(name) {
    state.view = name;
    const v = views[name];
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    orbitCam.position.set(...v.pos);
    controls.target.set(...v.target);
    controls.update();
    lockYawOnly();
    stageLabel.textContent = v.label;
    document.querySelectorAll("#viewPresets button").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.view === name);
    });
  }

  function dollyBy(factor) {
    const offset = orbitCam.position.clone().sub(controls.target);
    const next = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance
    );
    offset.setLength(next);
    orbitCam.position.copy(controls.target).add(offset);
    controls.update();
  }

  const viewSize = new THREE.Vector2();

  function resetFullViewport() {
    renderer.getSize(viewSize);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, viewSize.x, viewSize.y);
    renderer.setScissor(0, 0, viewSize.x, viewSize.y);
  }

  function resize() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    renderer.setSize(w, h, false);
    orbitCam.aspect = w / Math.max(h, 1);
    orbitCam.updateProjectionMatrix();
    resetFullViewport();
  }

  function tick() {
    requestAnimationFrame(tick);
    controls.autoRotate = state.autoRotate;
    controls.autoRotateSpeed = 1.4;
    controls.enabled = true;
    controls.update();
    units.forEach((unit) => {
      if (unit.floorLabel) unit.floorLabel.lookAt(orbitCam.position);
    });
    resetFullViewport();
    renderer.setClearColor(0x141311, 1);
    renderer.render(scene, orbitCam);
  }

  function applySkips() {
    const unit = selectedUnit();
    if (!unit) return;
    if (unit.popGroup) unit.popGroup.visible = !state.skip.top;
    if (unit.popMeshes.back) unit.popMeshes.back.visible = !state.skip.top && !state.skip.back;
    if (unit.attach.sideLeft) unit.attach.sideLeft.visible = !state.skip.sideLeft;
    if (unit.attach.sideRight) unit.attach.sideRight.visible = !state.skip.sideRight;
    if (unit.attach.posterLeft) unit.attach.posterLeft.visible = !state.skip.posterLeft;
    if (unit.attach.posterRight) unit.attach.posterRight.visible = !state.skip.posterRight;
    Object.keys(state.skip).forEach((key) => {
      const wrap = editorPanel.querySelector(`[data-skip-wrap="${key}"]`);
      const box = editorPanel.querySelector(`input[data-skip="${key}"]`);
      if (wrap) wrap.classList.toggle("is-off", !!state.skip[key]);
      if (box) box.checked = !!state.skip[key];
    });
  }

  function bindSlots() {
    editorPanel.querySelectorAll(".face-slot").forEach((slot) => {
      const input = slot.querySelector('input[type="file"]');
      if (!input) return;
      const face = slot.dataset.face;
      const onFile = (file) => {
        if (!file) return;
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          applyPopImage(selectedUnit(), face, img, true);
        };
        img.src = URL.createObjectURL(file);
      };
      input.addEventListener("change", () => onFile(input.files[0]));
      ["dragenter", "dragover"].forEach((ev) => {
        slot.addEventListener(ev, (e) => {
          e.preventDefault();
          slot.classList.add("is-over");
        });
      });
      ["dragleave", "drop"].forEach((ev) => {
        slot.addEventListener(ev, (e) => {
          e.preventDefault();
          slot.classList.remove("is-over");
        });
      });
      slot.addEventListener("drop", (e) => {
        onFile(e.dataTransfer.files[0]);
      });
    });
  }

  function bindEditor() {
    editorPanel.querySelector(".copy-front").addEventListener("click", () => {
      const unit = selectedUnit();
      if (!unit.maps.front) return;
      ["back", "left", "right"].forEach((k) => {
        setMap(unit, k, unit.maps.front);
        persistFace(unit, k);
      });
    });
    editorPanel.querySelector(".reset-pop").addEventListener("click", () => applyDefaultPop(selectedUnit()));
    editorPanel.querySelector(".reset-side").addEventListener("click", () => applyDefaultSidePop(selectedUnit()));
    editorPanel.querySelector(".reset-posters").addEventListener("click", () => applyDefaultSidePosters(selectedUnit()));
    editorPanel.querySelectorAll('input[name="screen"]').forEach((el) => {
      el.addEventListener("change", () => {
        if (el.checked) setScreen(el.value);
      });
    });
    editorPanel.querySelectorAll('input[name="xbanner"]').forEach((el) => {
      el.addEventListener("change", () => {
        if (el.checked) setXBanner(1, el.value);
      });
    });
    editorPanel.querySelectorAll('input[name="xbanner2"]').forEach((el) => {
      el.addEventListener("change", () => {
        if (el.checked) setXBanner(2, el.value);
      });
    });
    editorPanel.querySelectorAll("[data-xb-count]").forEach((btn) => {
      btn.addEventListener("click", () => setXbCount(Number(btn.dataset.xbCount)));
    });
    editorPanel.querySelectorAll("input[data-skip]").forEach((box) => {
      box.addEventListener("change", () => {
        state.skip[box.dataset.skip] = box.checked;
        applySkips();
      });
    });
    bindSlots();
  }

  function bindUi() {
    document.querySelectorAll("#viewPresets button").forEach((btn) => {
      btn.addEventListener("click", () => {
        setCameraView(btn.dataset.view);
      });
    });
    document.getElementById("autoRotate").addEventListener("change", (e) => {
      state.autoRotate = e.target.checked;
    });
    document.getElementById("zoomIn").addEventListener("click", () => dollyBy(0.78));
    document.getElementById("zoomOut").addEventListener("click", () => dollyBy(1.28));
    document.getElementById("zoomFit").addEventListener("click", () => setCameraView(state.view));
    window.addEventListener("keydown", (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "+" || e.key === "=") dollyBy(0.78);
      if (e.key === "-" || e.key === "_") dollyBy(1.28);
    });
    document.getElementById("captureBtn").addEventListener("click", () => {
      const a = document.createElement("a");
      a.download = `yeonwolilsi-kiosk-pop-${Date.now()}.png`;
      a.href = renderer.domElement.toDataURL("image/png");
      a.click();
    });

    bindEditor();

    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = null;
    renderer.domElement.addEventListener("pointerdown", (ev) => {
      down = { x: ev.clientX, y: ev.clientY };
    });
    renderer.domElement.addEventListener("pointerup", (ev) => {
      if (!down) return;
      const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6;
      down = null;
      if (moved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, orbitCam);
      const hits = ray.intersectObjects(allPickMeshes());
      if (isSolo) return;
      if (!hits[0] || !hits[0].object.userData.unit) return;
      const { unit: unitId, face } = hits[0].object.userData;
      const switched = state.selected !== unitId;
      setSelected(unitId);
      if (!face || switched) return;
      const slot = editorPanel.querySelector(`.face-slot[data-face="${face}"] input`);
      if (slot) slot.click();
    });
  }

  async function start() {
    await document.fonts.ready;
    bindUi();
    const screenTex = await loadScreenTex(state.screen).catch(() => null);
    units.forEach((unit) => {
      buildBody(unit, screenTex);
      applyDefaultBody(unit);
      applyDefaultSidePop(unit);
      applyDefaultSidePosters(unit);
      buildPop(unit);
    });
    await Promise.all(units.map((unit) => applyDefaultPop(unit)));
    await setXBanner(1, state.xbanner);
    await setXBanner(2, state.xbanner2);
    setSelected(state.selected);
    applySkips();
    setXbCount(state.xbCount, false);
    setCameraView("hero");
    if (isSolo) {
      document.body.classList.add("solo-preview");
      applySoloPreview({
        concept: state.selected,
        top: 0,
        disp: false,
        pay: false,
        howto: false,
        side: false,
        xb: false,
      });
      window.addEventListener("message", (ev) => {
        if (!ev.data || ev.data.type !== "dp-preview") return;
        applySoloPreview(ev.data);
      });
      if (window.parent !== window) {
        window.parent.postMessage({ type: "dp-ready" }, "*");
      }
    }
    resize();
    window.addEventListener("resize", () => {
      resize();
      refreshPanelPreviews(selectedUnit());
    });
    tick();
  }

  function applySoloPreview(flags) {
    const id = flags.concept && units.some((u) => u.id === flags.concept) ? flags.concept : "c1";
    setSelected(id);
    units.forEach((unit) => {
      const on = unit.id === id;
      unit.group.visible = on;
      unit.group.position.x = on ? 0 : UNIT_X[unit.id];
      if (!on) return;
      unit.popGroup.visible = flags.top > 0;
      if (unit.popMeshes.back) unit.popMeshes.back.visible = flags.top === 4;
      if (unit.attach.sideLeft) unit.attach.sideLeft.visible = !!flags.disp && flags.sideLeft !== false;
      if (unit.attach.sideRight) unit.attach.sideRight.visible = !!flags.disp && flags.sideRight !== false;
      if (unit.attach.posters) unit.attach.posters.visible = !!flags.side;
      if (unit.attach.posterLeft) unit.attach.posterLeft.visible = !!flags.side && flags.posterLeft !== false;
      if (unit.attach.posterRight) unit.attach.posterRight.visible = !!flags.side && flags.posterRight !== false;
      if (unit.attach.quote0) unit.attach.quote0.visible = !!flags.pay;
      if (unit.attach.quote1) unit.attach.quote1.visible = !!flags.howto;
      if (unit.attach.xbanner) unit.attach.xbanner.visible = !!flags.xb;
      if (unit.attach.xbanner2) unit.attach.xbanner2.visible = !!flags.xb && state.xbCount === 2;
    });
    if (flags.view && views[flags.view]) setCameraView(flags.view);
    else if (flags.xb) controls.target.set(-12, 90, 0);
  }

  start();
})();
