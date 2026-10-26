// Rüzgar's delivery scooter: side view, teal body, orange box on the back.
// The chassis is a cached sprite; wheels, speed lines and the rider bob are per frame.
import { circle, ellipse, roundRect, softShadow, sprite, type Ctx } from './common';

const TEAL = '#3fb3a6';
const TEAL_D = '#2a8c82';
const TEAL_L = '#8fdcd2';
const ORANGE = '#f08a3c';
const ORANGE_D = '#c96a26';
const TYRE = '#4a3f3b';
const RIM = '#e8e3dc';
const OUT = 'rgba(60,35,20,0.3)';

const U = 60; // scooter height in units (ground y = 0, up negative)

function outline(c: Ctx, w = 1.2) {
  c.strokeStyle = OUT;
  c.lineWidth = w;
  c.stroke();
}

function chassis(c: Ctx, box: boolean) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // rear fender + body
  c.fillStyle = TEAL;
  c.beginPath();
  c.moveTo(-46, -24);
  c.quadraticCurveTo(-48, -40, -30, -40);
  c.lineTo(-6, -40);
  c.quadraticCurveTo(4, -40, 10, -30);
  c.lineTo(22, -30);
  c.lineTo(26, -18);
  c.lineTo(-24, -18);
  c.quadraticCurveTo(-40, -18, -46, -24);
  c.closePath();
  c.fill();
  outline(c);
  // seat
  c.fillStyle = '#4a3f3b';
  roundRect(c, -34, -47, 32, 9, 4.5);
  c.fill();
  outline(c);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(c, -31, -46, 20, 3, 1.5);
  c.fill();
  // floorboard
  c.fillStyle = TEAL_D;
  roundRect(c, -8, -20, 36, 5, 2.5);
  c.fill();
  outline(c);
  // front shield / steering column
  c.fillStyle = TEAL;
  c.beginPath();
  c.moveTo(24, -18);
  c.lineTo(32, -46);
  c.quadraticCurveTo(34, -54, 40, -54);
  c.lineTo(44, -54);
  c.lineTo(38, -18);
  c.closePath();
  c.fill();
  outline(c);
  c.fillStyle = TEAL_L;
  c.beginPath();
  c.moveTo(29, -24);
  c.lineTo(34, -44);
  c.lineTo(37, -44);
  c.lineTo(33, -24);
  c.closePath();
  c.fill();
  // handlebar
  c.strokeStyle = '#4a3f3b';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(36, -54);
  c.lineTo(28, -60);
  c.stroke();
  c.fillStyle = '#4a3f3b';
  circle(c, 27, -60.5, 2.6);
  c.fill();
  // headlight
  c.fillStyle = '#fff2b0';
  ellipse(c, 44, -46, 3.2, 4.2);
  c.fill();
  outline(c, 1);
  // mirror
  c.strokeStyle = '#4a3f3b';
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(40, -55);
  c.lineTo(45, -64);
  c.stroke();
  c.fillStyle = RIM;
  ellipse(c, 46, -66, 2.6, 3.2);
  c.fill();
  outline(c, 1);
  // orange delivery box
  if (box) {
    c.fillStyle = ORANGE;
    roundRect(c, -52, -64, 26, 22, 4);
    c.fill();
    outline(c);
    c.fillStyle = ORANGE_D;
    roundRect(c, -52, -64, 26, 4, 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(c, -49, -58, 4, 12, 2);
    c.fill();
    // noodle-bowl logo
    c.fillStyle = '#fff6e9';
    ellipse(c, -37, -51, 6.5, 4.5);
    c.fill();
    c.strokeStyle = '#d9573f';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-42, -52.5);
    c.lineTo(-32, -52.5);
    c.stroke();
    c.strokeStyle = '#fff6e9';
    c.beginPath();
    c.moveTo(-40, -56);
    c.lineTo(-34, -56);
    c.stroke();
  }
  // exhaust
  c.fillStyle = RIM;
  roundRect(c, -40, -14, 20, 5, 2.5);
  c.fill();
  outline(c, 1);
}

function wheel(c: Ctx, x: number, y: number, r: number, angle: number) {
  c.fillStyle = TYRE;
  circle(c, x, y, r);
  c.fill();
  c.fillStyle = RIM;
  circle(c, x, y, r * 0.6);
  c.fill();
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.strokeStyle = '#9b948c';
  c.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(-r * 0.55, 0);
    c.lineTo(r * 0.55, 0);
    c.stroke();
    c.rotate(Math.PI / 3);
  }
  c.restore();
  c.fillStyle = TEAL_D;
  circle(c, x, y, r * 0.18);
  c.fill();
}

function rider(c: Ctx, bob: number) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.save();
  c.translate(0, bob);
  // leg
  c.strokeStyle = '#4b5a7a';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-14, -48);
  c.lineTo(4, -42);
  c.lineTo(8, -22);
  c.stroke();
  c.fillStyle = '#3a2a22';
  roundRect(c, 4, -24, 12, 5, 2.5);
  c.fill();
  // torso (orange jacket)
  c.fillStyle = ORANGE;
  roundRect(c, -22, -82, 20, 36, 9);
  c.fill();
  outline(c);
  c.fillStyle = 'rgba(255,255,255,0.5)';
  roundRect(c, -20, -66, 16, 2.5, 1.2);
  c.fill();
  // arm to handlebar
  c.strokeStyle = ORANGE;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-10, -74);
  c.lineTo(12, -66);
  c.lineTo(27, -60);
  c.stroke();
  c.fillStyle = '#c89a7a';
  circle(c, 27, -60, 3.2);
  c.fill();
  // head
  c.fillStyle = '#c89a7a';
  circle(c, -10, -92, 9.5);
  c.fill();
  outline(c);
  // helmet
  c.fillStyle = TEAL_D;
  c.beginPath();
  c.arc(-10, -93, 11.5, Math.PI, Math.PI * 2);
  c.lineTo(3, -89);
  c.lineTo(-22, -89);
  c.closePath();
  c.fill();
  outline(c);
  c.fillStyle = TEAL_L;
  c.beginPath();
  c.arc(-10, -93, 8.5, Math.PI * 1.15, Math.PI * 1.55);
  c.lineWidth = 2.2;
  c.strokeStyle = TEAL_L;
  c.stroke();
  // visor
  c.fillStyle = 'rgba(90,98,138,0.35)';
  roundRect(c, -8, -94, 12, 6, 3);
  c.fill();
  // smile + eye
  c.fillStyle = '#3a2a22';
  circle(c, -3, -89, 1.1);
  c.fill();
  c.strokeStyle = '#3a2a22';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(-4, -85, 2.5, 0.1, Math.PI * 0.8);
  c.stroke();
  c.restore();
}

/**
 * Side-view delivery scooter. x = centre, y = ground, size = height.
 * Wheels rotate with t; speed lines trail behind. Faces right unless `flip`.
 */
export function drawScooter(
  c: Ctx,
  x: number,
  y: number,
  size: number,
  t: number,
  opts?: { rider?: boolean; flip?: boolean; box?: boolean }
): void {
  const box = opts?.box ?? true;
  const k = size / U;
  c.save();
  c.translate(x, y);
  softShadow(c, 0, 0, 52 * k, 8 * k, 0.22);
  if (opts?.flip) c.scale(-1, 1);
  c.scale(k, k);
  const bob = Math.sin(t * 14) * 0.8;
  // speed lines
  c.strokeStyle = 'rgba(120,110,100,0.35)';
  c.lineCap = 'round';
  c.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const ph = (t * 3 + i * 0.37) % 1;
    const ly = -30 - i * 9 + Math.sin(i) * 3;
    const lx = -60 - ph * 22;
    c.globalAlpha = 1 - ph;
    c.beginPath();
    c.moveTo(lx, ly);
    c.lineTo(lx - 12 - i * 3, ly);
    c.stroke();
  }
  c.globalAlpha = 1;
  // rider is behind the shield but on the seat
  if (opts?.rider) rider(c, bob);
  c.save();
  c.translate(0, bob * 0.6);
  const sp = sprite(
    `scooter:${box ? 1 : 0}`,
    120,
    80,
    (sc) => {
      sc.translate(60, 76);
      chassis(sc, box);
    },
    3
  );
  c.drawImage(sp, -60, -76, 120, 80);
  c.restore();
  const ang = t * 9;
  wheel(c, -30, -10, 10, ang);
  wheel(c, 32, -10, 10, ang);
  c.restore();
}
