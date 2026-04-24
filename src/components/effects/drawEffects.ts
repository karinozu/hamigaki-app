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
