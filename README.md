# van-tilt-card

Custom Home Assistant Lovelace card for displaying van tilt from two sensors.

## Install

- URL: `/local/van-tilt-card/van-tilt-card.js`
- Type: `JavaScript Module`

## Supported Function

The card currently supports one core function: displaying side-to-side and front-to-back tilt values/rotation from two sensor entities.

Optional configuration supported by the card:

- `side_to_side_zero`
- `front_to_back_zero`
- `invert_side_to_side`
- `invert_front_to_back`
- `multiplier`
- `decimals`
- `buttons`

The built-in visual editor now supports:

- Side-to-side sensor
- Front-to-back sensor
- Side-to-side zero
- Front-to-back zero
- Visual multiplier
- Invert side-to-side
- Invert front-to-back
- Optional button entity selection for:
  - Rear Left Up
  - Rear Left Down
  - Rear Right Up
  - Rear Right Down
  - Driving Preset
  - Auto Level

### Multiplier

`multiplier` only affects the image rotation amount (visual sensitivity). It does not change the sensor values shown in text.

- `multiplier: 1` = normal rotation
- `multiplier: 2` = rotates images twice as much
- `multiplier: 0.5` = rotates images half as much

Use this when your sensors are correct but you want the van graphics to look more or less responsive.

### Replacing Images

The card uses these image files:

- `/local/van-tilt-card/img/van_side.png`
- `/local/van-tilt-card/img/van_back.png`

To replace them:

1. Put your new PNG files in the `img` folder with the same names, or
2. Keep your own file names and update the image paths in `van-tilt-card.js`.

After replacing images, refresh the dashboard (or clear browser cache) to see the new files.

### Buttons

Buttons are optional and configured with the `buttons` list.

You can add them either in YAML or through the visual editor.

How button actions work:

- The first 4 non-preset buttons are shown as directional arrow controls.
- Clicking a directional button toggles its target entity.
- Directional buttons are paired (0 with 1, and 2 with 3). Turning one on turns its opposite pair off.
- Buttons named `Driving Preset` and `Auto Level` are shown as preset buttons.
- Preset buttons are mutually exclusive. Turning one on turns the other off.

Example:

```yaml
buttons:
  - name: Rear Left Up
    entity: switch.van_rear_left_up
  - name: Rear Left Down
    entity: switch.van_rear_left_down
  - name: Rear Right Up
    entity: switch.van_rear_right_up
  - name: Rear Right Down
    entity: switch.van_rear_right_down
  - name: Driving Preset
    entity: input_boolean.drive_preset
  - name: Auto Level
    entity: input_boolean.level_preset
```

Notes:

- Use entities that support `toggle` for directional buttons.
- Preset buttons are intended for `input_boolean` entities.
- Relay entities above are placeholders. Replace with your own switch entity IDs.



## Minimal Config

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
```

## Example Config

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
side_to_side_zero: 1.0
front_to_back_zero: 2.0
invert_side_to_side: false
invert_front_to_back: false
multiplier: 1
decimals: 1
buttons:
  - name: Rear Left Up
    entity: switch.van_rear_left_up
  - name: Rear Left Down
    entity: switch.van_rear_left_down
  - name: Rear Right Up
    entity: switch.van_rear_right_up
  - name: Rear Right Down
    entity: switch.van_rear_right_down
  - name: Driving Preset
    entity: input_boolean.drive_preset
  - name: Auto Level
    entity: input_boolean.level_preset
```

Legacy aliases still supported: `entity_x`, `entity_y`, `x_offset`, `y_offset`, `invert_x`, `invert_y`.

## Auto-Level Pyscript

The folder `pyscript/auto_level.py` contains a Home Assistant Pyscript service named `pyscript.start_auto_level`.

What it uses (matching this README examples):

- Side-to-side sensor: `sensor.filtered_x_angle`
- Front-to-back sensor: `sensor.filtered_y_angle`
- Preset enable switch: `input_boolean.level_preset`
- Relays:
  - Rear Left Up: `switch.van_rear_left_up`
  - Rear Left Down: `switch.van_rear_left_down`
  - Rear Right Up: `switch.van_rear_right_up`
  - Rear Right Down: `switch.van_rear_right_down`
- Zero offsets in script defaults:
  - `side_to_side_zero = 1.0`
  - `front_to_back_zero = 2.0`

### How To Use

1. Install and enable the Pyscript integration in Home Assistant.
2. Copy `pyscript/auto_level.py` into your Home Assistant `config/pyscript/` folder.
3. Reload Pyscript (or restart Home Assistant).
4. Turn on `input_boolean.level_preset`.
5. Call service `pyscript.start_auto_level`.

Optional automation to auto-start when preset turns on:

```yaml
alias: Start Auto Level Loop
trigger:
  - platform: state
    entity_id: input_boolean.level_preset
    to: "on"
action:
  - service: pyscript.start_auto_level
mode: single
```

Important:

- Keep the script zero values aligned with your card config values so visual and backend correction logic match.
- The script exits when `input_boolean.level_preset` is turned off.