import time


_AUTO_LEVEL_RUNNING = False
_AUTO_LEVEL_RUN_ID = 0


@service
def start_auto_level():
    """Start the auto leveling loop if preset is on."""
    global _AUTO_LEVEL_RUNNING
    global _AUTO_LEVEL_RUN_ID

    log.warning("Auto-level service called")

    if state.get("input_boolean.level_preset") != "on":
        log.warning("Auto-level preset is OFF. Not starting.")
        return

    if _AUTO_LEVEL_RUNNING:
        # Bump run id and start a fresh loop so changed tunables take effect immediately.
        log.warning("Auto-level loop already running. Restarting with latest script settings.")

    _AUTO_LEVEL_RUN_ID += 1
    run_id = _AUTO_LEVEL_RUN_ID
    _AUTO_LEVEL_RUNNING = True

    log.warning(f"Starting auto-level task (run_id={run_id})")
    task.create(level_loop(run_id))


async def level_loop(run_id: int):
    """
    One-solenoid-at-a-time auto-level:
      - Keep one best valve open and re-evaluate continuously.
      - Attempt leveling for up to 2 minutes, then sleep.
      - If level is reached earlier, sleep immediately.
    """

    global _AUTO_LEVEL_RUNNING

    # ------------ Tunables ------------
    tolerance = 0.2                 # correction tolerance (degrees)
    settle_tolerance = 0.2        # stricter "good enough" stop/sleep band (degrees)
    recheck_interval = 1200          # seconds between checks while resting
    max_level_attempt_time = 120    # max active correction time before resting
    relay_switch_deadtime = 0.25    # all-off pause before opening a valve
    move_check_interval = 1.0       # re-evaluation cadence during correction
    invalid_sensor_retry = 2        # retry delay for invalid sensor values
    min_improvement = 0.01          # minimum total error drop per check
    stall_limit = 6                 # poor checks before forced recovery action
    max_single_valve_hold = 45      # max uninterrupted hold before re-decision
    invert_x = False                 # flip if X feels backwards
    invert_y = False                # flip if Y feels backwards
    side_to_side_zero = 1.0        # match card config in README example
    front_to_back_zero = 2.0       # match card config in README example
    side_to_side_gain = 1.0         # extra backend scaling (keep 1.0 to match frontend)
    front_to_back_gain = 1.0        # extra backend scaling (keep 1.0 to match frontend)
    # ----------------------------------

    log.warning(
        f"Run {run_id} config: tolerance={tolerance}, settle_tolerance={settle_tolerance}, "
        f"attempt={max_level_attempt_time}s, recheck={recheck_interval}s"
    )

    preset = "input_boolean.level_preset"
    front_to_back_sensor = "sensor.filtered_y_angle"
    side_to_side_sensor = "sensor.filtered_x_angle"

    relays = {
        "rear_left_up": "switch.van_rear_left_up",
        "rear_left_down": "switch.van_rear_left_down",
        "rear_right_up": "switch.van_rear_right_up",
        "rear_right_down": "switch.van_rear_right_down",
    }

    linked_pairs = [
        ("rear_left_up", "rear_right_up"),
        ("rear_left_down", "rear_right_down"),
    ]

    def _call_service(domain_dot_name: str, **data):
        try:
            pyscript.call_service(domain_dot_name, **data)   # type: ignore
            return
        except Exception as e1:
            try:
                service.call(name=domain_dot_name, **data)   # type: ignore
                return
            except Exception as e2:
                try:
                    domain, svc = domain_dot_name.split(".", 1)
                    task.executor(hass.services.call, domain, svc, data)
                    return
                except Exception as e3:
                    log.error(
                        f"Service {domain_dot_name} failed; "
                        f"pyscript.call_service: {e1}; service.call: {e2}; hass.services.call: {e3}"
                    )

    def turn_on(entity_id: str):
        _call_service("switch.turn_on", entity_id=entity_id)

    def turn_off(entity_id: str):
        _call_service("switch.turn_off", entity_id=entity_id)

    def stop_all_relays():
        for ent in relays.values():
            turn_off(ent)

    def linked_pair_on():
        for left_key, right_key in linked_pairs:
            left_state = state.get(relays[left_key])
            right_state = state.get(relays[right_key])
            if left_state == "on" and right_state == "on":
                return left_key, right_key
        return None

    def get_angle(entity_id: str):
        try:
            return float(state.get(entity_id))
        except (ValueError, TypeError):
            log.warning(f"Invalid angle from {entity_id}; pausing corrections.")
            return None

    def within_tol(x: float, y: float) -> bool:
        return abs(x) <= tolerance and abs(y) <= tolerance

    def within_settle_band(x: float, y: float) -> bool:
        return abs(x) <= settle_tolerance and abs(y) <= settle_tolerance

    def total_error(x: float, y: float) -> float:
        return abs(x) + abs(y)

    def apply_calibration(x_raw: float, y_raw: float):
        """Match van-tilt-card calibration: sign flip, then zero offset."""
        x = x_raw
        y = y_raw
        if invert_x:
            x = -x
        if invert_y:
            y = -y
        x = (x * side_to_side_gain) + side_to_side_zero
        y = (y * front_to_back_gain) + front_to_back_zero
        return x, y

    async def sleep_recheck_cycle(reason: str):
        log.warning(f"{reason}. Rechecking in {recheck_interval // 60} min.")
        slept = 0
        while slept < recheck_interval and state.get(preset) == "on":
            if run_id != _AUTO_LEVEL_RUN_ID:
                return
            await task.sleep(5)
            slept += 5

    def decide_single_action(x, y):
        absx, absy = abs(x), abs(y)
        if within_settle_band(x, y):
            return None
        if absx <= tolerance and absy <= tolerance:
            return None

        scores = {
            "rear_left_up": 0.0,
            "rear_right_up": 0.0,
            "rear_left_down": 0.0,
            "rear_right_down": 0.0,
        }

        if absx > tolerance:
            if x > 0:
                scores["rear_right_up"] += absx
                scores["rear_left_up"] -= absx
                scores["rear_left_down"] -= absx * 0.6
                scores["rear_right_down"] -= absx * 0.6
            else:
                scores["rear_left_up"] += absx
                scores["rear_right_up"] -= absx
                scores["rear_left_down"] -= absx * 0.6
                scores["rear_right_down"] -= absx * 0.6

        if absy > tolerance:
            if y > 0:
                scores["rear_left_up"] += absy
                scores["rear_right_up"] += absy
                scores["rear_left_down"] -= absy
                scores["rear_right_down"] -= absy
            else:
                scores["rear_left_down"] += absy
                scores["rear_right_down"] += absy
                scores["rear_left_up"] -= absy
                scores["rear_right_up"] -= absy

        order = ["rear_right_up", "rear_left_up", "rear_left_down", "rear_right_down"]
        best = None
        best_score = float("-inf")
        for key in order:
            s = scores.get(key, float("-inf"))
            if s > best_score:
                best = key
                best_score = s

        if best is None or best_score <= 0.0:
            return None
        return best

    def decide_stall_recovery_action(x, y, last_action):
        if abs(x) >= abs(y):
            return "rear_right_up" if x > 0 else "rear_left_up"
        if y > 0:
            return "rear_left_up" if last_action == "rear_right_up" else "rear_right_up"
        return "rear_left_down" if last_action == "rear_right_down" else "rear_right_down"

    stop_all_relays()

    try:
        current_action = None
        current_entity = None
        hold_time = 0.0
        stall_count = 0
        last_error = None
        attempt_started_at = None

        while state.get(preset) == "on":
            if run_id != _AUTO_LEVEL_RUN_ID:
                stop_all_relays()
                log.warning(f"Detected newer run; stopping run_id={run_id}")
                return

            pair = linked_pair_on()
            if pair is not None:
                log.warning(f"Safety: linked pair ON ({pair[0]} + {pair[1]}). Forcing all OFF.")
                stop_all_relays()
                current_action = None
                current_entity = None
                hold_time = 0.0
                stall_count = 0
                last_error = None
                await task.sleep(relay_switch_deadtime)

            x = get_angle(side_to_side_sensor)
            y = get_angle(front_to_back_sensor)
            if x is None or y is None:
                stop_all_relays()
                current_action = None
                current_entity = None
                hold_time = 0.0
                stall_count = 0
                last_error = None
                await task.sleep(invalid_sensor_retry)
                continue

            x, y = apply_calibration(x, y)

            # Hard gate: never correct while inside tolerance.
            if within_tol(x, y):
                stop_all_relays()
                current_action = None
                current_entity = None
                hold_time = 0.0
                stall_count = 0
                last_error = None
                attempt_started_at = None
                await sleep_recheck_cycle(
                    f"Level reached (X={x:.3f}, Y={y:.3f}, tol={tolerance})"
                )
                continue

            if attempt_started_at is None:
                attempt_started_at = time.monotonic()

            elapsed_attempt = time.monotonic() - attempt_started_at
            if elapsed_attempt >= max_level_attempt_time:
                stop_all_relays()
                current_action = None
                current_entity = None
                hold_time = 0.0
                stall_count = 0
                last_error = None
                attempt_started_at = None
                await sleep_recheck_cycle(
                    f"Level attempt timed out after {int(elapsed_attempt)}s (X={x:.3f}, Y={y:.3f})"
                )
                continue

            error_now = total_error(x, y)
            if last_error is not None and current_entity is not None:
                improvement = last_error - error_now
                if improvement >= min_improvement:
                    stall_count = 0
                else:
                    stall_count += 1
            last_error = error_now

            action_key = decide_single_action(x, y)
            if stall_count >= stall_limit or hold_time >= max_single_valve_hold:
                action_key = decide_stall_recovery_action(x, y, current_action)
                log.warning(
                    f"Progress stalled/timeout (stall={stall_count}, hold={hold_time:.0f}s). "
                    f"Recovery action: {action_key}"
                )
                stall_count = 0
                hold_time = 0.0

            if action_key is None:
                if within_tol(x, y):
                    stop_all_relays()
                    current_action = None
                    current_entity = None
                    hold_time = 0.0
                    stall_count = 0
                    last_error = None
                    attempt_started_at = None
                    await sleep_recheck_cycle(
                        f"Level reached (X={x:.3f}, Y={y:.3f}, tol={tolerance})"
                    )
                    continue

                stop_all_relays()
                current_action = None
                current_entity = None
                hold_time = 0.0
                last_error = None
                await task.sleep(3)
                continue

            target_entity = relays[action_key]
            if current_entity != target_entity:
                # Last-moment guard: re-read sensors right before switching a valve.
                x_live = get_angle(side_to_side_sensor)
                y_live = get_angle(front_to_back_sensor)
                if x_live is None or y_live is None:
                    stop_all_relays()
                    current_action = None
                    current_entity = None
                    hold_time = 0.0
                    stall_count = 0
                    last_error = None
                    await task.sleep(invalid_sensor_retry)
                    continue

                x_live, y_live = apply_calibration(x_live, y_live)

                # Final safety veto before energizing a relay.
                if within_tol(x_live, y_live):
                    stop_all_relays()
                    current_action = None
                    current_entity = None
                    hold_time = 0.0
                    stall_count = 0
                    last_error = None
                    attempt_started_at = None
                    await sleep_recheck_cycle(
                        f"Tolerance veto before valve on (X={x_live:.3f}, Y={y_live:.3f}, tol={tolerance})"
                    )
                    continue

                stop_all_relays()
                await task.sleep(relay_switch_deadtime)
                turn_on(target_entity)
                current_entity = target_entity
                current_action = action_key
                hold_time = 0.0
                stall_count = 0
                last_error = error_now
                log.warning(
                    f"Correcting: X={x:.3f}, Y={y:.3f}. Opening {action_key} ({target_entity})."
                )

            await task.sleep(move_check_interval)
            hold_time += move_check_interval

        stop_all_relays()
        log.warning("Auto-level preset turned OFF; exiting.")
    finally:
        stop_all_relays()
        if run_id == _AUTO_LEVEL_RUN_ID:
            _AUTO_LEVEL_RUNNING = False