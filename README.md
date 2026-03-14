# van-tilt-sensor-custom-card

Custom Home Assistant Lovelace card showing van tilt.

Install resource:

- URL: /local/van-tilt-card/van-tilt-card.js
- Type: JavaScript Module

The card supports a built-in visual editor with only these fields:

- Side to Side Sensor
- Front to Back Sensor
- Side to Side Zero
- Front to Back Zero
- Invert Side to Side
- Invert Front to Back
- Multiplier

Equivalent YAML:

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
side_to_side_zero: 0
front_to_back_zero: 0
invert_side_to_side: false
invert_front_to_back: false
multiplier: 1
decimals: 1
```

Full example with your existing relay/preset buttons:

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

Legacy aliases still supported: entity_x, entity_y, x_offset, y_offset, invert_x, invert_y.# van-tilt-sensor-custom-card

Custom Home Assistant Lovelace card showing van tilt.

Install resource:

- URL: /local/van-tilt-card/van-tilt-card.js
- Type: JavaScript Module

Minimal config:

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
```

Manual calibration config:

```yaml
side_to_side_zero: 0        # Set this to zero side-to-side when parked level
front_to_back_zero: 0       # Set this to zero front-to-back when parked level
invert_side_to_side: false  # Flip side-to-side direction if needed
invert_front_to_back: false # Flip front-to-back direction if needed
multiplier: 1               # Shared scale factor for both axes
decimals: 1                 # Display precision
```

Full example:

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

Legacy aliases still supported: entity_x, entity_y, x_offset, y_offset, invert_x, invert_y.# van-tilt-sensor-custom-card

Custom Home Assistant Lovelace card showing van tilt.

Install resource:

- URL: /local/van-tilt-card/van-tilt-card.js
- Type: JavaScript Module

Minimal config:

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
```

Manual calibration config:

```yaml
side_to_side_zero: 0        # Set this to zero side-to-side when parked level
front_to_back_zero: 0       # Set this to zero front-to-back when parked level
invert_side_to_side: false  # Flip side-to-side direction if needed
invert_front_to_back: false # Flip front-to-back direction if needed
decimals: 1                 # Display precision
```

Full example:

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
side_to_side_zero: 1.0
front_to_back_zero: 2.0
invert_side_to_side: false
invert_front_to_back: false
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

Legacy aliases still supported: entity_x, entity_y, x_offset, y_offset, invert_x, invert_y.# van-tilt-sensor-custom-card

Custom home assistant lovelace card showing how tilted the van is

To install the card, create a new folder in your "homeassistant/www/" directory called "van-tilt-card" and download the files to this directory. Then in Home Assistant go to Configuration - Lovelace Dashboards - Resources and click "Add Resource". Enter "/local/van-tilt-card/van-tilt-card.js" for the URL and "JavaScript Module" for the type and click create. Back in your main dashboard, you can now manually add the new card with the following code:

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
```

Simple options:

```yaml
side_to_side_zero: 0        # Manual zero for side-to-side axis
front_to_back_zero: 0       # Manual zero for front-to-back axis
invert_side_to_side: false  # Flip side-to-side direction
invert_front_to_back: false # Flip front-to-back direction
decimals: 1              # Display decimal places
```

In-card settings UI:

- Use `- / +` to change zero values.
- Use `Invert` to flip each axis direction.
- Use `Set Current As Zero` while parked level.

Cross-device persistence (recommended):

Create helpers in Home Assistant UI and point the card to them.

```yaml
entity_side_to_side_zero: input_number.van_side_to_side_zero
entity_front_to_back_zero: input_number.van_front_to_back_zero
entity_invert_side_to_side: input_boolean.van_invert_side_to_side
entity_invert_front_to_back: input_boolean.van_invert_front_to_back
show_settings_controls: true
zero_adjust_step: 0.1
```

If helper entities are not provided, settings UI still works for the current dashboard session.

Example:

```yaml
type: custom:van-tilt-card
entity_side_to_side: sensor.filtered_x_angle
entity_front_to_back: sensor.filtered_y_angle
side_to_side_zero: 1.0
front_to_back_zero: 2.0
invert_side_to_side: false
invert_front_to_back: false
entity_side_to_side_zero: input_number.van_side_to_side_zero
entity_front_to_back_zero: input_number.van_front_to_back_zero
entity_invert_side_to_side: input_boolean.van_invert_side_to_side
entity_invert_front_to_back: input_boolean.van_invert_front_to_back
show_settings_controls: true
zero_adjust_step: 0.1
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

Legacy keys are still supported for backward compatibility: entity_x, entity_y, x_offset, y_offset, invert_x, invert_y.

![alt text](https://github.com/CF209/vanomation_website/blob/main/assets/img/tilt/tilt5.png)
