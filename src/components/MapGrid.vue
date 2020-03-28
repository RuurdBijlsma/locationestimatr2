<template>
    <div class="map-grid">
        <map-card v-for="map in maps" :key="map.name" :map="map" :img-prefix="imgPrefix"></map-card>
    </div>
</template>

<script>
    import MapCard from "./MapCard";
    export default {
        name: 'MapGrid',
        components: {MapCard},
        props: {
            maps: {
                type: Array,
                default: [],
            },
            imgPrefix: {
                type: String,
                default: '',
            }
        },
        data() {
            return {}
        },
        async mounted() {

        },
        methods: {},
        watch: {},
        computed: {}
    }
</script>

<style scoped>
    .map-grid {
        display: inline-grid;
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 2em;
        grid-auto-rows: minmax(13em, auto);
        max-width: 1200px;
        width: 90%;
    }

    @media screen and (max-width: calc(1100px + 487px)) {
        .map-grid {
            grid-template-columns: repeat(3, 1fr) !important;
        }
    }

    @media screen and (max-width: calc(700px + 487px)) {
        .map-grid {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }

    @media screen and (max-width: calc(621px)) {
        .map-grid {
            grid-template-columns: repeat(1, 1fr) !important;
        }
    }
</style>
