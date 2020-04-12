<template>
    <div class="point-rules">
        <v-card class="rules-card">
            <v-img :src="image" class="banner-image"
                   aspect-ratio="3/5"
                   gradient="to top, rgba(25,32,72,.7), rgba(100,115,201,.13)">
                <h1 class="game-title" v-if="map !== null">{{map.name}}</h1>
            </v-img>
            <v-card-title v-if="challengeRules === null">Game Rules</v-card-title>
            <v-card-title v-else-if="!mpChallenge">You've been challenged!</v-card-title>
            <v-card-title v-else>Play with friend!</v-card-title>
            <v-card-text v-if="challengeMap !== null && challengeRules !== null && !mpChallenge">
                Play Location Estimatr in "{{challengeMap.name}}" using the following difficulty rules:
            </v-card-text>
            <v-card-text v-else-if="challengeMap !== null && challengeRules !== null">
                Anyone using this link: <a :href="url">{{url}}</a>
                will get the same rules, map and locations as you! Score comparison at the end of the round isn't implemented (yet).
            </v-card-text>
            <v-card-text>
                <v-form ref="form"
                        v-model="valid"
                        :lazy-validation="true">
                    <v-select v-model="selectedDifficulty"
                              :disabled="challengeRules !== null"
                              :items="difficulties"
                              outlined
                              label="Difficulty"
                              required></v-select>
                    <div v-if="selectedDifficulty === 'Custom' && challengeRules === null" class="custom-difficulty">
                        <h3>Round count</h3>
                        <v-chip-group class="chips" active-class="primary--text" mandatory v-model="customRoundIndex">
                            <v-chip v-for="round in rounds">
                                {{round}}
                            </v-chip>
                        </v-chip-group>
                        <v-switch label="Unlimited Time" v-model="rules.unlimitedTime"></v-switch>
                        <v-text-field v-if="!rules.unlimitedTime" class="number-input" outlined type="number"
                                      label="Time Limit (seconds)" v-model="rules.timeLimit"></v-text-field>
                        <v-switch label="Unlimited Moves" v-model="rules.unlimitedMoves"></v-switch>
                        <v-text-field v-if="!rules.unlimitedMoves" class="number-input" outlined type="number"
                                      label="Move Limit" v-model="rules.moveLimit"></v-text-field>
                        <v-switch label="Zoom Allowed" v-model="rules.zoomAllowed"></v-switch>
                        <v-switch label="Pan Allowed" v-model="rules.panAllowed"></v-switch>
                        <h3>Objective</h3>
                        <v-chip-group class="chips" active-class="primary--text" mandatory v-model="rules.objective">
                            <v-chip v-for="objective in objectives">
                                {{objective}}
                            </v-chip>
                        </v-chip-group>
                    </div>
                    <rules-display v-else :rules="rules" :is-point="true"></rules-display>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn color='primary' text @click="$emit('startGame', exportRules())" :loading="loading">
                    Start game
                </v-btn>
                <v-btn v-if="challengeRules === null" color='grey' text @click="$emit('hostGame', exportRules())"
                       :loading="loadingHost">
                    Play with friend
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>

    import PointRules from "../js/PointRules";
    import GeoMap from "../js/GeoMap";
    import Rules from "../js/Rules";
    import RulesDisplay from "./RulesDisplay";

    export default {
        name: 'PointRules',
        components: {RulesDisplay},
        props: {
            challengeRules: {
                type: PointRules,
                default: null,
            },
            challengeMap: {
                type: GeoMap,
                default: null,
            },
            loading: {
                type: Boolean,
                default: false,
            },
            loadingHost: {
                type: Boolean,
                default: false,
            },
            map: {
                type: GeoMap,
                default: null,
            },
            image: {
                type: String,
                default: '',
            },
            mpChallenge: {
                type: Boolean,
                default: '',
            },
        },
        data: () => ({
            customRoundIndex: 4,
            valid: true,
            selectedDifficulty: 'Normal',
            difficulties: PointRules.presetNames,
            difficultyRules: PointRules.presets,
            objectives: ["Guess starting location", "Guess camera location"],
            url: location.href,
        }),
        async mounted() {
            this.customRoundIndex = this.rounds.indexOf(this.defaultRoundCount);
            let difficulty;
            if (this.challengeRules) {
                console.log(this.setChallengeRules);
                this.setChallengeRules(this.challengeRules);
            } else if (this.$route.query.hasOwnProperty('difficulty')) {
                difficulty = +this.$route.query['difficulty']
            } else if (localStorage.getItem('lastPlayedPointDifficulty') !== null) {
                difficulty = +localStorage.lastPlayedPointDifficulty;
            }
            if (difficulty) {
                this.selectedDifficulty = PointRules.presetNames[Math.min(Math.max(difficulty, 0), PointRules.presetNames.length)];
            }
        },
        methods: {
            setChallengeRules(challengeRules) {
                this.selectedDifficulty = challengeRules.presetName;
                if (challengeRules.presetName === 'Custom') {
                    this.difficultyRules['Custom'] = challengeRules;
                    this.customRoundIndex = challengeRules.roundCount - 1;
                }
            },
            exportRules() {
                return this.rules;
            }
        },
        watch: {
            $route() {
                this.url = location.href;
            },
            selectedDifficulty() {
                if (this.challengeMap || this.challengeRules)
                    return;
                localStorage.lastPlayedPointDifficulty = this.difficultyId;
                console.log("Replacing route!", {
                    selDiff: this.selectedDifficulty,
                    map: this.map.id,
                    difficulty: this.difficultyId
                });
                try {
                    if (this.$route.query.map !== this.map.id || this.$route.query.difficulty !== this.difficultyId)
                        this.$router.replace({
                            query: {
                                map: this.map.id,
                                difficulty: this.difficultyId,
                            }
                        });
                } catch (e) {
                }
            },
            customRoundIndex() {
                this.rules.roundCount = this.rounds[this.customRoundIndex];
            },
            challengeRules() {
                this.setChallengeRules(this.challengeRules);
            },
        },
        computed: {
            difficultyId() {
                return PointRules.presetNames.indexOf(this.selectedDifficulty);
            },
            rules() {
                if (this.difficultyRules[this.selectedDifficulty].roundCount === -1)
                    this.difficultyRules[this.selectedDifficulty].roundCount = this.defaultRoundCount;
                return this.difficultyRules[this.selectedDifficulty];
            },
            rounds() {
                let mapRoundCount = this.map.points.length;
                const maxRoundsShown = 10;
                let roundCount = Math.min(mapRoundCount, maxRoundsShown);
                let rounds = [...new Array(roundCount)].map((_, i) => i + 1);
                if (mapRoundCount > maxRoundsShown)
                    rounds[rounds.length - 1] = mapRoundCount;
                console.log(roundCount, rounds);
                return rounds;
            },
            defaultRoundCount() {
                let maxRound = this.rounds[this.rounds.length - 1];
                let roundCount = Math.min(maxRound, 5);
                console.log({roundCount});
                return roundCount;
            },
        }
    }
</script>

<style scoped>
    .rules-card {
        height: auto;
    }

    @media screen and (max-width: 550px) {
        .rules-card {
            margin-bottom: 60px;
            min-height: 100%;
        }
    }

    .number-input {
        /*margin-top: 20px;*/
    }

    .banner-image {
        min-height: 300px;
        width: 100%;
    }

    .game-title {
        position: absolute;
        padding: 20px;
        bottom: 0;
    }
</style>
