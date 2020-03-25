<template>
    <div class="create-map">
        <div v-if="$route.path==='/create'">
            <h1>Create Map</h1>
            <p>What type of map do you want to make</p>
            <v-btn to="/create/polygon">Polygon area map</v-btn>
            <v-btn to="/create/point">Point map</v-btn>
        </div>
        <router-view v-else @uploaded="uploadedMap" class="map-editor"></router-view>
    </div>
</template>

<script>
    import PolyMapEditor from "./PolyMapEditor";
    import PointMapEditor from "./PointMapEditor";

    export default {
        name: 'CreateMap',
        components: {PointMapEditor, PolyMapEditor},
        data() {
            return {
                kml: '',
                showEditor: -1,
            }
        },
        async mounted() {
        },
        methods: {
            uploadedMap(id) {
                this.$router.push(`/play?map=${id}`);
            }
        }
    }
</script>

<style scoped>
    .create-map {
        margin-top: -10px;
    }

    .map-editor {
        width: 100%;
        height: 100%;
    }

    .playable {
        padding: 10px;
    }
</style>
