import './style.css';

const dpr = window.devicePixelRatio || 1;
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const width = 800;
const height = 600;
canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
if (ctx == null) throw Error("failed to create context");
ctx.scale(dpr, dpr);

const shape_list = ["circle", "square", "triangle", /*"star"*/];

type Range = ReturnType<typeof range>;
function range(low: number, high: number) {
  return {low, high};
}

const random = {
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

// TODO turn to array for n dimensional vectors
class Vec2 {
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
}

const input = {
  press_state: {
    just_down: 3,
    still_down: 2,
    just_up: 1,
    still_up: 0,
  },
  key_table: {} as Record<string, number>,
  mouse: {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    button_table: {} as Record<string, number>,
  },
  update() {
    for (let [keyCode, keyState] of Object.entries(input.key_table)) {
      if (keyState % 2 == 1) input.key_table[keyCode] -= 1;
    }

    for (let [button, buttonState] of Object.entries(input.mouse.button_table)) {
      if (buttonState % 2 == 1) input.mouse.button_table[button] -= 1;
    }
  },
  keyState(code: string) { return this.key_table[code]; },
  keyDown(code: string) { return this.key_table[code] >= this.press_state.still_down  },
  keyUp(code: string) { return this.key_table[code] <= this.press_state.just_up  },
  keyJustDown(code: string) { return this.key_table[code] == input.press_state.just_down  },
  keyJustUp(code: string) { return this.key_table[code] == input.press_state.just_up  },

  buttonState(button: number) { return this.mouse.button_table[button]; },
  buttonDown(button: number) { return this.mouse.button_table[button] >= this.press_state.just_down  },
  buttonUp(button: number) { return this.mouse.button_table[button] <= this.press_state.just_up  },
  buttonJustDown(button: number) { return this.mouse.button_table[button] == input.press_state.just_down  },
  buttonJustUp(button: number) { return this.mouse.button_table[button] == input.press_state.just_up  },

  keyDownHandler(event: KeyboardEvent) { this.key_table[event.code] = this.press_state.just_down  },
  keyUpHandler(event: KeyboardEvent) { this.key_table[event.code] = this.press_state.just_up  },
  pointerDownHandler(event: PointerEvent) { this.mouse.button_table[event.button] = this.press_state.just_down  },
  pointerUpHandler(event: PointerEvent) { this.mouse.button_table[event.button] = this.press_state.just_up  },
  pointerMoveHandler(event: PointerEvent) {
    this.mouse.x = event.clientX - canvas.getBoundingClientRect().x;
    this.mouse.y = event.clientY - canvas.getBoundingClientRect().y;
    this.mouse.dx = event.movementX;
    this.mouse.dy = event.movementY;
  }
};

window.addEventListener("keydown", (event) => input.keyDownHandler(event));
window.addEventListener("keyup", (event) => input.keyUpHandler(event));
window.addEventListener("pointerdown", (event) => input.pointerDownHandler(event));
window.addEventListener("pointerup", (event) => input.pointerUpHandler(event));
window.addEventListener("pointermove", (event) => input.pointerMoveHandler(event));


let raf = requestAnimationFrame(loop);
raf;

type Entity = {
  exists: boolean,
  pos: Vec2,
  vel: Vec2,
};

type Shape = Entity & {
  kind: string,
};

let world_center = new Vec2(width / 2, height / 2);
class ShapeSpawner {
  pos: Vec2;
  ent_list: Shape[];
  direction: Vec2;
  timer: number;
  timer_duration: number;

  constructor(pos: Vec2) {
    this.ent_list = [];
    this.pos = pos;
    this.direction = pos.to(world_center).normalize();
    this.timer_duration = 1;
    this.timer = this.timer_duration;
  }

  update(dt: number) {
    if (this.timer >= this.timer_duration) {
      this.timer = this.timer_duration - this.timer;
      // spawn
      let begin = 20;
      let end = 100;
      let xr = random.fromArray([range(-end, -begin), range(width + begin, width + end)]);
      let yr = random.fromArray([range(-end, -begin), range(height + begin, height + end)]);
      let pos = random.vecBetween(xr, yr);
      let dest = world_center.add(random.vecOnUnit().mulScalar(random.betweenNumbers(10, 100)));
      let new_ent = {
        exists: true,
        pos: pos,
        vel: Vec2.mulScalar(pos.to(dest).normalize(), random.betweenNumbers(80, 120)),
        kind: random.shape(),
      }
      this.ent_list.push(new_ent);
    }
    this.timer += dt;
    
    for (let ent of this.ent_list) {
      switch(ent.kind) {
        default:
      }
      // integrate movement
      let dxy = Vec2.mulScalar(ent.vel, dt);
      ent.pos.x += dxy.x;
      ent.pos.y += dxy.y;
    }
  }
}

let vizlog = {
  visible: true,
  list: [] as string[],
  log(str: string) {
    this.list.push(str);
  },
  clear() {
    this.list = [];
  }
};

let time_elapsed = 0;

const DASH_COOLDOWN = 3;
let player = {
  score: 0,
  pos: new Vec2(width/2, height/2),
  shape: random.shape(),
  dash: {
    cooldown_remaining: 0,
    cooldown_duration: DASH_COOLDOWN,
  },
  shapes_collected: [] as string[],
};

let shape_spawner = new ShapeSpawner(new Vec2(10, height / 2));

// let shape_pickup_order = ['circle', 'circle', 'circle'];
let shape_pickup_order = Array.from({length: 3}).map(() => random.shape());

function loop(time: DOMHighResTimeStamp) {
  let dt_ms = (time - time_elapsed);
  let dt_s = dt_ms / 1000;
  time_elapsed = time;
  vizlog.clear();
  vizlog.log(`${(time_elapsed/1000).toFixed(1)}s`);
  vizlog.log(`${(dt_ms).toFixed(0)}ms`);

  { // update
    { // spawners
      shape_spawner.update(dt_s);
    }
    { // cooldowns
      if (player.dash.cooldown_remaining - dt_s < 0) player.dash.cooldown_remaining = 0;
      else player.dash.cooldown_remaining -= dt_s;
    }
    { // player movement
      let dir = new Vec2(0);
      if (input.keyDown("KeyE")) dir.y -= 1;
      if (input.keyDown("KeyS")) dir.x -= 1;
      if (input.keyDown("KeyD")) dir.y += 1;
      if (input.keyDown("KeyF")) dir.x += 1;
      dir.normalize();

      if (input.keyJustDown("Space")) {
        player.dash.cooldown_remaining = player.dash.cooldown_duration;
      }

      let speed = 100;
      let vel = Vec2.mulScalar(dir, speed);
      let dxy = Vec2.mulScalar(vel, dt_s);
      player.pos.x += dxy.x;
      player.pos.y += dxy.y;
      vizlog.log("player:");
      vizlog.log(`\tpos: ${player.pos.x.toFixed(0)}, ${player.pos.y.toFixed(0)}`);
      vizlog.log(`\tscore: ${player.score}`);
      vizlog.log(`\tcollection: ${player.shapes_collected.toString()}`);
      vizlog.log(`\tdash (unused): ${player.dash.cooldown_remaining.toFixed(1)} / ${player.dash.cooldown_duration.toFixed(1)}`);
    }
    { // collect shapes
      for (const shape of shape_spawner.ent_list) {
        if (shape.exists) {
          if (player.pos.to(shape.pos).len() < 20) {
            // despawn shape
            shape.exists = false;

            let current_shape_ndx = player.shapes_collected.length;
            if (shape.kind === shape_pickup_order[current_shape_ndx]) {
              player.shapes_collected.push(shape.kind);
            } else {
              player.shapes_collected = [];
            }

            if (shape_pickup_order.toString() == player.shapes_collected.toString()) {
              player.shapes_collected = [];
              player.score += 1;
              shape_pickup_order = Array.from({length: 3}).map(() => random.shape());
            }
          }
        }
      }
    }
  }
  { // draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // shape goals
    ctx.lineWidth = 10;
    for (let i = 0; i < shape_pickup_order.length; i += 1) {
      let current_shape_ndx = player.shapes_collected.length;
      if (current_shape_ndx > i) {
        ctx.strokeStyle = "rgb(255 255 255 / 1)";
      } else {
        ctx.strokeStyle = "rgb(255 255 255 / 0.1)";
      }
      let xi = width / (shape_pickup_order.length+1);
      let shape = shape_pickup_order[i];
      let pos = new Vec2(xi * (i + 1), height/2);
      let padding = 10;
      let r = xi / 2 - padding;
      switch(shape) {
        case "circle":
        {
          ctx.beginPath();
          let x = pos.x;
          let y = pos.y;
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        case "square":
        {
          ctx.beginPath();
          let x = pos.x - r;
          let y = pos.y - r;
          ctx.rect(x, y, r * 2, r * 2);
          ctx.stroke();
        }
        break;
        case "triangle":
        {
          drawShape(3, pos, r);
        }
        break;
        default:
        break;
      }
    }

    // shapes
    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";
    for (const shape of shape_spawner.ent_list) {
      if (!shape.exists) continue;
      switch(shape.kind) {
        case "circle":
        {
          ctx.beginPath();
          let x = shape.pos.x;
          let y = shape.pos.y;
          let r = 10;
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
        case "square":
        {
          ctx.beginPath();
          let r = 10 * 2;
          let x = shape.pos.x - r / 2;
          let y = shape.pos.y - r / 2;
          ctx.rect(x, y, r, r);
          ctx.stroke();
        }
        break;
        case "triangle":
        {
          drawShape(3, shape.pos, 10);
        }
        break;
        default:
        break;
      }
    }

    // player
    let r = 10;
    ctx.beginPath();
    ctx.strokeStyle = "white";
    let x = player.pos.x;
    let y = player.pos.y;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();


    // debug info
    if (input.keyJustDown("KeyP")) vizlog.visible = !vizlog.visible;
    if (vizlog.visible) {
      let y = 0;
      let gap = 0;
      for (let log of vizlog.list) {
        let text_metrics = ctx.measureText(log);
        let x = 10;
        y += text_metrics.fontBoundingBoxAscent + gap;
        ctx.fillStyle = `white`;
        ctx.font = `1em monospace`;
        ctx.fillText(log, x, y);
      }
    }
  }

  input.update();
  raf = requestAnimationFrame(loop);
}

function generateShapePoints(point_count: number, r: number) {
  let result = new Array<Vec2>(point_count);
  let angle = 0;
  let alpha = Math.PI * 2 / point_count;
  let point = new Vec2(Math.cos(alpha), Math.sin(alpha));
  point.mulScalar(r);
  result.push(point);
  for (let i = 0; i < point_count; i += 1) {
    angle += alpha;
    point = new Vec2(Math.cos(angle), Math.sin(angle));
    point.mulScalar(r);
    result.push(point);
  }
}

function drawShape(point_count: number, pos: Vec2, r: number) {
  ctx.beginPath();
  let angle = 0;
  let alpha = Math.PI * 2 / point_count;
  let pxy = new Vec2(Math.cos(angle), Math.sin(angle));
  pxy.mulScalar(r).add(pos);
  ctx.moveTo(pxy.x, pxy.y);
  for (let i = 0; i < point_count; i += 1) {
    angle += alpha;
    pxy = new Vec2(Math.cos(angle), Math.sin(angle));
    pxy.mulScalar(r).add(pos);
    ctx.lineTo(pxy.x, pxy.y);
  }
  ctx.closePath();
  ctx.stroke();
}
