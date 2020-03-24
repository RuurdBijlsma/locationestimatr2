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
            if (this.$route.query.hasOwnProperty('challenge')) {
                let {challenge, map} = await this.$store.dispatch('getChallenge', this.$route.query.challenge);
                if (typeof challenge.rules === 'number')
                    challenge.rules = RulesObject.presets[RulesObject.presetNames[challenge.rules]];
                else
                    challenge.rules = new RulesObject(challenge.rules);
                console.log("Challenge rules", challenge.rules);
                this.challenge = challenge;
                this.challengeRules = challenge.rules;
                this.rules = challenge.rules;
                if (map === 'my_area') {
                    if (this.$route.query.hasOwnProperty('area_coordinates') && this.$route.query.hasOwnProperty('area_radius')) {
                        let coordinates = this.$route.query['area_coordinates'].split(',').map(n => +n);
                        let radius = +this.$route.query['area_radius'] * 1000;
                        this.challengeMap = await MapManager.areaToGeoMap(coordinates, radius);
                        this.map = this.challengeMap;
                    } else {
                        alert("Malformed challenge url");
                    }
                } else {
                    this.challengeMap = await MapManager.mapToGeoMap(map, challenge.map);
                    this.map = this.challengeMap;
                }
                console.log({challenge, map})
            } else if (this.$route.query.hasOwnProperty('area_coordinates') && this.$route.query.hasOwnProperty('area_radius')) {
                let coordinates = this.$route.query['area_coordinates'].split(',').map(n => +n);
                let radius = +this.$route.query['area_radius'] * 1000;
                this.map = await MapManager.areaToGeoMap(coordinates, radius);
            } else if (this.$route.query.hasOwnProperty('map')) {
                let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
                console.log(mapInfo);
                this.map = await MapManager.mapToGeoMap(mapInfo, this.$route.query.map);
                // this.startGame(this.$refs.rules.exportRules())
            } else {
                alert("Malformed URL :(");
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
        transition: margin-top 0.3s;
    }

    @media screen and (max-width: 500px) {
        .rules {
            margin-top: 0;
        }
    }
</style>
