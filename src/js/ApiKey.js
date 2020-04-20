import {googleMapsKey} from '../assets/credentials.json';

class ApiKey {
    constructor() {
        this.customKey = false;
        this.key = googleMapsKey;
        if (localStorage.getItem('apiKey') !== null) {
            this.key = localStorage.apiKey;
            this.customKey = true;
        }
    }
}

export default new ApiKey()