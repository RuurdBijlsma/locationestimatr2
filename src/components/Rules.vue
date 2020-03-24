<template>
    <div class="rules">
        <v-card class="rules-card">
            <v-card-title v-if="challengeRules === null">Game Rules</v-card-title>
            <v-card-title v-else>You've been challenged!</v-card-title>
            <v-card-subtitle v-if="challengeMap !== null && challengeRules !== null">
                Play Location Estimatr in "{{challengeMap.name}}" using the following difficulty rules:
            </v-card-subtitle>
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
                            <v-chip>{{rounds[rules.roundCount - 1]}} round{{rules.roundCount - 1 === 1 ? '' : 's'}}
                            </v-chip>
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
                                Objective: {{objectives[rules.objective]}}
                            </v-chip>
                            <v-chip title="With this objective you try to guess where the StreetView camera is at the time of guessing, instead of where you started."
                                    v-if="rules.objective === 1" light :color="$store.state.color">
                                Objective: {{objectives[rules.objective]}}
                                <v-icon right>priority_high</v-icon>
                            </v-chip>
                        </div>
                    </div>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn :color="$store.state.color" text @click="$emit('startGame', exportRules())">Start game</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>

    import Rules from "../js/Rules";
    import GeoMap from "../js/GeoMap";

    export default {
        name: 'Rules',
        components: {},
        props: {
            challengeRules: {
                type: Rules,
                default: null,
            },
            challengeMap: {
                type: GeoMap,
                default: null,
            }
        },
        data: () => ({
            customRoundIndex: 4,
            valid: true,
            selectedDifficulty: 'Normal',
            difficulties: [
                'Easy', 'Normal', 'Hard', 'Extreme', 'Custom'
            ],
            difficultyRules: Rules.presets,
            rounds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            objectives: ["Guess starting location", "Guess camera location"],
        }),
        async mounted() {

        },
        methods: {
            exportRules() {
                return this.rules;
            }
        },
        watch: {
            customRoundIndex() {
                this.rules.roundCount = this.customRoundIndex + 1;
            },
            challengeRules() {
                this.selectedDifficulty = this.challengeRules.presetName;
                if (this.challengeRules.presetName === 'Custom') {
                    this.difficultyRules['Custom'] = this.challengeRules;
                    this.customRoundIndex = this.challengeRules.roundCount - 1;
                }
            },
        },
        computed: {
            rules() {
                return this.difficultyRules[this.selectedDifficulty];
            }
        }
    }
</script>

<style scoped>
    .rules-card {
        display: inline-block;
        max-width: 500px;
        width: 100%;
    }

    .chips > * {
        margin: 5px;
    }

    .number-input {
        /*margin-top: 20px;*/
    }
</style>
