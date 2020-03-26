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
                <p class="score-total">You scored {{points}} point{{points !== 1 ? 's' : ''}}</p>
                <p v-if="challengeGuess !== null" class="score-distance">Your challenger guessed
                    {{formatDistance(challengeGuess.distance)}} away from the target, scoring {{challengeGuess.score}}
                    points
                </p>
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
                    disable-sort
                    :headers="tableHeaders"
                    hide-default-footer
                    :items="tableGuesses"
                    class="elevation-1 data-table">
                <template v-slot:footer>
                    <p class="table-footer">Your total score: {{points}}<span v-if="challenge!==null">, challenger total score: {{challengeTotalScore}}</span>
                    </p>
                </template>
            </v-data-table>
            <div v-if="!hsDisabled">
                <p class="caption">Submit to scoreboard to see other high scores</p>
                <v-form class="highscore-submit" @submit="submitHighScore">
                    <v-text-field v-model="user" label="Username" dense class="hs-input" outlined required
                                  :rules="userRules"></v-text-field>
                    <v-btn text type="submit" :loading="submitting" class="hs-button">Submit</v-btn>
                </v-form>
            </div>
            <div class="challenge">
                <v-btn text @click="getChallengeUrl()">Challenge a friend</v-btn>
            </div>
            <div class="play-again">
                <v-btn text to="/">Play Other Map</v-btn>
                <v-btn @click="playAgain" :color="$store.state.color">Play Again</v-btn>
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
            hsDisabled: {
                type: Boolean,
                default: true,
            },
            submitting: {
                type: Boolean,
                default: false,
            },
            challenge: {
                type: Object,
                default: null,
            }
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
            challengeGuess: null,
        }),
        async mounted() {

        },
        methods: {
            getChallengeUrl() {
                this.$emit('challengeUrl');
            },
            playAgain() {
                location.reload();
            },
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
                        this.addOverviewLine({
                            location: this.toLatLng(guess),
                            name: `Your Guess (round ${i + 1})`,
                            color: '#FE6256',
                            number: i + 1,
                        }, {
                            location: this.toLatLng(target),
                            name: `Target Location (round ${i + 1})`,
                            color: '#02c780',
                            number: i + 1,
                        }, '#FE6256', 800).then(() => {
                            if (this.challenge !== null) {
                                this.addOverviewLine({
                                    location: this.toLatLng(this.challenge.guesses[i].target),
                                    name: `Target Location (round ${i + 1})`,
                                    color: '#02c780',
                                    number: i + 1,
                                }, {
                                    location: this.toLatLng(this.challenge.guesses[i].guess),
                                    name: `Challenger Guess (round ${i + 1})`,
                                    color: '#daa604',
                                    number: i + 1,
                                }, '#daa604', 800)
                            }
                        })
                    }, i * 500);
                }
                let locations = this.guesses.flatMap(g => [g.guess, g.target]).map(l => this.toLatLng(l));
                if (this.challenge !== null)
                    locations = locations.concat(this.challenge.guesses.map(c => this.toLatLng(c.guess)));
                console.log("LOCATIONS", locations, 'guesses', this.guesses);
                this.updateFit(...locations);
                this.points = this.guesses.map(g => g.score).reduce((a, b) => a + b);
                this.roundOverview = false;
                console.log("TOTAL SCORE", this.points);
            },
            nextRound() {
                this.removeOverviewLines();
                this.points = 0;
                this.$emit('nextRound');
            },
            show(guess, target, meters, points, isLastRound, challengeGuess) {
                console.log(guess, target, "is last round", isLastRound);
                this.nextButtonEnabled = false;
                let challengeGuessLocation = null;
                if (challengeGuess !== null) {
                    challengeGuessLocation = this.toLatLng(challengeGuess.guess);
                    this.challengeGuess = challengeGuess;
                }
                this.isLastRound = isLastRound;
                this.guess = this.toLatLng(guess);
                this.target = this.toLatLng(target);
                this.meters = meters;
                this.points = points;
                setTimeout(() => {
                    this.updateMap(this.guess, this.target, challengeGuessLocation);
                }, 250);
            },
            updateMap(guess, target, challengeGuess) {
                if (guess === null || target === null)
                    return;
                this.updateFit(guess, target, challengeGuess);
                this.removeOverviewLines();
                this.addOverviewLine({
                    location: guess,
                    name: "Your Guess",
                    color: '#FE6256',
                }, {
                    location: target,
                    name: "Target Location",
                    color: '#02c780'
                }, '#FE6256', 600)
                    .then(() => {
                        if (challengeGuess !== null) {
                            this.addOverviewLine({
                                location: target,
                                name: "Target Location",
                                color: '#02c780',
                            }, {
                                location: challengeGuess,
                                name: "Challenger Guess",
                                color: '#daa604',
                            }, '#daa604', 600).then(() => {
                                this.nextButtonEnabled = true;
                            });
                        } else {
                            this.nextButtonEnabled = true;
                        }
                    });
            },
            updateFit(...locations) {
                console.log("UPDATE FIT");
                const bounds = new google.maps.LatLngBounds();
                locations.forEach(l => {
                    if (l !== null)
                        bounds.extend(l)
                });
                this.googleMap.fitBounds(bounds);
            },
            addOverviewLine(start, end, lineColor = 'red', animationTime = 1500) {
                return new Promise(resolve => {
                    let lineData = {};
                    this.overviewLines.push(lineData);

                    lineData.line = new google.maps.Polyline({
                        path: [start.location, end.location],
                        geodesic: true,
                        strokeColor: lineColor,
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                    });

                    let dropTime = 250;
                    let fps = 30;
                    let steps = fps * (animationTime / 1000);
                    let step = 0;
                    let deltaLat = start.location.lat - end.location.lat;
                    let deltaLng = start.location.lng - end.location.lng;

                    let color = start.color || '#FE6256';
                    let number = start.number || 0;
                    lineData.start = new google.maps.Marker({
                        position: start.location,
                        map: this.googleMap,
                        animation: google.maps.Animation.DROP,
                        icon: `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${number}|${color.substr(1)}|000000`,
                        title: start.name,
                    });

                    setTimeout(() => {
                        let i = 0;
                        let interval = self.setInterval(() => {
                            if (step++ >= steps) {
                                clearInterval(interval);
                                lineData.line.setPath([start.location, end.location]);
                                return;
                            }

                            lineData.line.setPath([
                                start.location,
                                {
                                    lat: start.location.lat - deltaLat * (step / steps),
                                    lng: start.location.lng - deltaLng * (step / steps),
                                }
                            ]);
                            if (i++ === 0)
                                lineData.line.setMap(this.googleMap)
                        }, 1000 / fps);
                    }, dropTime);

                    setTimeout(() => {
                        color = end.color || '#14f75f';
                        number = end.number || 0;
                        lineData.end = new google.maps.Marker({
                            position: end.location,
                            map: this.googleMap,
                            animation: google.maps.Animation.DROP,
                            icon: `https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=${number}|${color.substr(1)}|000000`,
                            title: end.name,
                        });
                        // lineData.end.setMap(this.googleMap);
                        resolve();
                    }, animationTime);
                });
            },
            removeOverviewLines() {
                for (let lineData of this.overviewLines) {
                    if (lineData.line)
                        lineData.line.setMap(null);
                    if (lineData.start)
                        lineData.start.setMap(null);
                    if (lineData.end)
                        lineData.end.setMap(null);
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
            challengeTotalScore() {
                return this.challenge.guesses.map(c => c.score).reduce((a, b) => a + b);
            },
            distance() {
                return this.formatDistance(this.meters);
            },
            tableGuesses() {
                if (this.challenge !== null) {
                    return this.guesses.map((guess, i) => {
                        return {
                            score: guess.score,
                            challengerScore: this.challenge.guesses[i].score,
                            distance: this.formatDistance(guess.distance),
                            challengerDistance: this.formatDistance(this.challenge.guesses[i].distance),
                            round: guess.round,
                        }
                    })
                }
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
        watch: {
            challenge() {
                this.tableHeaders = [
                    {
                        text: "Round",
                        value: "round",
                    },
                    {
                        text: "Distance (you)",
                        value: "distance",
                        sortable: false,
                    },
                    {
                        text: "Distance (challenger)",
                        value: "challengerDistance",
                        sortable: false,
                    },
                    {
                        text: "Score (you)",
                        value: "score",
                    },
                    {
                        text: "Score (challenger)",
                        value: "challengerScore",
                    },
                ];
            }
        }
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
        display: flex;
        justify-content: space-around;
        margin: 0 auto 20px;
    }

    .challenge {
        margin-bottom: 20px;
    }
</style>
