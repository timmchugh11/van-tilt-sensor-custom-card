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
    const roundedXAngle = parseInt(xAngleStr);

    const entityY = this.config.entity_y;
    const yAngle = hass.states[entityY];
    const yAngleStr = yAngle ? yAngle.state : 'unavailable';
    const roundedYAngle = parseInt(yAngleStr);

    const xRotate = (roundedXAngle * 2).toString();
    const yRotate = (roundedYAngle * 2).toString();

    this.content.innerHTML = `
    <row style="display: flex;">
    <div style="flex: 60%;text-align: center;position: relative;">
      <img src="/local/van-tilt-card/img/van_side.png" style="max-width: 100%;height: 100px;transform:rotate(${yRotate}deg);">
      <p style="position: absolute;top: 10%;left: 75%;transform: translate(-50%, -50%); color:rgb(147 149 159); font-size:25px">${roundedYAngle}°</p>
    </div>
    <div style="flex: 40%;text-align: center;position: relative;">
      <img src="/local/van-tilt-card/img/van_back.png" style="max-width: 100%;height: 100px;transform:rotate(${xRotate}deg);">
      <p style="position: absolute;top: 10%;left: 60%;transform: translate(-50%, -50%); color:rgb(147 149 159); font-size:25px">${roundedXAngle}°</p>
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

