<template>
    <div class="rules">
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
                        <h3>StreetView type</h3>
                        <v-chip-group class="chips" active-class="primary--text" mandatory v-model="rules.svType">
                            <v-chip v-for="svType in svTypes">
                                {{svType}}
                            </v-chip>
                        </v-chip-group>
                        <v-tooltip bottom>
                            <template v-slot:activator="{ on }">
                                <h3 v-on="on">Random location generator</h3>
                            </template>
                            <span>
                                Determines how random location is picked, 'uniform' picks randomly on earth, while 'weighted' chooses based on the amount of StreetView coverage in that area.
                                <br>
                                'uniform' generally finds a more remote location, while 'weighted' is more likely to go to populated areas.
                            </span>
                        </v-tooltip>
                        <v-chip-group class="chips" active-class="primary--text" mandatory v-model="rules.distribution">
                            <v-chip v-for="dType in distributionTypes">
                                {{dType}}
                            </v-chip>
                        </v-chip-group>
                        <p v-if="rules.svType===2">
                            <v-icon color="warning">warning</v-icon>
                            In regions with low StreetView coverage PhotoSpheres will occur disproportionally often.
                        </p>
                    </div>
                    <rules-display v-else :rules="rules"></rules-display>
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

    import Rules from "../js/Rules";
    import GeoMap from "../js/GeoMap";
    import PointRules from "../js/PointRules";
    import RulesDisplay from "./RulesDisplay";

    export default {
        name: 'Rules',
        components: {RulesDisplay},
        props: {
            challengeRules: {
                type: Rules,
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
            challengeMap: {
                type: GeoMap,
                default: null,
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
            rounds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            valid: true,
            selectedDifficulty: 'Normal',
            difficulties: Rules.presetNames,
            difficultyRules: Rules.presets,
            objectives: ["Guess starting location", "Guess camera location"],
            distributionTypes: Rules.distributionTypes,
            svTypes: Rules.svTypes,
            url: location.href,
        }),
        async mounted() {
            let difficulty;
            if (this.challengeRules) {
                console.log(this.setChallengeRules);
                this.setChallengeRules(this.challengeRules);
            } else if (this.$route.query.hasOwnProperty('difficulty')) {
                difficulty = +this.$route.query['difficulty'];
            } else if (localStorage.getItem('lastPlayedDifficulty') !== null) {
                difficulty = +localStorage.lastPlayedDifficulty;
            }
            if (difficulty !== undefined)
                this.selectedDifficulty = Rules.presetNames[Math.min(Math.max(difficulty, 0), Rules.presetNames.length)];
        },
        methods: {
            setChallengeRules(challengeRules) {
                this.selectedDifficulty = challengeRules.presetName;
                console.log("Setting challenge rules", challengeRules);
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
                try {
                    localStorage.lastPlayedDifficulty = this.difficultyId;
                    this.customRoundIndex = this.rules.roundCount - 1;
                    if (this.$route.query.hasOwnProperty('area_coordinates') && this.$route.query.hasOwnProperty('area_radius')) {
                        this.$router.replace({
                            query: {
                                area_coordinates: this.$route.query.area_coordinates,
                                area_radius: this.$route.query.area_radius,
                                difficulty: this.difficultyId,
                            }
                        });
                    } else {
                        this.$router.replace({
                            query: {
                                map: this.map.id,
                                difficulty: this.difficultyId,
                            }
                        });
                    }
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
                let ind = Rules.presetNames.indexOf(this.selectedDifficulty);
                return ind === -1 ? 0 : ind;
            },
            rules() {
                return this.difficultyRules[this.selectedDifficulty];
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
