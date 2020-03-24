<template>
    <div class="play-map">
        <rules class="rules" v-if="!gameStarted" @startGame="startGame" ref="rules" :challenge-rules="challengeRules"
               :challenge-map="challengeMap"></rules>
        <game v-show="gameStarted" :rules="rules" :map="map" :challenge="challenge" ref="game"></game>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";
    import Rules from "../components/Rules";
    import RulesObject from '../js/Rules'
    import Game from "../components/Game";

    export default {
        name: 'PlayMap',
        components: {Game, Rules},
        data() {
            return {
                gameStarted: false,
                rules: null,
                map: null,
                challengeRules: null,
                challengeMap: null,
                challenge: null,
            }
        },
        async mounted() {
            if (this.$route.query.hasOwnProperty('map')) {
                let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
                console.log(mapInfo);
                this.map = await MapManager.mapToGeoMap(mapInfo, this.$route.query.map);
                // this.startGame(this.$refs.rules.exportRules())
            } else if (this.$route.query.hasOwnProperty('challenge')) {
                let {challenge, map} = await this.$store.dispatch('getChallenge', this.$route.query.challenge);
                if (typeof challenge.rules === 'number')
                    challenge.rules = RulesObject.presets[RulesObject.presetNames[challenge.rules]];
                else
                    challenge.rules = new RulesObject(challenge.rules);
                console.log("Challenge rules", challenge.rules);
                this.challenge = challenge;
                this.challengeRules = challenge.rules;
                this.rules = challenge.rules;
                this.challengeMap = await MapManager.mapToGeoMap(map, challenge.map);
                this.map = this.challengeMap;
                console.log({challenge, map})
            }
        },
        methods: {
            startGame(rules) {
                console.log({rules});
                this.rules = rules;
                this.gameStarted = true;
                this.$refs.game.start();
            }
        }
    }
</script>

<style scoped>
    .play-map {
        height: 100%;
        width: 100%;
        display: flex;
        overflow-y: hidden;
        justify-content: center;
        background-color: rgb(9, 6, 50);
        background-image: linear-gradient(180deg, rgba(9, 6, 50, 1) 0%, rgba(24, 150, 202, 1) 77%, rgba(26, 231, 219, 1) 100%);
    }

    .rules {
        margin-top: 50px;
    }
</style>
