<template>
    <div class="play-map">
        <div class="rules-container"
             v-if="gameState < 2"
        >
            <!--             v-show="gameState < 1"-->
            <point-rules class="rules" v-if="map && map.type==='point'"
                         @startGame="startGame"
                         @hostGame="hostGame"
                         ref="pointRules"
                         :challenge-rules="challengePointRules"
                         :image="image"
                         :map="map"
                         :loading="gameState === 1"
                         :mp-challenge="mpChallenge"
                         :loading-host="loadingHost"
                         :challenge-map="challengeMap"></point-rules>
            <rules class="rules" v-else-if="map"
                   @startGame="startGame"
                   @hostGame="hostGame"
                   ref="rules"
                   :challenge-rules="challengeRules"
                   :image="image"
                   :loading="gameState === 1"
                   :loading-host="loadingHost"
                   :mp-challenge="mpChallenge"
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
    // import StreetView from "../js/StreetView";
    import PointRules from "../components/PointRules";
    import randomStreetView from 'random-streetview';
    import Google from "../js/Google";

    export default {
        name: 'PlayMap',
        components: {PointRules, Game, Rules},
        data() {
            return {
                host: null,
                gameState: 0,
                map: null,
                challengeRules: null,
                challengePointRules: null,
                challengeMap: null,
                challenge: null,
                image: '',
                loadingHost: false,
                mpChallenge: false,
            }
        },
        async mounted() {
            await this.parseUrl();
        },
        methods: {
            async parseUrl() {
                this.$store.commit('setImmersive', false);
                if (this.$route.query.hasOwnProperty('challenge')) {
                    let {challenge, map} = await this.$store.dispatch('getChallenge', this.$route.query.challenge);
                    if (challenge.guesses[0].guess === undefined)
                        this.mpChallenge = true;
                    const RulesClass = map.type === 'points' ? PointRulesObject : RulesObject;
                    if (typeof challenge.rules === 'number') {
                        challenge.rules = RulesClass.presets[RulesClass.presetNames[challenge.rules]];
                    } else {
                        challenge.rules = new RulesClass(challenge.rules);
                    }
                    console.log("Challenge rules", challenge.rules);
                    this.challenge = challenge;
                    if (map.type === 'points') {
                        this.challengePointRules = challenge.rules;
                    } else {
                        this.challengeRules = challenge.rules;
                    }
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
                    this.$store.dispatch('getUrl', map.image).then(imageUrl => {
                        this.image = imageUrl;
                    });
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
                    this.map = await MapManager.mapToGeoMap(mapInfo, this.$route.query.map);
                } else {
                    alert("Malformed URL :(");
                }
                console.log("Map:", this.map);
            },
            async hostGame(rules) {
                this.loadingHost = true;
                this.host = {rules, map: this.map};
                let locations;
                if (this.map.points === undefined) {
                    let svType = rules.svType === 2 ? 'both' : (rules.svType === 1 ? 'photo' : 'sv');
                    let distribution = rules.distribution === 1 ? 'uniform' : 'weighted';
                    let endZoom = 14;
                    if (this.map.minimumDistanceForPoints < 500) endZoom = 19;
                    else if (this.map.minimumDistanceForPoints < 3000) endZoom = 18;
                    else if (this.map.minimumDistanceForPoints < 10000) endZoom = 16;
                    await randomStreetView.setParameters({
                        polygon: this.map.polygon,
                        cacheKey: this.map.id,
                        google: Google,
                        type: svType,
                        distribution, endZoom,
                    });
                    locations = await randomStreetView.getRandomLocations(rules.roundCount);
                } else {
                    locations = randomStreetView._streetView.shuffle(JSON.parse(JSON.stringify(this.map.points))).slice(0, rules.roundCount).map(l => l.position);
                }
                let guesses = locations.map(g => {
                    return {target: g}
                });
                let shortRules = rules.presetName === 'Custom' ? JSON.parse(JSON.stringify(rules)) : rules.preset;
                let challengeUrl = await this.$store.dispatch('getChallengeUrl', {
                    guesses,
                    rules: shortRules,
                    map: this.map.id,
                    radius: this.$route.query['area_radius'],
                    coordinates: this.$route.query['area_coordinates'],
                    date: new Date(),
                });
                this.loadingHost = false;
                await this.$router.push(challengeUrl.substr(location.origin.length));
            },
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
            },
        },
        watch: {
            map() {
                document.title = `${this.map.name} - LocationEstimatr`;
            },
            async '$route.query.map'() {
                location.reload();
            },
            async '$route.query.challenge'() {
                location.reload();
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
