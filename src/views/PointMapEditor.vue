<template>
    <div class="point-map-editor">
        <h2>Create Point Map</h2>
        <p class="caption">Click in the map below to start creating a polygon.</p>
        <p class="caption">Drag polygon points to move them</p>
        <p class="caption">Click on a polygon point to select it, then click somewhere in the map to place a polygon
            point after the selected point.</p>
        <div class="controls">

        </div>
        <div class="map-element" ref="map"></div>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";
    import Google from '../js/Google';

    export default {
        name: 'PointMapEditor',
        components: {},
        data() {
            return {
                googleMap: null,

            }
        },
        async mounted() {
            Google.wait().then(() => {
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
                    this.placeMarker(e.latLng);
                });

                document.onkeydown = e => {
                    switch (e.key) {
                        case "Control":

                            break;
                    }
                };
                document.onkeyup = e => {
                    switch (e.key) {
                        case "Control":

                            break;
                    }
                }
            })
        },
        methods: {
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

                });
                Google.maps.event.addListener(marker, 'dragend', e => {

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
            exportPoints() {
                this.$emit('export', {type: "points", points: [1,2,3]});
            },
        },
        watch: {

        },
    }
</script>

<style scoped>
    .map-element {
        border-radius: 10px;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
        overflow: hidden;
        height: 100%;
        width: 100%;
        max-width: 1000px;
    }

    .controls {
        display: flex;
        justify-content: space-around;
    }
</style>
