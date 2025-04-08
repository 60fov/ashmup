import { shape_list } from "./main.ts";

export function clamp(v: number, low: number, high: number) {
  return Math.min(high, Math.max(low, v));
}

export function lerp(a: number, b: number, t: number) {
  return (1 - t) * a + t * b;
}

export const random = {
  betweenNumbers(low: number, high: number) {return Math.random() * (high - low) + low},
  betweenRange(r: Range) {return Math.random() * (r.high - r.low) + r.low},
  vecBetween(a_range: Range, b_range: Range) {return new Vec2(this.betweenRange(a_range), this.betweenRange(b_range))},
  fromArray<T>(array: T[]): T {return array[Math.floor(Math.random() * array.length)]},
  shape() {
    return this.fromArray(shape_list);
  },
  vecOnUnit() {
    return new Vec2(this.betweenNumbers(-1, 1), this.betweenNumbers(-1, 1));
  }
};

export type Range = ReturnType<typeof range>;
export function range(low: number, high: number) {
  return {low, high};
}

export class Vec2 {
  x: number;
  y: number;

  constructor(x: number, y?: number) {
    this.x = x;
    this.y = y ?? x;
  }

  get xx() {return new Vec2(this.x, this.x)}
  get yy() {return new Vec2(this.y, this.y)}
  get yx() {return new Vec2(this.y, this.x)}

  mul(v: Vec2) {this.x *= v.x; this.y *= v.y; return this}
  add(v: Vec2) {this.x += v.x; this.y += v.y; return this}
  sub(v: Vec2) {this.x -= v.x; this.y -= v.y; return this}
  div(v: Vec2) {this.x /= v.x; this.y /= v.y; return this}
  mulScalar(s: number) {this.x *= s; this.y *= s; return this}
  addScalar(s: number) {this.x += s; this.y += s; return this}
  subScalar(s: number) {this.x -= s; this.y -= s; return this}
  divScalar(s: number) {this.x /= s; this.y /= s; return this}
  dot(v: Vec2) {return this.x * v.x + this.y * v.y}
  len2() {return Vec2.dot(this,this)}
  len() {return Math.sqrt(Vec2.len2(this))}
  normalize() {
    let l = Vec2.len(this);
    return l == 0 ? this : this.divScalar(l);
  }
  to(v: Vec2) {return Vec2.sub(v, this);}
  from(v: Vec2) {return Vec2.sub(this, v);}

  static copy(v: Vec2) {return new Vec2(v.x, v.y)}
  static mul(a: Vec2, b: Vec2) {return new Vec2(a.x * b.x, a.y * b.y)}
  static add(a: Vec2, b: Vec2) {return new Vec2(a.x + b.x, a.y + b.y)}
  static sub(a: Vec2, b: Vec2) {return new Vec2(a.x - b.x, a.y - b.y)}
  static div(a: Vec2, b: Vec2) {return new Vec2(a.x / b.x, a.y / b.y)}
  static mulScalar(v: Vec2, s: number) {return new Vec2(v.x * s, v.y * s)}
  static addScalar(v: Vec2, s: number) {return new Vec2(v.x + s, v.y + s)}
  static subScalar(v: Vec2, s: number) {return new Vec2(v.x - s, v.y - s)}
  static divScalar(v: Vec2, s: number) {return new Vec2(v.x / s, v.y / s)}
  static dot(a: Vec2, b: Vec2) {return a.x * b.x + a.y * b.y}
  static len(v: Vec2) {return Math.sqrt(Vec2.len2(v))}
  static len2(v: Vec2) {return Vec2.dot(v,v)}
  static normalize(v: Vec2) {
    let l = Vec2.len(v);
    return l == 0 ? v : Vec2.divScalar(v, l);
  }
  static lerp(a: Vec2, b: Vec2, t: number) {
    return new Vec2(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }
}
