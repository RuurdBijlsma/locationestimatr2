<template>
    <div class="play-map">
        <rules v-show="true" class="rules" v-if="!gameStarted" @startGame="startGame" ref="rules"
               :challenge-rules="challengeRules"
               :image="image"
               :map="map"
               :challenge-map="challengeMap"></rules>
        <game v-show="gameStarted" ref="game"></game>
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
                image: '',
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
                    console.log("IMAGE URL", imageUrl);
                    this.image = imageUrl;
                });
                console.log({challenge, map})
            } else if (this.$route.query.hasOwnProperty('area_coordinates') && this.$route.query.hasOwnProperty('area_radius')) {
                let coordinates = this.$route.query['area_coordinates'].split(',').map(n => +n);
                let radius = +this.$route.query['area_radius'] * 1000;
                this.map = await MapManager.areaToGeoMap(coordinates, radius);
                this.$store.dispatch('getUrl', 'images/my_area.jpg').then(imageUrl => {
                    console.log("IMAGE URL", imageUrl);
                    this.image = imageUrl;
                });
            } else if (this.$route.query.hasOwnProperty('map')) {
                let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
                if (mapInfo.image === 'id')
                    mapInfo.image = '/images/user/' + this.$route.query.map;
                this.$store.dispatch('getUrl', mapInfo.image).then(imageUrl => {
                    console.log("IMAGE URL", imageUrl);
                    this.image = imageUrl;
                });
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
                this.$refs.game.start(this.map, this.rules, this.challenge);
            }
        },
        watch: {
            map() {
                document.title = `Play ${this.map.name} - LocationEstimatr`;
            },
        },
        computed: {
            isSvg() {

            },
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
