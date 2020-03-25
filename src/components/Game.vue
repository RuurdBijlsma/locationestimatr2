<template>
    <div class="game" ref="game">
        <div class="game-info" v-if="rules !== null">
            <span>Round: <span class="font-weight-bold">{{currentRound}}</span>/<span class="font-weight-bold">{{rules.roundCount}}</span></span>
            <span v-if="!rules.unlimitedTime" class="time">Time: <span
                    class="font-weight-bold">{{roundTime}}</span></span>
        </div>
        <div class="street-view" ref="streetView"></div>
        <div class="return-home" ref="returnHome">
            <v-btn @click="homeFlag()" class="return-home-button" color="#222222" fab dark>
                <v-icon>flag</v-icon>
            </v-btn>
        </div>
        <div class="map-element" ref="map"></div>
        <div class="guess-map" ref="guessMap">
            <div class="resize-map" ref="resizeTrigger" @mousedown="resizeDownEvent"
                 @touchstart="resizeDownEvent($event.touches[0])">
                <v-icon color="#FFFFFF" class="resize-icon" v-if="mobile">menu</v-icon>
                <v-icon small color="#FFFFFF" class="resize-icon" v-else>call_made</v-icon>
            </div>
            <div class="small-map" ref="smallMap"></div>
            <div class="guess-bottom">
                <v-btn @click="makeGuess()" :color="$store.state.color" text large class="guess-button"
                       :disabled="!guessButtonEnabled">
                    Make Guess
                </v-btn>
            </div>
        </div>
        <round-score :challenge="challenge" @challengeUrl="getChallengeUrl" @submitHighScore="submitHighScore"
                     @nextRound="nextRoundEvent"
                     :guesses="previousGuesses"
                     class="roundScore"
                     :submitting="submitting"
                     v-show="showRoundOverview" :google-map="googleMap"
                     ref="roundScore"
                     :hs-enabled="(rules && rules.presetName === 'Custom') || (map && map.id === 'my_area')">
            <div class="big-map" ref="bigMap"></div>
        </round-score>

        <v-dialog v-model="dialog">
            <v-card :loading="challengeLoading">
                <v-card-title class="headline">Challenge a Friend</v-card-title>
                <v-card-subtitle>
                    <p>Share this link with someone so they can play on the locations you played and compare scores!</p>
                    <v-text-field ref="challengeUrlField" :value="challengeUrl"></v-text-field>
                    <p class="caption" v-if="isCopied">
                        <v-icon :color="$store.state.color">done</v-icon>
                        Copied link to clipboard
                    </p>
                </v-card-subtitle>

                <v-card-actions>
                    <v-btn text @click="dialog=false">Dismiss</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    import Rules from "../js/Rules";
    import GeoMap from "../js/GeoMap";
    import Google from "../js/Google";
    import StreetView from "../js/StreetView";
    import StreetViewElement from "../js/StreetViewElement";
    import RoundScore from "./RoundScore";

    export default {
        name: 'Game',
        components: {RoundScore},
        props: {
            rules: {
                type: Rules,
                default: null,
            },
            map: {
                type: GeoMap,
                default: null,
            },
            challenge: {
                type: Object,
                default: null,
            }
        },
        data: () => ({
            dialog: false,
            challengeLoading: false,
            challengeUrl: '',
            googleMap: null,
            mapMarker: null,
            guessButtonEnabled: false,
            overviewLines: [],
            streetView: null,
            previousGuesses: [],
            currentRound: 0,
            findingRandomLocation: false,
            currentDestination: null,
            guessedLocation: null,
            prepared: false,
            showRoundOverview: false,
            nextLocation: null,
            startTime: 0,
            timeTaken: -1,
            submitting: false,
            timer: -1,
            roundTime: '',
            svElement: null,
            isCopied: false,
            resizeDown: false,
            resizeOffset: {x: 0, y: 0},
            windowWidth: window.innerWidth,
            mobile: window.innerWidth < 500,
        }),
        async mounted() {
            window.onresize = () => {
                this.windowWidth = window.innerWidth
            }
            console.log("MOUNTED");
            this.svElement = new StreetViewElement(this.$refs.streetView, this.$refs.returnHome);
            console.log("SV ELEMENT", this.svElement);
            Google.wait().then(() => {
                this.googleMap = new Google.maps.Map(this.$refs.map, {
                    zoom: 1,
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
                // this.showOverview()

                document.onmouseup = e => {
                    this.resizeDown = false;
                    this.resizeEvent(e);
                };
                document.onmousemove = e => {
                    if (this.resizeDown) {
                        this.resizeEvent(e);
                    }
                };
                document.ontouchend = e => {
                    this.resizeDown = false;
                    this.resizeEvent(e.touches[0]);
                };
                document.ontouchmove = e => {
                    if (this.resizeDown) {
                        this.resizeEvent(e.touches[0]);
                    }
                };
            });
        },
        methods: {
            resizeDownEvent(e) {
                this.resizeDown = true;
                let trigger = this.$refs.resizeTrigger;
                let triggerWidth = this.$refs.guessMap.offsetWidth - trigger.offsetLeft;
                this.resizeOffset.x = triggerWidth - (e.pageX - trigger.offsetLeft);
                this.resizeOffset.y = e.pageY - this.$refs.guessMap.offsetTop;
                this.resizeEvent(e);
            },
            resizeEvent(e) {
                if (!this.resizeDown) return;
                let x = e.pageX - this.$refs.game.offsetLeft + this.resizeOffset.x;
                let y = e.pageY - this.$refs.game.offsetTop - this.resizeOffset.y;
                this.setMapSize(x, window.innerHeight - y - 50);
            },
            setMapSize(width, height) {
                if (!this.mobile) {
                    this.$refs.guessMap.style.width = width + 'px';
                }
                this.$refs.guessMap.style.height = (height + 50) + 'px';
            },
            async getChallengeUrl() {
                this.dialog = true;
                this.challengeLoading = true;
                if (this.challengeUrl === '') {
                    let guesses = this.previousGuesses.map(g => {
                        return {guess: g.guess, target: g.target}
                    });
                    let rules = this.rules.presetName === 'Custom' ? this.rules : this.rules.preset;
                    rules = JSON.parse(JSON.stringify(rules));
                    this.challengeUrl = await this.$store.dispatch('getChallengeUrl', {
                        guesses,
                        rules,
                        map: this.map.id,
                        radius: this.$route.query['area_radius'],
                        coordinates: this.$route.query['area_coordinates'],
                        timeTaken: this.timeTaken,
                        date: new Date(),
                    });
                    setTimeout(() => {
                        const copyText = this.$refs.challengeUrlField.$el.querySelector('input');
                        console.log(copyText);
                        copyText.select();
                        copyText.setSelectionRange(0, 99999);
                        document.execCommand("copy");
                        console.log("Copied the text: " + copyText.value);
                        this.isCopied = true;
                        copyText.blur();
                    }, 300);
                }
                this.challengeLoading = false;
            },
            async homeFlag() {
                await this.svElement.setLocation(...this.currentDestination);
            },
            async submitHighScore(user, totalScore, scores) {
                this.submitting = true;
                let rules = this.rules.presetName === 'Custom' ? this.rules : this.rules.preset;
                await this.$store.dispatch('submitHighScore', {
                    totalScore,
                    totalDistance: scores.map(s => s.distance).reduce((a, b) => a + b),
                    scores,
                    rules,
                    map: this.map.id,
                    user,
                    timeTaken: this.timeTaken,
                    date: new Date(),
                });
                await this.$router.push('/scores?map=' + this.map.id);
                this.submitting = false;
            },
            async start() {
                if (this.map === null)
                    await this.waitFor('map');
                if (this.rules === null)
                    await this.waitFor('rules');
                if (!this.prepared)
                    await this.waitFor('prepared');

                await this.nextRound(this.nextLocation);

                console.log("Start game");
                this.startTime = performance.now();
                this.startRound();
            },
            msToTime(ms) {
                let s = ms / 1000;
                let minutes = Math.floor(s / 60);
                let seconds = s % 60;
                if (minutes !== 0)
                    return `${minutes}:${Math.floor(seconds).toString().padStart(2, '0')}`;
                if (seconds > 20)
                    return Math.round(seconds);
                return (Math.round(seconds * 10) / 10).toFixed(1);
            },
            async startRound() {
                this.attachMap(this.$refs.smallMap);
                this.fitMapToGeoMap();
                console.log("Round start. Start timer here, reset allowed moves");
                if (!this.rules.unlimitedTime) {
                    //  Start Timer grace period of 500 ms
                    let timeLimitMs = this.rules.timeLimit * 1000;
                    this.roundTime = this.msToTime(timeLimitMs);
                    setTimeout(() => {
                        let roundStartTime = performance.now();
                        this.timer = setInterval(() => {
                            let elapsed = performance.now() - roundStartTime;
                            let remainingMs = Math.max(timeLimitMs - elapsed, 0);

                            this.roundTime = this.msToTime(remainingMs);
                            if (remainingMs <= 0) {
                                if (this.mapMarker === null)
                                    this.placeGuessMarker({lat: 0, lng: 0});
                                this.makeGuess();
                            }
                        }, 1000 / 60);
                    }, 500);
                }
            },
            async prepareGame() {
                return new Promise(async resolve => {
                    this.prepared = false;
                    console.log("prepareGame");
                    this.streetView = new StreetView(this.map, 'weighted');
                    if (this.map.minimumDistanceForPoints < 500) this.zoom = 19;
                    else if (this.map.minimumDistanceForPoints < 3000) this.zoom = 18;
                    else this.zoom = 14;
                    console.log("End Zoom Level: ", this.zoom, this.map.minimumDistanceForPoints);
                    this.currentRound = 0;
                    this.previousGuesses = [];

                    let nextLocation = await this.loadNextLocation();
                    if (this.rules === null)
                        await this.waitFor('rules');

                    this.prepared = true;
                    this.$emit('prepared');
                })
            },
            async loadNextLocation() {
                console.log("loadNextLocation");
                this.findingRandomLocation = true;
                if (this.challenge !== null) {
                    this.nextLocation = this.challenge.guesses[this.currentRound].target;
                    console.log("Using challenge location, round: ", this.currentRound, 'location:', this.nextLocation);
                } else {
                    console.log("Using random location");
                    this.nextLocation = await this.streetView.randomValidLocation(this.zoom);
                }
                this.findingRandomLocation = false;
                //TODO locationload
                this.$emit('locationLoad');
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

                console.log("Setting location to ", this.currentDestination);
                await this.svElement.setLocation(...this.currentDestination);
                this.applyRules();
                //TODO: CHECK TIMEOUT HERE
                // setTimeout(() => {
                //Ensure location in this.currentDestination is as accurate as possible
                this.currentDestination = this.svElement.getLocation();
                console.log("SV Getlocation returned", this.currentDestination)
                this.$emit("nextRound");
                console.log("Next round load complete");
                // }, 500);
            },
            attachMap(element) {
                console.log("Attach map to", element);
                let mapElement = this.googleMap.getDiv();
                mapElement.remove();
                console.log('AttachMap was', mapElement);
                element.appendChild(mapElement);
            },
            fitMapToGeoMap() {
                console.log("UPDATE FIT TO GEOMAP");
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
            applyRules() {
                if (this.rules.zoomAllowed)
                    this.svElement.allowZoom();
                else
                    this.svElement.restrictZoom();
                if (this.rules.panAllowed)
                    this.svElement.allowPan();
                else
                    this.svElement.restrictPan();

                if (this.rules.moveLimit !== 0 && !this.rules.unlimitedMoves)
                    this.svElement.allowMove();
                if (!this.rules.unlimitedMoves) {
                    let moveLimit = this.rules.moveLimit;
                    if (moveLimit === 0) {
                        this.svElement.restrictMove();
                    } else {
                        this.svElement.removeMoveListener();
                        this.svElement.panorama.addListener("position_changed", () => {
                            if (--moveLimit === 0)
                                this.svElement.restrictMove();
                        });
                    }
                }
            },
            makeGuess() {
                clearInterval(this.timer);
                this.guessedLocation = [this.mapMarker.position.lat(), this.mapMarker.position.lng()];
                let targetDestination = this.rules.objectives === 1 ? this.svElement.getLocation() : this.currentDestination;
                let distance = this.measureDistance(this.guessedLocation, targetDestination);
                let points = this.map.scoreCalculation(distance);
                this.previousGuesses.push({
                    round: this.currentRound,
                    guess: this.guessedLocation,
                    target: targetDestination,
                    distance,
                    score: points
                });
                let isLastRound = this.currentRound === this.rules.roundCount;
                this.showOverview(this.guessedLocation, targetDestination, distance, points, isLastRound);
                if (!isLastRound) {
                    this.nextRound(this.nextLocation);
                } else {
                    this.timeTaken = performance.now() - this.startTime;
                }
            },
            showOverview(guess, target, distance, points, isLastRound) {
                console.log("SHOW OVERVIEW");
                this.showRoundOverview = true;
                if (this.mapMarker !== null)
                    this.mapMarker.setMap(null);
                this.mapMarker = null;
                //TODO IMPORTANT SHOW LOADING NEXT ROUDN BUTTON WHEN NEXT LOCATION ISN'T  FOUND YET
                this.attachMap(this.$refs.bigMap);
                let challengeGuess = null;
                if (this.challenge !== null)
                    challengeGuess = this.challenge.guesses[this.currentRound - 1];
                this.$refs.roundScore.show(guess, target, distance, points, isLastRound, challengeGuess);
            },
            measureDistance(from, to) {
                return google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(...from), new google.maps.LatLng(...to));
            },
            nextRoundEvent() {
                console.log("NExt round event, nextlocation: ", this.nextLocation);
                this.showRoundOverview = false;
                this.startRound();
            },
            waitFor(event) {
                return new Promise(resolve => {
                    this.$once(event, () => resolve());
                });
            }
        },
        watch: {
            async challenge() {
                await Google.wait();
                await this.waitFor('map');
                this.challenge.guesses.forEach(challenge => {
                    let guess = challenge.guess;
                    let target = challenge.target;
                    challenge.distance = this.measureDistance(guess, target);
                    challenge.score = this.map.scoreCalculation(challenge.distance);
                });
            },
            map() {
                this.$emit('map');
                console.log("Map set", this.map);
                this.prepareGame();
            },
            rules() {
                this.$emit('rules');
                console.log("Rules set", this.rules);
            },
            windowWidth() {
                this.mobile = this.windowWidth < 500;
                console.log(this.mobile);
            },
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

    .time {
        width: 100px;
        text-align: left;
    }

    .round-score {
        position: absolute;
        top: 0;
        z-index: 4;
    }

    @media screen and (max-width: 500px) {
        .street-view {
            height: calc(100% - 94px) !important;
        }

        .return-home {
            bottom: calc(200px + 94px) !important;
        }

        .guess-map {
            width: 100% !important;
            border-radius: 0 !important;
        }

        .resize-map {
            width: 100% !important;
            border-radius: 0 !important;
            left: 0 !important;
            top: 0 !important;
            height: auto !important;
            position: absolute;
            text-align: center !important;
            padding: 10px !important;
        }
    }

    .street-view, .game {
        width: 100%;
        height: 100%;
    }

    .guess-map {
        z-index: 2;
        position: absolute !important;
        bottom: 0;
        left: 0;
        width: 350px;
        height: 350px;
        box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.3);
        border-top-right-radius: 10px;
        overflow: hidden;

        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;

        min-width: 50px;
        min-height: 94px;
        max-width: 100%;
        max-height: 100%;
    }

    .small-map {
        width: 100%;
        height: calc(100% - 50px);
        z-index: 3;
        position: absolute;
        top: 0;
        left: 0;
    }

    .small-map > div {
        height: 100%;
        width: 100%;
        cursor: default;
    }

    .resize-map {
        background-color: #222222;
        width: 50px;
        height: 50px;
        border-radius: 25%;
        cursor: sw-resize;
        position: absolute;
        top: -20px;
        right: -20px;
        z-index: 5;
        -webkit-user-drag: none;
        text-align: left;
        padding-top: 22px;
        padding-left: 7px;
    }

    .guess-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50px;
        text-align: center;
        z-index: 5;
        background-color: rgb(34, 34, 34);
    }

    .guess-bottom > * {
        width: 100%;
        height: 100% !important;
    }

    .return-home {
        position: absolute;
        bottom: 200px;
        right: 10px;
        width: 48px;
        height: 48px;
        z-index: 1;
    }

    .return-home-button {
        width: 100%;
        height: 100%;
    }
</style>
