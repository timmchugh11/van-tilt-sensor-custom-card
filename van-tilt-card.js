class VanTiltCard extends HTMLElement {
  // Whenever the state changes, a new `hass` object is set. Use this to
  // update your content.
  set hass(hass) {
    // Initialize the content if it's not there yet.
    if (!this.content) {
      this.innerHTML = `
       <ha-card>
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector('div');
    }

    const entityX = this.config.entity_x;
    const xAngle = hass.states[entityX];
    const xAngleStr = xAngle ? xAngle.state : 'unavailable';

    const entityY = this.config.entity_y;
    const yAngle = hass.states[entityY];
    const yAngleStr = yAngle ? yAngle.state : 'unavailable';

    const xRotate = (parseFloat(xAngleStr) * 2).toString();
    const yRotate = (parseFloat(yAngleStr) * 2).toString();

    this.content.innerHTML = `
    <row style="display: flex;">
    <div style="flex: 60%;text-align: center;position: relative;">
      <img src="/local/van-tilt-card/img/van_side.png" style="max-width: 100%;height: 100px;transform:rotate(${yRotate}deg);">
      <h1 style="position: absolute;top: 20%;left: 65%;transform: translate(-50%, -50%); color:black">${yAngleStr}°</h1>
    </div>
    <div style="flex: 40%;text-align: center;position: relative;">
      <img src="/local/van-tilt-card/img/van_back.png" style="max-width: 100%;height: 100px;transform:rotate(${xRotate}deg);">
      <h1 style="position: absolute;top: 20%;left: 60%;transform: translate(-50%, -50%); color:black">${xAngleStr}°</h1>
    </div>
  </row>  
    `;
  }

  // The user supplied configuration. Throw an exception and Lovelace will
  // render an error card.
  setConfig(config) {
    if (!config.entity_x) {
      throw new Error('You need to define an entity_x');
    }
    if (!config.entity_y) {
      throw new Error('You need to define an entity_y');
    }
    this.config = config;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 3;
  }
}

customElements.define('van-tilt-card', VanTiltCard);

