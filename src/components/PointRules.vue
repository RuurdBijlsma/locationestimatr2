<template>
    <div class="point-rules">
        <v-card class="rules-card">
            <v-img :src="image" class="banner-image"
                   aspect-ratio="3/5"
                   gradient="to top, rgba(25,32,72,.7), rgba(100,115,201,.13)">
                <h1 class="game-title" v-if="map !== null">{{map.name}}</h1>
            </v-img>
            <v-card-title v-if="challengeRules === null">Game Rules</v-card-title>
            <v-card-title v-else>You've been challenged!</v-card-title>
            <v-card-text v-if="challengeMap !== null && challengeRules !== null">
                Play Location Estimatr in "{{challengeMap.name}}" using the following difficulty rules:
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
                    <div v-else>
                        <div class="chips">
                            <v-chip>{{roundCount}} round{{roundCount === 1 ? '' : 's'}}</v-chip>
                            <v-chip v-if="rules.zoomAllowed">Zooming Allowed</v-chip>
                            <v-chip v-else>Zooming Restricted</v-chip>
                            <v-chip v-if="rules.panAllowed">Panning Allowed</v-chip>
                            <v-chip v-else>Panning Restricted</v-chip>
                            <v-chip v-if="rules.unlimitedMoves">Unlimited Moves</v-chip>
                            <v-chip v-else>{{rules.moveLimit}} move{{rules.moveLimit === 1 ? '' : 's'}}</v-chip>
                            <v-chip v-if="rules.unlimitedTime">Unlimited Time</v-chip>
                            <v-chip v-else>{{rules.timeLimit}} second{{rules.timeLimit === 1 ? '' : 's'}} per round
                            </v-chip>
                            <v-chip v-if="rules.objective === 0">
                                {{objectives[rules.objective]}}
                            </v-chip>
                            <v-chip title="With this objective you try to guess where the StreetView camera is at the time of guessing, instead of where you started."
                                    v-if="rules.objective === 1" light color='primary'>
                                {{objectives[rules.objective]}}
                                <v-icon right>priority_high</v-icon>
                            </v-chip>
                        </div>
                    </div>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn color='primary' text @click="$emit('startGame', exportRules())" :loading="loading">Start game
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>

    import PointRules from "../js/PointRules";
    import GeoMap from "../js/GeoMap";
    import Rules from "../js/Rules";

    export default {
        name: 'PointRules',
        components: {},
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
            map: {
                type: GeoMap,
                default: null,
            },
            image: {
                type: String,
                default: '',
            }
        },
        data: () => ({
            valid: true,
            selectedDifficulty: 'Normal',
            difficulties: PointRules.presetNames,
            difficultyRules: PointRules.presets,
            objectives: ["Guess starting location", "Guess camera location"],
        }),
        async mounted() {
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
                this.selectedDifficulty = this.challengeRules.presetName;
                if (this.challengeRules.presetName === 'Custom') {
                    this.difficultyRules['Custom'] = this.challengeRules;
                    this.customRoundIndex = this.challengeRules.roundCount - 1;
                }
            },
            exportRules() {
                return this.rules;
            }
        },
        watch: {
            selectedDifficulty() {
                if (this.challengeMap || this.challengeRules)
                    return;
                try {
                    localStorage.lastPlayedPointDifficulty = this.difficultyId;
                    console.log("Replacing route!", {
                        selDiff: this.selectedDifficulty,
                        map: this.map.id,
                        difficulty: this.difficultyId
                    });
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
                this.rules.roundCount = this.customRoundIndex + 1;
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
                this.difficultyRules[this.selectedDifficulty].roundCount = this.roundCount;
                return this.difficultyRules[this.selectedDifficulty];
            },
            roundCount() {
                if (this.map !== null)
                    return this.map.points.length;
            }
        }
    }
</script>

<style scoped>
    .rules-card {
        height: auto;
    }

    @media screen and (max-width: 550px) {
        .rules-card {
            height: 100%;
        }
    }


    .chips > * {
        margin: 5px;
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
