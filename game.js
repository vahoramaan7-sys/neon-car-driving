// TURBO DRIFT // Asphalt Legends Style 3D Metropolis Edition
(function () {
  const canvas = document.getElementById("road-canvas");
  const ctx = canvas.getContext("2d");

  const hud = document.getElementById("hud");
  const hudScore = document.getElementById("hud-score");
  const hudBest = document.getElementById("hud-best");
  const hudSpeed = document.getElementById("hud-speed");
  const hudHearts = document.getElementById("hud-hearts");
  const hudNitroFill = document.getElementById("hud-nitro-fill");
  const buffBar = document.getElementById("buff-bar");
  const touchControls = document.getElementById("touch-controls");

  const screenStart = document.getElementById("screen-start");
  const screenPause = document.getElementById("screen-pause");
  const screenGameover = document.getElementById("screen-gameover");
  const startBest = document.getElementById("start-best");

  const goCar = document.getElementById("go-car");
  const goScore = document.getElementById("go-score");
  const goBest = document.getElementById("go-best");
  const goDist = document.getElementById("go-dist");
  const goNearmiss = document.getElementById("go-nearmiss");
  const newBestEl = document.getElementById("new-best");

  const btnStart = document.getElementById("btn-start");
  const btnResume = document.getElementById("btn-resume");
  const btnRestartPause = document.getElementById("btn-restart-pause");
  const btnRetry = document.getElementById("btn-retry");
  const btnMenu = document.getElementById("btn-menu");

  const btnCam = document.getElementById("btn-cam");
  const btnTime = document.getElementById("btn-time");
  const btnLights = document.getElementById("btn-lights");
  const btnWiper = document.getElementById("btn-wiper");
  const btnHazard = document.getElementById("btn-hazard");
  const btnHorn = document.getElementById("btn-horn");
  const btnMute = document.getElementById("btn-mute");
  const btnPause = document.getElementById("btn-pause");

  const touchLeftBtn = document.getElementById("touch-left");
  const touchRightBtn = document.getElementById("touch-right");
  const touchHornBtn = document.getElementById("touch-horn");
  const touchBrakeBtn = document.getElementById("touch-brake");
  const touchNitroBtn = document.getElementById("touch-nitro");

  const garageButtons = Array.from(document.querySelectorAll(".car-choice"));

  const audio = new window.HighwayAudio();
  const BEST_KEY = "turbo_drift_best_v3";

  const CAR_SPECS = {
    bmw: {
      id: "bmw",
      name: "BMW M4",
      maxHp: 3,
      topMult: 1.05,
      steerMult: 1.06,
      wNorm: 0.168,
      zLen: 66,
      accent: "#38bdf8",
    },
    mercedes: {
      id: "mercedes",
      name: "MERCEDES AMG",
      maxHp: 3,
      topMult: 1.04,
      steerMult: 1.15,
      wNorm: 0.172,
      zLen: 66,
      accent: "#e2e8f0",
    },
    lambo: {
      id: "lambo",
      name: "LAMBORGHINI",
      maxHp: 3,
      topMult: 1.13,
      steerMult: 1.12,
      wNorm: 0.178,
      zLen: 64,
      accent: "#facc15",
    },
    mahindra: {
      id: "mahindra",
      name: "MAHINDRA SUV",
      maxHp: 4,
      topMult: 0.99,
      steerMult: 0.98,
      wNorm: 0.188,
      zLen: 74,
      accent: "#fb7185",
    },
  };

  const CAMERAS = [
    { id: "chase3d", label: "3D CHASE" },
    { id: "cockpit", label: "COCKPIT" },
    { id: "hood", label: "HOOD CAM" },
    { id: "topdown", label: "TOP-DOWN" },
  ];

  const LIGHT_MODES = ["HIGH", "LOW", "OFF"];
  const TIME_MODES = ["AUTO", "DAY", "SUNSET", "NIGHT"];
  const GANTRY_SIGNS = [
    ["TIMES SQ / 42ND ST", "MANHATTAN  EXIT 4"],
    ["BROOKLYN BRIDGE", "DOWNTOWN   2 MI"],
    ["FDR DRIVE SOUTH", "WALL ST / HARBOR"],
    ["5TH AVE MIDTOWN", "CENTRAL PARK  1 MI"],
  ];
  const BILLBOARD_TITLES = ["TIMES SQ", "BROADWAY", "NEW YORK", "MANHATTAN", "WALL ST", "NYC 24/7"];

  let viewW = window.innerWidth;
  let viewH = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    canvas.style.width = viewW + "px";
    canvas.style.height = viewH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const keys = new Set();
  const touchState = { left: false, right: false, nitro: false, brake: false };

  let selectedCarId = "bmw";
  let camIndex = 0; // 3D CHASE default
  let timeModeIndex = 0; // AUTO (Day -> Sunset -> Night)
  let dayPhase = 0.08; // Starts in bright realistic Day and smoothly cycles
  let lightIndex = 0; // HIGH
  let wipersOn = false;
  let hazardOn = false;
  let hornFlashTimer = 0;
  let wiperPhase = 0;

  let bestScore = Number(localStorage.getItem(BEST_KEY) || 0);
  let state = "menu";
  let run = null;

  const nightStars = Array.from({ length: 85 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.34,
    size: Math.random() < 0.28 ? 1.9 : 1.1,
    alpha: 0.25 + Math.random() * 0.6,
  }));

  const clouds = Array.from({ length: 12 }, (_, idx) => ({
    x: (idx / 12) + Math.random() * 0.08,
    y: 0.06 + (idx % 4) * 0.055,
    w: 90 + (idx % 3) * 55,
    h: 22 + (idx % 2) * 12,
    speed: 0.005 + (idx % 3) * 0.003,
  }));

  const windshieldDrops = Array.from({ length: 28 }, () => ({
    x: 0.08 + Math.random() * 0.84,
    y: 0.08 + Math.random() * 0.58,
    r: 1 + Math.random() * 2,
    vy: 0.04 + Math.random() * 0.08,
  }));

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpRGB(c1, c2, t) {
    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));
    return `rgb(${r},${g},${b})`;
  }

  function getEffectivePhase() {
    const mode = TIME_MODES[timeModeIndex];
    if (mode === "DAY") return 0;
    if (mode === "SUNSET") return 1;
    if (mode === "NIGHT") return 2;
    return dayPhase % 3;
  }

  function getAtmosphere() {
    const p = getEffectivePhase(); // 0=Day, 1=Sunset, 2=Night, 3->0=Day
    const keysAtmo = [
      {
        // DAY
        skyTop: [29, 78, 216],
        skyMid: [56, 189, 248],
        skyHor: [186, 230, 253],
        terrain: [22, 68, 44],
        roadA: [52, 58, 70],
        roadB: [45, 51, 62],
        shoulder: [90, 98, 112],
        bldgTop: [100, 128, 165],
        bldgBot: [51, 65, 85],
        sunAlpha: 1,
        sunsetAlpha: 0,
        nightAlpha: 0,
      },
      {
        // GOLDEN SUNSET
        skyTop: [30, 27, 75],
        skyMid: [190, 24, 93],
        skyHor: [251, 146, 60],
        terrain: [26, 24, 38],
        roadA: [36, 34, 48],
        roadB: [30, 28, 42],
        shoulder: [58, 48, 66],
        bldgTop: [68, 48, 86],
        bldgBot: [28, 22, 42],
        sunAlpha: 0.75,
        sunsetAlpha: 1,
        nightAlpha: 0.35,
      },
      {
        // NYC NIGHT
        skyTop: [2, 5, 16],
        skyMid: [14, 24, 54],
        skyHor: [48, 34, 62],
        terrain: [8, 16, 26],
        roadA: [21, 27, 41],
        roadB: [17, 22, 34],
        shoulder: [23, 30, 46],
        bldgTop: [34, 48, 82],
        bldgBot: [9, 14, 28],
        sunAlpha: 0,
        sunsetAlpha: 0.12,
        nightAlpha: 1,
      },
    ];

    const i0 = Math.floor(p) % 3;
    const i1 = (i0 + 1) % 3;
    const t = p - Math.floor(p);
    const a = keysAtmo[i0];
    const b = keysAtmo[i1];

    return {
      skyTop: lerpRGB(a.skyTop, b.skyTop, t),
      skyMid: lerpRGB(a.skyMid, b.skyMid, t),
      skyHor: lerpRGB(a.skyHor, b.skyHor, t),
      terrain: lerpRGB(a.terrain, b.terrain, t),
      roadA: lerpRGB(a.roadA, b.roadA, t),
      roadB: lerpRGB(a.roadB, b.roadB, t),
      shoulder: lerpRGB(a.shoulder, b.shoulder, t),
      bldgTop: lerpRGB(a.bldgTop, b.bldgTop, t),
      bldgBot: lerpRGB(a.bldgBot, b.bldgBot, t),
      sunAlpha: lerp(a.sunAlpha, b.sunAlpha, t),
      sunsetAlpha: lerp(a.sunsetAlpha, b.sunsetAlpha, t),
      nightAlpha: lerp(a.nightAlpha, b.nightAlpha, t),
    };
  }

  function laneNorm(laneIdx) {
    return -0.75 + laneIdx * 0.5;
  }

  function fmt(n) {
    return String(Math.floor(n)).padStart(6, "0");
  }

  function refreshBestUI() {
    startBest.textContent = fmt(bestScore);
    hudBest.textContent = fmt(bestScore);
  }
  refreshBestUI();

  // Straight New York Expressway + Elevated Sky-Flyover Viaduct Sections
  function roadCurve() {
    return 0;
  }

  function roadHill(wz) {
    const cycle = ((wz % 3400) + 3400) % 3400;
    const maxElev = 58;
    if (cycle < 1400) return 0;
    if (cycle < 1900) {
      const u = (cycle - 1400) / 500;
      return maxElev * (0.5 - 0.5 * Math.cos(u * Math.PI));
    }
    if (cycle < 2700) return maxElev;
    if (cycle < 3200) {
      const u = (cycle - 2700) / 500;
      return maxElev * (0.5 + 0.5 * Math.cos(u * Math.PI));
    }
    return 0;
  }

  function createRun() {
    const spec = CAR_SPECS[selectedCarId];
    return {
      carSpec: spec,
      score: 0,
      distanceKm: 0,
      nearMisses: 0,
      worldZ: 0,
      baseSpeed: 440 * spec.topMult,
      speed: 440 * spec.topMult,
      fovZoom: 0,
      camBank: 0,
      shake: 0,
      spawnTimer: 0.65,
      coinTimer: 1.0,
      powerupTimer: 6.5,
      rampTimer: 5.0,
      player: {
        xNorm: 0,
        vxNorm: 0,
        steerAngle: 0,
        bodyRoll: 0,
        jumpY: 0,
        jumpVy: 0,
        drifting: false,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        shield: false,
        invuln: 0,
        nitro: 100,
        boosting: false,
        braking: false,
        magnetTimer: 0,
        turnDir: 0,
      },
      traffic: [],
      coins: [],
      powerups: [],
      ramps: [],
      particles: [],
      popups: [],
    };
  }

  function startGame() {
    audio.unlock();
    audio.startEngine();
    run = createRun();
    state = "playing";
    screenStart.classList.add("hidden");
    screenPause.classList.add("hidden");
    screenGameover.classList.add("hidden");
    hud.classList.remove("hidden");
    buffBar.classList.remove("hidden");
    touchControls.classList.remove("hidden");
    syncHUD();
  }

  function setPaused(paused) {
    if (state !== "playing" && state !== "paused") return;
    state = paused ? "paused" : "playing";
    screenPause.classList.toggle("hidden", !paused);
    if (paused) audio.updateEngine(0, false, false);
  }

  function endGame() {
    state = "gameover";
    audio.updateEngine(0, false, false);
    audio.gameOver();
    const isNew = run.score > bestScore;
    if (isNew) {
      bestScore = Math.floor(run.score);
      localStorage.setItem(BEST_KEY, String(bestScore));
      refreshBestUI();
    }
    goCar.textContent = run.carSpec.name;
    goScore.textContent = fmt(run.score);
    goBest.textContent = fmt(bestScore);
    goDist.textContent = run.distanceKm.toFixed(2) + " KM";
    goNearmiss.textContent = String(run.nearMisses);
    newBestEl.classList.toggle("hidden", !isNew);
    screenGameover.classList.remove("hidden");
  }

  function addParticles(xNorm, z, color, count = 14, elevY = 0) {
    for (let i = 0; i < count; i++) {
      run.particles.push({
        xNorm,
        z,
        y: elevY,
        vxNorm: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.2) * 80,
        life: 0.28 + Math.random() * 0.35,
        maxLife: 0.63,
        size: 3 + Math.random() * 3.5,
        color,
      });
    }
  }

  function addPopup(xNorm, z, text, color = "#eef6ff") {
    run.popups.push({ xNorm, z, text, color, life: 0.95, maxLife: 0.95 });
  }

  function triggerHorn() {
    if (state !== "playing" || !run) return;
    audio.unlock();
    audio.horn();
    hornFlashTimer = 0.25;
    for (const car of run.traffic) {
      if (car.z > 60 && car.z < 480 && Math.abs(car.xNorm - run.player.xNorm) < 0.44) {
        car.honked = 0.65;
        if (car.kind !== "truck") {
          const pushDir = car.xNorm >= run.player.xNorm ? 1 : -1;
          const nextLane = Math.max(0, Math.min(3, car.lane + pushDir));
          car.lane = nextLane;
          car.targetXNorm = laneNorm(nextLane);
        }
      }
    }
  }

  function spawnTraffic() {
    const lane = Math.floor(Math.random() * 4);
    const xNorm = laneNorm(lane);

    for (const c of run.traffic) {
      if (Math.abs(c.xNorm - xNorm) < 0.34 && c.z > 1150) return;
    }

    const pool = [
      { kind: "taxi", body: "#eab308", bodyHi: "#fde047", wNorm: 0.166, zLen: 66, speed: 178 },
      { kind: "taxi", body: "#ca8a04", bodyHi: "#facc15", wNorm: 0.166, zLen: 66, speed: 186 },
      { kind: "bmw", body: "#111827", bodyHi: "#374151", wNorm: 0.165, zLen: 66, speed: 205 },
      { kind: "mercedes", body: "#94a3b8", bodyHi: "#e2e8f0", wNorm: 0.168, zLen: 66, speed: 200 },
      { kind: "lambo", body: "#ca8a04", bodyHi: "#fde047", wNorm: 0.172, zLen: 64, speed: 250 },
      { kind: "mahindra", body: "#0f172a", bodyHi: "#334155", wNorm: 0.185, zLen: 74, speed: 175 },
      { kind: "sedan", body: "#7f1d1d", bodyHi: "#dc2626", wNorm: 0.162, zLen: 64, speed: 185 },
      { kind: "truck", body: "#1e293b", bodyHi: "#64748b", wNorm: 0.2, zLen: 108, speed: 130 },
      { kind: "police", body: "#e2e8f0", bodyHi: "#f8fafc", wNorm: 0.168, zLen: 66, speed: 245 },
    ];
    const pick = pool[Math.floor(Math.random() * pool.length)];

    run.traffic.push({
      kind: pick.kind,
      bodyColor: pick.body,
      bodyHi: pick.bodyHi,
      lane,
      xNorm,
      targetXNorm: xNorm,
      z: 1580,
      wNorm: pick.wNorm,
      zLen: pick.zLen,
      speed: pick.speed + Math.random() * 45,
      nearMissed: false,
      honked: 0,
      swerveTimer: pick.kind === "lambo" || pick.kind === "bmw" ? 1.0 + Math.random() * 1.4 : 99,
    });
  }

  function spawnCoinLine() {
    const lane = Math.floor(Math.random() * 4);
    const xNorm = laneNorm(lane);
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      run.coins.push({ xNorm, z: 1500 + i * 70 });
    }
  }

  function spawnPowerup() {
    const lane = Math.floor(Math.random() * 4);
    const kinds = ["fuel", "shield", "magnet"];
    run.powerups.push({
      xNorm: laneNorm(lane),
      z: 1500,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
    });
  }

  function spawnRamp() {
    const lane = Math.floor(Math.random() * 4);
    run.ramps.push({
      xNorm: laneNorm(lane),
      z: 1540,
      hit: false,
    });
  }

  function handleCrash() {
    const p = run.player;
    if (p.invuln > 0) return;

    if (p.shield) {
      p.shield = false;
      p.invuln = 1.3;
      run.shake = 14;
      audio.shieldBreak();
      addParticles(p.xNorm, 20, "#00f3ff", 22, p.jumpY);
      addPopup(p.xNorm, 60, "SHIELD SAVED!", "#00f3ff");
      return;
    }

    p.hp -= 1;
    p.invuln = 1.4;
    run.shake = 18;
    audio.crash();
    addParticles(p.xNorm, 20, "#ff3355", 26, p.jumpY);

    if (p.hp <= 0) {
      endGame();
    }
  }

  function update(dt) {
    if (hornFlashTimer > 0) hornFlashTimer -= dt;
    if (wipersOn) wiperPhase += dt * 6.5;

    if (TIME_MODES[timeModeIndex] === "AUTO") {
      dayPhase = (dayPhase + dt * 0.028) % 3;
    }

    for (const cl of clouds) {
      cl.x = (cl.x + cl.speed * dt) % 1.2;
    }

    for (const d of windshieldDrops) {
      d.y += d.vy * dt * (run && run.player.boosting ? 2.2 : 1);
      if (d.y > 0.68) {
        d.y = 0.06;
        d.x = 0.08 + Math.random() * 0.84;
      }
    }

    if (state !== "playing" || !run) return;

    const p = run.player;
    const spec = run.carSpec;
    p.invuln = Math.max(0, p.invuln - dt);
    p.magnetTimer = Math.max(0, p.magnetTimer - dt);
    run.shake = Math.max(0, run.shake - 38 * dt);

    run.baseSpeed = Math.min(820, (440 + run.distanceKm * 48) * spec.topMult);

    const steerLeft = keys.has("ArrowLeft") || keys.has("KeyA") || touchState.left;
    const steerRight = keys.has("ArrowRight") || keys.has("KeyD") || touchState.right;
    const wantNitro = keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW") || touchState.nitro;
    const wantBrake = keys.has("ArrowDown") || keys.has("KeyS") || touchState.brake;
    const wantDrift = keys.has("ShiftLeft") || keys.has("ShiftRight");

    p.braking = wantBrake;
    if (wantNitro && p.nitro > 2) {
      p.boosting = true;
      p.nitro = Math.max(0, p.nitro - 25 * dt);
    } else {
      p.boosting = false;
      p.nitro = Math.min(100, p.nitro + (p.drifting ? 18 : 6.5) * dt);
    }

    let targetSpeed = run.baseSpeed;
    if (p.boosting) targetSpeed = run.baseSpeed * 1.72;
    else if (wantBrake) targetSpeed = run.baseSpeed * 0.54;

    run.speed += (targetSpeed - run.speed) * Math.min(1, 7 * dt);
    run.fovZoom += ((p.boosting ? 1 : 0) - run.fovZoom) * Math.min(1, 6 * dt);
    audio.updateEngine(run.speed * 0.34, p.boosting, true);

    const steerDir = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
    p.turnDir = steerDir;
    p.drifting = p.jumpY <= 1 && Math.abs(steerDir) > 0 && (wantDrift || Math.abs(p.vxNorm) > 1.05);

    const maxVx = (p.drifting ? 2.25 : 1.95) * spec.steerMult;
    p.vxNorm += (steerDir * maxVx - p.vxNorm) * Math.min(1, 13 * dt);
    p.xNorm += p.vxNorm * dt;
    p.steerAngle += (steerDir * 0.72 - p.steerAngle) * Math.min(1, 12 * dt);
    p.bodyRoll += (steerDir * (p.drifting ? 0.14 : 0.09) - p.bodyRoll) * Math.min(1, 10 * dt);

    // Camera banking into curves & drifts (Asphalt Legends feel!)
    const targetBank = -steerDir * 0.024 - roadCurve(run.worldZ) * 0.014;
    run.camBank += (targetBank - run.camBank) * Math.min(1, 5 * dt);

    const limit = 0.88;
    if (p.xNorm < -limit) {
      p.xNorm = -limit;
      p.vxNorm = 0;
    } else if (p.xNorm > limit) {
      p.xNorm = limit;
      p.vxNorm = 0;
    }

    // Jump physics (ramps)
    if (p.jumpY > 0 || p.jumpVy > 0) {
      p.jumpY += p.jumpVy * dt;
      p.jumpVy -= 560 * dt;
      if (p.jumpY <= 0) {
        p.jumpY = 0;
        p.jumpVy = 0;
        run.shake = 10;
        audio.land();
        addParticles(p.xNorm - 0.07, 0, "#fbbf24", 8, 2);
        addParticles(p.xNorm + 0.07, 0, "#fbbf24", 8, 2);
      }
    }

    // Drift sparks
    if (p.drifting && Math.random() < 0.8) {
      run.particles.push({
        xNorm: p.xNorm - steerDir * 0.07,
        z: -28,
        y: 2,
        vxNorm: -steerDir * 0.45 + (Math.random() - 0.5) * 0.2,
        vz: -180,
        vy: 30,
        life: 0.2,
        maxLife: 0.2,
        size: 3.5,
        color: Math.random() < 0.5 ? "#f59e0b" : "#38bdf8",
      });
    }

    // Nitro shockwave flames
    if (p.boosting && Math.random() < 0.9) {
      run.particles.push({
        xNorm: p.xNorm + (Math.random() - 0.5) * 0.08,
        z: -34,
        y: p.jumpY + 4,
        vxNorm: (Math.random() - 0.5) * 0.22,
        vz: -260,
        vy: 15,
        life: 0.16,
        maxLife: 0.16,
        size: 4.5,
        color: Math.random() < 0.45 ? "#c084fc" : Math.random() < 0.5 ? "#38bdf8" : "#fb923c",
      });
    }

    run.worldZ += run.speed * dt;
    run.distanceKm += (run.speed * dt) / 2800;
    run.score += run.speed * dt * (p.boosting ? 0.25 : 0.12);

    // Spawners
    run.spawnTimer -= dt;
    if (run.spawnTimer <= 0) {
      spawnTraffic();
      const density = Math.max(0.34, 0.94 - run.distanceKm * 0.045);
      run.spawnTimer = p.boosting ? density * 0.72 : density;
    }

    run.coinTimer -= dt;
    if (run.coinTimer <= 0) {
      spawnCoinLine();
      run.coinTimer = 1.85 + Math.random() * 1.1;
    }

    run.powerupTimer -= dt;
    if (run.powerupTimer <= 0) {
      spawnPowerup();
      run.powerupTimer = 8.5 + Math.random() * 4;
    }

    run.rampTimer -= dt;
    if (run.rampTimer <= 0) {
      spawnRamp();
      run.rampTimer = 7.5 + Math.random() * 4.5;
    }

    // Ramps update
    for (let i = run.ramps.length - 1; i >= 0; i--) {
      const r = run.ramps[i];
      r.z -= run.speed * dt;
      if (r.z < -120) {
        run.ramps.splice(i, 1);
        continue;
      }
      if (!r.hit && p.jumpY < 8 && Math.abs(r.xNorm - p.xNorm) < 0.24 && Math.abs(r.z) < 42) {
        r.hit = true;
        p.jumpVy = 260;
        p.jumpY = 2;
        p.nitro = Math.min(100, p.nitro + 25);
        run.score += 300;
        audio.jump();
        addPopup(p.xNorm, 70, "AIRBORNE! +300", "#38bdf8");
      }
    }

    // Traffic update
    for (let i = run.traffic.length - 1; i >= 0; i--) {
      const car = run.traffic[i];
      if (car.honked > 0) car.honked -= dt;

      car.z -= (run.speed - car.speed) * dt;

      if (car.kind === "lambo" || car.kind === "bmw") {
        car.swerveTimer -= dt;
        if (car.swerveTimer <= 0 && car.z < 900 && car.z > 260) {
          car.swerveTimer = 99;
          const nextLane = Math.max(0, Math.min(3, car.lane + (Math.random() < 0.5 ? -1 : 1)));
          car.lane = nextLane;
          car.targetXNorm = laneNorm(nextLane);
        }
      }
      car.xNorm += (car.targetXNorm - car.xNorm) * Math.min(1, 4.5 * dt);

      if (car.z < -220) {
        run.traffic.splice(i, 1);
        continue;
      }

      // If airborne high enough, fly safely over traffic!
      if (
        p.jumpY < 26 &&
        Math.abs(car.xNorm - p.xNorm) < (car.wNorm + spec.wNorm) * 0.44 &&
        Math.abs(car.z) < (car.zLen + spec.zLen) * 0.44
      ) {
        run.traffic.splice(i, 1);
        handleCrash();
        if (state !== "playing") return;
        continue;
      }

      if (!car.nearMissed && Math.abs(car.z) < (car.zLen + spec.zLen) * 0.52) {
        const gap = Math.abs(car.xNorm - p.xNorm) - (car.wNorm + spec.wNorm) * 0.5;
        if (gap > 0 && gap < 0.22) {
          car.nearMissed = true;
          run.nearMisses += 1;
          run.score += 150;
          p.nitro = Math.min(100, p.nitro + 12);
          audio.nearMiss();
          addPopup(p.xNorm, 55, "NEAR MISS +150", "#39ff14");
        }
      }
    }

    for (let i = run.coins.length - 1; i >= 0; i--) {
      const c = run.coins[i];
      c.z -= run.speed * dt;
      if (p.magnetTimer > 0 && c.z > -30 && c.z < 360) {
        c.xNorm += (p.xNorm - c.xNorm) * Math.min(1, 8 * dt);
        c.z -= 260 * dt;
      }
      if (c.z < -120) {
        run.coins.splice(i, 1);
        continue;
      }
      if (Math.abs(c.xNorm - p.xNorm) < 0.17 && Math.abs(c.z) < 48) {
        run.coins.splice(i, 1);
        run.score += p.boosting ? 100 : 50;
        audio.coin();
        addParticles(c.xNorm, 12, "#ffb800", 6, p.jumpY);
      }
    }

    for (let i = run.powerups.length - 1; i >= 0; i--) {
      const pw = run.powerups[i];
      pw.z -= run.speed * dt;
      if (pw.z < -120) {
        run.powerups.splice(i, 1);
        continue;
      }
      if (Math.abs(pw.xNorm - p.xNorm) < 0.18 && Math.abs(pw.z) < 52) {
        run.powerups.splice(i, 1);
        audio.powerup();
        if (pw.kind === "fuel") {
          p.nitro = 100;
          addPopup(p.xNorm, 60, "NITRO FULL!", "#39ff14");
        } else if (pw.kind === "shield") {
          p.shield = true;
          addPopup(p.xNorm, 60, "SHIELD ACTIVE!", "#00f3ff");
        } else if (pw.kind === "magnet") {
          p.magnetTimer = 9;
          addPopup(p.xNorm, 60, "COIN MAGNET!", "#ffb800");
        }
      }
    }

    for (let i = run.particles.length - 1; i >= 0; i--) {
      const pt = run.particles[i];
      pt.xNorm += pt.vxNorm * dt;
      pt.z += pt.vz * dt;
      pt.y += (pt.vy || 0) * dt;
      pt.life -= dt;
      if (pt.life <= 0) run.particles.splice(i, 1);
    }

    for (let i = run.popups.length - 1; i >= 0; i--) {
      const pp = run.popups[i];
      pp.life -= dt;
      if (pp.life <= 0) run.popups.splice(i, 1);
    }

    syncHUD();
  }

  function syncHUD() {
    if (!run) return;
    const p = run.player;
    hudScore.textContent = fmt(run.score);
    if (run.score > bestScore) hudBest.textContent = fmt(run.score);
    hudSpeed.textContent = Math.round(run.speed * 0.34) + " KM/H";
    hudNitroFill.style.width = p.nitro + "%";

    let heartsHtml = "";
    for (let i = 0; i < p.maxHp; i++) {
      heartsHtml += `<span class="heart ${i < p.hp ? "" : "empty"}"></span>`;
    }
    if (p.shield) heartsHtml += `<span class="shield-icon"></span>`;
    hudHearts.innerHTML = heartsHtml;

    const buffs = [];
    if (p.boosting) buffs.push(`<span class="buff-pill" style="color:#c084fc">SHOCKWAVE 2X</span>`);
    if (p.drifting) buffs.push(`<span class="buff-pill" style="color:#38bdf8">DRIFT +NITRO</span>`);
    if (p.jumpY > 2) buffs.push(`<span class="buff-pill" style="color:#facc15">AIRBORNE</span>`);
    if (p.magnetTimer > 0) buffs.push(`<span class="buff-pill" style="color:#ffb800">MAGNET ${p.magnetTimer.toFixed(1)}s</span>`);
    if (p.shield) buffs.push(`<span class="buff-pill" style="color:#00f3ff">SHIELD READY</span>`);
    buffBar.innerHTML = buffs.join("");
  }

  // ==================== CURVED + HILLY 3D ROAD PROJECTION ====================
  const SLICES = 46;
  const DZ = 36;

  function buildRoadSlices(worldZ, proj) {
    const slices = [];
    const baseElev = roadHill(worldZ);
    let dx = 0;
    let xOff = 0;

    for (let i = 0; i < SLICES; i++) {
      const z = i * DZ;
      const absZ = worldZ + z;
      if (i > 0) {
        dx += roadCurve(absZ) * 0.032;
        xOff += dx;
      }
      const absElev = roadHill(absZ);
      const yOff = absElev - baseElev;
      const dz = z + proj.camZ;
      const scale = proj.camZ / dz;
      const yScreen = proj.horizonY + (proj.groundY - proj.horizonY) * scale - yOff * scale;
      const cx = viewW * 0.5 + (0 - proj.camX) * proj.roadHalfBottom * scale + xOff * proj.curveScale * scale;
      const halfW = proj.roadHalfBottom * scale;
      slices.push({ z, absZ, absElev, xOff, yOff, scale, yScreen, cx, halfW });
    }
    return slices;
  }

  function sampleCurveAt(z, slices) {
    if (z <= 0) return { xOff: 0, yOff: 0 };
    const maxZ = (SLICES - 1) * DZ;
    const cz = Math.min(maxZ - 0.01, z);
    const idx = Math.floor(cz / DZ);
    const t = (cz - idx * DZ) / DZ;
    const a = slices[idx];
    const b = slices[idx + 1];
    return {
      xOff: a.xOff + (b.xOff - a.xOff) * t,
      yOff: a.yOff + (b.yOff - a.yOff) * t,
    };
  }

  function projectCurved3D(xNorm, z, elevY, proj, slices) {
    const { xOff, yOff } = sampleCurveAt(z, slices);
    const dz = Math.max(18, z + proj.camZ);
    const scale = proj.camZ / dz;
    const y = proj.horizonY + (proj.groundY - proj.horizonY) * scale - (yOff + elevY) * scale;
    const x = viewW * 0.5 + (xNorm - proj.camX) * proj.roadHalfBottom * scale + xOff * proj.curveScale * scale;
    return { x, y, scale };
  }

  function get3DProjParams(camId) {
    const fov = run ? run.fovZoom : 0;
    const horizonY = viewH * (camId === "cockpit" ? 0.41 : camId === "hood" ? 0.44 : 0.35 - fov * 0.02);
    const groundY = viewH * (camId === "chase3d" ? 0.88 : 0.96);
    const camZ = (camId === "chase3d" ? 215 : 122) * (1 - fov * 0.1);
    const roadHalfBottom = Math.min(viewW * 0.48, camId === "chase3d" ? 375 : 495) * (1 + fov * 0.08);
    const p = run ? run.player : { xNorm: 0 };
    const camX = p.xNorm * (camId === "chase3d" ? 0.14 : 0.65);
    const curveScale = viewW * 0.42;
    return { horizonY, groundY, camZ, roadHalfBottom, camX, curveScale };
  }

  // ==================== NEW YORK CITY DAY / SUNSET / NIGHT HIGH-GRAPHICS ====================
  function drawAsphaltSky(horizonY, worldZ, atmo) {
    // Dynamic Day / Golden Sunset / Night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 14);
    sky.addColorStop(0, atmo.skyTop);
    sky.addColorStop(0.55, atmo.skyMid);
    sky.addColorStop(1, atmo.skyHor);
    ctx.fillStyle = sky;
    ctx.fillRect(-40, -40, viewW + 80, horizonY + 54);

    // Stars (visible at Night/Dusk)
    if (atmo.nightAlpha > 0.08) {
      ctx.save();
      ctx.globalAlpha = atmo.nightAlpha;
      for (const s of nightStars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
        ctx.fillRect(s.x * viewW, s.y * viewH, s.size, s.size);
      }
      ctx.restore();
    }

    // Sun + Volumetric Lens Flare (Day & Golden Sunset)
    if (atmo.sunAlpha > 0.05) {
      const sunX = viewW * 0.5 + viewW * 0.2 * (1 - atmo.sunsetAlpha);
      const sunY = horizonY * (0.28 + atmo.sunsetAlpha * 0.56);
      const sunR = 115 + atmo.sunsetAlpha * 55;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, sunR);
      sunGrad.addColorStop(0, `rgba(255, 252, 235, ${atmo.sunAlpha})`);
      sunGrad.addColorStop(0.22, `rgba(253, 224, 71, ${0.55 * atmo.sunAlpha})`);
      sunGrad.addColorStop(0.55, `rgba(251, 146, 60, ${0.22 * atmo.sunAlpha})`);
      sunGrad.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon with atmospheric halo (Night)
    if (atmo.nightAlpha > 0.15) {
      const moonX = viewW * 0.82;
      const moonY = horizonY * 0.28;
      const moonHalo = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 76);
      moonHalo.addColorStop(0, `rgba(248, 250, 252, ${0.9 * atmo.nightAlpha})`);
      moonHalo.addColorStop(0.22, `rgba(226, 232, 240, ${0.25 * atmo.nightAlpha})`);
      moonHalo.addColorStop(1, "rgba(226, 232, 240, 0)");
      ctx.fillStyle = moonHalo;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 76, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drifting Volumetric Clouds (Day & Sunset)
    if (atmo.sunAlpha > 0.1) {
      ctx.save();
      for (const cl of clouds) {
        const cx = (cl.x * viewW) - 80;
        const cy = cl.y * horizonY * 1.4;
        ctx.fillStyle = atmo.sunsetAlpha > 0.4
          ? `rgba(253, 186, 116, ${0.38 * atmo.sunAlpha})`
          : `rgba(255, 255, 255, ${0.58 * atmo.sunAlpha})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cl.w * 0.5, cl.h * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - cl.w * 0.25, cy + 4, cl.w * 0.34, cl.h * 0.42, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + cl.w * 0.26, cy + 3, cl.w * 0.32, cl.h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Manhattan horizon atmospheric haze
    const cityGlow = ctx.createLinearGradient(0, horizonY - 95, 0, horizonY + 12);
    cityGlow.addColorStop(0, "rgba(251, 146, 60, 0)");
    cityGlow.addColorStop(0.65, `rgba(251, 191, 36, ${0.14 + atmo.sunsetAlpha * 0.18})`);
    cityGlow.addColorStop(1, `rgba(226, 232, 240, ${0.15 + atmo.sunAlpha * 0.14})`);
    ctx.fillStyle = cityGlow;
    ctx.fillRect(-40, horizonY - 95, viewW + 80, 107);

    // Distant Manhattan Skyline
    const step = 36;
    for (let sx = -36; sx < viewW + 36; sx += step) {
      const idx = Math.round(sx / step);
      const h = 34 + Math.abs(Math.sin(idx * 1.73)) * 78;
      ctx.fillStyle = atmo.nightAlpha > 0.5 ? "#080d1c" : atmo.sunsetAlpha > 0.4 ? "#231b35" : "#476082";
      ctx.fillRect(sx, horizonY - h, step - 3, h + 14);
      if (atmo.nightAlpha > 0.25) {
        ctx.fillStyle = idx % 2 === 0
          ? `rgba(253, 224, 120, ${0.38 * atmo.nightAlpha})`
          : `rgba(125, 211, 252, ${0.34 * atmo.nightAlpha})`;
        for (let wy = horizonY - h + 8; wy < horizonY - 4; wy += 9) {
          if (((idx * 7 + wy) % 5) < 2) ctx.fillRect(sx + 6, wy, 4, 3);
          if (((idx * 11 + wy) % 5) < 2) ctx.fillRect(sx + 18, wy, 4, 3);
        }
      }
    }

    // === ICONIC NYC LANDMARKS IN SKYLINE ===
    const towerShade = atmo.nightAlpha > 0.5 ? "#0b1326" : atmo.sunsetAlpha > 0.4 ? "#261c38" : "#435d82";

    // 1. Empire State Building
    const esbX = viewW * 0.32;
    const esbH = Math.min(185, horizonY * 0.78);
    ctx.fillStyle = towerShade;
    ctx.fillRect(esbX - 22, horizonY - esbH * 0.55, 44, esbH * 0.55 + 10);
    ctx.fillRect(esbX - 14, horizonY - esbH * 0.8, 28, esbH * 0.28);
    ctx.fillRect(esbX - 8, horizonY - esbH * 0.92, 16, esbH * 0.14);
    ctx.fillStyle = atmo.nightAlpha > 0.3 ? "#38bdf8" : "#cbd5e1";
    ctx.fillRect(esbX - 7, horizonY - esbH * 0.92, 14, 5);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(esbX - 1.5, horizonY - esbH - 22, 3, 28);
    if (Math.floor(performance.now() / 550) % 2 === 0) {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(esbX, horizonY - esbH - 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. One World Trade Center
    const wtcX = viewW * 0.68;
    const wtcH = Math.min(198, horizonY * 0.82);
    const wtcGrad = ctx.createLinearGradient(wtcX - 18, horizonY - wtcH, wtcX + 18, horizonY);
    wtcGrad.addColorStop(0, atmo.sunAlpha > 0.3 ? "#7dd3fc" : "#1e3a5f");
    wtcGrad.addColorStop(1, towerShade);
    ctx.fillStyle = wtcGrad;
    ctx.beginPath();
    ctx.moveTo(wtcX - 19, horizonY + 8);
    ctx.lineTo(wtcX - 11, horizonY - wtcH);
    ctx.lineTo(wtcX + 11, horizonY - wtcH);
    ctx.lineTo(wtcX + 19, horizonY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(wtcX - 1.2, horizonY - wtcH - 30, 2.4, 30);

    // 3. Chrysler Building
    const chX = viewW * 0.16;
    const chH = Math.min(148, horizonY * 0.64);
    ctx.fillStyle = towerShade;
    ctx.fillRect(chX - 13, horizonY - chH * 0.78, 26, chH * 0.78 + 8);
    for (let t = 0; t < 4; t++) {
      ctx.beginPath();
      ctx.arc(chX, horizonY - chH * 0.78 - t * 6, 12 - t * 2.4, Math.PI, 0);
      ctx.strokeStyle = atmo.nightAlpha > 0.3 ? "rgba(253, 230, 138, 0.5)" : "rgba(241, 245, 249, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillRect(chX - 1, horizonY - chH - 14, 2, 22);
  }

  function drawAsphaltSkyscraper(x, y, scale, sideDir, seed, fogAlpha, rowLayer, atmo) {
    // atmo can be null in top-down view — fall back to a neutral day-time look
    if (!atmo) atmo = { nightAlpha: 0, sunAlpha: 1, sunsetAlpha: 0, bldgTop: "rgb(100,128,165)", bldgBot: "rgb(51,65,85)" };
    const mult = rowLayer === 2 ? 1.48 : 1.0;
    const bw = (98 + (seed % 3) * 32) * scale * mult;
    const bh = (220 + (seed % 5) * 60) * scale * mult;
    const depth = (48 + (seed % 2) * 18) * scale * mult;
    if (bw < 4 || bh < 6) return;

    const topY = y - bh;
    const frontX = sideDir < 0 ? x - bw : x;
    const nycColors = ["#facc15", "#00f3ff", "#ff2a85", "#fb923c", "#38bdf8"];
    const accent = nycColors[seed % nycColors.length];

    ctx.save();
    ctx.globalAlpha = Math.max(0.18, 1 - fogAlpha * 0.82);

    // 3D side wall (shaded for realistic sun direction)
    ctx.fillStyle = atmo.nightAlpha > 0.5 ? (rowLayer === 2 ? "#070b16" : "#0b1122") : atmo.bldgBot;
    ctx.beginPath();
    if (sideDir < 0) {
      ctx.moveTo(frontX + bw, topY);
      ctx.lineTo(frontX + bw + depth * 0.5, topY + depth * 0.2);
      ctx.lineTo(frontX + bw + depth * 0.5, y + depth * 0.1);
      ctx.lineTo(frontX + bw, y);
    } else {
      ctx.moveTo(frontX, topY);
      ctx.lineTo(frontX - depth * 0.5, topY + depth * 0.2);
      ctx.lineTo(frontX - depth * 0.5, y + depth * 0.1);
      ctx.lineTo(frontX, y);
    }
    ctx.closePath();
    ctx.fill();

    // High-contrast Manhattan Glass & Limestone Skyscraper Facade
    const facade = ctx.createLinearGradient(frontX, topY, frontX, y);
    facade.addColorStop(0, atmo.bldgTop);
    facade.addColorStop(1, atmo.bldgBot);
    ctx.fillStyle = facade;
    ctx.fillRect(frontX, topY, bw, bh);

    // Glossy Sky Reflection on Glass Tower
    ctx.fillStyle = atmo.sunAlpha > 0.3 ? "rgba(255, 255, 255, 0.18)" : "rgba(186, 230, 253, 0.09)";
    ctx.beginPath();
    ctx.moveTo(frontX, topY + bh * 0.16);
    ctx.lineTo(frontX + bw, topY);
    ctx.lineTo(frontX + bw, topY + bh * 0.42);
    ctx.lineTo(frontX, topY + bh * 0.58);
    ctx.closePath();
    ctx.fill();

    // Architectural window grid (reflective glass in Day, glowing warm/cool lights at Night!)
    const floors = 11;
    const cols = 4;
    const padX = bw * 0.1;
    const cellW = (bw - padX * 2) / cols;
    const floorH = bh / floors;
    for (let r = 0; r < floors - 1; r++) {
      for (let c = 0; c < cols; c++) {
        const h = (seed + r * 11 + c * 7) % 9;
        if (atmo.nightAlpha > 0.35 && h < 4) {
          ctx.fillStyle = h <= 1 ? "rgba(253, 224, 130, 0.85)" : "rgba(147, 197, 253, 0.65)";
        } else {
          ctx.fillStyle = atmo.sunAlpha > 0.4
            ? (h % 2 === 0 ? "rgba(224, 242, 254, 0.48)" : "rgba(30, 58, 95, 0.55)")
            : "rgba(15, 23, 42, 0.7)";
        }
        ctx.fillRect(
          frontX + padX + c * cellW + cellW * 0.12,
          topY + r * floorH + floorH * 0.22,
          cellW * 0.74,
          floorH * 0.52
        );
      }
    }

    // Ground-level NYC retail storefronts & awnings
    if (rowLayer === 1 && scale > 0.14) {
      const shopH = bh * 0.11;
      ctx.fillStyle = atmo.nightAlpha > 0.35 ? "rgba(251, 191, 36, 0.78)" : "rgba(30, 41, 59, 0.82)";
      ctx.fillRect(frontX + bw * 0.08, y - shopH, bw * 0.84, shopH * 0.85);
      if (seed % 2 === 0) {
        const sx = sideDir < 0 ? frontX + bw + 5 * scale : frontX - 5 * scale;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(sx, y - 18 * scale, Math.max(1.5, 4 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Giant Times Square Animated LED Jumbotrons on front-row towers
    if (rowLayer === 1 && seed % 2 === 0 && scale > 0.13) {
      const bbw = bw * 0.86;
      const bbh = bh * 0.19;
      const bbx = frontX + bw * 0.07;
      const bby = topY + bh * 0.42;

      const jbGrad = ctx.createLinearGradient(bbx, bby, bbx + bbw, bby + bbh);
      jbGrad.addColorStop(0, "#090d1f");
      jbGrad.addColorStop(0.5, accent);
      jbGrad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = jbGrad;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1, 1.8 * scale);
      ctx.fillRect(bbx, bby, bbw, bbh);
      ctx.strokeRect(bbx, bby, bbw, bbh);

      if (scale > 0.2) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(7, Math.round(13 * scale))}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(BILLBOARD_TITLES[seed % BILLBOARD_TITLES.length], bbx + bbw * 0.5, bby + bbh * 0.5);
      }
    }

    // Rooftop parapet & water tower / spire
    ctx.fillStyle = "#334155";
    ctx.fillRect(frontX, topY, bw, Math.max(1.5, 3 * scale));
    if (seed % 2 === 0 && scale > 0.16) {
      const antX = frontX + bw * 0.5;
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = Math.max(1, scale * 2);
      ctx.beginPath();
      ctx.moveTo(antX, topY);
      ctx.lineTo(antX, topY - 26 * scale);
      ctx.stroke();
      if (Math.floor(performance.now() / 520) % 2 === 0) {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(antX, topY - 26 * scale, Math.max(1.5, 3 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawBrooklynBridgeTower(z, proj, slices) {
    const pL = projectCurved3D(-1.22, z, 0, proj, slices);
    const pR = projectCurved3D(1.22, z, 0, proj, slices);
    const s = pL.scale;
    if (s < 0.08 || s > 1.35) return;

    const towerH = 260 * s;
    const towerW = 36 * s;
    const topY = pL.y - towerH;

    ctx.save();
    // Gothic stone twin bridge towers
    [pL.x, pR.x].forEach((tx, idx) => {
      const x0 = idx === 0 ? tx - towerW : tx;
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.fillRect(x0, topY, towerW, towerH);
      ctx.strokeRect(x0, topY, towerW, towerH);

      // Gothic pointed arches inside stone tower
      ctx.fillStyle = "#090e1c";
      ctx.beginPath();
      ctx.roundRect(x0 + towerW * 0.25, topY + towerH * 0.18, towerW * 0.5, towerH * 0.34, 8 * s);
      ctx.fill();

      // Tower crown lamps
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(x0 + towerW * 0.5, topY - 4 * s, Math.max(1.5, 3.5 * s), 0, Math.PI * 2);
      ctx.fill();
    });

    // Overhead bridge arch & steel suspension cables
    ctx.fillStyle = "#334155";
    ctx.fillRect(pL.x - towerW, topY + towerH * 0.15, pR.x - pL.x + towerW * 2, 14 * s);

    ctx.strokeStyle = "rgba(203, 213, 225, 0.55)";
    ctx.lineWidth = Math.max(1, 1.8 * s);
    for (let k = -0.8; k <= 0.8; k += 0.32) {
      const roadPt = projectCurved3D(k, z, 0, proj, slices);
      ctx.beginPath();
      ctx.moveTo(k < 0 ? pL.x - towerW * 0.5 : pR.x + towerW * 0.5, topY + 6 * s);
      ctx.lineTo(roadPt.x, roadPt.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlyoverBridge(z, proj, slices, idx) {
    const pNearL = projectCurved3D(-1.05, Math.max(0, z - 44), 0, proj, slices);
    const pNearR = projectCurved3D(1.05, Math.max(0, z - 44), 0, proj, slices);
    const pFarL = projectCurved3D(-1.05, z + 44, 0, proj, slices);
    const pFarR = projectCurved3D(1.05, z + 44, 0, proj, slices);

    const s = pNearL.scale;
    if (s < 0.08 || s > 1.5) return;

    ctx.save();
    // Realistic cast shadow across highway below
    ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
    ctx.beginPath();
    ctx.moveTo(pFarL.x, pFarL.y);
    ctx.lineTo(pFarR.x, pFarR.y);
    ctx.lineTo(pNearR.x, pNearR.y);
    ctx.lineTo(pNearL.x, pNearL.y);
    ctx.closePath();
    ctx.fill();

    // Concrete piers on shoulders & outer lanes
    const deckH = 122 * s;
    const deckThick = 28 * s;
    const spanL = projectCurved3D(-2.9, z, 0, proj, slices);
    const spanR = projectCurved3D(2.9, z, 0, proj, slices);
    const deckY = spanL.y - deckH;

    [-1.18, 1.18, -2.0, 2.0].forEach((px) => {
      const pier = projectCurved3D(px, z, 0, proj, slices);
      const pw = 24 * pier.scale;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(pier.x - pw * 0.5, pier.y - deckH, pw, deckH);
      ctx.fillStyle = "#334155";
      ctx.fillRect(pier.x - pw * 0.5, pier.y - deckH, pw * 0.35, deckH);
    });

    // 3D Underside shadow girder + glowing LED underpass ceiling strips!
    ctx.fillStyle = "#090e1a";
    ctx.fillRect(spanL.x, deckY + deckThick * 0.72, spanR.x - spanL.x, deckThick * 0.52);

    const lightSpanW = pNearR.x - pNearL.x;
    for (let u = 0.15; u <= 0.85; u += 0.35) {
      ctx.fillStyle = "rgba(253, 224, 130, 0.75)";
      ctx.fillRect(pNearL.x + lightSpanW * u - 14 * s, deckY + deckThick * 0.82, 28 * s, Math.max(1.5, 4 * s));
    }

    const deckGrad = ctx.createLinearGradient(0, deckY, 0, deckY + deckThick);
    deckGrad.addColorStop(0, "#64748b");
    deckGrad.addColorStop(0.45, "#334155");
    deckGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = deckGrad;
    ctx.fillRect(spanL.x, deckY, spanR.x - spanL.x, deckThick);

    // Steel truss arch above flyover deck
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = Math.max(1.2, 3 * s);
    ctx.beginPath();
    ctx.moveTo(pNearL.x - 40 * s, deckY - 6 * s);
    ctx.quadraticCurveTo((pNearL.x + pNearR.x) * 0.5, deckY - 58 * s, pNearR.x + 40 * s, deckY - 6 * s);
    ctx.stroke();

    // Top concrete parapet railing
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(spanL.x, deckY - 7 * s, spanR.x - spanL.x, 7 * s);

    // NYC Expressway Green Sign + Yellow Clearance Badge mounted on Flyover
    const midX = (pNearL.x + pNearR.x) * 0.5;
    if (s > 0.16) {
      ctx.fillStyle = "#065f46";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = Math.max(1, 1.5 * s);
      ctx.fillRect(midX - 78 * s, deckY + 3 * s, 96 * s, 21 * s);
      ctx.strokeRect(midX - 78 * s, deckY + 3 * s, 96 * s, 21 * s);

      ctx.fillStyle = "#facc15";
      ctx.fillRect(midX + 24 * s, deckY + 6 * s, 54 * s, 15 * s);
      if (s > 0.24) {
        ctx.fillStyle = "#f8fafc";
        ctx.font = `bold ${Math.max(7, Math.round(9.5 * s))}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FDR EXPRESSWAY", midX - 30 * s, deckY + 13.5 * s);
        ctx.fillStyle = "#090d16";
        ctx.font = `bold ${Math.max(7, Math.round(8.5 * s))}px monospace`;
        ctx.fillText("14FT 6IN", midX + 51 * s, deckY + 13.5 * s);
      }
    }

    // Animated cross-traffic vehicles driving across the top of the flyover!
    const tNow = performance.now() * 0.001;
    const spanW = spanR.x - spanL.x;
    for (let c = 0; c < 3; c++) {
      const dir = c % 2 === 0 ? 1 : -1;
      const frac = ((tNow * (0.14 + c * 0.05) + idx * 0.31 + c * 0.37) % 1);
      const cx = dir > 0 ? spanL.x + frac * spanW : spanR.x - frac * spanW;
      const cy = deckY - 6 * s;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(cx - 16 * s, cy - 11 * s, 32 * s, 11 * s);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(dir > 0 ? cx + 12 * s : cx - 16 * s, cy - 8 * s, 5 * s, 4 * s);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(dir > 0 ? cx - 16 * s : cx + 12 * s, cy - 8 * s, 5 * s, 4 * s);
    }

    // Streetlamps along top of flyover
    for (let lx = spanL.x + 60 * s; lx < spanR.x - 40 * s; lx += 160 * s) {
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath();
      ctx.moveTo(lx, deckY - 6 * s);
      ctx.lineTo(lx, deckY - 26 * s);
      ctx.stroke();
      ctx.fillStyle = "rgba(253, 224, 130, 0.7)";
      ctx.beginPath();
      ctx.arc(lx, deckY - 26 * s, Math.max(1.5, 3 * s), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function draw3DTreePersp(x, y, scale, seed, fogAlpha) {
    if (scale < 0.06) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, 1 - fogAlpha * 0.8);
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.ellipse(8, 2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Palm / city tree mix
    if (seed % 3 === 0) {
      // Asphalt coastal city palm tree!
      ctx.strokeStyle = "#4b2e1e";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(5, -30, 2, -64);
      ctx.stroke();

      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 3.5;
      for (let a = -2.4; a <= 0.8; a += 0.65) {
        ctx.beginPath();
        ctx.moveTo(2, -64);
        ctx.quadraticCurveTo(2 + Math.cos(a) * 18, -74, 2 + Math.cos(a) * 32, -52);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#3b2314";
      ctx.fillRect(-4.5, -36, 9, 38);
      const clusters = [
        { ox: -12, oy: -38, r: 16, col: "#0b3b24" },
        { ox: 12, oy: -37, r: 15, col: "#0a3320" },
        { ox: 0, oy: -48, r: 20, col: "#14532d" },
        { ox: -7, oy: -54, r: 14, col: "#166534" },
        { ox: 7, oy: -52, r: 13, col: "#15803d" },
        { ox: -2, oy: -60, r: 11, col: "#22c55e" },
      ];
      for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i];
        ctx.fillStyle = c.col;
        ctx.globalAlpha = i === 5 ? 0.35 : 0.95;
        ctx.beginPath();
        ctx.arc(c.ox, c.oy, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawOverheadGantry(z, proj, slices, signIdx) {
    const pL = projectCurved3D(-1.08, z, 0, proj, slices);
    const pR = projectCurved3D(1.08, z, 0, proj, slices);
    const s = pL.scale;
    if (s < 0.08 || s > 1.25) return;

    const beamH = 132 * s;
    const topY = pL.y - beamH;
    const sign = GANTRY_SIGNS[signIdx % GANTRY_SIGNS.length];

    ctx.save();
    ctx.fillStyle = "#334155";
    ctx.fillRect(pL.x - 4 * s, topY, 8 * s, beamH);
    ctx.fillRect(pR.x - 4 * s, topY, 8 * s, beamH);

    // Futuristic neon arch trim on gantry
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(pL.x, topY, pR.x - pL.x, 12 * s);
    ctx.fillStyle = "#00f3ff";
    ctx.fillRect(pL.x, topY + 10 * s, pR.x - pL.x, Math.max(1, 2.5 * s));

    const sw = (pR.x - pL.x) * 0.56;
    const sh = 46 * s;
    const sx = (pL.x + pR.x) * 0.5 - sw * 0.5;
    const sy = topY - sh * 0.45;
    ctx.fillStyle = "#064e3b";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeRect(sx, sy, sw, sh);

    if (s > 0.2) {
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.font = `bold ${Math.max(7, Math.round(13 * s))}px monospace`;
      ctx.fillText(sign[0], sx + sw * 0.5, sy + sh * 0.42);
      ctx.fillStyle = "#fde047";
      ctx.font = `bold ${Math.max(6, Math.round(10 * s))}px monospace`;
      ctx.fillText(sign[1], sx + sw * 0.5, sy + sh * 0.78);
    }
    ctx.restore();
  }

  function drawJumpRamp(ramp, proj, slices) {
    const pBackL = projectCurved3D(ramp.xNorm - 0.16, ramp.z + 45, 22, proj, slices);
    const pBackR = projectCurved3D(ramp.xNorm + 0.16, ramp.z + 45, 22, proj, slices);
    const pFrontL = projectCurved3D(ramp.xNorm - 0.16, ramp.z - 25, 0, proj, slices);
    const pFrontR = projectCurved3D(ramp.xNorm + 0.16, ramp.z - 25, 0, proj, slices);

    ctx.save();
    const grad = ctx.createLinearGradient(0, pBackL.y, 0, pFrontL.y);
    grad.addColorStop(0, "#00f3ff");
    grad.addColorStop(0.5, "#0284c7");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pBackL.x, pBackL.y);
    ctx.lineTo(pBackR.x, pBackR.y);
    ctx.lineTo(pFrontR.x, pFrontR.y);
    ctx.lineTo(pFrontL.x, pFrontL.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing chevrons
    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = Math.max(1.2, 2.5 * pFrontL.scale);
    const midX = (pBackL.x + pBackR.x + pFrontL.x + pFrontR.x) * 0.25;
    const midY = (pBackL.y + pFrontL.y) * 0.5;
    const cw = Math.abs(pFrontR.x - pFrontL.x) * 0.26;
    ctx.beginPath();
    ctx.moveTo(midX - cw, midY + 4 * pFrontL.scale);
    ctx.lineTo(midX, midY - 6 * pFrontL.scale);
    ctx.lineTo(midX + cw, midY + 4 * pFrontL.scale);
    ctx.stroke();
    ctx.restore();
  }

  // ==================== TRUE 3D MULTI-FACE PROJECTED CARS ====================
  function draw3DCarPersp(car, proj, slices, isPlayer, lightMode) {
    const elev = isPlayer && run ? run.player.jumpY : 0;
    const pRearC = projectCurved3D(car.xNorm, car.z, elev, proj, slices);
    const s = pRearC.scale;
    if (s <= 0.04) return;

    const hw = car.wNorm * 0.5;
    const lenZ = car.kind === "truck" ? 105 : 68;
    const bodyH = car.kind === "truck" ? 56 : car.kind === "mahindra" ? 38 : car.kind === "lambo" ? 24 : 29;
    const z0 = car.z;
    const z1 = car.z + lenZ;

    // Project 3D ground corners for shadow
    const gRL = projectCurved3D(car.xNorm - hw * 1.08, z0, 0, proj, slices);
    const gRR = projectCurved3D(car.xNorm + hw * 1.08, z0, 0, proj, slices);
    const gFL = projectCurved3D(car.xNorm - hw * 1.08, z1, 0, proj, slices);
    const gFR = projectCurved3D(car.xNorm + hw * 1.08, z1, 0, proj, slices);

    ctx.save();
    // 1. 3D Ground Shadow Polygon
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.25, 0.78 - elev * 0.008)})`;
    ctx.beginPath();
    ctx.moveTo(gRL.x, gRL.y + 3 * gRL.scale);
    ctx.lineTo(gRR.x, gRR.y + 3 * gRR.scale);
    ctx.lineTo(gFR.x, gFR.y + 3 * gFR.scale);
    ctx.lineTo(gFL.x, gFL.y + 3 * gFL.scale);
    ctx.closePath();
    ctx.fill();

    // 2. Volumetric 3D Headlight Beams ahead of front bumper
    if (isPlayer && lightMode !== "OFF") {
      const beamLen = lightMode === "HIGH" ? 340 : 190;
      const bFL = projectCurved3D(car.xNorm - hw * 0.8, z1, elev * 0.3, proj, slices);
      const bFR = projectCurved3D(car.xNorm + hw * 0.8, z1, elev * 0.3, proj, slices);
      const bEndL = projectCurved3D(car.xNorm - hw * (lightMode === "HIGH" ? 2.1 : 1.45), z1 + beamLen, 0, proj, slices);
      const bEndR = projectCurved3D(car.xNorm + hw * (lightMode === "HIGH" ? 2.1 : 1.45), z1 + beamLen, 0, proj, slices);
      const cone = ctx.createLinearGradient(0, bFL.y, 0, bEndL.y);
      cone.addColorStop(0, lightMode === "HIGH" ? "rgba(240, 249, 255, 0.52)" : "rgba(240, 249, 255, 0.28)");
      cone.addColorStop(0.4, lightMode === "HIGH" ? "rgba(186, 230, 253, 0.22)" : "rgba(186, 230, 253, 0.1)");
      cone.addColorStop(1, "rgba(148, 210, 255, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(bFL.x, bFL.y);
      ctx.lineTo(bEndL.x, bEndL.y);
      ctx.lineTo(bEndR.x, bEndR.y);
      ctx.lineTo(bFR.x, bFR.y);
      ctx.closePath();
      ctx.fill();
    }

    // Project 3D Body Cage Vertices
    const rollShift = isPlayer && run ? run.player.bodyRoll * 18 : 0;
    const rbL = projectCurved3D(car.xNorm - hw, z0, elev + 2, proj, slices);
    const rbR = projectCurved3D(car.xNorm + hw, z0, elev + 2, proj, slices);
    const fbL = projectCurved3D(car.xNorm - hw * 0.96, z1, elev + 2, proj, slices);
    const fbR = projectCurved3D(car.xNorm + hw * 0.96, z1, elev + 2, proj, slices);

    const beltH = elev + bodyH * (car.kind === "truck" ? 0.98 : 0.56);
    const frontBeltH = elev + bodyH * (car.kind === "truck" ? 0.98 : 0.44);
    const rmL = projectCurved3D(car.xNorm - hw * 0.96, z0, beltH, proj, slices);
    const rmR = projectCurved3D(car.xNorm + hw * 0.96, z0, beltH, proj, slices);
    const fmL = projectCurved3D(car.xNorm - hw * 0.9, z1, frontBeltH, proj, slices);
    const fmR = projectCurved3D(car.xNorm + hw * 0.9, z1, frontBeltH, proj, slices);

    const roofW = car.kind === "truck" ? hw * 0.92 : hw * 0.72;
    const roofZ0 = car.kind === "truck" ? z0 + 2 : z0 + lenZ * 0.22;
    const roofZ1 = car.kind === "truck" ? z1 - 4 : z0 + lenZ * 0.64;
    const rrL = projectCurved3D(car.xNorm - roofW, roofZ0, elev + bodyH, proj, slices);
    const rrR = projectCurved3D(car.xNorm + roofW, roofZ0, elev + bodyH, proj, slices);
    const frL = projectCurved3D(car.xNorm - roofW, roofZ1, elev + bodyH, proj, slices);
    const frR = projectCurved3D(car.xNorm + roofW, roofZ1, elev + bodyH, proj, slices);

    const cbL = projectCurved3D(car.xNorm - hw * 0.85, z0 + lenZ * 0.76, elev + bodyH * 0.5, proj, slices);
    const cbR = projectCurved3D(car.xNorm + hw * 0.85, z0 + lenZ * 0.76, elev + bodyH * 0.5, proj, slices);

    // Subtle body-roll lean on upper cabin
    [rmL, rmR, rrL, rrR, frL, frR].forEach((pt) => {
      pt.x += rollShift * pt.scale;
    });

    // Color palette (Stealth Black for player, realistic metallic for traffic)
    const sideColor = isPlayer ? "#0c111a" : car.bodyColor;
    const topColor = isPlayer ? "#1e2736" : car.bodyHi;
    const rearDark = isPlayer ? "#05070b" : car.bodyColor;
    const rearMid = isPlayer ? "#2d384a" : car.bodyHi;

    // 3. Draw Visible 3D Side Panel + Wheels + Side Windows
    const sideDiff = car.xNorm - proj.camX;
    if (Math.abs(sideDiff) > 0.03) {
      const showRight = sideDiff < 0;
      const sRB = showRight ? rbR : rbL;
      const sFB = showRight ? fbR : fbL;
      const sRM = showRight ? rmR : rmL;
      const sFM = showRight ? fmR : fmL;
      const sRR = showRight ? rrR : rrL;
      const sFR = showRight ? frR : frL;
      const sCB = showRight ? cbR : cbL;
      const sideXNorm = showRight ? car.xNorm + hw * 0.98 : car.xNorm - hw * 0.98;

      // 3D Front & Rear Wheels on visible side
      [z0 + lenZ * 0.18, z0 + lenZ * 0.78].forEach((wz) => {
        const wPt = projectCurved3D(sideXNorm, wz, elev + 5, proj, slices);
        ctx.fillStyle = "#040507";
        ctx.beginPath();
        ctx.ellipse(wPt.x, wPt.y, 4.5 * wPt.scale, 8 * wPt.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        // Metallic alloy rim center
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.ellipse(wPt.x, wPt.y, 2.2 * wPt.scale, 4 * wPt.scale, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Side Body Door Panel
      ctx.fillStyle = sideColor;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = Math.max(0.8, 1.1 * s);
      ctx.beginPath();
      ctx.moveTo(sRB.x, sRB.y);
      ctx.lineTo(sFB.x, sFB.y);
      ctx.lineTo(sFM.x, sFM.y);
      ctx.lineTo(sRM.x, sRM.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side Glass Window (non-truck)
      if (car.kind !== "truck") {
        ctx.fillStyle = "#0b1526";
        ctx.beginPath();
        ctx.moveTo(sRM.x, sRM.y);
        ctx.lineTo(sCB.x, sCB.y);
        ctx.lineTo(sFR.x, sFR.y);
        ctx.lineTo(sRR.x, sRR.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Rear tires (left & right bottom corners)
    ctx.fillStyle = "#030406";
    const tireW = Math.max(2, (rbR.x - rbL.x) * 0.17);
    const tireH = Math.max(3, 10 * s);
    ctx.fillRect(rbL.x - 1, rbL.y - tireH + 3 * s, tireW, tireH);
    ctx.fillRect(rbR.x - tireW + 1, rbR.y - tireH + 3 * s, tireW, tireH);

    // 4. 3D Hood + Roof + Rear Sloped Glass
    if (car.kind !== "truck") {
      // Hood
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.moveTo(cbL.x, cbL.y);
      ctx.lineTo(cbR.x, cbR.y);
      ctx.lineTo(fmR.x, fmR.y);
      ctx.lineTo(fmL.x, fmL.y);
      ctx.closePath();
      ctx.fill();

      // Roof
      ctx.fillStyle = topColor;
      ctx.strokeStyle = "rgba(226, 232, 240, 0.25)";
      ctx.lineWidth = Math.max(0.8, 1.1 * s);
      ctx.beginPath();
      ctx.moveTo(rrL.x, rrL.y);
      ctx.lineTo(rrR.x, rrR.y);
      ctx.lineTo(frR.x, frR.y);
      ctx.lineTo(frL.x, frL.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sloped Rear Windshield
      const glassGrad = ctx.createLinearGradient(0, rrL.y, 0, rmL.y);
      glassGrad.addColorStop(0, "#1e3a5f");
      glassGrad.addColorStop(0.55, "#0b1322");
      glassGrad.addColorStop(1, "#04070e");
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(rmL.x + (rmR.x - rmL.x) * 0.08, rmL.y);
      ctx.lineTo(rmR.x - (rmR.x - rmL.x) * 0.08, rmR.y);
      ctx.lineTo(rrR.x, rrR.y);
      ctx.lineTo(rrL.x, rrL.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Truck Roof
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(rmL.x, rmL.y);
      ctx.lineTo(rmR.x, rmR.y);
      ctx.lineTo(fmR.x, fmR.y);
      ctx.lineTo(fmL.x, fmL.y);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Sculpted 3D Rear Face (Trunk, Diffuser, License Plate, Brand LEDs)
    const cw = rbR.x - rbL.x;
    const rearH = rbL.y - rmL.y;
    const rearGrad = ctx.createLinearGradient(rbL.x, 0, rbR.x, 0);
    rearGrad.addColorStop(0, rearDark);
    rearGrad.addColorStop(0.5, rearMid);
    rearGrad.addColorStop(1, rearDark);

    ctx.fillStyle = rearGrad;
    ctx.strokeStyle = "rgba(226, 232, 240, 0.28)";
    ctx.lineWidth = Math.max(0.9, 1.3 * s);
    ctx.beginPath();
    ctx.moveTo(rbL.x, rbL.y);
    ctx.lineTo(rbR.x, rbR.y);
    ctx.lineTo(rmR.x, rmR.y);
    ctx.lineTo(rmL.x, rmL.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Red asphalt tailglow behind car
    if (elev < 10) {
      const midX = (rbL.x + rbR.x) * 0.5;
      const tailGlow = ctx.createRadialGradient(midX, rbL.y + 3 * s, 2 * s, midX, rbL.y + 6 * s, cw * 0.65);
      tailGlow.addColorStop(0, "rgba(220, 38, 38, 0.34)");
      tailGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = tailGlow;
      ctx.fillRect(midX - cw * 0.65, rbL.y - 3 * s, cw * 1.3, 20 * s);
    }

    // License Plate
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(rbL.x + cw * 0.36, rmL.y + rearH * 0.36, cw * 0.28, Math.max(2, rearH * 0.25));

    if (isPlayer) {
      // Brand-accurate LED Taillights
      const braking = run ? run.player.braking : false;
      ctx.fillStyle = braking ? "#ff1744" : "#dc2626";
      ctx.shadowBlur = braking ? 20 * s : 11 * s;
      ctx.shadowColor = "#ff1744";

      if (car.kind === "bmw") {
        ctx.fillRect(rmL.x + cw * 0.05, rmL.y + rearH * 0.2, cw * 0.24, Math.max(2, 4.5 * s));
        ctx.fillRect(rmL.x + cw * 0.05, rmL.y + rearH * 0.08, Math.max(1.5, cw * 0.06), Math.max(3, 9 * s));
        ctx.fillRect(rmR.x - cw * 0.29, rmR.y + rearH * 0.2, cw * 0.24, Math.max(2, 4.5 * s));
        ctx.fillRect(rmR.x - cw * 0.11, rmR.y + rearH * 0.08, Math.max(1.5, cw * 0.06), Math.max(3, 9 * s));
      } else if (car.kind === "mercedes") {
        ctx.fillRect(rmL.x + cw * 0.06, rmL.y + rearH * 0.22, cw * 0.26, Math.max(2, 3.8 * s));
        ctx.fillRect(rmR.x - cw * 0.32, rmR.y + rearH * 0.22, cw * 0.26, Math.max(2, 3.8 * s));
      } else if (car.kind === "lambo") {
        ctx.fillRect(rmL.x + cw * 0.05, rmL.y + rearH * 0.22, cw * 0.22, Math.max(2, 4 * s));
        ctx.fillRect(rmR.x - cw * 0.27, rmR.y + rearH * 0.22, cw * 0.22, Math.max(2, 4 * s));
        // Carbon rear spoiler
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#05070a";
        ctx.fillRect(rmL.x + cw * 0.06, rmL.y - 5 * s, cw * 0.88, 3.5 * s);
      } else if (car.kind === "mahindra") {
        ctx.fillRect(rmL.x + cw * 0.05, rmL.y + rearH * 0.1, cw * 0.11, rearH * 0.56);
        ctx.fillRect(rmR.x - cw * 0.16, rmR.y + rearH * 0.1, cw * 0.11, rearH * 0.56);
      }
      ctx.shadowBlur = 0;

      // Quad chrome exhausts + Nitro flame bursts
      ctx.fillStyle = "#cbd5e1";
      [0.18, 0.28, 0.72, 0.82].forEach((f) => {
        const ex = rbL.x + cw * f;
        ctx.beginPath();
        ctx.arc(ex, rbL.y - 3 * s, Math.max(1.2, 2.4 * s), 0, Math.PI * 2);
        ctx.fill();
        if (run && run.player.boosting) {
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(ex, rbL.y - 1 * s, (4 + Math.random() * 3) * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#cbd5e1";
        }
      });

      // Hazard / Turn Blinkers
      const blink = Math.floor(performance.now() / 320) % 2 === 0;
      if (blink && (hazardOn || (run && run.player.turnDir !== 0))) {
        ctx.fillStyle = "#f59e0b";
        if (hazardOn || (run && run.player.turnDir < 0)) ctx.fillRect(rmL.x + 2, rmL.y + rearH * 0.45, 5 * s, 4 * s);
        if (hazardOn || (run && run.player.turnDir > 0)) ctx.fillRect(rmR.x - 5 * s - 2, rmR.y + rearH * 0.45, 5 * s, 4 * s);
      }
    } else {
      // Traffic Taillights
      ctx.fillStyle = car.honked > 0 ? "#f59e0b" : "#ef4444";
      ctx.fillRect(rmL.x + cw * 0.06, rmL.y + rearH * 0.22, cw * 0.2, Math.max(2, 4 * s));
      ctx.fillRect(rmR.x - cw * 0.26, rmR.y + rearH * 0.22, cw * 0.2, Math.max(2, 4 * s));

      if (car.kind === "taxi") {
        // NYC Yellow Cab illuminated roof sign + checkered band
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(rmL.x + cw * 0.05, rmL.y + rearH * 0.05, cw * 0.9, Math.max(1.5, 3 * s));
        const rMid = (rrL.x + rrR.x + frL.x + frR.x) * 0.25;
        const rY = (rrL.y + frL.y) * 0.5;
        ctx.fillStyle = "#fef08a";
        ctx.shadowBlur = 10 * s;
        ctx.shadowColor = "#facc15";
        ctx.fillRect(rMid - cw * 0.15, rY - 5 * s, cw * 0.3, 5 * s);
        ctx.shadowBlur = 0;
      } else if (car.kind === "police") {
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(rmL.x + cw * 0.05, rmL.y + rearH * 0.06, cw * 0.9, Math.max(1.5, 3.5 * s));
        const rMid = (rrL.x + rrR.x + frL.x + frR.x) * 0.25;
        const rY = (rrL.y + frL.y) * 0.5;
        const flash = Math.floor(performance.now() / 120) % 2 === 0;
        ctx.fillStyle = flash ? "#ff2244" : "#00f3ff";
        ctx.fillRect(rMid - cw * 0.26, rY - 5 * s, cw * 0.22, 5 * s);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(rMid - cw * 0.04, rY - 5 * s, cw * 0.08, 5 * s);
        ctx.fillStyle = flash ? "#00f3ff" : "#ff2244";
        ctx.fillRect(rMid + cw * 0.04, rY - 5 * s, cw * 0.22, 5 * s);
      }
    }

    ctx.restore();
  }

  // ==================== LUXURY REALISTIC COCKPIT INTERIOR ====================
  function drawCockpitOverlay(lightMode) {
    const p = run ? run.player : { steerAngle: 0, nitro: 100, turnDir: 0, boosting: false, braking: false, xNorm: 0 };
    const spec = run ? run.carSpec : CAR_SPECS[selectedCarId];
    const spdKmh = run ? Math.round(run.speed * 0.34) : 120;

    ctx.save();

    ctx.fillStyle = "rgba(226, 232, 240, 0.22)";
    for (const d of windshieldDrops) {
      ctx.beginPath();
      ctx.arc(d.x * viewW, d.y * viewH, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const hoodTop = viewH * 0.66;
    const hoodGrad = ctx.createLinearGradient(0, hoodTop, 0, viewH * 0.77);
    hoodGrad.addColorStop(0, "#242e40");
    hoodGrad.addColorStop(0.35, "#0d121b");
    hoodGrad.addColorStop(1, "#04060a");
    ctx.fillStyle = hoodGrad;
    ctx.beginPath();
    ctx.moveTo(viewW * 0.15, viewH * 0.76);
    ctx.lineTo(viewW * 0.3, hoodTop);
    ctx.lineTo(viewW * 0.7, hoodTop);
    ctx.lineTo(viewW * 0.85, viewH * 0.76);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.moveTo(viewW * 0.38, hoodTop + 8);
    ctx.lineTo(viewW * 0.32, viewH * 0.75);
    ctx.moveTo(viewW * 0.62, hoodTop + 8);
    ctx.lineTo(viewW * 0.68, viewH * 0.75);
    ctx.stroke();

    ctx.fillStyle = spec.accent;
    ctx.beginPath();
    ctx.arc(viewW * 0.5, hoodTop + 13, 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (wipersOn) {
      const sweep = (Math.sin(wiperPhase) + 1) * 0.5;
      const angle = -0.22 - sweep * 1.38;
      [viewW * 0.31, viewW * 0.63].forEach((wx) => {
        ctx.save();
        ctx.translate(wx, viewH * 0.74);
        ctx.rotate(angle);
        ctx.strokeStyle = "#090c12";
        ctx.lineWidth = 6.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -viewH * 0.28);
        ctx.stroke();
        ctx.restore();
      });
    }

    ctx.fillStyle = "#06080d";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(viewW * 0.1, 0);
    ctx.lineTo(viewW * 0.04, viewH * 0.75);
    ctx.lineTo(0, viewH * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(viewW, 0);
    ctx.lineTo(viewW * 0.9, 0);
    ctx.lineTo(viewW * 0.96, viewH * 0.75);
    ctx.lineTo(viewW, viewH * 0.75);
    ctx.closePath();
    ctx.fill();

    if (viewW > 620) {
      [viewW * 0.045, viewW * 0.955 - 66].forEach((mx) => {
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(mx, viewH * 0.54, 66, 38, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(mx + 5, viewH * 0.54 + 5, 56, 28);
        const streakY = (performance.now() * 0.15) % 24;
        ctx.fillStyle = "rgba(253, 224, 71, 0.45)";
        ctx.fillRect(mx + 14, viewH * 0.54 + 6 + streakY, 6, 4);
      });
    }

    ctx.fillStyle = "#0b111e";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(viewW * 0.5 - 64, 54, 128, 28, 7);
    ctx.fill();
    ctx.stroke();

    const dashY = viewH * 0.72;
    const dashGrad = ctx.createLinearGradient(0, dashY, 0, viewH);
    dashGrad.addColorStop(0, "#19202d");
    dashGrad.addColorStop(0.16, "#0c1018");
    dashGrad.addColorStop(1, "#040508");
    ctx.fillStyle = dashGrad;
    ctx.beginPath();
    ctx.moveTo(0, dashY + 26);
    ctx.quadraticCurveTo(viewW * 0.3, dashY - 14, viewW * 0.56, dashY + 8);
    ctx.lineTo(viewW, dashY + 14);
    ctx.lineTo(viewW, viewH);
    ctx.lineTo(0, viewH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(148, 163, 184, 0.32)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(viewW * 0.04, dashY + 20);
    ctx.quadraticCurveTo(viewW * 0.3, dashY - 10, viewW * 0.56, dashY + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = spec.accent;
    ctx.beginPath();
    ctx.moveTo(viewW * 0.05, dashY + 27);
    ctx.quadraticCurveTo(viewW * 0.3, dashY - 2, viewW * 0.56, dashY + 18);
    ctx.lineTo(viewW * 0.95, dashY + 22);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const wheelX = Math.min(viewW * 0.33, 330);
    const wheelY = viewH * 0.87;
    const wheelR = Math.min(115, viewW * 0.16, viewH * 0.175);

    ctx.fillStyle = "#040711";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(wheelX - wheelR * 1.0, dashY + 4, wheelR * 2.0, 68, 12);
    ctx.fill();
    ctx.stroke();

    const rpmNorm = Math.min(1, ((spdKmh % 65) / 65) * 0.65 + (p.boosting ? 0.35 : 0.25));
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(wheelX, dashY + 42, 34, Math.PI * 0.85, Math.PI * 2.15);
    ctx.stroke();

    ctx.strokeStyle = p.boosting ? "#ef4444" : spec.accent;
    ctx.beginPath();
    ctx.arc(wheelX, dashY + 42, 34, Math.PI * 0.85, Math.PI * (0.85 + 1.3 * rpmNorm));
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText(spdKmh + "", wheelX, dashY + 44);
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 8px monospace";
    ctx.fillText("KM/H", wheelX, dashY + 55);

    const gear = p.boosting ? "S+" : spdKmh > 210 ? "D6" : spdKmh > 150 ? "D5" : "D4";
    ctx.fillStyle = p.boosting ? "#39ff14" : spec.accent;
    ctx.font = "bold 12px monospace";
    ctx.fillText(gear, wheelX + wheelR * 0.62, dashY + 34);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 9px monospace";
    ctx.fillText("24°C", wheelX - wheelR * 0.62, dashY + 56);

    const blink = Math.floor(performance.now() / 320) % 2 === 0;
    if ((p.turnDir < 0 || hazardOn) && blink) {
      ctx.fillStyle = "#39ff14";
      ctx.fillText("◀", wheelX - wheelR * 0.65, dashY + 28);
    }
    if ((p.turnDir > 0 || hazardOn) && blink) {
      ctx.fillStyle = "#39ff14";
      ctx.fillText("▶", wheelX + wheelR * 0.65, dashY + 28);
    }
    if (lightMode !== "OFF") {
      ctx.fillStyle = lightMode === "HIGH" ? "#38bdf8" : "#4ade80";
      ctx.font = "bold 9px monospace";
      ctx.fillText(lightMode === "HIGH" ? "HI-BEAM" : "LO-BEAM", wheelX + wheelR * 0.62, dashY + 56);
    }

    const infoW = Math.min(185, viewW * 0.25);
    const infoX = viewW * 0.62;
    const infoY = dashY + 18;
    if (viewW > 520) {
      ctx.fillStyle = "#050914";
      ctx.strokeStyle = spec.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(infoX, infoY, infoW, 84, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("HIGHWAY RADAR", infoX + 10, infoY + 14);

      const rx = infoX + 12;
      const ry = infoY + 20;
      const rw = infoW - 24;
      const rh = 54;
      ctx.fillStyle = "#0d1424";
      ctx.fillRect(rx, ry, rw, rh);
      for (let l = 1; l < 4; l++) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.moveTo(rx + (rw * l) / 4, ry);
        ctx.lineTo(rx + (rw * l) / 4, ry + rh);
        ctx.stroke();
      }
      const px = rx + (p.xNorm + 1) * 0.5 * rw;
      ctx.fillStyle = "#00f3ff";
      ctx.fillRect(px - 3, ry + rh - 9, 6, 7);

      if (run) {
        for (const car of run.traffic) {
          if (car.z > 0 && car.z < 1200) {
            const tx = rx + (car.xNorm + 1) * 0.5 * rw;
            const ty = ry + rh - (car.z / 1200) * rh;
            ctx.fillStyle = "#ff3355";
            ctx.fillRect(tx - 2.5, ty - 3, 5, 5);
          }
        }
      }
    }

    ctx.save();
    ctx.translate(wheelX, wheelY);
    ctx.rotate(p.steerAngle);

    ctx.fillStyle = "#475569";
    ctx.fillRect(-wheelR * 0.65, -24, 16, 36);
    ctx.fillRect(wheelR * 0.65 - 16, -24, 16, 36);

    ctx.strokeStyle = "rgba(0,0,0,0.88)";
    ctx.lineWidth = 23;
    ctx.beginPath();
    ctx.arc(0, 4, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#10141c";
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#2d3748";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR - 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR, -Math.PI / 2 - 0.08, -Math.PI / 2 + 0.08);
    ctx.stroke();

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-wheelR + 6, -9, wheelR * 2 - 12, 18);
    ctx.fillRect(-13, 0, 26, wheelR - 6);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(-wheelR + 12, -4, 24, 8);
    ctx.fillRect(wheelR - 36, -4, 24, 8);

    ctx.fillStyle = "#0b0f17";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = spec.accent;
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.id.toUpperCase(), 0, 0);

    ctx.restore();
    ctx.restore();
  }

  function drawHoodOverlay() {
    const p = run ? run.player : { steerAngle: 0 };
    const spec = run ? run.carSpec : CAR_SPECS[selectedCarId];
    ctx.save();
    const hoodY = viewH * 0.78;
    const grad = ctx.createLinearGradient(0, hoodY, 0, viewH);
    grad.addColorStop(0, "#242e40");
    grad.addColorStop(0.4, "#0d121b");
    grad.addColorStop(1, "#030407");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(viewW * 0.14, viewH);
    ctx.lineTo(viewW * 0.28, hoodY);
    ctx.lineTo(viewW * 0.72, hoodY);
    ctx.lineTo(viewW * 0.86, viewH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(viewW * 0.36, hoodY + 12);
    ctx.lineTo(viewW * 0.28 + p.steerAngle * 14, viewH);
    ctx.moveTo(viewW * 0.64, hoodY + 12);
    ctx.lineTo(viewW * 0.72 + p.steerAngle * 14, viewH);
    ctx.stroke();

    ctx.fillStyle = spec.accent;
    ctx.beginPath();
    ctx.arc(viewW * 0.5, hoodY + 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ==================== CURVED ASPHALT 3D WORLD RENDERER ====================
  function renderPerspectiveWorld(camId) {
    const proj = get3DProjParams(camId);
    const worldZ = run ? run.worldZ : performance.now() * 0.35;
    const lightMode = hornFlashTimer > 0 ? "HIGH" : LIGHT_MODES[lightIndex];
    const slices = buildRoadSlices(worldZ, proj);

    ctx.save();
    if (run && Math.abs(run.camBank) > 0.001) {
      ctx.translate(viewW * 0.5, viewH * 0.5);
      ctx.rotate(run.camBank);
      ctx.translate(-viewW * 0.5, -viewH * 0.5);
    }

    const atmo = getAtmosphere(); // compute once per frame for all draw calls
    drawAsphaltSky(proj.horizonY, worldZ, atmo);

    // City terrain beneath horizon — dynamic colour from atmosphere
    const terrainGrad = ctx.createLinearGradient(0, proj.horizonY, 0, viewH);
    terrainGrad.addColorStop(0, atmo.terrain);
    terrainGrad.addColorStop(1, "#071316");
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(-60, proj.horizonY, viewW + 120, viewH - proj.horizonY + 60);

    // Draw Curved & Hilly Road Segments (Back to Front)
    for (let i = SLICES - 1; i >= 1; i--) {
      const s1 = slices[i];
      const s0 = slices[i - 1];
      const band = Math.floor(s0.absZ / 90) % 2 === 0;

      // Wide city sidewalk / shoulder
      ctx.fillStyle = band ? "#171e2e" : "#131927";
      ctx.beginPath();
      ctx.moveTo(s1.cx - s1.halfW * 1.22, s1.yScreen);
      ctx.lineTo(s1.cx + s1.halfW * 1.22, s1.yScreen);
      ctx.lineTo(s0.cx + s0.halfW * 1.22, s0.yScreen);
      ctx.lineTo(s0.cx - s0.halfW * 1.22, s0.yScreen);
      ctx.closePath();
      ctx.fill();

      // Asphalt Legends red/white/cyan racing edge kerbs
      ctx.fillStyle = band ? "#00f3ff" : "#1e293b";
      ctx.beginPath();
      ctx.moveTo(s1.cx - s1.halfW * 1.05, s1.yScreen);
      ctx.lineTo(s1.cx - s1.halfW, s1.yScreen);
      ctx.lineTo(s0.cx - s0.halfW, s0.yScreen);
      ctx.lineTo(s0.cx - s0.halfW * 1.05, s0.yScreen);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s1.cx + s1.halfW, s1.yScreen);
      ctx.lineTo(s1.cx + s1.halfW * 1.05, s1.yScreen);
      ctx.lineTo(s0.cx + s0.halfW * 1.05, s0.yScreen);
      ctx.lineTo(s0.cx + s0.halfW, s0.yScreen);
      ctx.closePath();
      ctx.fill();

      // Wet Glossy Asphalt
      ctx.fillStyle = band ? "#151b29" : "#111622";
      ctx.beginPath();
      ctx.moveTo(s1.cx - s1.halfW, s1.yScreen);
      ctx.lineTo(s1.cx + s1.halfW, s1.yScreen);
      ctx.lineTo(s0.cx + s0.halfW, s0.yScreen);
      ctx.lineTo(s0.cx - s0.halfW, s0.yScreen);
      ctx.closePath();
      ctx.fill();

      // Neon wet-asphalt city reflection strip on road edges
      ctx.fillStyle = band ? "rgba(0, 243, 255, 0.06)" : "rgba(236, 72, 153, 0.05)";
      ctx.beginPath();
      ctx.moveTo(s1.cx - s1.halfW * 0.94, s1.yScreen);
      ctx.lineTo(s1.cx - s1.halfW * 0.72, s1.yScreen);
      ctx.lineTo(s0.cx - s0.halfW * 0.72, s0.yScreen);
      ctx.lineTo(s0.cx - s0.halfW * 0.94, s0.yScreen);
      ctx.closePath();
      ctx.fill();

      // Dashed lane dividers
      if (Math.floor(s0.absZ / 72) % 2 === 0) {
        [-0.5, 0, 0.5].forEach((laneEdge) => {
          ctx.strokeStyle = laneEdge === 0 ? "rgba(250, 204, 21, 0.7)" : "rgba(255, 255, 255, 0.52)";
          ctx.lineWidth = Math.max(1, 3.2 * s0.scale);
          ctx.beginPath();
          ctx.moveTo(s1.cx + laneEdge * s1.halfW, s1.yScreen);
          ctx.lineTo(s0.cx + laneEdge * s0.halfW, s0.yScreen);
          ctx.stroke();
        });
      }

      // Steel W-beam guardrails along curves
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = Math.max(1, 3.5 * s0.scale);
      ctx.beginPath();
      ctx.moveTo(s1.cx - s1.halfW * 1.1, s1.yScreen - 12 * s1.scale);
      ctx.lineTo(s0.cx - s0.halfW * 1.1, s0.yScreen - 12 * s0.scale);
      ctx.moveTo(s1.cx + s1.halfW * 1.1, s1.yScreen - 12 * s1.scale);
      ctx.lineTo(s0.cx + s0.halfW * 1.1, s0.yScreen - 12 * s0.scale);
      ctx.stroke();
    }

    // Cockpit / Hood headlight cone
    if (camId !== "chase3d" && lightMode !== "OFF") {
      const pX = run ? run.player.xNorm : 0;
      const beamBase = projectCurved3D(pX, 20, 0, proj, slices);
      const beamTop = projectCurved3D(pX, lightMode === "HIGH" ? 900 : 500, 0, proj, slices);
      const cone = ctx.createLinearGradient(0, viewH * 0.78, 0, beamTop.y);
      cone.addColorStop(0, lightMode === "HIGH" ? "rgba(240, 249, 255, 0.5)" : "rgba(240, 249, 255, 0.28)");
      cone.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(beamBase.x - 180, viewH * 0.8);
      ctx.lineTo(beamTop.x - (lightMode === "HIGH" ? 235 : 130) * beamTop.scale, beamTop.y);
      ctx.lineTo(beamTop.x + (lightMode === "HIGH" ? 235 : 130) * beamTop.scale, beamTop.y);
      ctx.lineTo(beamBase.x + 180, viewH * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    // Build far-to-near sorted draw list for dense Asphalt City + Entities
    const sceneryStep = 190;
    const baseIdx = Math.floor(worldZ / sceneryStep);
    const frac = worldZ % sceneryStep;
    const drawList = [];

    for (let i = 0; i <= 8; i++) {
      const z = i * sceneryStep + (sceneryStep - frac);
      if (z < -60 || z > 1580) continue;
      const idx = baseIdx + i;
      const seed = Math.abs(idx * 2654435761);
      drawList.push({ z, kind: "scenery", seed });
    }

    const gantryStep = 1100;
    const gBase = Math.floor(worldZ / gantryStep);
    const gFrac = worldZ % gantryStep;
    for (let gi = 0; gi <= 1; gi++) {
      const gz = gi * gantryStep + (gantryStep - gFrac);
      if (gz > -40 && gz < 1550) {
        drawList.push({ z: gz, kind: "gantry", signIdx: gBase + gi });
      }
    }

    // Periodic Elevated NYC Highway Flyovers (crossing over the main expressway!)
    const flyoverStep = 1350;
    const fBase = Math.floor(worldZ / flyoverStep);
    const fFrac = worldZ % flyoverStep;
    for (let fi = 0; fi <= 1; fi++) {
      const fz = fi * flyoverStep + (flyoverStep - fFrac);
      if (fz > -60 && fz < 1560) {
        drawList.push({ z: fz, kind: "flyover", idx: fBase + fi });
      }
    }

    // Periodic Brooklyn Bridge Gothic Suspension Overpass
    const bridgeStep = 2700;
    const bFrac = worldZ % bridgeStep;
    const bz = bridgeStep - bFrac;
    if (bz > -60 && bz < 1560) {
      drawList.push({ z: bz, kind: "bridge" });
    }

    if (run) {
      for (const r of run.ramps) {
        if (r.z > -60 && r.z < 1550) drawList.push({ z: r.z, kind: "ramp", obj: r });
      }
      for (const c of run.coins) {
        if (c.z > -60 && c.z < 1550) drawList.push({ z: c.z, kind: "coin", obj: c });
      }
      for (const pw of run.powerups) {
        if (pw.z > -60 && pw.z < 1550) drawList.push({ z: pw.z, kind: "powerup", obj: pw });
      }
      for (const car of run.traffic) {
        if (car.z > -90 && car.z < 1580) drawList.push({ z: car.z, kind: "traffic", obj: car });
      }
      if (camId === "chase3d") {
        drawList.push({ z: 0, kind: "player" });
      }
    }

    drawList.sort((a, b) => b.z - a.z);

    for (const item of drawList) {
      const fogAlpha = Math.max(0, Math.min(1, item.z / 1550));
      if (item.kind === "scenery") {
        const z = item.z;
        const seed = item.seed;
        const pLTree = projectCurved3D(-1.3, z, 0, proj, slices);
        const pRTree = projectCurved3D(1.3, z, 0, proj, slices);
        const pLBldg1 = projectCurved3D(-1.66, z, 0, proj, slices);
        const pRBldg1 = projectCurved3D(1.66, z, 0, proj, slices);
        const pLBldg2 = projectCurved3D(-2.55, z + 60, 0, proj, slices);
        const pRBldg2 = projectCurved3D(2.55, z + 60, 0, proj, slices);

        // Two depth rows of Asphalt Metropolis Skyscrapers!
        drawAsphaltSkyscraper(pLBldg2.x, pLBldg2.y, pLBldg2.scale, -1, seed + 19, fogAlpha, 2, atmo);
        drawAsphaltSkyscraper(pRBldg2.x, pRBldg2.y, pRBldg2.scale, 1, seed + 23, fogAlpha, 2, atmo);
        drawAsphaltSkyscraper(pLBldg1.x, pLBldg1.y, pLBldg1.scale, -1, seed, fogAlpha, 1, atmo);
        drawAsphaltSkyscraper(pRBldg1.x, pRBldg1.y, pRBldg1.scale, 1, seed + 3, fogAlpha, 1, atmo);

        draw3DTreePersp(pLTree.x, pLTree.y, pLTree.scale, seed, fogAlpha);
        draw3DTreePersp(pRTree.x, pRTree.y, pRTree.scale, seed + 1, fogAlpha);

        // City streetlamps along curved road
        const pLLamp = projectCurved3D(-1.1, z, 0, proj, slices);
        const pRLamp = projectCurved3D(1.1, z, 0, proj, slices);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = Math.max(1, 3 * pLLamp.scale);
        ctx.beginPath();
        ctx.moveTo(pLLamp.x, pLLamp.y);
        ctx.lineTo(pLLamp.x, pLLamp.y - 78 * pLLamp.scale);
        ctx.lineTo(pLLamp.x + 22 * pLLamp.scale, pLLamp.y - 78 * pLLamp.scale);
        ctx.moveTo(pRLamp.x, pRLamp.y);
        ctx.lineTo(pRLamp.x, pRLamp.y - 78 * pRLamp.scale);
        ctx.lineTo(pRLamp.x - 22 * pRLamp.scale, pRLamp.y - 78 * pRLamp.scale);
        ctx.stroke();

        ctx.fillStyle = "rgba(253, 224, 130, 0.34)";
        ctx.beginPath();
        ctx.arc(pLLamp.x + 22 * pLLamp.scale, pLLamp.y - 78 * pLLamp.scale, 14 * pLLamp.scale, 0, Math.PI * 2);
        ctx.arc(pRLamp.x - 22 * pRLamp.scale, pRLamp.y - 78 * pRLamp.scale, 14 * pRLamp.scale, 0, Math.PI * 2);
        ctx.fill();

        // Iconic NYC Manhattan street manhole steam plumes
        if (seed % 2 === 0 && pLLamp.scale > 0.15) {
          const steamX = seed % 4 === 0 ? pLLamp.x + 16 * pLLamp.scale : pRLamp.x - 16 * pRLamp.scale;
          const steamY = pLLamp.y;
          ctx.fillStyle = "rgba(226, 232, 240, 0.14)";
          for (let st = 0; st < 3; st++) {
            const lift = ((performance.now() * 0.03 + st * 14) % 42) * pLLamp.scale;
            ctx.beginPath();
            ctx.arc(steamX + Math.sin(st + performance.now() * 0.002) * 5 * pLLamp.scale, steamY - lift, (8 + st * 4) * pLLamp.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (item.kind === "flyover") {
        drawFlyoverBridge(item.z, proj, slices, item.idx);
      } else if (item.kind === "bridge") {
        drawBrooklynBridgeTower(item.z, proj, slices);
      } else if (item.kind === "gantry") {
        drawOverheadGantry(item.z, proj, slices, item.signIdx);
      } else if (item.kind === "ramp") {
        drawJumpRamp(item.obj, proj, slices);
      } else if (item.kind === "coin") {
        const pt = projectCurved3D(item.obj.xNorm, item.z, 0, proj, slices);
        const r = Math.max(2, 13 * pt.scale);
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - 10 * pt.scale, r, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb800";
        ctx.shadowBlur = 10 * pt.scale;
        ctx.shadowColor = "#ffb800";
        ctx.fill();
        ctx.restore();
      } else if (item.kind === "powerup") {
        const pw = item.obj;
        const pt = projectCurved3D(pw.xNorm, item.z, 0, proj, slices);
        const col = pw.kind === "fuel" ? "#39ff14" : pw.kind === "shield" ? "#00f3ff" : "#ffb800";
        const r = Math.max(3, 16 * pt.scale);
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - 12 * pt.scale, r, 0, Math.PI * 2);
        ctx.fillStyle = "#070b14";
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(1, 2.4 * pt.scale);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.font = `bold ${Math.max(8, Math.round(13 * pt.scale))}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pw.kind === "fuel" ? "N" : pw.kind === "shield" ? "S" : "M", pt.x, pt.y - 12 * pt.scale);
        ctx.restore();
      } else if (item.kind === "traffic") {
        draw3DCarPersp(item.obj, proj, slices, false, "OFF");
      } else if (item.kind === "player" && run) {
        const p = run.player;
        const hide = p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0;
        if (!hide) {
          draw3DCarPersp(
            { kind: run.carSpec.id, xNorm: p.xNorm, z: 0, wNorm: run.carSpec.wNorm },
            proj,
            slices,
            true,
            lightMode
          );
          if (p.shield) {
            const pPos = projectCurved3D(p.xNorm, 0, p.jumpY, proj, slices);
            ctx.save();
            ctx.strokeStyle = "#00f3ff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(pPos.x, pPos.y - 16, 48, 28, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    // Asphalt Nitro Speed Warp Lines around screen edges!
    if (run && run.fovZoom > 0.08) {
      ctx.save();
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.28 * run.fovZoom})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const ang = (Math.PI * 2 * i) / 16 + (performance.now() * 0.0005);
        const r1 = Math.min(viewW, viewH) * 0.36;
        const r2 = Math.max(viewW, viewH) * 0.75;
        ctx.beginPath();
        ctx.moveTo(viewW * 0.5 + Math.cos(ang) * r1, viewH * 0.5 + Math.sin(ang) * r1);
        ctx.lineTo(viewW * 0.5 + Math.cos(ang) * r2, viewH * 0.5 + Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (run) {
      for (const pt of run.particles) {
        const pPos = projectCurved3D(pt.xNorm, pt.z, pt.y || 0, proj, slices);
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        const sz = Math.max(1.5, pt.size * pPos.scale * 1.6);
        ctx.fillRect(pPos.x - sz / 2, pPos.y - sz / 2 - 8 * pPos.scale, sz, sz);
        ctx.restore();
      }
      for (const pp of run.popups) {
        const pPos = projectCurved3D(pp.xNorm, pp.z, 20, proj, slices);
        ctx.save();
        ctx.globalAlpha = Math.min(1, pp.life / pp.maxLife);
        ctx.fillStyle = pp.color;
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 8;
        ctx.shadowColor = pp.color;
        ctx.fillText(pp.text, pPos.x, pPos.y - 52 - (1 - pp.life / pp.maxLife) * 32);
        ctx.restore();
      }
    }

    ctx.restore();

    if (camId === "cockpit") drawCockpitOverlay(lightMode);
    else if (camId === "hood") drawHoodOverlay();
  }

  function renderTopDownWorld() {
    const roadW = Math.min(440, viewW * 0.88);
    const roadX = (viewW - roadW) / 2;
    const laneW = roadW / 4;
    const worldZ = run ? run.worldZ : performance.now() * 0.25;
    const roadOffset = worldZ % 80;
    const lightMode = hornFlashTimer > 0 ? "HIGH" : LIGHT_MODES[lightIndex];
    const playerY = viewH - Math.min(130, viewH * 0.22);

    ctx.fillStyle = "#081419";
    ctx.fillRect(0, 0, viewW, viewH);
    const shoulderW = Math.min(26, Math.max(10, roadX * 0.25));
    ctx.fillStyle = "#171c2b";
    ctx.fillRect(roadX - shoulderW, 0, shoulderW, viewH);
    ctx.fillRect(roadX + roadW, 0, shoulderW, viewH);

    const blockSize = 185;
    const baseIdx = Math.floor(worldZ / blockSize);
    const frac = worldZ % blockSize;
    const count = Math.ceil(viewH / blockSize) + 2;
    for (let i = -1; i < count; i++) {
      const idx = baseIdx - i;
      const y = i * blockSize + frac;
      const seed = Math.abs(idx * 73856093);

      ctx.fillStyle = "rgba(253, 224, 130, 0.32)";
      ctx.beginPath();
      ctx.arc(roadX - 5, y + 32, 16, 0, Math.PI * 2);
      ctx.arc(roadX + roadW + 5, y + 32, 16, 0, Math.PI * 2);
      ctx.fill();

      if (roadX > 36) {
        draw3DTreePersp(roadX - shoulderW - 22, y + 52, 0.9, seed, 0);
        if (roadX > 118) {
          const bx = Math.max(10, roadX - shoulderW - 58);
          drawAsphaltSkyscraper(bx, y + 145, 0.85, -1, seed, 0, 1, null);
        }
      }
      const rightSpace = viewW - (roadX + roadW);
      if (rightSpace > 36) {
        draw3DTreePersp(roadX + roadW + shoulderW + 22, y + 70, 0.9, seed + 2, 0);
        if (rightSpace > 118) {
          const bx = roadX + roadW + shoulderW + 58;
          drawAsphaltSkyscraper(bx, y + 135, 0.85, 1, seed + 5, 0, 1, null);
        }
      }
    }

    ctx.fillStyle = "#121622";
    ctx.fillRect(roadX, 0, roadW, viewH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, viewH);
    ctx.moveTo(roadX + roadW, 0);
    ctx.lineTo(roadX + roadW, viewH);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.setLineDash([34, 46]);
    ctx.lineDashOffset = -roadOffset;
    for (let l = 1; l < 4; l++) {
      ctx.beginPath();
      ctx.moveTo(roadX + l * laneW, 0);
      ctx.lineTo(roadX + l * laneW, viewH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (!run) return;

    const toScreenX = (xNorm) => viewW / 2 + xNorm * (roadW / 2);
    const toScreenY = (z) => playerY - z * 0.72;

    for (const r of run.ramps) {
      const sy = toScreenY(r.z);
      if (sy < -50 || sy > viewH + 50) continue;
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(toScreenX(r.xNorm) - 24, sy - 24, 48, 48);
    }

    for (const c of run.coins) {
      const sy = toScreenY(c.z);
      if (sy < -30 || sy > viewH + 30) continue;
      ctx.fillStyle = "#ffb800";
      ctx.beginPath();
      ctx.arc(toScreenX(c.xNorm), sy, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const pw of run.powerups) {
      const sy = toScreenY(pw.z);
      if (sy < -30 || sy > viewH + 30) continue;
      const col = pw.kind === "fuel" ? "#39ff14" : pw.kind === "shield" ? "#00f3ff" : "#ffb800";
      ctx.strokeStyle = col;
      ctx.fillStyle = "#080c14";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(toScreenX(pw.xNorm), sy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (const car of run.traffic) {
      const sy = toScreenY(car.z);
      if (sy < -130 || sy > viewH + 130) continue;
      const wPx = car.wNorm * (roadW * 0.5);
      ctx.fillStyle = car.bodyColor;
      ctx.fillRect(toScreenX(car.xNorm) - wPx / 2, sy - (car.zLen * 0.45), wPx, car.zLen * 0.9);
    }

    const p = run.player;
    const hide = p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0;
    if (!hide) {
      const pw = run.carSpec.wNorm * (roadW * 0.5);
      const scaleJump = 1 + p.jumpY * 0.008;
      ctx.save();
      ctx.translate(toScreenX(p.xNorm), playerY);
      ctx.scale(scaleJump, scaleJump);
      ctx.rotate(p.steerAngle * 0.25);
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = run.carSpec.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -run.carSpec.zLen / 2, pw, run.carSpec.zLen, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function render() {
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.save();
    if (run && run.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * run.shake, (Math.random() - 0.5) * run.shake);
    }

    const camId = CAMERAS[camIndex].id;
    if (camId === "topdown") {
      renderTopDownWorld();
    } else {
      renderPerspectiveWorld(camId);
    }

    ctx.restore();
  }

  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function cycleCamera() {
    audio.unlock();
    audio.click();
    camIndex = (camIndex + 1) % CAMERAS.length;
    btnCam.textContent = "CAM: " + CAMERAS[camIndex].label;
  }

  function cycleTime() {
    audio.unlock();
    audio.click();
    timeModeIndex = (timeModeIndex + 1) % TIME_MODES.length;
    const mode = TIME_MODES[timeModeIndex];
    // When manually selecting a fixed mode, snap dayPhase to that phase
    if (mode === "DAY")    dayPhase = 0.08;
    if (mode === "SUNSET") dayPhase = 1.0;
    if (mode === "NIGHT")  dayPhase = 2.0;
    btnTime.textContent = "TIME: " + mode;
  }

  function cycleLights() {
    audio.unlock();
    audio.click();
    lightIndex = (lightIndex + 1) % LIGHT_MODES.length;
    const mode = LIGHT_MODES[lightIndex];
    btnLights.textContent = "LIGHTS: " + mode;
    btnLights.classList.toggle("active", mode !== "OFF");
  }

  function toggleWiper() {
    audio.unlock();
    audio.click();
    wipersOn = !wipersOn;
    btnWiper.classList.toggle("active", wipersOn);
  }

  function toggleHazard() {
    audio.unlock();
    audio.click();
    hazardOn = !hazardOn;
    btnHazard.classList.toggle("active", hazardOn);
  }

  function toggleMute() {
    audio.setMuted(!audio.muted);
    btnMute.textContent = audio.muted ? "MUTE" : "SFX";
    btnMute.classList.toggle("muted", audio.muted);
  }

  garageButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.unlock();
      audio.click();
      selectedCarId = btn.dataset.car;
      garageButtons.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    if (e.code === "KeyP" || e.code === "Escape") {
      if (state === "playing") setPaused(true);
      else if (state === "paused") setPaused(false);
    } else if (e.code === "KeyC") {
      cycleCamera();
    } else if (e.code === "KeyT") {
      cycleTime();
    } else if (e.code === "KeyL") {
      cycleLights();
    } else if (e.code === "KeyH") {
      triggerHorn();
    } else if (e.code === "KeyV") {
      toggleWiper();
    } else if (e.code === "KeyX") {
      toggleHazard();
    } else if (e.code === "KeyM") {
      toggleMute();
    } else if (e.code === "Enter" && state === "menu") {
      startGame();
    }
  });

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });

  function bindTouchButton(el, prop) {
    const press = (e) => {
      e.preventDefault();
      audio.unlock();
      touchState[prop] = true;
      el.classList.add("pressed");
    };
    const release = (e) => {
      e.preventDefault();
      touchState[prop] = false;
      el.classList.remove("pressed");
    };
    el.addEventListener("pointerdown", press);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", release);
  }

  bindTouchButton(touchLeftBtn, "left");
  bindTouchButton(touchRightBtn, "right");
  bindTouchButton(touchBrakeBtn, "brake");
  bindTouchButton(touchNitroBtn, "nitro");
  touchHornBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    triggerHorn();
  });

  btnStart.addEventListener("click", startGame);
  btnRetry.addEventListener("click", startGame);
  btnRestartPause.addEventListener("click", startGame);
  btnResume.addEventListener("click", () => setPaused(false));
  btnMenu.addEventListener("click", () => {
    state = "menu";
    audio.updateEngine(0, false, false);
    screenGameover.classList.add("hidden");
    hud.classList.add("hidden");
    buffBar.classList.add("hidden");
    touchControls.classList.add("hidden");
    screenStart.classList.remove("hidden");
  });

  btnCam.addEventListener("click", cycleCamera);
  btnTime.addEventListener("click", cycleTime);
  btnLights.addEventListener("click", cycleLights);
  btnWiper.addEventListener("click", toggleWiper);
  btnHazard.addEventListener("click", toggleHazard);
  btnHorn.addEventListener("click", triggerHorn);
  btnMute.addEventListener("click", toggleMute);
  btnPause.addEventListener("click", () => setPaused(state === "playing"));
})();
