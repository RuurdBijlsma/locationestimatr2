<template>
    <div class="round-score">
        <div class="map-slot">
            <slot></slot>
        </div>
        <div v-if="roundOverview" class="score-overview">
            <div class="score-bar">
                <div class="score-bar-progress" :style="`width: ${Math.round(points / 50)}%`"></div>
            </div>
            <div class="score-text">
                <p class="score-distance">Your guess is {{distance}} removed from the target location</p>
                <p class="score-total">You scored {{points}} points</p>
            </div>
            <v-btn v-if="isLastRound" :disabled="!nextButtonEnabled" large dark rounded :color="$store.state.color"
                   @click="showGameOverview">
                Show Game Overview
            </v-btn>
            <v-btn v-else :disabled="!nextButtonEnabled" large dark rounded :color="$store.state.color"
                   @click="nextRound">
                Next Round
            </v-btn>
        </div>
        <div v-else class="score-overview">
            <v-data-table
                    dense
                    dark
                    :headers="tableHeaders"
                    hide-default-footer
                    :items="tableGuesses"
                    class="elevation-1 data-table">
                <template v-slot:footer>
                    <p class="table-footer">Your total score is {{points}}</p>
                </template>
            </v-data-table>
            <div v-if="isCustom">
                <p class="caption">Sorry, you can't submit your highscore when playing on custom difficulty.</p>
            </div>
            <div v-else>
                <p class="caption">Submit to scoreboard to see other high scores</p>
                <v-form class="highscore-submit" @submit="submitHighScore">
                    <v-text-field v-model="user" label="Username" dense class="hs-input" outlined required
                                  :rules="userRules"></v-text-field>
                    <v-btn text type="submit" :loading="submitting" class="hs-button">Submit</v-btn>
                </v-form>
            </div>
            <div class="play-again">
                <v-btn text to="/">Play Other Map</v-btn>
                <v-btn :color="$store.state.color">Play Again</v-btn>
            </div>
        </div>
    </div>
</template>

<script>
    const lastUser = localStorage.getItem('lastUser') ? localStorage.lastUser : '';
    export default {
        name: 'RoundScore',
        components: {},
        props: {
            guesses: {
                type: Array,
                default: [],
            },
            googleMap: {
                type: Object,
                default: null,
            },
            isCustom: {
                type: Boolean,
                default: true,
            },
            submitting: {
                type: Boolean,
                default: false,
            },
        },
        data: () => ({
            userRules: [
                v => !!v || 'Name is required',
                v => v.length <= 40 || 'Name must be less than 40 characters',
                v => v.length > 2 || 'Name must be more than 2 characters',
            ],
            tableHeaders: [
                {
                    text: "Round",
                    value: "round",
                },
                {
                    text: "Distance from target",
                    value: "distance",
                    sortable: false,
                },
                {
                    text: "Score",
                    value: "score",
                },
            ],
            target: null,
            guess: null,
            targetMarker: null,
            guessMarker: null,
            overviewLines: [],
            meters: 0,
            points: 0,
            isLastRound: false,
            roundOverview: true,
            nextButtonEnabled: false,
            user: lastUser,
        }),
        async mounted() {

        },
        methods: {
            submitHighScore(e) {
                e.preventDefault();
                localStorage.lastUser = this.user;
                this.$emit('submitHighScore', this.user, this.points, this.dbGuesses);
            },
            showGameOverview() {
                this.removeOverviewLines();
                for (let i = 0; i < this.guesses.length; i++) {
                    let {guess, target} = this.guesses[i];
                    setTimeout(() => {
                        this.addOverviewLine(this.toLatLng(guess), this.toLatLng(target));
                    }, i * 350);
                }
                let locations = this.guesses.flatMap(g => [g.guess, g.target]).map(l => this.toLatLng(l));
                console.log("LOCATIONS", locations, 'guesses', this.guesses);
                this.updateFit(...locations)
                this.points = this.guesses.map(g => g.score).reduce((a, b) => a + b);
                this.roundOverview = false;
                console.log("TOTAL SCORE", this.points);
            },
            nextRound() {
                this.removeOverviewLines();
                this.points = 0;
                this.$emit('nextRound');
            },
            show(guess, target, meters, points, isLastRound = false) {
                console.log(guess, target, "is last round", isLastRound);
                this.nextButtonEnabled = false;
                this.isLastRound = isLastRound;
                this.guess = this.toLatLng(guess);
                this.target = this.toLatLng(target);
                this.meters = meters;
                this.points = points;
                setTimeout(() => {
                    this.updateMap(this.guess, this.target);
                }, 250);
            },
            updateMap(guess, target) {
                if (guess === null || target === null)
                    return;
                this.updateFit(guess, target);
                this.removeOverviewLines();
                this.addOverviewLine(guess, target, 700)
                    .then(() => this.nextButtonEnabled = true);
            },
            updateFit(...locations) {
                console.log("UPDATE FIT");
                const bounds = new google.maps.LatLngBounds();
                locations.forEach(l => bounds.extend(l));
                this.googleMap.fitBounds(bounds);
            },
            addOverviewLine(guess, actual, animationTime = 1500) {
                return new Promise(resolve => {
                    let lineData = {};
                    this.overviewLines.push(lineData);

                    lineData.line = new google.maps.Polyline({
                        path: [guess, guess],
                        geodesic: true,
                        strokeColor: "red",
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        map: this.googleMap
                    });

                    let dropTime = 250;
                    let fps = 30;
                    let steps = fps * (animationTime / 1000);
                    let step = 0;
                    let deltaLat = guess.lat - actual.lat;
                    let deltaLng = guess.lng - actual.lng;

                    lineData.guess = new google.maps.Marker({
                        position: guess,
                        map: this.googleMap,
                        animation: google.maps.Animation.DROP,
                        title: "Your Guess",
                    });

                    setTimeout(() => {
                        let interval = self.setInterval(() => {
                            if (step++ >= steps) {
                                clearInterval(interval);
                                lineData.line.setPath([guess, actual]);
                                return;
                            }

                            lineData.line.setPath([
                                guess,
                                {
                                    lat: guess.lat - deltaLat * (step / steps),
                                    lng: guess.lng - deltaLng * (step / steps),
                                }
                            ]);
                        }, 1000 / fps);
                    }, dropTime);

                    setTimeout(() => {
                        lineData.actual = new google.maps.Marker({
                            position: actual,
                            animation: google.maps.Animation.DROP,
                            icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                            title: "Target Location",
                        });
                        lineData.actual.setMap(this.googleMap);
                        resolve();
                    }, animationTime);
                });
            },
            removeOverviewLines() {
                for (let lineData of this.overviewLines) {
                    if (lineData.line)
                        lineData.line.setMap(null);
                    if (lineData.guess)
                        lineData.guess.setMap(null);
                    if (lineData.actual)
                        lineData.actual.setMap(null);
                }
                this.overviewLines = [];
            },
            formatDistance(meters) {
                if (meters < 1000) {
                    return `${Math.floor(meters * 10) / 10} m`;
                }
                if (meters < 20000) {
                    return `${Math.floor(meters / 100) / 10} km`;
                }
                return `${Math.floor(meters / 1000)} km`;
            },
            toLatLng(latLon) {
                return {lat: latLon[0], lng: latLon[1]};
            }
        },
        computed: {
            distance() {
                return this.formatDistance(this.meters);
            },
            tableGuesses() {
                return this.guesses.map(guess => {
                    return {
                        score: guess.score,
                        distance: this.formatDistance(guess.distance),
                        round: guess.round,
                    }
                })
            },
            dbGuesses() {
                return this.guesses.map(guess => {
                    return {
                        score: guess.score,
                        distance: guess.distance,
                    }
                })
            },
        },
        watch: {}
    }
</script>

<style scoped>
    .round-score {
        text-align: center;
        width: 100%;
        height: 100%;
        background: rgb(110, 8, 147);
        background: linear-gradient(180deg, rgba(4, 237, 195, 1) 0%, rgba(110, 8, 147, 1) 100%);
        overflow-y: auto;
    }

    .map-slot {
        margin: 10px;
        width: calc(100% - 20px);
        border-radius: 10px;
        overflow: hidden;
        height: calc(100% - 400px);
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
    }

    .map-slot > * {
        width: 100%;
        height: 100%;
    }

    .score-bar {
        width: 90%;
        max-width: 900px;
        height: 30px;
        background-color: #ffffff61;
        margin: 20px auto;
        display: block;
        border-radius: 15px;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    .score-bar-progress {
        height: 100%;
        background-color: red;
        background-image: linear-gradient(to right, #06f998, #25a055);
        border-radius: 15px;
        width: 0%;
        transition: 0.5s;
    }

    .score-text {
        padding: 15px;
        background-color: rgba(0, 0, 0, 0.3);
        margin-bottom: 20px;
    }

    .score-text > p {
        margin: 10px;
    }

    .data-table {
        margin: 10px;
    }

    .table-footer {
        padding: 10px;
    }

    .highscore-submit {
        display: flex;
        justify-content: center;
    }

    .hs-button {
        margin-top: 1.5px;
    }

    .hs-input {
        max-width: 200px;
        margin-right: 10px;
    }

    .caption {
        margin: 10px;
        opacity: 0.8;
    }

    .play-again {
        width: 340px;
        margin: 0 auto;
        display: flex;
        justify-content: space-around;
    }
</style>
