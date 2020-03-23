<template>
    <div class="rules">
        <v-card class="rules-card">
            <v-card-title>Game Rules</v-card-title>
            <v-card-text>
                <v-form ref="form"
                        v-model="valid"
                        :lazy-validation="true">
                    <v-select v-model="selectedDifficulty"
                              :items="difficulties"
                              outlined
                              label="Difficulty"
                              required></v-select>
                    <div v-if="selectedDifficulty === 'Custom'" class="custom-difficulty">
                        <h3>Round count</h3>
                        <v-chip-group class="chips" active-class="primary--text" mandatory v-model="rules.roundIndex">
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
                            <v-chip>{{rounds[rules.roundIndex]}} round{{rules.moveLimit === 1 ? '' : 's'}}</v-chip>
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
                            <v-chip v-if="rules.objective === 1" light :color="$store.state.color">
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

    export default {
        name: 'Rules',
        components: {},
        data: () => ({
            valid: true,
            selectedDifficulty: 'Normal',
            difficulties: [
                'Easy', 'Normal', 'Hard', 'Extreme', 'Custom'
            ],
            difficultyRules: {
                Easy: {
                    zoomAllowed: true,
                    panAllowed: true,
                    unlimitedTime: true,
                    unlimitedMoves: true,
                    moveLimit: -1,
                    timeLimit: -1,
                    roundIndex: 4,
                    objective: 1,
                },
                Normal: {
                    zoomAllowed: true,
                    panAllowed: true,
                    unlimitedTime: true,
                    unlimitedMoves: true,
                    moveLimit: -1,
                    timeLimit: -1,
                    roundIndex: 4,
                    objective: 0,
                },
                Hard: {
                    zoomAllowed: true,
                    panAllowed: true,
                    unlimitedTime: true,
                    unlimitedMoves: false,
                    moveLimit: 0,
                    timeLimit: -1,
                    roundIndex: 4,
                    objective: 0,
                },
                Extreme: {
                    zoomAllowed: false,
                    panAllowed: false,
                    unlimitedTime: false,
                    unlimitedMoves: false,
                    moveLimit: 0,
                    timeLimit: 10,
                    roundIndex: 4,
                    objective: 0,
                },
                Custom: {
                    zoomAllowed: true,
                    panAllowed: true,
                    unlimitedTime: true,
                    unlimitedMoves: true,
                    timeLimit: 30,
                    moveLimit: 5,
                    roundIndex: 4,
                    objective: 0,
                }
            },
            rounds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            objectives: ["Guess starting location", "Guess camera location"],
        }),
        async mounted() {

        },
        methods: {
            exportRules() {
                return new Rules({
                    zoomAllowed: this.rules.zoomAllowed,
                    panAllowed: this.rules.panAllowed,
                    unlimitedTime: this.rules.unlimitedTime,
                    unlimitedMoves: this.rules.unlimitedMoves,
                    timeLimit: this.rules.timeLimit,
                    moveLimit: this.rules.moveLimit,
                    roundCount: this.rounds[this.rules.roundIndex],
                    objective: this.rules.objective,
                    preset: this.difficulties.indexOf(this.selectedDifficulty),
                });
            }
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
        width: 500px;
    }

    .chips > * {
        margin: 5px;
    }

    .number-input {
        /*margin-top: 20px;*/
    }
</style>
