<template>
    <div class="game" ref="game" v-show="rules !== null && map !== null">
        <div class="game-part" v-if="!svFailed">
            <div class="game-info" v-if="rules !== null">
                <span class="time">Points <span
                        class="font-weight-bold">{{previousGuesses.map(g=>g.score).reduce((a,b)=>a+b, 0)}}</span></span>
                <span class="time">Round <span class="font-weight-bold">{{currentRound}}</span>/<span
                        class="font-weight-bold">{{rules.roundCount}}</span></span>
                <span v-if="!rules.unlimitedTime" class="time">Time <span
                        class="font-weight-bold">{{roundTime}}</span></span>
                <span v-if="!rules.unlimitedMoves" class="time">Moves Left
                    <span class="font-weight-bold">{{movesLeft}}</span></span>
            </div>
            <div class="street-view" ref="streetView"></div>
            <div class="return-home full-screen" ref="returnHome" title="Toggle fullscreen">
                <v-btn @click="toggleFullScreen()" class="return-home-button" color="#222222" fab dark>
                    <v-icon v-if="fullscreen">fullscreen_exit</v-icon>
                    <v-icon v-else>fullscreen</v-icon>
                </v-btn>
            </div>
            <div class="return-home" ref="returnHome" title="Teleport to start location">
                <v-btn @click="homeFlag()" class="return-home-button" color="#222222" fab dark>
                    <v-icon>flag</v-icon>
                </v-btn>
            </div>
            <div class="map-element" ref="map"></div>
            <div class="guess-map" ref="guessMap">
                <v-btn @click="showCoverage" title="Show current map area and StreetView coverage." fab small
                       class="show-coverage">
                    <v-icon :color="showingCoverage ? 'primary' : undefined">layers</v-icon>
                </v-btn>
                <div class="resize-map" ref="resizeTrigger" @mousedown="resizeDownEvent"
                     @touchstart="resizeDownEvent($event.touches[0])">
                    <v-icon color="#FFFFFF" class="resize-icon" v-if="mobile">menu</v-icon>
                    <v-icon small color="#FFFFFF" class="resize-icon" v-else>call_made</v-icon>
                </div>
                <div class="small-map" ref="smallMap"></div>
                <div class="guess-bottom">
                    <v-btn @click="makeGuess()" color='primary' text large class="guess-button"
                           :disabled="!guessButtonEnabled">
                        Make Guess
                    </v-btn>
                </div>
            </div>
        </div>
        <div v-if="svFailed" class="sv-failed error">
            <h1>Couldn't find valid StreetView location in this map!</h1>
            <v-btn outlined to="/">Change Map</v-btn>
            <v-btn outlined @click="reload">Change Rules</v-btn>
        </div>
        <div class="loading-text" v-show="dontAllowPlay || this.currentRound === 0">
            <p>Loading random location...</p>
            <v-progress-circular indeterminate></v-progress-circular>
            <canvas v-if="visualize" class="tile-canvas" ref="tileCanvas"></canvas>
        </div>
        <round-score :challenge="challenge" @challengeUrl="getChallengeUrl" @submitHighScore="submitHighScore"
                     @nextRound="nextRoundEvent"
                     :guesses="previousGuesses"
                     class="roundScore"
                     :map="map"
                     :submitting="submitting"
                     v-show="showRoundOverview" :google-map="googleMap"
                     ref="roundScore"
                     :hs-disabled="(rules && rules.presetName === 'Custom') || (map && map.id === 'my_area') || (challenge !== null)">
            <div class="big-map" ref="bigMap"></div>
        </round-score>

        <v-dialog v-model="dialog">
            <v-card :loading="challengeLoading">
                <v-card-title class="headline">Challenge a Friend</v-card-title>
                <v-card-subtitle>
                    <p>Share this link with someone so they can play on the locations you played and compare
                        scores!</p>
                    <v-text-field ref="challengeUrlField" readonly :value="challengeUrl"></v-text-field>
                    <p class="caption" v-if="isCopied">
                        <v-icon color='primary'>done</v-icon>
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
    import Google from "../js/Google";
    import StreetView from "../js/StreetView";
    import StreetViewElement from "../js/StreetViewElement";
    import RoundScore from "./RoundScore";
    import PolyMap from "../js/PolyMap";

    export default {
        name: 'Game',
        components: {RoundScore},
        data: () => ({
            dontAllowPlay: false,
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
            fullscreen: false,
            prepared: false,
            showRoundOverview: false,
            currentSvRound: -1,
            startTime: 0,
            timeTaken: -1,
            submitting: false,
            timer: -1,
            roundTime: '',
            svElement: null,
            isCopied: false,
            resizeDown: false,
            resizeOffset: {x: 0, y: 0},
            svCoverage: null,
            showingCoverage: false,
            rules: null,
            map: null,
            challenge: null,
            movesLeft: 5,
            canvas: null,
            context: null,
            visualize: localStorage.getItem('visualize') && localStorage.visualize === 'true',
            svType: 0,
            distribution: 0,
            svFailed: false,
            locations: [],
        }),
        async mounted() {
            this.fullscreen = document.fullscreenElement;
            document.onfullscreenchange = e => {
                this.fullscreen = document.fullscreenElement;
            };

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
        },
        methods: {
            toggleFullScreen() {
                let elem = document.documentElement;
                if (!this.fullscreen) {
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen();
                    } else if (elem.mozRequestFullScreen) { /* Firefox */
                        elem.mozRequestFullScreen();
                    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                        elem.webkitRequestFullscreen();
                    } else if (elem.msRequestFullscreen) { /* IE/Edge */
                        elem.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.mozCancelFullScreen) { /* Firefox */
                        document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) { /* IE/Edge */
                        document.msExitFullscreen();
                    }
                }
            },
            async start(map, rules, challenge) {
                this.$store.commit('setImmersive', true);
                this.map = map;
                this.rules = rules;
                this.challenge = challenge;
                console.log("Starting game", map, rules, challenge);
                if (this.challenge !== null)
                    this.challenge.guesses.forEach(challenge => {
                        let guess = challenge.guess;
                        let target = challenge.target;
                        challenge.distance = this.measureDistance(guess, target);
                        challenge.score = this.map.scoreCalculation(challenge.distance);
                    });

                this.svType = this.rules.svType === 2 ? 'both' : (this.rules.svType === 1 ? 'photo' : 'sv');
                this.distribution = this.rules.distribution === 1 ? 'uniform' : 'weighted';
                this.streetView = new StreetView(this.map);
                if (this.visualize)
                    this.initializeTilesVisualizer().then(() => {
                        this.streetView.on('subTiles', tiles => {
                            if (this.dontAllowPlay || this.currentRound === 0)
                                this.visualizeTiles(tiles);
                        });
                    });
                if (this.map.minimumDistanceForPoints < 500) this.zoom = 19;
                else if (this.map.minimumDistanceForPoints < 3000) this.zoom = 18;
                else if (this.map.minimumDistanceForPoints < 10000) this.zoom = 16;
                else this.zoom = 14;
                console.log("Using zoom level:", this.zoom, this.map.minimumDistanceForPoints);
                this.currentRound = 0;
                this.previousGuesses = [];

                this.preloadAllRoundLocations();
                await this.initGoogle();
                await this.preloadStreetView();

                console.log("Start game");
                this.startTime = performance.now();
                this.startRound();
            },
            async initGoogle() {
                this.svElement = new StreetViewElement(this.$refs.streetView, this.$refs.returnHome);
                await Google.wait();
                this.googleMap = new Google.maps.Map(this.$refs.map, {
                    zoom: 1,
                    center: {lat: 0, lng: 0},
                    disableDefaultUI: true,
                    clickableIcons: false,
                    backgroundColor: "#aadaff",
                    fullscreenControl: false,
                });
                this.streetView.googleMap = this.googleMap;
                console.log("googleMap", this.googleMap);
                this.svCoverage = new Google.maps.StreetViewCoverageLayer();
                Google.maps.event.addListener(this.googleMap, "click", e => {
                    if (this.googleMap.getDiv().parentElement.attributes.class.value === "small-map") {
                        // console.log("Is in map?", this.map.containsLocation(e.latLng.lat(), e.latLng.lng()));
                        this.placeGuessMarker(e.latLng);
                    }
                });
                this.attachMap(this.$refs.smallMap);
            },
            async initializeTilesVisualizer() {
                return new Promise(resolve => {
                    setTimeout(() => {
                        this.canvas = this.$refs.tileCanvas;
                        this.context = this.canvas.getContext('2d');
                        let canvasBounds = this.canvas.getBoundingClientRect();
                        this.canvas.width = canvasBounds.width;
                        this.canvas.height = canvasBounds.height;
                        resolve();
                    }, 100);
                })
            },
            visualizeTiles(tiles) {
                tiles.sort((a, b) => {
                    if (a.y === b.y)
                        return a.x - b.x;
                    return a.y - b.y;
                });
                let gridWidth = 2;
                let imgSize = this.canvas.width / gridWidth;
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                tiles.map(tile => tile.img).forEach((img, i) => {
                    if (img === false)
                        return;
                    let x = i % gridWidth;
                    let y = Math.floor(i / gridWidth);
                    this.context.drawImage(img, x * imgSize, y * imgSize, imgSize, imgSize);
                });
            },
            showCoverage() {
                if (this.showingCoverage) {
                    this.svCoverage.setMap(null);
                    if (this.map instanceof PolyMap)
                        this.map.polygon.setMap(null);
                    this.showingCoverage = false;
                } else {
                    this.svCoverage.setMap(this.googleMap);
                    if (this.map instanceof PolyMap)
                        this.map.polygon.setMap(this.googleMap);
                    this.showingCoverage = true;
                }
            },
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
                    let rules = this.rules.presetName === 'Custom' ? JSON.parse(JSON.stringify(this.rules)) : this.rules.preset;
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
            reload() {
                location.reload();
            },
            async homeFlag() {
                await this.svElement.setLocation(...this.currentDestination);
            },
            async submitHighScore(user, totalScore, scores) {
                this.submitting = true;
                let rules = this.rules.presetName === 'Custom' ? JSON.parse(JSON.stringify(this.rules)) : this.rules.preset;
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
                await this.$router.push(`/scores?refresh=true&difficulty=${this.rules.preset}&map=${this.map.id}`);
                this.submitting = false;
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
            async waitSleep(time) {
                return new Promise(resolve => {
                    setTimeout(resolve, time);
                });
            },
            async startRound() {
                this.dontAllowPlay = true;
                this.attachMap(this.$refs.smallMap);
                setTimeout(() => this.fitMapToGeoMap(), 30);
                let round = ++this.currentRound;
                if (this.locations[round] === undefined) {
                    let event = 'roundLocation:' + round;
                    await this.waitFor(event);
                }
                if (this.currentSvRound !== round) {
                    console.log("Current svround is not round", this.currentSvRound, round);
                    let event = 'svRound:' + round;
                    await this.waitFor(event);
                    console.log("SV round wait COMPLETE!");
                }
                this.dontAllowPlay = false;
                this.$emit('gameLoad');
                console.log("Round start. Start timer here, reset allowed moves");
                if (!this.rules.unlimitedTime) {
                    //  Start Timer grace period of 500 ms
                    let timeLimitMs = this.rules.timeLimit * 1000;
                    this.roundTime = this.msToTime(timeLimitMs);
                    setTimeout(() => {
                        let roundStartTime = performance.now();
                        clearInterval(this.timer);
                        let thisTimer;
                        thisTimer = setInterval(() => {
                            let elapsed = performance.now() - roundStartTime;
                            let remainingMs = Math.max(timeLimitMs - elapsed, 0);

                            this.roundTime = this.msToTime(remainingMs);
                            if (remainingMs <= 0) {
                                clearInterval(thisTimer);
                                if (this.mapMarker === null)
                                    this.placeGuessMarker({lat: 0, lng: 0});
                                this.makeGuess();
                            }
                        }, 1000 / 60);
                        this.timer = thisTimer;
                    }, 500);
                }
            },
            async preloadStreetView() {
                if (this.mapMarker !== null)
                    this.mapMarker.setMap(null);
                this.mapMarker = null;
                let preloadingRound = this.currentRound + 1;
                let {position, pov} = await this.getRoundLocation(preloadingRound);
                this.currentDestination = position;
                this.guessButtonEnabled = false;
                console.log("SetLocation", this.currentDestination);
                await this.svElement.setLocation(...this.currentDestination);
                console.log("SetPov", pov);
                this.svElement.panorama.setPov(pov);
                this.applyRules();

                this.currentSvRound = preloadingRound;
                let event = 'svRound:' + preloadingRound;
                this.$emit(event);
            },
            positionDistance(positionA, positionB) {
                return (positionA[0] - positionB[0]) ** 2 + (positionA[1] - positionB[1]) ** 2;
            },
            async preloadAllRoundLocations() {
                this.locations = [];
                const defaultPov = {heading: 0, pitch: 0, zoom: 1};

                if (this.challenge !== null) {
                    let challengeLocations = JSON.parse(JSON.stringify(this.challenge.guesses.map(g => g.target)));
                    if (this.map.type === 'point') {
                        challengeLocations = challengeLocations.map(position => {
                            let pov = this.map.points.find(p => this.positionDistance(p.position, position) < 0.000001).pov;
                            console.log("pov found!", pov);
                            return {position, pov: pov || defaultPov}
                        });
                    } else {
                        challengeLocations = challengeLocations.map(position => {
                            return {position, pov: defaultPov}
                        });
                    }
                    challengeLocations.unshift(undefined);
                    this.locations = challengeLocations;
                } else if (this.map.type === 'point') {
                    console.log("Not shuffled", this.map.points);
                    //Copy points because of the unshift happening after
                    let pointPositions = this.streetView.shuffle(JSON.parse(JSON.stringify(this.map.points)));
                    console.log("Shuffled", pointPositions);
                    pointPositions.unshift(undefined);
                    this.locations = pointPositions;
                } else {
                    for (let round = 1; round <= this.rules.roundCount; round++) {
                        let position = await this.streetView.randomValidLocation(this.zoom, this.svType, this.distribution);
                        this.locations[round] = {position, pov: defaultPov};
                        console.log("Finished loading location for round:", round, this.locations);
                        this.$emit('roundLocation:' + round);
                    }
                }
            },
            async getRoundLocation(round) {
                return new Promise(async resolve => {
                    console.log("loadNextLocation, round:", round);
                    this.findingRandomLocation = true;
                    if (this.locations[round] === undefined) {
                        let event = 'roundLocation:' + round;
                        console.log("Waiting for event:", event);
                        this.$on(event, () => {
                            console.log("YAAAAA EVENT DONE");
                        });
                        await this.waitFor(event);
                        console.log("EVENT DONEYAAA??????")
                    }
                    let nextLocation = this.locations[round];

                    if (nextLocation === false) {
                        this.svFailed = true;
                        let rules = this.rules.presetName === 'Custom' ? JSON.parse(JSON.stringify(this.rules)) : this.rules.preset;
                        await this.$store.dispatch('reportMap', {mapId: this.map.id, rules});
                    }
                    console.log("Setting finding random location to False");
                    this.findingRandomLocation = false;
                    resolve(nextLocation);
                })
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
                    this.movesLeft = this.rules.moveLimit;
                    if (this.movesLeft === 0) {
                        this.svElement.restrictMove();
                    } else {
                        this.svElement.removeMoveListener();
                        this.svElement.panorama.addListener("position_changed", () => {
                            if (--this.movesLeft === 0)
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
                    this.preloadStreetView();
                } else {
                    this.timeTaken = performance.now() - this.startTime;
                    this.$store.dispatch('addPlay', this.map.id);
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
            async nextRoundEvent() {
                this.attachMap(this.$refs.smallMap);
                console.log("NExt round event, nextlocation: ", this.locations[this.currentRound + 1]);
                this.showRoundOverview = false;
                this.startRound();
            },
            waitFor(event) {
                return new Promise(resolve => {
                    this.$once(event, () => resolve());
                });
            }
        },
        computed: {
            mobile() {
                return this.$store.state.windowWidth < 500;
            }
        }
    }
</script>

<style scoped>

    .game-part {
        height: 100%;
    }

    .game-info {
        position: absolute;
        top: 0;
        width: 500px;
        left: calc(50% - 250px);
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
        text-transform: uppercase;
        width: 100px;
        text-align: left;
    }

    .round-score {
        position: absolute;
        top: 0;
        z-index: 4;
    }

    @media screen and (max-width: 500px) {
        .game-info {
            position: absolute;
            top: 0;
            width: 100%;
            left: 0;
            border-bottom-right-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
        }

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

        .show-coverage {
            margin-top: 50px !important;
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

    .show-coverage {
        z-index: 4;
        margin: 5px;
    }

    .loading-text {
        padding: 20px;
        text-align: center;
        position: fixed;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 6;
        background-color: #222031;
    }

    .tile-canvas {
        position: relative;
        width: 512px;
        height: 512px;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2);
        display: block;
        margin-left: calc(50% - 256px);
        margin-top: 40px;
        background-color: #afdca9;
        border-radius: 50%;
    }

    @media screen and (max-width: 500px) {
        .tile-canvas {
            width: 256px;
            height: 256px;
            margin-left: calc(50% - 128px);
        }
    }

    .sv-failed {
        padding: 20px;
        text-align: center;
    }

    .sv-failed > h1 {
        padding: 20px;
    }

    .sv-failed > button {
        margin: 15px;
    }


    .full-screen {
        margin-bottom: 63px;
    }
</style>
