<template>
    <div class="poly-map-editor">
        <h2>Create Polygon Map</h2>
        <p class="caption">Click in the map below to start creating a polygon. Hold ctrl & left mouse button to draw a
            polygon.</p>
        <p class="caption">Drag polygon points to move them</p>
        <p class="caption">Click on a polygon point to select it, then click somewhere in the map to place a polygon
            point after the selected point. Press delete to remove a selected point.</p>
        <p class="error--text caption">{{error}}</p>
        <div class="controls">
            <v-file-input small-chips v-model="kmlFile" label="Import KML" outlined dense accept=".kml"
                          title="Import .kml file into editor" class="kml-input"/>
            <v-btn @click="exportKml()" outlined
                   title="Export your map as a kml file, which can be imported later.">
                Export KML
            </v-btn>
        </div>
        <div class="controls">
            <v-btn @click="makeNewGroup()" outlined
                   title="Add new polygon, detached from current polygon, click map to create the new polygon">
                Add area
            </v-btn>
            <v-switch class="coverage-switch" v-model="showCoverage" label="Show StreetView Coverage"/>
            <!--            <v-btn @click="getImage()" outlined-->
            <!--                   title="Export your map as a kml file, which can be imported later.">-->
            <!--                Get Image-->
            <!--            </v-btn>-->
        </div>
        <div class="map-element" ref="map" @keyup="mapUp" @keydown="mapDown"
             :style="`pointer-events: ${uploading?'none':'all'}`"></div>
        <!--        <v-file-input v-model="mapImage" class="image-input" prepend-icon="insert_photo" outlined dense small-chips-->
        <!--                      accept="image/*" label="Map Image (optional)"></v-file-input>-->
        <v-form class="name-field" @submit="createMap">
<!--            <div class="map-settings">-->
<!--                <v-switch label="Zoom in on points on minimap" v-model="settings.zoom"/>-->
<!--            </div>-->
            <div class="map-settings">
                <v-text-field class="difficulty-multiplier" type="number"
                              label="Points difficulty multiplier (higher value gives lower score for same distance)"
                              v-model="settings.difficultyMultiplier"/>
            </div>
            <div class="map-settings">
                <v-text-field required :rules="nameRules" v-model="mapName" class="name-input" outlined label="Map Name"
                              dense/>
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
                            later, click "Export KML".
                        </v-card-text>
                        <v-divider/>
                        <v-card-actions>
                            <v-spacer/>
                            <v-btn color="error" text @click="dialog = false">
                                Cancel
                            </v-btn>
                            <v-btn v-if="!invalid" color="primary" text @click="uploadMap">
                                Upload
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </div>
        </v-form>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";
    import Google from '../js/Google';
    import html2canvas from 'html2canvas';

    export default {
        name: 'PolyMapEditor',
        components: {},
        data() {
            return {
                nameRules: [
                    v => !!v || 'Name is required',
                    v => v.length <= 80 || 'Name must be less than 80 characters',
                    v => v.length > 2 || 'Name must be more than 2 characters',
                ],
                googleMap: null,
                markerGroups: [],
                polygon: null,
                activeMarker: null,
                newGroup: true,
                kmlFile: null,
                mapImage: null,
                ctrlDown: false,
                mapName: '',
                uploading: false,
                dialog: false,
                svCoverage: null,
                invalid: false,
                showCoverage: false,
                error: '',
                settings: {
                    difficultyMultiplier: 1,
                    zoom: true,
                },
            }
        },
        async mounted() {
            Google.wait().then(() => {
                this.svCoverage = new Google.maps.StreetViewCoverageLayer();
                this.googleMap = new Google.maps.Map(this.$refs.map, {
                    zoom: 1,
                    center: {lat: 0, lng: 0},
                    disableDefaultUI: true,
                    clickableIcons: false,
                    backgroundColor: "#aadaff",
                    fullscreenControl: false,
                    gestureHandling: 'greedy'
                });
                this.polygon = new Google.maps.Polygon({
                    strokeColor: '#FF0000',
                    clickable: false,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    map: this.googleMap,
                });
                let lastPlaceTime = performance.now();
                let placeEveryMs = 100;
                Google.maps.event.addListener(this.googleMap, "mousemove", e => {
                    if (this.ctrlDown) {
                        if (e.tb === undefined) {
                            let now = performance.now();
                            if (now - lastPlaceTime > placeEveryMs) {
                                this.placePolygonPiece(e.latLng);
                                lastPlaceTime = now;
                            }
                        }
                    }
                });

                console.log("map", this.googleMap);
                Google.maps.event.addListener(this.googleMap, "click", e => {
                    this.placePolygonPiece(e.latLng);
                });

            })
        },
        methods: {
            mapDown(e) {
                switch (e.key) {
                    case "Delete":
                        this.removeActiveMarker();
                        break;
                    case "f":
                        this.fitToMarkers();
                        break;
                    case "Control":
                        this.ctrlDown = true;
                        this.googleMap.setOptions({draggable: false});
                        break;
                }
            },
            mapUp(e) {
                switch (e.key) {
                    case "Control":
                        this.ctrlDown = false;
                        this.googleMap.setOptions({draggable: true});
                        break;
                }
            },
            importKml(file) {
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const text = reader.result;
                    let paths = MapManager.kmlToPaths(text);
                    if (paths.length === 0) {
                        alert("Only kmls with 1 or more <Polygon> in a <MultiGeometry> as the root element are supported");
                        return;
                    }
                    for (let i = 0; i < paths.length; i++) {
                        let path = paths[i];
                        let group = [];
                        for (let point of path) {
                            const marker = this.placeMarker(point, 3);
                            group.push(marker);
                        }
                        this.markerGroups.push(group);
                    }
                    this.updatePolygon();
                };

                reader.readAsText(file);
            },
            makeNewGroup() {
                this.newGroup = true;
                this.activeMarker = null;
            },
            removeActiveMarker() {
                let {index, groupIndex} = this.getMarkerIndices(this.activeMarker);
                if (index === -1)
                    return;
                let removedMarker = this.markerGroups[groupIndex].splice(index, 1)[0];
                removedMarker.setMap(null);
                this.updatePolygon();
                if (this.markerGroups[groupIndex].length === 0) {
                    this.activeMarker = null;
                } else {
                    let newActiveMarker = this.markerGroups[groupIndex][index - 1];
                    if (!newActiveMarker)
                        newActiveMarker = this.markerGroups[groupIndex][0];
                    this.activeMarker = newActiveMarker;
                }
            },
            fitToMarkers() {
                let nBounds = 0;
                const bounds = new Google.maps.LatLngBounds();
                this.polygon.getPaths().forEach(path => {
                    path.forEach(pos => {
                        bounds.extend(pos);
                        nBounds++;
                    });
                });
                if (nBounds !== 0)
                    this.googleMap.fitBounds(bounds);
            },
            placePolygonPiece(location) {
                let groupIndex = 0, lastIndex = -1;
                if (this.activeMarker !== null) {
                    let lastInd = this.getMarkerIndices(this.activeMarker);
                    lastIndex = lastInd.index;
                    groupIndex = lastInd.groupIndex;
                }
                if (this.newGroup) {
                    groupIndex = this.markerGroups.length;
                    this.newGroup = false;
                }
                if (this.markerGroups[groupIndex] === undefined)
                    this.markerGroups[groupIndex] = [];

                const marker = this.placeMarker(location);

                this.activeMarker = marker;
                this.markerGroups[groupIndex].splice(lastIndex + 1, 0, marker);
                this.updatePolygon();
            },
            placeMarker(location, scale = 5) {
                const marker = new Google.maps.Marker({
                    position: location,
                    icon: {
                        path: Google.maps.SymbolPath.CIRCLE,
                        scale,
                    },
                    draggable: true,
                    map: this.googleMap,
                });

                Google.maps.event.addListener(marker, 'click', e => {
                    this.activeMarker = marker;
                });
                Google.maps.event.addListener(marker, 'dragstart', e => {

                });
                Google.maps.event.addListener(marker, 'drag', e => {
                    this.updatePolygon();
                });
                Google.maps.event.addListener(marker, 'dragend', e => {
                    this.updatePolygon();
                });

                return marker;
            },
            normalizeMarkerIcons() {
                for (let group of this.markerGroups)
                    for (let marker of group)
                        marker.setIcon({
                            path: Google.maps.SymbolPath.CIRCLE,
                            scale: 3,
                        })
            },
            getMarkerIndices(marker) {
                let index = -1;
                for (let i = 0; i < this.markerGroups.length; i++) {
                    index = this.markerGroups[i].indexOf(marker);
                    if (index !== -1) {
                        return {groupIndex: i, index};
                    }
                }
                return {groupIndex: -1, index: -1};
            },
            highlightMarkerConnection(activeMarker) {
                if (activeMarker !== null) {
                    let {index, groupIndex} = this.getMarkerIndices(activeMarker);
                    let group = this.markerGroups[groupIndex];
                    let active = group[index];
                    let next = group[index + 1];
                    if (index !== 0 && !next)
                        next = group[0];
                    if (next) {
                        next.setIcon({
                            path: Google.maps.SymbolPath.CIRCLE,
                            scale: 3,
                            strokeColor: 'green',
                        });
                    }
                    if (active) {
                        active.setIcon({
                            path: Google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            strokeColor: 'green',
                        })
                    }
                }
            },
            updatePolygon() {
                this.polygon.setPaths(this.markerGroups.map(group => group.map(marker => marker.position)));
            },
            updateMarkers() {
                let paths = this.polygon.getPaths().getArray().map(p => p.getArray());
                this.markerGroups.forEach((group, i) =>
                    group.forEach((marker, j) =>
                        marker.setPosition(paths[i][j])
                    )
                );
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
            exportKml() {
                let kml = this.toKml();
                this.download((this.mapName || 'mapName') + '.kml', kml);
            },
            toKml() {
                let kml = '<MultiGeometry>\n';
                for (let path of this.polygon.getPaths().getArray()) {
                    let points = path.getArray();
                    if (points.length === 0)
                        continue;
                    kml += `<Polygon><outerBoundaryIs><LinearRing><coordinates>\n`;
                    for (let point of points) {
                        kml += `${point.lng()},${point.lat()},0 `;
                    }
                    kml += `\n</coordinates></LinearRing></outerBoundaryIs></Polygon>\n`;
                }
                kml += `</MultiGeometry>\n`;
                return kml;
            },
            createMap(e) {
                e.preventDefault();
                this.dialog = true;
                let pointsExist = Math.max(...this.markerGroups.map(group => group.length));
                this.invalid = pointsExist < 3;
            },
            async getImage() {
                return new Promise(resolve => {
                    this.fitToMarkers();
                    // let fitting = setInterval(() => {
                    //     this.fitToMarkers();
                    // });
                    setTimeout(async () => {
                        console.log("Snapping iamge :)");
                        let canvas = await html2canvas(this.$refs.map, {
                            allowTaint: true,
                            logging: true,
                            useCORS: true,
                        });
                        canvas.toBlob(blob => {
                            resolve(blob);
                        }, 'image/png')
                    }, 1500);
                });
            },
            async uploadMap() {
                this.dialog = false;
                this.uploading = true;
                const kml = this.toKml();
                let mapId = await this.$store.dispatch('uploadUserMap', {
                    type: 'kml',
                    name: this.mapName,
                    kml,
                    image: await this.getImage(),
                    date: new Date(),
                    settings: this.settings,
                });
                this.uploading = false;
                // console.warn("EMIT HERE");
                this.$emit('uploaded', mapId);
            },
        },
        watch: {
            kmlFile() {
                this.importKml(this.kmlFile);
                this.kmlFile = null;
            },
            activeMarker(activeMarker) {
                this.normalizeMarkerIcons();
                this.highlightMarkerConnection(activeMarker);
            },
            showCoverage() {
                if (this.showCoverage) {
                    this.svCoverage.setMap(this.googleMap);
                } else {
                    this.svCoverage.setMap(null);
                }
            },
        },
    }
</script>

<style scoped>
    .map-element {
        border-radius: 10px;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
        overflow: hidden;
        height: 400px;
        width: 100%;
        max-width: 1000px;
    }

    .controls {
        display: flex;
        justify-content: left;
    }

    .controls > * {
        margin-right: 20px;
    }

    .kml-input {
        max-width: 200px;
        margin: -1px 20px -7px -5px;
    }

    .kml-input >>> * {
        cursor: pointer;
    }


    .name-field {
        max-width: 1000px;
        /*display: flex;*/
        /*justify-content: space-around;*/
        margin: 20px 0;
    }

    .map-settings {
        display: flex;
        justify-content: space-around;
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
