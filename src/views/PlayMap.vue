<template>
    <div class="play-map">
        <div class="rules-container" v-if="gameState < 2">
            <point-rules class="rules" v-if="map && map.type==='point'"
                         @startGame="startGame"
                         ref="pointRules"
                         :challenge-rules="challengePointRules"
                         :image="image"
                         :map="map"
                         :loading="gameState === 1"
                         :challenge-map="challengeMap"></point-rules>
            <rules class="rules" v-else-if="map" @startGame="startGame" ref="rules"
                   :challenge-rules="challengeRules"
                   :image="image"
                   :loading="gameState === 1"
                   :map="map"
                   :challenge-map="challengeMap"></rules>
        </div>
        <game ref="game" @gameLoad.once="loadGame" class="game" @failed="gameFail"></game>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";
    import Rules from "../components/Rules";
    import RulesObject from '../js/Rules'
    import PointRulesObject from '../js/PointRules'
    import Game from "../components/Game";
    import StreetView from "../js/StreetView";
    import PointRules from "../components/PointRules";

    export default {
        name: 'PlayMap',
        components: {PointRules, Game, Rules},
        data() {
            return {
                gameState: 0,
                rules: null,
                map: null,
                challengeRules: null,
                challengePointRules: null,
                challengeMap: null,
                challenge: null,
                image: '',
            }
        },
        async mounted() {
            this.$store.commit('setImmersive', false);
            if (this.$route.query.hasOwnProperty('challenge')) {
                let {challenge, map} = await this.$store.dispatch('getChallenge', this.$route.query.challenge);
                const RulesClass = map.type === 'points' ? PointRulesObject : RulesObject;
                let r = challenge.rules;
                if (typeof challenge.rules === 'number') {
                    challenge.rules = RulesClass.presets[RulesClass.presetNames[challenge.rules]];
                    console.log("HERE1");
                } else {
                    challenge.rules = new RulesClass(challenge.rules);
                    console.log("HERE2");
                }
                console.log("Challenge rules", challenge.rules, 'RulesClass', RulesClass, RulesClass.presetNames[r]);
                this.challenge = challenge;
                if (map.type === 'points') {
                    this.challengePointRules = challenge.rules;
                } else {
                    this.challengeRules = challenge.rules;
                }
                this.rules = challenge.rules;
                if (map === 'my_area') {
                    if (this.$route.query.hasOwnProperty('area_coordinates') && this.$route.query.hasOwnProperty('area_radius')) {
                        let coordinates = this.$route.query['area_coordinates'].split(',').map(n => +n);
                        let radius = +this.$route.query['area_radius'] * 1000;
                        this.challengeMap = await MapManager.areaToGeoMap(coordinates, radius);
                        this.map = this.challengeMap;
                        map = {image: '/images/my_area.jpg'};
                    } else {
                        alert("Malformed challenge url");
                    }
                } else {
                    this.challengeMap = await MapManager.mapToGeoMap(map, challenge.map);
                    this.map = this.challengeMap;
                    if (map.image === 'id')
                        map.image = '/images/user/' + challenge.map;
                }
                console.log(map.image);
                this.$store.dispatch('getUrl', map.image).then(imageUrl => {
                    this.image = imageUrl;
                });
                console.log({challenge, map})
            } else if (this.$route.query.hasOwnProperty('area_coordinates') && this.$route.query.hasOwnProperty('area_radius')) {
                let coordinates = this.$route.query['area_coordinates'].split(',').map(n => +n);
                let radius = +this.$route.query['area_radius'] * 1000;
                this.map = await MapManager.areaToGeoMap(coordinates, radius);
                this.$store.dispatch('getUrl', 'images/my_area.jpg').then(imageUrl => {
                    this.image = imageUrl;
                });
            } else if (this.$route.query.hasOwnProperty('map')) {
                let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
                if (mapInfo.image === 'id')
                    mapInfo.image = '/images/user/' + this.$route.query.map;
                this.$store.dispatch('getUrl', mapInfo.image).then(imageUrl => {
                    this.image = imageUrl;
                });
                console.log(mapInfo);
                this.map = await MapManager.mapToGeoMap(mapInfo, this.$route.query.map);
                console.log(this.map);
                //Debug:
                // let streetView = new StreetView(this.map);
                // console.log("calling randomValidLocations");
                // streetView.randomValidLocations(3, 14, 'sv', 'weighted', location => {
                //     console.log("Location received:", location);
                // });
                // this.startGame(this.$refs.rules.exportRules())
            } else {
                alert("Malformed URL :(");
            }
            console.log("Map:", this.map);
        },
        methods: {
            gameFail() {
                console.log("Failed");
                this.gameState = 2;
            },
            startGame(rules) {
                this.gameState = 1;
                setTimeout(() => {
                    this.$refs.game.start(this.map, rules, this.challenge);
                });
            },
            loadGame() {
                this.gameState = 2;
            }
        },
        watch: {
            map() {
                document.title = `Play ${this.map.name} - LocationEstimatr`;
            },
        },
        computed: {}
    }
</script>

<style scoped>
    .play-map {
        height: 100%;
        width: 100%;
        overflow-y: hidden;
    }

    .rules-container {
        /*background-color: black;*/
        width: 100%;
        height: 100%;
        position: fixed;
        left: 0;
        display: flex;
        justify-content: center;
        z-index: 5;
        overflow-y: auto;
    }

    .rules {
        margin-top: 50px;
        transition: margin-top 0.3s;
        height: auto;
        max-width: 550px;
        width: 100%;
    }

    .game {
        position: fixed;
        left: 0;
        width: 100%;
        height: 100%;
    }

    @media screen and (max-width: 550px) {
        .rules {
            margin-top: 0 !important;
            height: 100%;
        }
    }
</style>
