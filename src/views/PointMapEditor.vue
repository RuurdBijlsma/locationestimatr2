<template>
    <div class="point-map-editor">
        <h2>Create Point Map</h2>
        <p class="caption">Click exactly on a road below to preview the StreetView in that location, if you are happy with the location, create a point there with the "Create Point" button. The point of view will also be stored (camera pitch/heading and zoom).</p>
        <p class="caption">When you have multiple points, you can click a point to select it, you can then update it with the "Update Selected Point" button, and you can delete it with the delete key.</p>
        <p class="error--text caption">{{error}}</p>
        <div class="controls">
            <v-file-input small-chips v-model="jsonFile" label="Import Map" outlined dense accept=".json"
                          title="Import .json file into editor" class="json-input"></v-file-input>
            <v-btn @click="exportJson()" outlined
                   title="Export your map as a json file, which can be imported later.">
                Export Map
            </v-btn>
        </div>
        <div class="controls">
            <v-switch class="coverage-switch" v-model="showCoverage" label="Show StreetView Coverage"></v-switch>
        </div>
        <div class="controls">
            <v-btn @click="confirmPoint()" outlined v-if="svPoint.position!==null">
                Create Point
            </v-btn>
            <v-btn @click="updatePoint()" outlined v-if="svPoint.position!==null && activePoint !== null">
                Update Selected Point
            </v-btn>
        </div>
        <div class="google-elements" ref="googleElements">
            <div class="map-element" ref="map" @keyup="mapUp" @keydown="mapDown"
                 :style="`pointer-events: ${uploading?'none':'all'}`"></div>
            <div class="street-view-element" ref="streetView">
                <h1>StreetView Preview</h1>
            </div>
        </div>
        <!--        <v-file-input v-model="mapImage" class="image-input" prepend-icon="insert_photo" outlined dense small-chips-->
        <!--                      accept="image/*" label="Map Image (optional)"></v-file-input>-->
        <v-form class="name-field" @submit="createMap">
            <v-text-field required :rules="nameRules" v-model="mapName" class="name-input" outlined label="Map Name"
                          dense></v-text-field>
            <v-dialog v-model="dialog" width="500">
                <template v-slot:activator="{ on }">
                    <v-btn text color='primary' type="submit" :loading="uploading">
                        Upload Map
                    </v-btn>
                </template>
                <v-card>
                    <v-card-title v-if="invalid" primary-title>Invalid map!</v-card-title>
                    <v-card-title v-else primary-title>Are you sure</v-card-title>
                    <v-card-text v-if="!invalid">
                        Once you upload your map, you can't edit it anymore, if you want to work on this
                        later, click "Export JSON". The current StreetView preview will be used as thumbnail image for this map.
                    </v-card-text>
                    <v-divider></v-divider>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="error" text @click="dialog = false">
                            Cancel
                        </v-btn>
                        <v-btn v-if="!invalid" color="primary" text @click="uploadMap">
                            Upload
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-form>
    </div>
</template>

<script>
    import Google from '../js/Google';
    import StreetViewElement from "../js/StreetViewElement";
    import {streetViewKey} from '../assets/credentials.json';

    export default {
        name: 'PointMapEditor',
        components: {},
        data() {
            return {
                nameRules: [
                    v => !!v || 'Name is required',
                    v => v.length <= 80 || 'Name must be less than 80 characters',
                    v => v.length > 2 || 'Name must be more than 2 characters',
                ],
                googleMap: null,
                activePoint: null,
                jsonFile: null,
                mapImage: null,
                mapName: '',
                uploading: false,
                dialog: false,
                svCoverageLayer: null,
                invalid: false,
                showCoverage: false,
                error: '',
                points: [],
                svPoint: {position: null, pov: null}
            }
        },
        async mounted() {
            console.log(this.svElement);
            Google.wait().then(() => {
                this.svElement = new StreetViewElement(this.$refs.streetView, null);
                this.svCoverageLayer = new Google.maps.StreetViewCoverageLayer();
                this.googleMap = new Google.maps.Map(this.$refs.map, {
                    zoom: 1,
                    center: {lat: 0, lng: 0},
                    disableDefaultUI: true,
                    clickableIcons: false,
                    backgroundColor: "#aadaff",
                    fullscreenControl: false,
                    gestureHandling: 'greedy'
                });

                console.log("map", this.googleMap);
                Google.maps.event.addListener(this.googleMap, "click", e => {
                    this.preview(e.latLng);
                });

                this.showCoverage = true;

            })
        },
        methods: {
            async preview(location) {
                let loc = [location.lat(), location.lng()];
                console.log("SV set location", loc);
                this.svElement.setLocation(...loc);
                Google.maps.event.clearListeners(this.svElement.panorama, 'position_changed');
                Google.maps.event.clearListeners(this.svElement.panorama, 'pov_changed');
                this.svElement.panorama.addListener('position_changed', () => {
                    this.svPoint.position = this.svElement.getLocation();
                });
                this.svElement.panorama.addListener('pov_changed', () => {
                    this.svPoint.pov = this.svElement.panorama.getPov();
                });
            },
            async confirmPoint() {
                console.log("Placing point at", this.svPoint.position)
                let point = {
                    ...this.svPoint
                };
                if (point.pov === null)
                    point.pov = this.svElement.panorama.getPov();
                this.placeMarker(new Google.maps.LatLng(...this.svPoint.position), point);
                console.log("Confirmed point: ", point);
                this.points.push(point);
                this.activePoint = point;
            },
            async updatePoint() {
                if (this.activePoint === null)
                    return this.confirmPoint();
                let point = this.activePoint;
                if (this.svPoint.pov === null)
                    point.pov = this.svElement.panorama.getPov();
                else
                    point.pov = this.svPoint.pov;
                point.position = this.svPoint.position;
                point.marker.setPosition(new Google.maps.LatLng(...point.position));
            },
            mapDown(e) {
                switch (e.key) {
                    case "Delete":
                        this.removeActiveMarker();
                        break;
                    case "f":
                        this.fitToMarkers();
                        break;
                }
            },
            mapUp(e) {
                switch (e.key) {

                }
            },
            importJson(file) {
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const text = reader.result;
                    let points = JSON.parse(text);
                    console.log({points});
                    points.forEach(p => this.placeMarker(new Google.maps.LatLng(...p.position), p));
                    this.points = this.points.concat(points);
                    if (this.activePoint === null)
                        this.activePoint = this.points[this.points.length - 1];
                };

                reader.readAsText(file);
            },
            removeActiveMarker() {
                this.activePoint.marker.setMap(null);
                this.points.splice(this.points.indexOf(this.activePoint), 1);
                if (this.points.length === 0)
                    this.activePoint = null;
                else
                    this.activePoint = this.points[this.points.length - 1];
            },
            fitToMarkers() {
                let nBounds = 0;
                const bounds = new Google.maps.LatLngBounds();
                this.points.forEach(marker => {
                    bounds.extend(marker.getPosition());
                    nBounds++;
                });
                if (nBounds !== 0)
                    this.googleMap.fitBounds(bounds);
            },
            placeMarker(location, point, scale = 6) {
                point.marker = new Google.maps.Marker({
                    position: location,
                    icon: {
                        path: Google.maps.SymbolPath.CIRCLE,
                        fillColor: '#02c780',
                        fillOpacity: 1,
                        strokeColor: 'black',
                        strokeWeight: 3,
                        scale,
                    },
                    map: this.googleMap,
                });

                Google.maps.event.addListener(point.marker, 'click', e => {
                    this.activePoint = point;
                });
                Google.maps.event.addListener(point.marker, 'dragstart', e => {

                });
                Google.maps.event.addListener(point.marker, 'drag', e => {

                });
                Google.maps.event.addListener(point.marker, 'dragend', e => {

                });

                return point.marker;
            },
            highlightActiveMarker() {
                for (let point of this.points)
                    if (point !== this.activePoint)
                        point.marker.setIcon({
                            path: Google.maps.SymbolPath.CIRCLE,
                            fillColor: 'grey',
                            strokeColor: 'black',
                            fillOpacity: 1,
                            strokeWeight: 2,
                            scale: 4,
                        });
                if (this.activePoint !== null)
                    this.activePoint.marker.setIcon({
                        path: Google.maps.SymbolPath.CIRCLE,
                        fillColor: '#02c780',
                        strokeColor: 'black',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        scale: 6,
                    });
            },
            download(filename, text) {
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                element.setAttribute('download', filename);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            },
            exportJson() {
                let json = JSON.stringify(this.exportPoints);
                this.download((this.mapName || 'mapName') + '.json', json);
            },
            createMap(e) {
                e.preventDefault();
                this.dialog = true;
                let pointsExist = this.points.length;
                this.invalid = pointsExist < 1;
            },
            getSvUrl(location, heading, pitch, zoom) {
                let ratio = 3 / 5;
                let width = 750;
                let height = width * ratio;
                let fov = 180 / Math.pow(2, zoom);

                return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${location.join(',')}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${streetViewKey}`;
            },
            async getImage() {
                return new Promise(async resolve => {
                    if (this.svPoint.pov === null)
                        this.svPoint.pov = this.svElement.panorama.getPov();
                    let url = this.getSvUrl(this.svPoint.position, this.svPoint.pov.heading, this.svPoint.pov.pitch, this.svPoint.pov.zoom);
                    let response = await fetch(url);
                    resolve(await response.blob());
                });
            },
            async uploadMap() {
                this.dialog = false;
                this.uploading = true;
                let mapId = await this.$store.dispatch('uploadUserMap', {
                    type: 'points',
                    name: this.mapName,
                    points: this.exportPoints,
                    image: await this.getImage(),
                    date: new Date(),
                });
                this.uploading = false;
                // console.warn("EMIT HERE");
                this.$emit('uploaded', mapId);
            },
        },
        watch: {
            'svPoint.position'() {

            },
            activePoint() {
                this.highlightActiveMarker();
                if (this.activePoint === null)
                    return;

                let svLoc = this.svElement.getLocation();
                if (!(svLoc[0] === this.activePoint.position[0] && svLoc[1] === this.activePoint.position[1]))
                    this.svElement.setLocation(...this.activePoint.position);

                this.svElement.panorama.setPov(this.activePoint.pov);
            },
            jsonFile() {
                this.importJson(this.jsonFile);
                this.jsonFile = null;
            },
            showCoverage() {
                if (this.showCoverage) {
                    this.svCoverageLayer.setMap(this.googleMap);
                } else {
                    this.svCoverageLayer.setMap(null);
                }
            },
        },
        computed: {
            exportPoints() {
                return this.points.map(point => {
                    return {
                        position: point.position,
                        pov: point.pov,
                    }
                })
            }
        }
    }
</script>

<style scoped>
    .google-elements {
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        overflow: hidden;
        background-color: white;
        width: calc(100% - 50px);
        max-width: 1000px;
        height: calc(100% - 300px);
        margin-top: 20px;
    }

    .map-element {
        height: 50%;
        min-height: 400px;
    }

    .street-view-element {
        min-height: 400px;
        height: 50%;
        background-image: linear-gradient(to top, #39b984, #6916ee);
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .street-view-element h1 {
        text-align: center;
        opacity: 0.5;
        font-size: 40px;
        font-weight: 900;
    }

    .controls {
        display: flex;
        justify-content: left;
        min-height: 36px;
    }

    .controls > * {
        margin-right: 20px;
    }

    .json-input {
        max-width: 220px;
        margin: -1px 20px -7px -5px;
    }

    .json-input >>> * {
        cursor: pointer;
    }

    .name-field {
        max-width: 1000px;
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
    }

    .name-input {
        margin-right: 20px;
    }

    .image-input {
        margin-top: 20px;
        margin-bottom: -30px;
    }

    .coverage-switch {
        margin-top: 0px;
    }
</style>
