import { Vec2, range, random } from "./math.ts";
import { world } from "./main.ts";



export type EntityHandle = {
  /*** ndx into some entity list */
  ndx: number,
  /***
  ie. "generation", used for handle validation.
  "should be" incremented when an entity is invalidated.
  */
  gen: number,
};

type Entity = {
  handle?: EntityHandle,
  kind: string,
  spawn_time: number,
  pos: Vec2,
  vel: Vec2,
};

type EntitySlot = {
  gen: number,
  entity?: Entity,
};

export class EntityManager {
  max_entity_count = 1000;
  entity_slot_list: Array<EntitySlot>;
  entity_count = 0;
  entity_free_slot_list: number[] = [];

  constructor(max_entity_count: number) {
    this.max_entity_count = max_entity_count;
    this.entity_slot_list = Array.from({length: max_entity_count}).map(() => ({gen: 0}));
  }


  entityIsValid(entity?: Entity) {
    if (entity && entity.handle) {
      const entity_slot = this.entity_slot_list[entity.handle.ndx];
      return entity_slot.gen == entity.handle.gen;
    }
    return false;
  }

  spawn(entity: Entity) {
    let ndx = this.entity_free_slot_list.pop() ?? this.entity_count;
    if (ndx >= this.max_entity_count) {
      console.error("failed to spawn entity, list full (probably)");
      return;
    }
    let slot = this.entity_slot_list[ndx];
    // NOTE it's integral that this data is copy'd
    entity.handle = {
      gen: slot.gen,
      ndx: ndx,
    };

    slot.entity = entity;
    this.entity_count += 1;
  }

  despawnFromHandle(handle: EntityHandle) {
    if (this.entity_count <= 0) {
      console.error("cannot despawn, entity count <= 0");
      return;
    }

    if (this.entity_count >= this.entity_slot_list.length) {
      console.error("cannot despawn, entity count >= entity_slot_list.length");
      return;
    }

    let entity = this.entityFromHandle(handle);
    if (entity && this.entityIsValid(entity)) {
      this.entity_slot_list[handle.ndx].entity = undefined;
      this.entity_slot_list[handle.ndx].gen += 1;
      this.entity_count -= 1;
      this.entity_free_slot_list.push(handle.ndx);
    }
  }

  entityInSlot(slot: EntitySlot) {
    if (!slot.entity) return;
    if (!slot.entity.handle) throw Error("entity in slot without a handle");
    if (slot.entity.handle.gen != slot.gen) throw Error("entity-slot generation mismatch");
    return slot.entity;
  }

  entityFromHandle(handle: EntityHandle) {
    const slot = this.entity_slot_list[handle.ndx];
    if (handle.gen == slot.gen) {
      if (slot.entity) {
        return slot.entity;
      }
      throw Error("failed to get entity from handle, generation matches but entity undefined");
      // errors as values?
      // return Error();
    }
    return undefined;
  }
};

export class ShapeSpawner {
  entity_manager: EntityManager;
  pos: Vec2;
  direction: Vec2;
  timer: number;
  timer_duration: number;

  constructor(pos: Vec2) {
    this.entity_manager = new EntityManager(1000);
    this.pos = pos;
    this.direction = pos.to(world.center()).normalize();
    this.timer_duration = 0.5;
    this.timer = this.timer_duration;
  }

  update(dt: number) {
    if (this.timer >= this.timer_duration) {
      this.timer = this.timer_duration - this.timer;
      // spawn
      let begin = 20;
      let end = 100;
      let speed_range = range(250, 350);
      let xr = random.fromArray([range(-end, -begin), range(world.width + begin, world.width + end)]);
      let yr = random.fromArray([range(-end, -begin), range(world.height + begin, world.height + end)]);
      let pos = random.vecBetween(xr, yr);
      let dest = world.center().add(random.vecOnUnit().mulScalar(random.betweenNumbers(10, 100)));
      let new_ent = {
        pos: pos,
        vel: Vec2.mulScalar(pos.to(dest).normalize(), random.betweenRange(speed_range)),
        kind: random.shape(),
        spawn_time: world.time,
      }
      this.entity_manager.spawn(new_ent);
    }
    this.timer += dt;
    
    for (let slot of this.entity_manager.entity_slot_list) {
      if (!slot.entity) continue;
      const ent = slot.entity;
      switch(ent.kind) {
        default:
      }
      // integrate movement
      let dxy = Vec2.mulScalar(ent.vel, dt);
      ent.pos.x += dxy.x;
      ent.pos.y += dxy.y;
    }
  }

  updateEnd() {
    const margin = 50;
    for (let slot of this.entity_manager.entity_slot_list) {
      if (!slot.entity) continue;
      const ent = slot.entity;
      if (!this.entity_manager.entityIsValid(ent)) continue;
      const oob_l = ent.pos.x < 0 - margin;
      const oob_r = ent.pos.x > world.width + margin;
      const oob_t = ent.pos.y < 0 - margin;
      const oob_b = ent.pos.y > world.height + margin;
      const out_of_bounds = oob_l || oob_t || oob_b || oob_r;
      const old_enough_to_die = world.time - ent.spawn_time > 5;
      if (out_of_bounds && old_enough_to_die) {
        this.entity_manager.despawnFromHandle(ent.handle!);
      }
    }
  }
}

