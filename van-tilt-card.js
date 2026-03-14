class VanTiltCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('van-tilt-card-editor');
  }

  static getStubConfig() {
    return {
      type: 'custom:van-tilt-card',
      entity_side_to_side: '',
      entity_front_to_back: '',
      side_to_side_zero: 0,
      front_to_back_zero: 0,
      invert_side_to_side: false,
      invert_front_to_back: false,
      multiplier: 1,
      decimals: 1,
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.hasRendered = false;
  }

  setConfig(config) {
    const sideToSideEntity = config.entity_side_to_side || config.entity_x;
    const frontToBackEntity = config.entity_front_to_back || config.entity_y;

    if (!sideToSideEntity || !frontToBackEntity) {
      throw new Error('Both side-to-side and front-to-back entities are required');
    }

    this.config = {
      entity_side_to_side: sideToSideEntity,
      entity_front_to_back: frontToBackEntity,
      side_to_side_zero: (config.side_to_side_zero ?? config.side_to_side_offset ?? config.x_offset ?? 0),
      front_to_back_zero: (config.front_to_back_zero ?? config.front_to_back_offset ?? config.y_offset ?? 0),
      multiplier: (config.multiplier ?? 1),
      invert_side_to_side: (config.invert_side_to_side ?? config.invert_x ?? false),
      invert_front_to_back: (config.invert_front_to_back ?? config.invert_y ?? false),
      decimals: 1,
      ...config,
    };
  }

  getCardSize() {
    return 3;
  }

  set hass(hass) {
    if (!this.hasRendered) {
      this.renderCard();
      this.hasRendered = true;
    }

    this.updateCard(hass);
  }

  renderCard() {
    const style = `
      <style>
        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
          justify-content: center;
          margin-top: 20px;
        }
        .preset-button, .positioned-button {
          padding: 6px 12px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          background: none;
          color: white;
        }
        .preset-button.active,
        .positioned-button.active {
          color: #ffc107;
        }
        .positional-buttons {
          position: relative;
          width: 100%;
          height: 0;
          z-index: 1000;
        }
        .positioned-button {
          position: absolute;
          font-size: 30px;
        }
      </style>
    `;

    const card = document.createElement('ha-card');
    card.innerHTML = `
      ${style}
      <div class="preset-buttons"></div>
      <div class="positional-buttons"></div>
      <div style="display: flex;">
        <div style="flex: 60%; text-align: center; position: relative;">
          <img class="van-side" src="/local/van-tilt-card/img/van_side.png" style="max-width: 100%; height: 100px;">
          <p class="front-to-back-angle" style="position: absolute; top: 10%; left: 68%; transform: translate(-50%, -50%); color: black; font-size: 25px">0°</p>
        </div>
        <div style="flex: 40%; text-align: center; position: relative;">
          <img class="van-back" src="/local/van-tilt-card/img/van_back.png" style="max-width: 100%; height: 100px;">
          <p class="side-to-side-angle" style="position: absolute; top: 10%; left: 60%; transform: translate(-50%, -50%); color: black; font-size: 25px">0°</p>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(card);

    this.presetContainer = card.querySelector('.preset-buttons');
    this.positionalContainer = card.querySelector('.positional-buttons');
    this.vanSideImg = card.querySelector('.van-side');
    this.vanBackImg = card.querySelector('.van-back');
    this.frontToBackAngleText = card.querySelector('.front-to-back-angle');
    this.sideToSideAngleText = card.querySelector('.side-to-side-angle');

    this.presetButtons = {};
    this.positionedButtons = {};
  }

  updateCard(hass) {
    const sideToSideEntity = this.config.entity_side_to_side || this.config.entity_x;
    const frontToBackEntity = this.config.entity_front_to_back || this.config.entity_y;
    const rawSideToSide = parseFloat(hass.states[sideToSideEntity]?.state || '0');
    const rawFrontToBack = parseFloat(hass.states[frontToBackEntity]?.state || '0');

    const sideToSideSign = this.config.invert_side_to_side ? -1 : 1;
    const frontToBackSign = this.config.invert_front_to_back ? -1 : 1;
    const multiplier = Number(this.config.multiplier) || 1;
    const sideToSideZero = Number(this.config.side_to_side_zero) || 0;
    const frontToBackZero = Number(this.config.front_to_back_zero) || 0;
    const rotationScale = 2;
    const decimals = Math.max(0, Number(this.config.decimals) || 0);

    const sideToSideAngle = ((Number.isFinite(rawSideToSide) ? rawSideToSide : 0) * sideToSideSign) + sideToSideZero;
    const frontToBackAngle = ((Number.isFinite(rawFrontToBack) ? rawFrontToBack : 0) * frontToBackSign) + frontToBackZero;

    this.sideToSideAngleText.textContent = `${sideToSideAngle.toFixed(decimals)}°`;
    this.frontToBackAngleText.textContent = `${frontToBackAngle.toFixed(decimals)}°`;
    this.vanSideImg.style.transform = `rotate(${frontToBackAngle * rotationScale * multiplier}deg)`;
    this.vanBackImg.style.transform = `rotate(${sideToSideAngle * rotationScale * multiplier}deg)`;

    const buttonConfigs = this.config.buttons || [];
    const overrideMap = {
      0: { top: '0px', left: '62%', label: '⬆' },
      1: { top: '60px', left: '62%', label: '⬇' },
      2: { top: '0px', left: '90%', label: '⬆' },
      3: { top: '60px', left: '90%', label: '⬇' },
    };

    const presetNames = ['Driving Preset', 'Auto Level'];

    if (Object.keys(this.presetButtons).length === 0) {
      this.presetContainer.innerHTML = '';
      buttonConfigs.filter((btn) => presetNames.includes(btn.name)).forEach((btn) => {
        const button = document.createElement('button');
        button.classList.add('preset-button');
        button.textContent = btn.name;
        button.dataset.entity = btn.entity;

        button.addEventListener('click', () => {
          const target = btn.entity;
          const other = target === 'input_boolean.level_preset'
            ? 'input_boolean.drive_preset'
            : 'input_boolean.level_preset';

          hass.callService('input_boolean', 'turn_off', { entity_id: other });
          hass.callService('input_boolean', 'toggle', { entity_id: target });
        });

        this.presetButtons[btn.entity] = button;
        this.presetContainer.appendChild(button);
      });
    }

    for (const [entityId, button] of Object.entries(this.presetButtons)) {
      const isOn = hass.states[entityId]?.state === 'on';
      button.classList.toggle('active', isOn);
    }

    if (Object.keys(this.positionedButtons).length === 0) {
      this.positionalContainer.innerHTML = '';
      buttonConfigs.forEach((btn, i) => {
        if (presetNames.includes(btn.name)) return;

        const button = document.createElement('button');
        button.classList.add('positioned-button');
        const override = overrideMap[i] || {};
        button.textContent = override.label || btn.name;
        button.style.top = override.top || '0';
        button.style.left = override.left || '0';
        button.dataset.entity = btn.entity;

        button.addEventListener('click', () => {
          const domain = btn.entity.split('.')[0];
          hass.callService(domain, 'toggle', { entity_id: btn.entity });

          const pairMap = { 0: 1, 1: 0, 2: 3, 3: 2 };
          if (pairMap[i] !== undefined) {
            const otherBtn = buttonConfigs[pairMap[i]];
            if (otherBtn) {
              const otherDomain = otherBtn.entity.split('.')[0];
              hass.callService(otherDomain, 'turn_off', { entity_id: otherBtn.entity });
            }
          }
        });

        this.positionedButtons[btn.entity] = button;
        this.positionalContainer.appendChild(button);
      });
    }

    for (const [entityId, button] of Object.entries(this.positionedButtons)) {
      const isOn = hass.states[entityId]?.state === 'on';
      button.classList.toggle('active', isOn);
    }
  }
}

customElements.define('van-tilt-card', VanTiltCard);

class VanTiltCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = {
      type: 'custom:van-tilt-card',
      entity_side_to_side: '',
      entity_front_to_back: '',
      side_to_side_zero: 0,
      front_to_back_zero: 0,
      invert_side_to_side: false,
      invert_front_to_back: false,
      multiplier: 1,
      decimals: 1,
      ...config,
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  get sensorEntities() {
    if (!this._hass) {
      return [];
    }

    return Object.keys(this._hass.states)
      .filter((entityId) => entityId.startsWith('sensor.'))
      .sort((left, right) => left.localeCompare(right));
  }

  updateConfig(key, value) {
    const newConfig = {
      ...this._config,
      [key]: value,
    };

    this._config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }

  renderEntityOptions(selectedValue) {
    const options = ['<option value="">Select sensor</option>'];
    this.sensorEntities.forEach((entityId) => {
      const selected = entityId === selectedValue ? ' selected' : '';
      options.push(`<option value="${entityId}"${selected}>${entityId}</option>`);
    });
    return options.join('');
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }

    const config = this._config || {};
    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          display: grid;
          gap: 12px;
          padding: 16px 0;
        }
        .field {
          display: grid;
          gap: 6px;
        }
        label {
          font-size: 14px;
          font-weight: 600;
        }
        select,
        input[type="number"] {
          padding: 8px;
          font: inherit;
        }
        .toggle {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      </style>
      <div class="editor">
        <div class="field">
          <label for="entity-side-to-side">Side to Side Sensor</label>
          <select id="entity-side-to-side">${this.renderEntityOptions(config.entity_side_to_side || '')}</select>
        </div>
        <div class="field">
          <label for="entity-front-to-back">Front to Back Sensor</label>
          <select id="entity-front-to-back">${this.renderEntityOptions(config.entity_front_to_back || '')}</select>
        </div>
        <div class="field">
          <label for="side-to-side-zero">Side to Side Zero</label>
          <input id="side-to-side-zero" type="number" step="0.1" value="${Number(config.side_to_side_zero ?? 0)}">
        </div>
        <div class="field">
          <label for="front-to-back-zero">Front to Back Zero</label>
          <input id="front-to-back-zero" type="number" step="0.1" value="${Number(config.front_to_back_zero ?? 0)}">
        </div>
        <div class="field">
          <label for="multiplier">Visual Multiplier</label>
          <input id="multiplier" type="number" step="0.1" value="${Number(config.multiplier ?? 1)}">
        </div>
        <label class="toggle">
          <input id="invert-side-to-side" type="checkbox"${config.invert_side_to_side ? ' checked' : ''}>
          <span>Invert Side to Side</span>
        </label>
        <label class="toggle">
          <input id="invert-front-to-back" type="checkbox"${config.invert_front_to_back ? ' checked' : ''}>
          <span>Invert Front to Back</span>
        </label>
      </div>
    `;

    this.shadowRoot.getElementById('entity-side-to-side')?.addEventListener('change', (event) => {
      this.updateConfig('entity_side_to_side', event.target.value);
    });
    this.shadowRoot.getElementById('entity-front-to-back')?.addEventListener('change', (event) => {
      this.updateConfig('entity_front_to_back', event.target.value);
    });
    this.shadowRoot.getElementById('side-to-side-zero')?.addEventListener('change', (event) => {
      this.updateConfig('side_to_side_zero', Number(event.target.value) || 0);
    });
    this.shadowRoot.getElementById('front-to-back-zero')?.addEventListener('change', (event) => {
      this.updateConfig('front_to_back_zero', Number(event.target.value) || 0);
    });
    this.shadowRoot.getElementById('multiplier')?.addEventListener('change', (event) => {
      this.updateConfig('multiplier', Number(event.target.value) || 1);
    });
    this.shadowRoot.getElementById('invert-side-to-side')?.addEventListener('change', (event) => {
      this.updateConfig('invert_side_to_side', event.target.checked);
    });
    this.shadowRoot.getElementById('invert-front-to-back')?.addEventListener('change', (event) => {
      this.updateConfig('invert_front_to_back', event.target.checked);
    });
  }
}

customElements.define('van-tilt-card-editor', VanTiltCardEditor);
