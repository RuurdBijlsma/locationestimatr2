<template>
    <div class="rules-display" v-if="rules !== null">
        <v-chip>{{rules.roundCount}} round{{rules.roundCount === 1 ? '' : 's'}}</v-chip>
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
        <v-chip v-if="!isPoint">StreetView: {{svTypes[rules.svType]}}</v-chip>
        <v-chip v-if="!isPoint">RNG: {{distributionTypes[rules.distribution]}}</v-chip>
    </div>
</template>

<script>
    import Rules from "../js/Rules";

    export default {
        name: "RulesDisplay",
        props: {
            rules: {
                type: Object,
                default: null,
            },
            isPoint: {
                type: Boolean,
                default: false,
            },
        },
        data: () => ({
            objectives: ["Guess starting location", "Guess camera location"],
            distributionTypes: Rules.distributionTypes,
            svTypes: Rules.svTypes,
        }),
    }
</script>

<style scoped>
    .rules-display > * {
        margin: 5px;
    }
</style>