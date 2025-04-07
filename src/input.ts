import { canvas } from "./main.ts";

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

export default input;
