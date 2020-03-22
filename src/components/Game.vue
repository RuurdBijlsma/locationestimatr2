<template>
    <div class="game">
        <div class="game-info" v-if="rules !== null">
            <span>Round: <span class="font-weight-bold">{{currentRound}}</span>/<span class="font-weight-bold">{{rules.roundCount}}</span></span>
        </div>
        <div class="street-view" ref="streetView"></div>
        <div class="return-home" ref="returnHome"></div>
        <div ref="map"></div>
        <div class="guess-map">
            <div class="small-map" ref="smallMap"></div>
            <div class="guess-bottom">
                <v-btn @click="makeGuess()" :color="$store.state.color" text large class="guess-button"
                       :disabled="!guessButtonEnabled">
                    Make Guess
                </v-btn>
            </div>
        </div>
        <div class="score-overview">
            <div class="big-map" ref="bigMap"></div>
        </div>
    </div>
</template>

<script>
    import Rules from "../js/Rules";
    import GeoMap from "../js/GeoMap";
    import Google from "../js/Google";
    import StreetView from "../js/StreetView";
    import StreetViewElement from "../js/StreetViewElement";

    export default {
        name: 'Game',
        components: {},
        props: {
            rules: {
                type: Rules,
                default: null,
            },
            map: {
                type: GeoMap,
                default: null,
            }
        },
        data: () => ({
            googleMap: null,
            mapMarker: null,
            guessButtonEnabled: false,
            overviewLines: [],
            streetView: null,
            previousGuesses: [],
            currentRound: 0,
            findingRandomLocation: false,
            currentDestination: null,
            prepared: false,
        }),
        async mounted() {
            console.log("MOUNTED");
            this.svElement = new StreetViewElement(this.$refs.streetView, this.$refs.returnHome);
            Google.wait().then(() => {
                this.googleMap = new Google.maps.Map(this.$refs.map, {
                    zoom: 0,
                    center: {lat: 0, lng: 0},
                    disableDefaultUI: true,
                    clickableIcons: false,
                    backgroundColor: "#aadaff",
                    fullscreenControl: false,
                });
                Google.maps.event.addListener(this.googleMap, "click", e => {
                    if (this.googleMap.getDiv().parentElement.attributes.class.value === "small-map")
                        this.placeGuessMarker(e.latLng);
                });
                this.attachMap(this.$refs.smallMap);
            });
        },
        methods: {
            start() {
                if (this.map === null) {
                    console.log("Map is not set, we wait before starting game");
                    this.$once('map', () => this.start());
                    return;
                }
                if (this.rules === null) {
                    console.log("Rules is not set, we wait before starting game");
                    this.$once('rules', () => this.start());
                    return;
                }
                if (!this.prepared) {
                    console.log("Not prepared yet, we wait before starting game");
                    this.$once('prepared', () => this.start());
                    return;
                }

                console.log("Start game");
            },
            async prepareGame() {
                this.prepared = false;
                console.log("prepareGame");
                this.removeOverviewLines();
                this.streetView = new StreetView(this.map, 'weighted');
                this.zoom = this.map.minimumDistanceForPoints < 3000 ? 18 : 14;
                this.currentRound = 0;
                this.previousGuesses = [];

                let nextLocation = await this.loadNextLocation();
                await this.nextRound(nextLocation);
                this.prepared = true;
                this.$emit('prepared');
            },
            async loadNextLocation() {
                console.log("loadNextLocation");
                this.findingRandomLocation = true;
                this.nextLocation = await this.streetView.randomValidLocation(this.zoom);
                this.findingRandomLocation = false;
                this.$emit('preload');
                return this.nextLocation;
            },
            async nextRound(nextLocation) {
                if (this.mapMarker !== null)
                    this.mapMarker.setMap(null);
                this.mapMarker = null;
                console.log("nextRound");
                //TODO WHY THIS?
                // if (this.svElement.panorama)
                //     this.resetRestrictions();
                this.currentDestination = nextLocation;
                this.guessButtonEnabled = false;

                if (++this.currentRound < this.rules.roundCount)
                    this.loadNextLocation();

                await this.svElement.setLocation(...this.currentDestination);
                //TODO: CHECK TIMEOUT HERE
                // setTimeout(() => {
                //TODO IS THIS LINE NECESSARY
                //     this.currentDestination = this.svElement.getLocation();
                this.$emit("nextRound");
                this.removeOverviewLines();
                this.attachMap(this.$refs.smallMap);
                this.fitMapToGeoMap();
                console.log("Next round load complete");
                // }, 500);
            },
            attachMap(element) {
                let mapElement = this.googleMap.getDiv();
                mapElement.remove();
                console.log('attachmap', mapElement);
                element.appendChild(mapElement);
            },
            fitMapToGeoMap() {
                this.googleMap.fitBounds(this.map.getBounds());
            },
            placeGuessMarker(location) {
                if (this.mapMarker !== null)
                    this.mapMarker.setMap(null);

                this.mapMarker = new google.maps.Marker({
                    position: location,
                    map: this.googleMap
                });
                this.guessButtonEnabled = true;
            },
            removeOverviewLines() {
                for (let lineData of this.overviewLines) {
                    lineData.line.setMap(null);
                    lineData.guess.setMap(null);
                    lineData.actual.setMap(null);
                }
                this.overviewLines = [];
            },
            applyRules() {
                //TODO CHANGE THIS A LOT
                if (!this.rules.panAllowed)
                    this.svElement.restrictPan();

                if (!this.rules.zoomAllowed)
                    this.svElement.restrictZoom();

                if (this.rules.moveLimit !== -1)
                    this.svElement.setMoveLimit(this.rules.moveLimit, this.movesElement);

                if (this.rules.timeLimit !== -1)
                    this.startTimer(+this.rules.timeLimit);
            },
            makeGuess() {
                let guessLocation = [this.mapMarker.position.lat(), this.mapMarker.position.lng()];
                alert(`YOU GUESSED ${guessLocation} CORRECT COORDINATE WAS ${this.currentDestination}`);
            //    TODO: Show guess overview
            }
        },
        watch: {
            map() {
                this.$emit('map');
                console.log("Map set", this.map);
                this.prepareGame();
            },
            rules() {
                this.$emit('rules');
                console.log("Rules set", this.rules);
            }
        }
    }
</script>

<style scoped>
    .game-info {
        position: absolute;
        top: 0;
        width: 50%;
        left: 25%;
        padding: 10px;
        border-bottom-right-radius: 10px;
        border-bottom-left-radius: 10px;
        z-index: 2;
        display: flex;
        justify-content: space-around;
        background-color: rgb(34, 34, 34);
        font-size: 13px;
    }

    .street-view, .game {
        width: 100%;
        height: 100%;
    }

    .small-map {
        width: 100%;
        height: 100%;
        z-index: 3;
        flex-grow: 1;
    }

    .small-map > div {
        height: 100%;
        width: 100%;
        cursor: default;
    }

    .guess-map {
        z-index: 2;
        position: absolute !important;
        bottom: 0;
        left: 0;
        width: 300px;
        height: 250px;
        box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.3);
        border-top-right-radius: 10px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .guess-bottom {
        height: 50px;
        padding: 5px;
        text-align: center;
        z-index: 5;
        background-color: rgb(34, 34, 34)
    }

    .guess-bottom > * {
        width: 100%;
    }
</style>
