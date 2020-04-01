export default class StreetViewElement {
    constructor(element, flagElement) {
        this.flagElement = flagElement;
        this.element = element;
    }

    resetRestrictions() {
        this.allowMove();
        this.allowPan();
        this.allowZoom();
        this.removeMoveListener();
    }

    removeMoveListener() {
        google.maps.event.clearListeners(this.panorama, "position_changed");
    }

    restrictPan() {
        this.element.querySelector(".gm-compass").style.display = "none";
        this.element.querySelector(".widget-scene").style.pointerEvents = "none";
    }

    allowPan() {
        this.element.querySelector(".gm-compass").style.display = "block";
        this.element.querySelector(".widget-scene").style.pointerEvents = "all";
    }

    restrictZoom() {
        this.element.querySelector("div.gmnoprint.gm-bundled-control.gm-bundled-control-on-bottom > div.gmnoprint > div").style.display = "none";
        this.panorama.setOptions({scrollwheel: false});
    }

    allowZoom() {
        this.element.querySelector("div.gmnoprint.gm-bundled-control.gm-bundled-control-on-bottom > div.gmnoprint > div").style.display = "block";
        this.panorama.setOptions({scrollwheel: true});
    }

    restrictMove() {
        this.panorama.setOptions({linksControl: false});
        this.panorama.setOptions({clickToGo: false});
        this.flagElement.style.display = "none";
    }

    allowMove() {
        this.panorama.setOptions({linksControl: true});
        this.panorama.setOptions({clickToGo: true});
        this.flagElement.style.display = "block";
    }

    getLocation() {
        let position = this.panorama.getPosition();
        let lat = position.lat();
        let lon = position.lng();
        return [lat, lon];
    }

    async setLocation(lat, lon) {
        return new Promise(resolve => {
            if (this.panorama !== undefined) {
                this.panorama.setPosition({lat: lat, lng: lon});
            } else {
                this.panorama = new google.maps.StreetViewPanorama(
                    this.element, {
                        position: {lat: lat, lng: lon},
                        addressControl: false,
                        linksControl: true,
                        panControl: true,
                        enableCloseButton: false,
                        showRoadLabels: false,
                        motionTracking: false,
                        fullscreenControl: false,
                        motionTrackingControl: false
                    });
            }
            //TODO IS THIS NECESSARY??
            setTimeout(() => resolve(), 1000);
        });
    }
}