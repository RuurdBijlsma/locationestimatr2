<template>
    <div class="play-map">
        <rules class="rules" v-if="!gameStarted" @startGame="startGame" ref="rules"></rules>
        <game v-show="gameStarted" :rules="rules" :map="map" ref="game"></game>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";
    import Rules from "../components/Rules";
    import Game from "../components/Game";

    export default {
        name: 'PlayMap',
        components: {Game, Rules},
        data() {
            return {
                gameStarted: false,
                rules: null,
                map: null,
            }
        },
        async mounted() {
            let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
            console.log(mapInfo);
            this.map = await MapManager.mapToGeoMap(mapInfo, this.$route.query.map);
            this.startGame(this.$refs.rules.exportRules())
        },
        methods: {
            startGame(rules) {
                console.log({rules});
                this.rules = rules;
                this.gameStarted = true;
                this.$refs.game.start(this.map, rules);
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
