<template>
    <div class="map-grid">
        <v-text-field class="search" v-if="showSearch" outlined label="Filter Maps" v-model="mapFilter"></v-text-field>
        <div class="inner-grid">
            <map-card v-for="map in filteredMaps"
                      :key="map.name" :map="map" :img-prefix="imgPrefix"></map-card>
        </div>
        <h3 v-if="filteredMaps.length===0 && !loading">
            <v-icon>sentiment_dissatisfied</v-icon>
            No maps found
        </h3>
    </div>
</template>

<script>
    import MapCard from "./MapCard";

    export default {
        name: 'MapGrid',
        components: {MapCard},
        props: {
            showSearch: {
                type: Boolean,
                default: false,
            },
            maps: {
                type: Array,
                default: [],
            },
            imgPrefix: {
                type: String,
                default: '',
            },
            loading: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                mapFilter: '',
            }
        },
        async mounted() {

        },
        methods: {},
        watch: {},
        computed: {
            filteredMaps() {
                return this.maps.filter(m => m.name.toLowerCase().includes(this.mapFilter.toLowerCase()))
            }
        }
    }
</script>

<style scoped>
    .search {
        margin: 0 auto;
        width: 90%;
        max-width: 700px;
    }

    .inner-grid {
        display: inline-grid;
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 2em;
        grid-auto-rows: minmax(13em, auto);
        max-width: 1200px;
        width: 90%;
    }

    @media screen and (max-width: calc(1100px + 487px)) {
        .inner-grid {
            grid-template-columns: repeat(3, 1fr) !important;
        }
    }

    @media screen and (max-width: calc(700px + 487px)) {
        .inner-grid {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }

    @media screen and (max-width: calc(621px)) {
        .inner-grid {
            grid-template-columns: repeat(1, 1fr) !important;
        }
    }
</style>
