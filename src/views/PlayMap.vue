<template>
    <div class="play-map">
        <h1>Play Map {{$route.query}}</h1>
        <div class="street-view" ref="streetView"></div>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";
    import StreetViewElement from '../js/StreetViewElement';

    export default {
        name: 'PlayMap',
        components: {},
        data() {
            return {}
        },
        async mounted() {
            let map = await this.$store.dispatch('getMap', this.$route.query.map);
            console.log(map);
            let geoMap = await MapManager.mapToGeoMap(map);
            console.log(geoMap);
            let svElement = new StreetViewElement(this.$refs.streetView);
            console.log(svElement);
        }
    }
</script>

<style scoped>

</style>
