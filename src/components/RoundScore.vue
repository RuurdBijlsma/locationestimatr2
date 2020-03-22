<template>
    <div class="round-score">
        <div class="map-slot">
            <slot></slot>
        </div>
        <div class="score-overview">
            <div class="score-bar">
                <div class="score-bar-progress" :style="`width: ${Math.round(points / 50)}%`"></div>
            </div>
            <div class="score-text">
                <p class="score-distance">Your guess is {{distance}} removed from the target location</p>
                <p class="score-total">You scored {{points}} points</p>
            </div>
            <v-btn large dark rounded :color="$store.state.color" @click="nextRound">Next Round</v-btn>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'RoundScore',
        components: {},
        props: {
            googleMap: {
                type: Object,
                default: null,
            }
        },
        data: () => ({
            target: null,
            guess: null,
            targetMarker: null,
            guessMarker: null,
            overviewLines: [],
            meters: 0,
            points: 0,
        }),
        async mounted() {

        },
        methods: {
            nextRound() {
                this.removeOverviewLines();
                this.points = 0;
                this.$emit('nextRound');
            },
            show(guess, target, meters, points) {
                console.log(guess, target);
                this.guess = {lat: guess[0], lng: guess[1]};
                this.target = {lat: target[0], lng: target[1]};
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
                this.addOverviewLine(guess, target, 700);
            },
            updateFit(guess, target) {
                console.log("UPDATE FIT");
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(guess);
                bounds.extend(target);
                this.googleMap.fitBounds(bounds);
            },
            addOverviewLine(guess, actual, animationTime = 1500) {
                this.removeOverviewLines();
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
                }, animationTime);
            },
            removeOverviewLines() {
                for (let lineData of this.overviewLines) {
                    lineData.line.setMap(null);
                    lineData.guess.setMap(null);
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
            }
        },
        computed: {
            distance() {
                return this.formatDistance(this.meters);
            }
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
</style>
