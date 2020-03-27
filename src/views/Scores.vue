<template>
    <div class="scores" v-if="map !== null">
        <div class="scores-container">
            <v-img :src="image" class="banner-image"
                   aspect-ratio="3/5"
                   gradient="to top, rgba(25,32,72,.7), rgba(100,115,201,.13)">
                <h1 class="score-title">Highscores for {{map.name}}</h1>
            </v-img>
            <v-select
                    class="select"
                    :items="scoreTypes"
                    v-model="selectedDifficulty"
                    label="Difficulty"
                    :disabled="loading"
                    outlined
            ></v-select>
            <div v-for="{id, scores, expanded} in compoundScores"
                 :key="id">
                <h2>{{id}} Scores</h2>
                <v-data-table
                        show-expand
                        :loading="id === 'Global' && loading"
                        :headers="headers"
                        :items="scores"
                        class="data-table"
                        item-key="number"
                        :items-per-page="10"
                        :single-expand="singleExpand"
                        disable-sort
                        :expanded.sync="expanded"
                        :mobile-breakpoint="400"
                        loading-text="Loading scores... Please wait">
                    <template v-slot:expanded-item="{ headers, item }">
                        <td :colspan="headers.length">
                            <div class="stats">
                                <span v-for="{text, value} in unlistedStats" :key="value" class="stat">
                                    <span v-if="value==='distance'">{{text}}: <span class="stat-value">{{formatDistance(item[value])}}</span></span>
                                    <span v-else>{{text}}: <span class="stat-value">{{item[value]}}</span></span>
                                </span>
                            </div>
                            <p class="round-score" v-for="({score, distance}, i) in item.scores" :key="i">
                                <span class="round-text">Round {{i+1}}</span><br>
                                <span class="score-text">Score:</span> <span class="round-value">{{score}}</span><br>
                                <span class="score-text">Distance:</span> <span class="round-value">{{formatDistance(distance)}}</span>
                            </p>
                        </td>
                    </template>
                </v-data-table>
            </div>
            <div class="bottom-buttons">
                <v-btn :to="`/play?map=${map.id}&difficulty=${difficultyId}`" filled color="primary">Play this map
                </v-btn>
                <v-btn to="/" outlined>Homepage</v-btn>
            </div>
        </div>
        <!--        <div class="background-image" :style="`background-image: ${bgImage}`"></div>-->
    </div>
</template>

<script>
    import Rules from "../js/Rules";

    export default {
        name: 'Scores',
        components: {},
        data() {
            return {
                singleExpand: false,
                selectedDifficulty: 'Normal',
                scoreTypes: Rules.presetNames.filter(p => p !== 'Custom'),
                compoundScores: [{id: "Global", scores: [], expanded: [],}],
                map: null,
                image: '',
                loading: false,
                refresh: false,
                windowWidth: window.innerWidth,
            }
        },
        async mounted() {
            if (this.map !== null)
                document.title = `${this.map.name} Highscores - LocationEstimatr`;
            else
                document.title = `Highscores - LocationEstimatr`;
            window.onresize = () => this.windowWidth = window.innerWidth;
            if (this.$route.query.hasOwnProperty('refresh'))
                this.refresh = this.$route.query['refresh'] === 'true';
            if (this.$route.query.hasOwnProperty('map')) {
                let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
                mapInfo.id = this.$route.query.map;
                if (mapInfo.image === 'id')
                    mapInfo.image = '/images/user/' + this.$route.query.map;
                this.$store.dispatch('getUrl', mapInfo.image).then(imageUrl => {
                    console.log("IMAGE URL", imageUrl);
                    this.image = imageUrl;
                });
                console.log(mapInfo);
                this.map = mapInfo;
            } else {
                alert("Malformed URL :(");
            }
            if (this.$route.query.hasOwnProperty('difficulty'))
                this.selectedDifficulty = Rules.presetNames[+this.$route.query['difficulty']];
            await this.loadScores();
        },
        methods: {
            parseScores(rawScores) {
                return rawScores.map((score, i) => {
                    let date = new Date(score.date);
                    return {
                        user: score.user,
                        date: date.toLocaleDateString(),
                        totalDistance: this.formatDistance(score.totalDistance),
                        totalScore: score.totalScore,
                        timeTaken: this.msToTime(score.timeTaken),
                        number: i + 1,
                        scores: score.scores,
                    }
                });
            },
            async loadScores() {
                if (this.map && this.map.id && this.selectedDifficulty && !this.loading) {
                    try {
                        let localScores = JSON.parse(localStorage.scores)[this.map.id].filter(score => score.rules === this.difficultyId);
                        console.log(localScores);
                        this.compoundScores[1] = {
                            scores: this.parseScores(localScores),
                            id: 'Local',
                            expanded: [],
                        };
                    } catch (e) {
                        this.compoundScores[1] = {
                            scores: [],
                            id: 'Local',
                            expanded: [],
                        };
                    }
                    this.loading = true;

                    console.log("Load scores for", this.map.id, "difficulty", this.selectedDifficulty);
                    let scores = await this.$store.dispatch('getScoresByDifficultyAndMap', {
                        difficulty: this.difficultyId,
                        map: this.map.id,
                        refresh: this.refresh,
                    });
                    this.refresh = false;
                    try {
                        await this.$router.replace({
                            query: {
                                map: this.map.id,
                                difficulty: this.difficultyId,
                                refresh: this.refresh,
                            }
                        });
                    } catch (e) {
                        //ignored
                    }
                    this.compoundScores[0] = {
                        scores: this.parseScores(scores),
                        id: 'Global',
                        expanded: [],
                    };


                    this.loading = false;
                }
            },
            msToTime(ms) {
                let s = ms / 1000;
                let hours = Math.floor(s / 3600);
                let minutes = Math.floor((s % 3600) / 60);
                let seconds = s % 60;
                if (hours !== 0)
                    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${Math.floor(seconds).toString().padStart(2, '0')}s`;
                if (minutes !== 0)
                    return `${minutes}m ${Math.floor(seconds).toString().padStart(2, '0')}s`;
                if (seconds > 20)
                    return Math.round(seconds) + 's';
                return (Math.round(seconds * 10) / 10).toFixed(1) + 's';
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
        },
        watch: {
            async selectedDifficulty() {
                await this.loadScores();
            },
            async selectedTimePeriod() {
                await this.loadScores();
            },
            expanded() {
                console.log(this.expanded);
            },
            singleExpand() {
                console.log(this.singleExpand)
            },
            map() {
                document.title = `${this.map.name} Highscores - LocationEstimatr`;
            },
        },
        computed: {
            unlistedStats() {
                if (this.windowWidth < 400) {
                    return [
                        {text: 'Total Distance', value: 'totalDistance',},
                        {text: 'Time Taken', value: 'timeTaken',},
                        {text: 'Date', value: 'date',}
                    ]
                } else if (this.windowWidth < 650) {
                    return [
                        {text: 'Time Taken', value: 'timeTaken'},
                        {text: 'Date', value: 'date',}
                    ]
                }
                return [{text: 'Date', value: 'date',}];
            },
            headers() {
                if (this.windowWidth < 400) {
                    return [
                        {text: 'User', value: 'user',},
                        {text: 'Score', align: 'right', value: 'totalScore',},
                    ];
                } else if (this.windowWidth < 600) {
                    return [
                        {text: 'User', value: 'user',},
                        {text: 'Score', align: 'right', value: 'totalScore',},
                        {text: 'Total Distance', value: 'totalDistance', align: 'right'},
                    ];
                } else if (this.windowWidth < 650) {
                    return [
                        {text: '#', value: 'number', align: 'right'},
                        {text: 'User', value: 'user',},
                        {text: 'Score', align: 'right', value: 'totalScore',},
                        {text: 'Total Distance', value: 'totalDistance', align: 'right'},
                    ];
                }
                return [
                    {text: '#', value: 'number', align: 'right'},
                    {text: 'User', value: 'user',},
                    {text: 'Score', align: 'right', value: 'totalScore',},
                    {text: 'Total Distance', value: 'totalDistance', align: 'right'},
                    {text: 'Time Taken', value: 'timeTaken', align: 'right'},
                ];
            },
            mobile() {
                this.windowWidth < 630;
            },
            difficultyId() {
                return Rules.presetNames.indexOf(this.selectedDifficulty);
            },
        }
    }
</script>

<style scoped>
    .scores {
        overflow-y: auto;
    }

    .score-title {
        position: absolute;
        bottom: 0;
        padding: 20px;
    }

    .banner-image {
        margin-left: -20px;
        margin-top: -20px;
        margin-bottom: 20px;
        height: 400px;
        width: calc(100% + 40px);
        max-width: 100vw;
    }

    .select {
        max-width: 300px;
        display: inline-block;
    }

    .scores-container {
        width: calc(100% - 40px);
        justify-content: center;
        max-width: 900px;
        border-radius: 10px;
        display: block;
        margin: 20px auto;
        overflow: hidden;
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2);
        z-index: 4;
        padding: 20px;
        background-color: rgba(0, 0, 0, 0.2);
    }

    @media screen and (max-width: 900px) {
        .scores-container {
            margin: 0;
            width: 100%;
        }

    }

    @media screen and (max-width: 600px) {
        .banner-image {
            height: 300px;
        }
    }

    .data-table {
        margin-bottom: 20px;
    }

    .bottom-buttons {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }

    .bottom-buttons > * {
        margin: 10px;
    }

    .expand-title {
        margin: 20px 0;
    }

    .individual-score {
        width: 100%;
        padding: 11px 0;
        margin: 0;
        font-size: 12px;
        opacity: 0.8;
    }

    .stats {
        display: flex;
        justify-content: center;
        color: rgba(255, 255, 255, 0.8);
    }

    .stat {
        display: inline-block;
        margin: 0;
        padding: 15px;
        text-transform: uppercase;
        font-size: 12px;
    }

    .stat-value {
        color: white;
    }

    .round-score {
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
    }

    .score-text {
        font-style: italic;
    }

    .round-text {
        text-transform: uppercase;
    }

    .round-value {
        font-weight: bold;
        color: white;
    }
</style>
