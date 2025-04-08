import './style.css';

import input from "./input.ts";
import { Vec2, random, clamp, lerp } from "./math.ts";
import * as entity from "./entity.ts";

export let screenWidth = 0;
export let screenHeight = 0;
const dpr = window.devicePixelRatio || 1;
let ctx: CanvasRenderingContext2D;

// window.addEventListener("resize", () => sizeGame(window.innerWidth, window.innerHeight));
window.addEventListener("keydown", (event) => input.keyDownHandler(event));
window.addEventListener("keyup", (event) => input.keyUpHandler(event));
window.addEventListener("pointerdown", (event) => input.pointerDownHandler(event));
window.addEventListener("pointerup", (event) => input.pointerUpHandler(event));
window.addEventListener("pointermove", (event) => input.pointerMoveHandler(event));

export const info_panel = document.querySelector("#info-panel");
export const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
sizeGame(800, 600);

let raf = requestAnimationFrame(loop);
raf;


let imlog = {
  visible: import.meta.env.DEV,
  list: [] as ({
    kind: "text",
    text: string,
  } | {
    kind: "vec2",
    vec: Vec2,
    size?: number,
    label?: string,
  })[],
  text(text: string) {
    this.list.push({kind:"text",text});
  },
  vec2(vec: Vec2, size?: number, label?: string) {
    this.list.push({kind:"vec2",vec:Vec2.copy(vec), size, label});
  },
  clear() {
    this.list = [];
  }
};

export const shape_list = ["circle", "square", "triangle", /*"star"*/];

export const world = {
  time: 0,
  width: screenWidth,
  height: screenHeight,
  center() {
    return new Vec2(this.width / 2, this.height / 2);
  },
};

let time_elapsed = 0;
let player = {
  score: 0,
  pos: world.center(),
  shape: random.shape(),
  vel: new Vec2(0),
  speed: 200,
  last_input_time: 0,
  brake_duration: 0.25,
  boost: {
    key: 'Space',
    speed: 0,
    max_speed: 150,
    /** a factor of max speed (eg 1 == instant, 0 == disabled) */
    accel: 0.5,
    amount: 0,
    max_amount: 100,
    last_boost_time: 0,
    cooldown: 1,
  },
  shapes_collected: [] as string[],
};

let shape_spawner = new entity.ShapeSpawner(new Vec2(10, world.height / 2));

// let shape_pickup_order = ['circle', 'circle', 'circle'];
let goal_shape_list = Array.from({length: 2}).map(() => random.shape());

function loop(time: DOMHighResTimeStamp) {
  let dt_ms = (time - time_elapsed);
  let dt_s = dt_ms / 1000;
  time_elapsed = time;
  imlog.clear();
  imlog.text(`${(dt_ms).toFixed(0)}ms`);
  imlog.text(`${(time_elapsed/1000).toFixed(1)}s`);

  if (input.keyJustUp("KeyC")) {
    info_panel?.classList.toggle("hidden");
  }

  { // update
    world.time += dt_s;
    { // spawners
      shape_spawner.update(dt_s);
    }
    { // player movement
      let input_dir = new Vec2(0);
      if (input.keyDown("KeyE")) input_dir.y -= 1;
      if (input.keyDown("KeyS")) input_dir.x -= 1;
      if (input.keyDown("KeyD")) input_dir.y += 1;
      if (input.keyDown("KeyF")) input_dir.x += 1;
      input_dir.normalize();

      const input_move = input_dir.len2() != 0;
      const input_boost = input.keyDown(player.boost.key);
      const has_boost = player.boost.amount > 0;

      if (input_move) player.last_input_time = world.time;

      if (input_boost && has_boost) {
        player.boost.last_boost_time = world.time;
        player.boost.amount -= 100 * dt_s;
        player.boost.speed += player.boost.max_speed * player.boost.accel;
      } else {
        const time_since_last_boost = world.time - player.boost.last_boost_time;
        if (time_since_last_boost > player.boost.cooldown) {
          player.boost.amount += 100 * dt_s;
        }
        player.boost.speed -= player.boost.max_speed * player.boost.accel;
      }
      player.boost.amount = clamp(player.boost.amount, 0, player.boost.max_amount);
      player.boost.speed = clamp(player.boost.speed, 0, player.boost.max_speed);

      let dir = player.vel.len2() > 1 ? player.vel.normalize() : player.vel;
      let new_dir = new Vec2(0);

      if (input_move) {
        let min_unit_dist = 0.1;
        let dist = Vec2.sub(dir, input_dir).len();
        if (dist > min_unit_dist) {
          new_dir = Vec2.lerp(dir, input_dir, 0.4);
        } else {
          new_dir = input_dir;
        }
      } else {
        const time_since_last_input = world.time - player.last_input_time;
        let t = (player.brake_duration - time_since_last_input) / player.brake_duration;
        t = 1 - t;
        t = clamp(t, 0, 1);
        new_dir = Vec2.lerp(dir, new Vec2(0), t);
      }

      let speed = player.speed;
      speed += player.boost.speed;
      let new_vel = Vec2.mulScalar(new_dir, speed);
      player.vel = new_vel;

      let dxy = Vec2.mulScalar(player.vel, dt_s);
      player.pos.x += dxy.x;
      player.pos.y += dxy.y;

      imlog.text("player:");
      imlog.vec2(input_dir, undefined, "input");
      imlog.vec2(player.vel, undefined, "vel");
      imlog.text(`\tpos: ${player.pos.x.toFixed(0)}, ${player.pos.y.toFixed(0)}`);
      imlog.text(`\tboost: ${player.boost.amount.toFixed(0)}`);
      imlog.text(`\tscore: ${player.score}`);
      imlog.text(`\tcollection: ${player.shapes_collected.toString()}`);
    }
    { // collect shapes
      // TODO iterator(?)
      for (const slot of shape_spawner.entity_manager.entity_slot_list) {
        const shape = shape_spawner.entity_manager.entityInSlot(slot);
        if (!shape) continue;

        if (player.pos.to(shape.pos).len() < 20) {
          // despawn shape
          // really this should mark for despawn then updateend should actually
          shape_spawner.entity_manager.despawnFromHandle(shape.handle!);

          let current_shape_ndx = player.shapes_collected.length;
          if (shape.kind === goal_shape_list[current_shape_ndx]) {
            player.shapes_collected.push(shape.kind);
          } else {
            player.shapes_collected = [];
          }

          if (goal_shape_list.toString() == player.shapes_collected.toString()) {
            player.shapes_collected = [];
            player.score += 1;
            goal_shape_list = Array.from({length: goal_shape_list.length + 1}).map(() => random.shape());
          }
        }
      }
      {
        shape_spawner.updateEnd();
        imlog.text(`shape_spawner:`);
        imlog.text(`\t entity_count: ${shape_spawner.entity_manager.entity_count}`);
      }
    }
  }
  { // draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgb(255 255 255 / 0.1)";
    ctx.strokeRect(0, 0, screenWidth, screenHeight);

    // shape goals
    ctx.lineWidth = 10;
    for (let i = 0; i < goal_shape_list.length; i += 1) {
      let current_shape_ndx = player.shapes_collected.length;
      if (current_shape_ndx > i) {
        ctx.strokeStyle = "rgb(255 255 255 / 0.5)";
      } else {
        ctx.strokeStyle = "rgb(255 255 255 / 0.1)";
      }
      let xi = screenWidth / (goal_shape_list.length+1);
      let shape = goal_shape_list[i];
      let pos = new Vec2(xi * (i + 1), screenHeight/2);
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
    ctx.lineWidth = 4;
    ctx.strokeStyle = "red";
    for (const slot of shape_spawner.entity_manager.entity_slot_list) {
      const shape = shape_spawner.entity_manager.entityInSlot(slot);
      if (!shape) continue;

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
    ctx.fillStyle = "white";
    let x = player.pos.x;
    let y = player.pos.y;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    /** [0, 1] -> 0 == east, counter-clockwise */
    let center = 0.25;
    /** [0, 1] */
    let length = 0.45;
    let gap = 10;
    let thickness = 2;
    length *= 0.5;
    center *= Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x, y, r + gap, center + Math.PI * length, center + -Math.PI * length, true);
    ctx.strokeStyle = "rgba(255 255 255 / 0.1)";
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    let end = lerp(Math.PI * length, -Math.PI * length, player.boost.amount / player.boost.max_amount);
    ctx.arc(x, y, r + gap, center + Math.PI * length, center + end, true);
    ctx.strokeStyle = "rgba(255 255 255 / 0.5)";
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.closePath();

    // debug info
    if (input.keyJustDown("KeyP")) imlog.visible = !imlog.visible;
    if (imlog.visible) {
      let x = 10;
      let y = 10;
      let gap = 2;
      for (let log of imlog.list) {
        ctx.beginPath();
        if (log.kind == "text") {
          let text_metrics = ctx.measureText(log.text);
          y += text_metrics.fontBoundingBoxAscent + gap;
          ctx.fillStyle = `white`;
          ctx.font = `1em monospace`;
          ctx.fillText(log.text, x, y);
        } else if (log.kind == "vec2") {
          let margin = 10;
          let size = (log?.size ?? 100) - margin * 2;
          let w = size - margin;
          let h = size - margin;
          let l = x + margin;
          let t = y + margin;
          let r = l + w;
          let b = t + h;
          let radius = w / 2;
          let cx = l + radius;
          let cy = t + radius;
          ctx.strokeStyle = "rgb(255 255 255 / 0.25)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, t);
          ctx.lineTo(cx, b);
          ctx.moveTo(l, cy);
          ctx.lineTo(r, cy);
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle = "rgb(255 255 255 / 1)";
          ctx.moveTo(cx, cy);
          let dir = Vec2.normalize(log.vec);
          let v = Vec2.mulScalar(dir, radius).add(new Vec2(cx, cy));
          ctx.lineTo(v.x, v.y);
          ctx.stroke();
          y += size + gap;
          ctx.fillStyle = `white`;
          ctx.font = `0.75em monospace`;
          ctx.fillText(`${log.vec.len().toFixed(1)}`, cx, cy);
          if (log.label) {
            let text_metrics = ctx.measureText(log.label);
            // y += text_metrics.fontBoundingBoxAscent + gap;
            ctx.fillText(`${log.label}`, cx - text_metrics.width, cy + text_metrics.actualBoundingBoxAscent);
          }
        }
        ctx.closePath();
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

function sizeGame(width: number, height: number) {
  screenWidth = width;
  screenHeight = height;
  canvas.width = screenWidth * dpr;
  canvas.height = screenHeight * dpr;
  canvas.style.width = `${screenWidth}px`;
  canvas.style.height = `${screenHeight}px`;
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  if (ctx == null) throw Error("failed to create context");
  ctx.scale(dpr, dpr);
}
