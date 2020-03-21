import loadGoogleMapsApi from 'load-google-maps-api'
import EventEmitter from "events";
import {googleMapsKey} from '../assets/credentials.json';

class Google extends EventEmitter {
    constructor() {
        super();
        this.maps = false;
        loadGoogleMapsApi({
            key: googleMapsKey,
            libraries: ['geometry', 'drawing', 'visualization']
        }).then(googleMaps => {
            this.maps = googleMaps;
            this.emit('maps');
            console.log(this.maps);
        });
    }

    async wait() {
        if (this.maps)
            return this.maps;
        return new Promise(resolve => {
            this.once('maps', () => resolve());
        });
    }
}

export default new Google()