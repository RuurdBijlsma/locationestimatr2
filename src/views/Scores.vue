<template>
    <div class="scores" v-if="map !== null">
        <div class="scores-container">
            <v-img :src="image" class="banner-image"
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
            <div v-for="{id, scores} in compoundScores"
                 :key="id">
                <h2>{{id}} Scores</h2>
                <v-data-table
                        show-expand
                        :loading="id === 'Global' && loading"
                        :headers="headers"
                        :items="scores"
                        class="data-table"
                        item-key="number"
                        :single-expand="singleExpand"
                        :expanded.sync="expanded"
                        loading-text="Loading scores... Please wait">
                    <template v-slot:expanded-item="{ headers, item }">
                        <td colspan="2"></td>
                        <td colspan="1">
                            <p class="individual-score" v-for="(_, i) of item.scores">Round {{i+1}}:</p>
                        </td>
                        <td colspan="1">
                            <p class="individual-score text-right" v-for="{score, distance} of item.scores"
                               :key="distance">
                                {{score}}</p>
                        </td>
                        <td colspan="1">
                            <p class="individual-score text-right" v-for="{distance} of item.scores" :key="distance">
                                {{formatDistance(distance)}}</p>
                        </td>
                    </template>
                </v-data-table>
            </div>
            <div class="bottom-buttons">
                <v-btn :to="`/play?map=${map.id}`" filled color="primary">Play this map</v-btn>
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
                expanded: [],
                singleExpand: false,
                headers: [
                    {text: '#', sortable: false, value: 'number',},
                    {text: 'User', sortable: false, value: 'user',},
                    {text: 'Score', sortable: false, align: 'right', value: 'totalScore',},
                    {text: 'Total Distance', value: 'totalDistance', sortable: false, align: 'right'},
                    {text: 'Time Taken', value: 'timeTaken', sortable: false, align: 'right'},
                    {text: 'Date', value: 'date', sortable: false,},
                ],
                selectedDifficulty: 'Normal',
                scoreTypes: Rules.presetNames.filter(p => p !== 'Custom'),
                compoundScores: [{id: "Global", scores: [], loading: false,}],
                map: null,
                image: '',
                loading: false,
                refresh: false,
            }
        },
        async mounted() {
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
                        };
                    } catch (e) {
                        this.compoundScores[1] = {
                            scores: [],
                            id: 'Local',
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
            }
        },
        computed: {
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
        max-width: 200px;
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
</style>
