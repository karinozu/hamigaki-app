import { Landmark } from '@/types';

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

// 正規化ランドマーク → Canvas座標（object-cover補正 + 左右ミラー）
function toCanvas(
  lx: number, ly: number,
  videoW: number, videoH: number,
  cw: number, ch: number
): { x: number; y: number } {
  const mx = 1 - lx; // CSS scale-x(-1) 対応
  const videoAspect = videoW / videoH;
  const canvasAspect = cw / ch;
  let scale: number, ox: number, oy: number;
  if (videoAspect > canvasAspect) {
    scale = ch / videoH;
    ox = -(videoW * scale - cw) / 2;
    oy = 0;
  } else {
    scale = cw / videoW;
    ox = 0;
    oy = -(videoH * scale - ch) / 2;
  }
  return { x: mx * videoW * scale + ox, y: ly * videoH * scale + oy };
}

function lm(landmarks: Landmark[], i: number, vw: number, vh: number, cw: number, ch: number) {
  return toCanvas(landmarks[i].x, landmarks[i].y, vw, vh, cw, ch);
}

// ---- ライオンのたてがみ ----
export function drawLion(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  vw: number, vh: number, cw: number, ch: number
) {
  const pts = landmarks.map(l => toCanvas(l.x, l.y, vw, vh, cw, ch));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const faceR = ((maxX - minX) + (maxY - minY)) / 4 * 1.05;
  const maneR = faceR * 1.6;

  ctx.save();

  // たてがみ外側スパイク
  const spikes = 22;
  for (let i = 0; i < spikes; i++) {
    const a1 = (i / spikes) * Math.PI * 2 - Math.PI / 2;
    const am = ((i + 0.5) / spikes) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / spikes) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a1) * faceR, cy + Math.sin(a1) * faceR);
    ctx.lineTo(cx + Math.cos(am) * maneR, cy + Math.sin(am) * maneR);
    ctx.lineTo(cx + Math.cos(a2) * faceR, cy + Math.sin(a2) * faceR);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // たてがみ内輪（太い輪）
  ctx.beginPath();
  ctx.arc(cx, cy, faceR * 1.08, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.55)';
  ctx.lineWidth = faceR * 0.2;
  ctx.stroke();

  // 耳（2つ）
  const earR = faceR * 0.32;
  [[-0.6, -0.88], [0.6, -0.88]].forEach(([dx, dy]) => {
    const ex = cx + faceR * dx, ey = cy + faceR * dy;
    ctx.beginPath();
    ctx.arc(ex, ey, earR, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, earR * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#fca5a5';
    ctx.fill();
  });

  ctx.restore();
}

// ---- 大きな花火 ----
export function createFireworksBurst(cw: number, ch: number): Particle[] {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff', '#ff9f43', '#fff'];
  const bx = cw * (0.15 + Math.random() * 0.7);
  const by = ch * (0.05 + Math.random() * 0.45);
  const n = 55;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    return {
      x: bx, y: by,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1, size: 5 + Math.random() * 7,
      life: 0, maxLife: 65 + Math.random() * 40,
    };
  });
}

export function updateAndDrawFireworks(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.13;
    p.vx *= 0.97;
    p.life++;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * Math.max(0.3, p.alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ---- 口からビーム ----
export function drawBeam(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  vw: number, vh: number, cw: number, ch: number,
  frame: number
) {
  const ul = lm(landmarks, 13, vw, vh, cw, ch);
  const ll = lm(landmarks, 14, vw, vh, cw, ch);
  const mx = (ul.x + ll.x) / 2;
  const my = (ul.y + ll.y) / 2;
  const pulse = Math.sin(frame * 0.15) * 0.12 + 1;
  const bw = 90 * pulse;
  const blen = ch * 1.1;

  ctx.save();

  // 外側グロー
  const og = ctx.createLinearGradient(mx, my, mx, my + blen);
  og.addColorStop(0, 'rgba(96,165,250,0.85)');
  og.addColorStop(0.4, 'rgba(167,139,250,0.55)');
  og.addColorStop(1, 'rgba(167,139,250,0)');
  ctx.beginPath();
  ctx.moveTo(mx - bw * 0.35, my);
  ctx.lineTo(mx - bw, my + blen);
  ctx.lineTo(mx + bw, my + blen);
  ctx.lineTo(mx + bw * 0.35, my);
  ctx.closePath();
  ctx.fillStyle = og;
  ctx.fill();

  // 中心コア（白→水色）
  const ig = ctx.createLinearGradient(mx, my, mx, my + blen * 0.7);
  ig.addColorStop(0, 'rgba(255,255,255,1)');
  ig.addColorStop(0.35, 'rgba(186,230,253,0.9)');
  ig.addColorStop(1, 'rgba(186,230,253,0)');
  ctx.beginPath();
  ctx.moveTo(mx - bw * 0.1, my);
  ctx.lineTo(mx - bw * 0.32, my + blen * 0.7);
  ctx.lineTo(mx + bw * 0.32, my + blen * 0.7);
  ctx.lineTo(mx + bw * 0.1, my);
  ctx.closePath();
  ctx.fillStyle = ig;
  ctx.fill();

  // 衝撃波リング
  for (let i = 0; i < 4; i++) {
    const prog = ((frame + i * 18) % 72) / 72;
    const ry = my + blen * 0.08 * (i + 1) + blen * 0.12 * prog;
    const rr = bw * 0.5 * (1 + prog * 2.5);
    ctx.beginPath();
    ctx.ellipse(mx, ry, rr, rr * 0.28, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(147,197,253,${(1 - prog) * 0.7})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 流れるスパークル
  ctx.fillStyle = 'rgba(255,255,200,0.95)';
  for (let i = 0; i < 7; i++) {
    const t = (frame * 0.04 + i * 0.15) % 1;
    ctx.globalAlpha = 1 - t;
    const sx = mx + Math.sin(frame * 0.18 + i * 1.4) * bw * 0.35;
    const sy = my + t * blen * 0.75;
    ctx.beginPath();
    ctx.arc(sx, sy, 3 + Math.sin(frame * 0.3 + i) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---- 電車 ----
export function drawTrain(ctx: CanvasRenderingContext2D, cw: number, ch: number, frame: number) {
  const cars = ['🚂', '🚃', '🚃', '🚃', '🚃'];
  const charW = 62;
  const trainW = cars.length * charW;
  const speed = 3.5;
  const trackY = ch * 0.6;

  ctx.save();

  // 枕木
  ctx.lineWidth = 7;
  for (let i = 0; i < cw + 30; i += 26) {
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.65)';
    ctx.beginPath();
    ctx.moveTo(i, trackY + 34);
    ctx.lineTo(i, trackY + 50);
    ctx.stroke();
  }

  // レール（上下2本）
  [trackY + 36, trackY + 48].forEach(y => {
    ctx.strokeStyle = 'rgba(160, 160, 160, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  });

  // 電車位置（右→左にループ）
  const period = cw + trainW + 60;
  const offset = (frame * speed) % period;
  const trainX = cw + 30 - offset;

  ctx.font = `${charW}px serif`;
  ctx.textBaseline = 'middle';
  cars.forEach((car, i) => ctx.fillText(car, trainX + i * charW, trackY));

  // 煙（機関車の上）
  for (let s = 0; s < 4; s++) {
    const age = (frame * 1.2 + s * 18) % 55;
    const sx = trainX + charW * 0.4 + Math.sin(age * 0.25) * 6;
    const sy = trackY - 30 - age * 1.4;
    const sr = 7 + age * 0.5;
    ctx.globalAlpha = Math.max(0, (1 - age / 55) * 0.65);
    ctx.fillStyle = '#d1d5db';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ---- ひよこたち ----
export function drawChicks(ctx: CanvasRenderingContext2D, cw: number, ch: number, frame: number) {
  // 14羽のひよこ：x位置・ボウンスの位相を固定
  const chicks = [
    [0.07, 0.0], [0.20, 1.3], [0.33, 0.6], [0.46, 2.1], [0.59, 0.9], [0.72, 1.7], [0.88, 0.3],
    [0.13, 3.0], [0.27, 2.5], [0.40, 1.1], [0.53, 3.4], [0.66, 0.5], [0.80, 2.8], [0.94, 1.5],
  ];

  ctx.save();
  ctx.font = '46px serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  chicks.forEach(([bx, phase]) => {
    const x = bx * cw;
    // ぴょんぴょん跳ねる：sin の絶対値でバウンド感を出す
    const bounce = Math.abs(Math.sin(frame * 0.09 + phase));
    const y = ch * 0.72 - bounce * ch * 0.42;

    // 影（地面）
    ctx.globalAlpha = 0.18 + bounce * 0.05;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, ch * 0.72 + 14, 18 - bounce * 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillText('🐥', x, y);
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---- 泡 ----
export interface BubbleParticle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  wobble: number;
  wobbleSpeed: number;
}

function spawnMouthBubble(spawnX: number, spawnY: number): BubbleParticle {
  return {
    x: spawnX + (Math.random() - 0.5) * 50,
    y: spawnY,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(1.5 + Math.random() * 2.5),
    r: 12 + Math.random() * 28,
    alpha: 0.6 + Math.random() * 0.4,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.025 + Math.random() * 0.045,
  };
}

export function updateAndDrawBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: BubbleParticle[],
  landmarks: Landmark[] | null,
  vw: number, vh: number, cw: number, ch: number,
  frame: number
) {
  let spawnX = cw / 2, spawnY = ch * 0.55;
  if (landmarks) {
    const ul = lm(landmarks, 13, vw, vh, cw, ch);
    const ll = lm(landmarks, 14, vw, vh, cw, ch);
    spawnX = (ul.x + ll.x) / 2;
    spawnY = (ul.y + ll.y) / 2;
  }

  if (frame % 4 === 0) bubbles.push(spawnMouthBubble(spawnX, spawnY));

  ctx.save();
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.wobble += b.wobbleSpeed;
    b.x += b.vx + Math.sin(b.wobble) * 1.2;
    b.y += b.vy;
    if (b.y < -b.r * 3) { bubbles.splice(i, 1); continue; }

    const grad = ctx.createRadialGradient(
      b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.05,
      b.x, b.y, b.r
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.35, 'rgba(186,230,253,0.45)');
    grad.addColorStop(1, 'rgba(125,190,255,0.1)');

    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(147,210,255,0.7)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.globalAlpha = b.alpha * 0.75;
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.38, b.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---- カバ3匹 ----
function drawHippoFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Shadow
  ctx.beginPath();
  ctx.arc(r * 0.08, r * 0.08, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Ears
  ([[-0.78, -0.65], [0.78, -0.65]] as [number, number][]).forEach(([ex, ey]) => {
    ctx.beginPath();
    ctx.arc(r * ex, r * ey, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * ex, r * ey, r * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = '#fda4af';
    ctx.fill();
  });

  // Snout
  ctx.beginPath();
  ctx.ellipse(0, r * 0.32, r * 0.58, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c8d4e0';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Nostrils
  [-0.22, 0.22].forEach(nx => {
    ctx.beginPath();
    ctx.ellipse(r * nx, r * 0.38, r * 0.11, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#475569';
    ctx.fill();
  });

  // Eyes
  [-0.38, 0.38].forEach(ex => {
    ctx.beginPath();
    ctx.ellipse(r * ex, -r * 0.18, r * 0.18, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * ex, -r * 0.18, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * ex + r * 0.06, -r * 0.23, r * 0.035, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  });

  // Smile
  ctx.beginPath();
  ctx.arc(0, r * 0.18, r * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}

export function drawHippos(ctx: CanvasRenderingContext2D, cw: number, ch: number, frame: number) {
  const r = Math.min(cw, ch) * 0.13;
  const hippos = [
    { x: cw * 0.2, y: ch * 0.38, speed: 0.016 },
    { x: cw * 0.5, y: ch * 0.55, speed: -0.011 },
    { x: cw * 0.8, y: ch * 0.32, speed: 0.020 },
  ];
  hippos.forEach(({ x, y, speed }) => {
    drawHippoFace(ctx, x, y, r, frame * speed);
  });
}

// ---- 子ブタ3匹 ----
export interface PigletState {
  x: number; y: number;
  angle: number;
  targetAngle: number;
  changeTimer: number;
}

export function initPiglets(cw: number, ch: number): PigletState[] {
  return [0, 1, 2].map(i => ({
    x: cw * (0.2 + i * 0.3),
    y: ch * (0.3 + Math.random() * 0.4),
    angle: Math.random() * Math.PI * 2,
    targetAngle: Math.random() * Math.PI * 2,
    changeTimer: 20 + Math.floor(Math.random() * 60),
  }));
}

export function updateAndDrawPiglets(
  ctx: CanvasRenderingContext2D,
  piglets: PigletState[],
  cw: number, ch: number
) {
  ctx.save();
  ctx.font = '56px serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  for (const p of piglets) {
    p.changeTimer--;
    if (p.changeTimer <= 0) {
      p.targetAngle = Math.random() * Math.PI * 2;
      p.changeTimer = 50 + Math.floor(Math.random() * 80);
    }

    let da = p.targetAngle - p.angle;
    if (da > Math.PI) da -= Math.PI * 2;
    if (da < -Math.PI) da += Math.PI * 2;
    p.angle += da * 0.06;

    p.x += Math.cos(p.angle) * 2.8;
    p.y += Math.sin(p.angle) * 2.8;

    const pad = 50;
    if (p.x < pad) { p.x = pad; p.targetAngle = Math.PI - p.angle + (Math.random() - 0.5); }
    if (p.x > cw - pad) { p.x = cw - pad; p.targetAngle = Math.PI - p.angle + (Math.random() - 0.5); }
    if (p.y < pad) { p.y = pad; p.targetAngle = -p.angle + (Math.random() - 0.5); }
    if (p.y > ch - pad) { p.y = ch - pad; p.targetAngle = -p.angle + (Math.random() - 0.5); }

    ctx.fillText('🐷', p.x, p.y);
  }
  ctx.restore();
}

// ---- サーフィン ----
export function drawSurf(ctx: CanvasRenderingContext2D, cw: number, ch: number, frame: number) {
  ctx.save();
  const waveBaseY = ch * 0.62;
  const waveOff = frame * 3;

  const seaGrad = ctx.createLinearGradient(0, waveBaseY, 0, ch);
  seaGrad.addColorStop(0, '#38bdf8');
  seaGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, waveBaseY - 40, cw, ch - waveBaseY + 40);

  // Wave layers (back to front)
  const waveColors = ['rgba(3,105,161,0.8)', 'rgba(14,165,233,0.75)', 'rgba(56,189,248,0.65)'];
  for (let w = 2; w >= 0; w--) {
    ctx.beginPath();
    ctx.moveTo(0, ch);
    for (let x = 0; x <= cw + 5; x += 5) {
      const y = waveBaseY
        + Math.sin((x + waveOff * (0.9 + w * 0.1)) * 0.018) * (18 + w * 10)
        + Math.sin((x * 0.013 + frame * 0.07 + w * 1.1)) * (8 + w * 5);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fillStyle = waveColors[w];
    ctx.fill();
  }

  // Foam on top wave
  ctx.beginPath();
  for (let x = 0; x <= cw; x += 4) {
    const y = waveBaseY + Math.sin((x + waveOff) * 0.018) * 18;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Surfer (right → left loop)
  const period = cw + 220;
  const sx = cw + 80 - ((frame * 2.5) % period);
  const sy = waveBaseY + Math.sin((sx + waveOff) * 0.018) * 18 - 44;

  ctx.font = '64px serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('🏄', sx, sy);
  ctx.restore();
}

// ---- 魚の群れ ----
export function drawFish(ctx: CanvasRenderingContext2D, cw: number, ch: number, frame: number) {
  ctx.save();
  const waveBaseY = ch * 0.45;
  const waveOff = frame * 2;

  const seaGrad = ctx.createLinearGradient(0, waveBaseY, 0, ch);
  seaGrad.addColorStop(0, '#38bdf8');
  seaGrad.addColorStop(0.5, '#0284c7');
  seaGrad.addColorStop(1, '#075985');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, waveBaseY - 30, cw, ch - waveBaseY + 30);

  // Wave layers
  for (let w = 1; w >= 0; w--) {
    ctx.beginPath();
    ctx.moveTo(0, ch);
    for (let x = 0; x <= cw + 5; x += 5) {
      const y = waveBaseY
        + Math.sin((x + waveOff * (0.9 + w * 0.15)) * 0.016) * (16 + w * 12)
        + Math.sin((x * 0.011 + frame * 0.06 + w)) * (7 + w * 6);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(cw, ch);
    ctx.closePath();
    ctx.fillStyle = w === 0 ? 'rgba(14,165,233,0.8)' : 'rgba(56,189,248,0.65)';
    ctx.fill();
  }

  // Foam
  ctx.beginPath();
  for (let x = 0; x <= cw; x += 4) {
    const y = waveBaseY + Math.sin((x + waveOff) * 0.016) * 16;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Fish school (right → left loop)
  const period = cw + 350;
  const schoolX = cw + 150 - ((frame * 2.8) % period);
  const schoolY = waveBaseY + (ch - waveBaseY) * 0.45;

  const formation: [number, number][] = [
    [0, 0], [55, -25], [55, 25],
    [110, -50], [110, 0], [110, 50],
    [165, -65], [165, -25], [165, 25], [165, 65],
    [220, -45], [220, -10], [220, 30],
    [270, -20], [270, 20],
  ];

  ctx.font = '30px serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  formation.forEach(([dx, dy]) => {
    const fx = schoolX + dx;
    const fy = schoolY + dy + Math.sin(frame * 0.05 + dx * 0.015) * 10;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(-1, 1);
    ctx.fillText('🐟', 0, 0);
    ctx.restore();
  });

  // Tiny bubbles from fish
  for (let b = 0; b < 5; b++) {
    const [fdx, fdy] = formation[b * 3];
    const bx = schoolX + fdx + Math.sin(frame * 0.1 + b) * 10;
    const by = schoolY + fdy - 20 + Math.sin(frame * 0.08 + b * 1.3) * 8;
    const br = Math.max(1, 3 + Math.sin(frame * 0.15 + b) * 2);
    ctx.globalAlpha = 0.35 + Math.abs(Math.sin(frame * 0.12 + b)) * 0.25;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200,240,255,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ---- ねこ ----
export function drawCat(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  vw: number, vh: number, cw: number, ch: number
) {
  const le = lm(landmarks, 33, vw, vh, cw, ch);
  const re = lm(landmarks, 263, vw, vh, cw, ch);
  const nose = lm(landmarks, 1, vw, vh, cw, ch);
  const fh = lm(landmarks, 10, vw, vh, cw, ch);
  const lc = lm(landmarks, 234, vw, vh, cw, ch);
  const rc = lm(landmarks, 454, vw, vh, cw, ch);
  const ed = Math.abs(re.x - le.x);
  const earH = ed * 0.9;

  ctx.save();

  // 耳（三角形 × 2）
  [
    { cx: le.x - ed * 0.28, tipX: le.x - ed * 0.28 },
    { cx: re.x + ed * 0.28, tipX: re.x + ed * 0.28 },
  ].forEach(({ cx: ecx, tipX }) => {
    const baseY = fh.y - earH * 0.05;
    const tipY = fh.y - earH;
    const hw = ed * 0.3;

    // 外耳
    ctx.beginPath();
    ctx.moveTo(ecx - hw, baseY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(ecx + hw, baseY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(251,146,60,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(154,52,18,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内耳（ピンク）
    ctx.beginPath();
    ctx.moveTo(ecx - hw * 0.5, baseY - earH * 0.08);
    ctx.lineTo(tipX, tipY + earH * 0.22);
    ctx.lineTo(ecx + hw * 0.5, baseY - earH * 0.08);
    ctx.closePath();
    ctx.fillStyle = 'rgba(249,168,212,0.9)';
    ctx.fill();
  });

  // ひげ（左3本・右3本）
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 1.8;
  [-0.09, 0, 0.09].forEach((oy) => {
    const wy = nose.y + ed * oy;
    ctx.beginPath();
    ctx.moveTo(nose.x - ed * 0.05, wy);
    ctx.lineTo(lc.x - ed * 0.08, wy + ed * oy * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nose.x + ed * 0.05, wy);
    ctx.lineTo(rc.x + ed * 0.08, wy + ed * oy * 0.6);
    ctx.stroke();
  });

  // 鼻（ピンク三角）
  ctx.beginPath();
  ctx.moveTo(nose.x, nose.y - ed * 0.04);
  ctx.lineTo(nose.x - ed * 0.09, nose.y + ed * 0.08);
  ctx.lineTo(nose.x + ed * 0.09, nose.y + ed * 0.08);
  ctx.closePath();
  ctx.fillStyle = 'rgba(244,114,182,0.97)';
  ctx.fill();

  ctx.restore();
}
