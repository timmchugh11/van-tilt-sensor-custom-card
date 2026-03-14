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
    entity: switch.power_board_relay_4
  - name: Rear Left Down
    entity: switch.power_board_relay_3
  - name: Rear Right Up
    entity: switch.power_board_relay_2
  - name: Rear Right Down
    entity: switch.power_board_relay_5
  - name: Driving Preset
    entity: input_boolean.drive_preset
  - name: Auto Level
    entity: input_boolean.level_preset
```

Legacy aliases still supported: `entity_x`, `entity_y`, `x_offset`, `y_offset`, `invert_x`, `invert_y`.
