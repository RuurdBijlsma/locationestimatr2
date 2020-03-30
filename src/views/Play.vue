<template>
    <div class="play">
        <div v-if="$store.state.homeMaps.length === 0">
            <h1>Loading maps... :)</h1>
            <br>
            <v-progress-circular
                    :size="70"
                    :width="7"
                    color="purple"
                    indeterminate
            ></v-progress-circular>
        </div>
        <div class="map-collection" v-for="collection in $store.state.homeMaps" :key="collection.name">
            <div class="map-collection-title">
                <h3 class="subtitle"><v-icon class="sub-icon" color='primary'>{{collection.icon}}</v-icon>{{collection.name}}</h3>
            </div>
            <map-grid class="maps" :show-search="collection.searchEnabled" :maps="collection.maps"></map-grid>
        </div>
    </div>
</template>

<script>
    import MapCard from "../components/MapCard";
    import MapGrid from "../components/MapGrid";

    export default {
        name: 'Play',
        components: {MapGrid, MapCard},
        data() {
            return {

            }
        },
        async mounted() {
            this.loadMaps()
        },
        methods: {
            async loadMaps() {
                console.log("Loading called");
                await this.$store.dispatch('loadHomeMaps');
                console.log("LOADED", this.$store.state.homeMaps);
                this.$emit('loadedMaps');
            }
        },
        watch: {}
    }
</script>

<style scoped>
    .subtitle {
        font-size: 23px;
        margin: 20px;
    }

    .sub-icon {
        margin-right: 10px;
        margin-top:-1px;
    }
    .play {
        text-align: center;
    }

    .map-collection {
        margin-bottom: 40px;
    }

    .map-collection-title {
        margin-bottom: 15px;
    }

    .map-collection i {
        padding: 4px;
        margin-top: -4px;
    }

    .map-collection .title {
        padding: 5px;
    }
    .maps{

    }
</style>
