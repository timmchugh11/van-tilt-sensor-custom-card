class VanTiltCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.hasRendered = false;
  }

  setConfig(config) {
    if (!config.entity_x || !config.entity_y) {
      throw new Error('You need to define entity_x and entity_y');
    }
    this.config = config;
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
          <p class="y-angle" style="position: absolute; top: 10%; left: 68%; transform: translate(-50%, -50%); color: black; font-size: 25px">0°</p>
        </div>
        <div style="flex: 40%; text-align: center; position: relative;">
          <img class="van-back" src="/local/van-tilt-card/img/van_back.png" style="max-width: 100%; height: 100px;">
          <p class="x-angle" style="position: absolute; top: 10%; left: 60%; transform: translate(-50%, -50%); color: black; font-size: 25px">0°</p>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(card);

    // Cache references
    this.presetContainer = card.querySelector('.preset-buttons');
    this.positionalContainer = card.querySelector('.positional-buttons');
    this.vanSideImg = card.querySelector('.van-side');
    this.vanBackImg = card.querySelector('.van-back');
    this.angleXText = card.querySelector('.x-angle');
    this.angleYText = card.querySelector('.y-angle');

    this.presetButtons = {};
    this.positionedButtons = {};
  }

  updateCard(hass) {
    const entityX = this.config.entity_x;
    const entityY = this.config.entity_y;
    const xAngle = parseInt(hass.states[entityX]?.state || '0');
    const yAngle = parseInt(hass.states[entityY]?.state || '0');

    this.angleXText.textContent = `${xAngle}°`;
    this.angleYText.textContent = `${yAngle}°`;
    this.vanSideImg.style.transform = `rotate(${yAngle * 2}deg)`;
    this.vanBackImg.style.transform = `rotate(${xAngle * 2}deg)`;

    const buttonConfigs = this.config.buttons || [];
    const overrideMap = {
      0: { top: '0px', left: '62%', label: '⬆' },
      1: { top: '60px', left: '62%', label: '⬇' },
      2: { top: '0px', left: '90%', label: '⬆' },
      3: { top: '60px', left: '90%', label: '⬇' },
    };

    const presetNames = ['Driving Preset', 'Auto Level'];

    // Preset buttons
    if (Object.keys(this.presetButtons).length === 0) {
      this.presetContainer.innerHTML = '';
      buttonConfigs.filter(btn => presetNames.includes(btn.name)).forEach(btn => {
        const button = document.createElement('button');
        button.classList.add('preset-button');
        button.textContent = btn.name;
        button.dataset.entity = btn.entity;

        button.addEventListener('click', () => {
          const target = btn.entity;
          const other = target === 'input_boolean.level_preset'
            ? 'input_boolean.drive_preset'
            : 'input_boolean.level_preset';
        
          // Turn off the other one
          hass.callService('input_boolean', 'turn_off', { entity_id: other });
        
          // Toggle the clicked one
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

    // Positional buttons
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

          // Exclusive toggle
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
