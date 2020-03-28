<template>
    <v-lazy class="map-card" min-height="207" transition="fade-transition">
        <div class="card">
            <v-img class="white--text align-end map-background"
                   aspect-ratio="3/5"
                   :src="image">
                <v-card-title class="card-title text-truncate d-inline-block">{{map.name}}</v-card-title>
            </v-img>
            <div class="card-bottom">
                <div v-if="map.type === 'area'" class="area-actions">
                    <span>Radius</span>
                    <v-text-field v-model="areaRadius" dense outlined dark type="number"
                                  class="radius-field"></v-text-field>
                    <span>KM</span>
                </div>
                <v-btn v-if="map.type === 'area'" class="area-play" :color="$store.state.color" small text
                       @mouseup.middle="openMyArea(true)" @mouseup.left="openMyArea(false)">
                    Play
                </v-btn>
                <v-btn v-else :color="$store.state.color" small text :to="`/play?map=${map.id}`">
                    Play
                </v-btn>
                <v-btn :color="$store.state.color" small text :to="`/scores?map=${map.id}`"
                       v-if="map.type !== 'area'">Scores
                </v-btn>
            </div>
        </div>
    </v-lazy>
</template>

<script>
    export default {
        name: 'MapCard',
        components: {},
        props: {
            map: {
                type: Object,
                default: null,
            },
            imgPrefix: {
                type: String,
                default: '',
            }
        },
        data() {
            return {
                areaRadius: 5,
            }
        },
        async mounted() {

        },
        methods: {
            openMyArea(newTab = false) {
                navigator.geolocation.getCurrentPosition(position => {
                    let {latitude, longitude} = position.coords;
                    let url = `/play?area_coordinates=${[latitude, longitude]}&area_radius=${this.areaRadius}`;
                    if (newTab) {
                        let absUrl = location.origin + location.pathname + this.$router.resolve(url).href;
                        console.log(absUrl);
                        window.open(absUrl, '_blank');
                        window.focus();
                    } else {
                        this.$router.push(url);
                    }
                });
            },
        },
        watch: {},
        computed: {
            image() {
                return this.map.image.startsWith("http") ? this.map.image : this.imgPrefix + this.map.image;
            }
        }
    }
</script>

<style scoped>

    .card {
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 0.7em;
        box-shadow: 0 0 2em 0 rgba(0, 0, 0, 0.2);
        transition: 0.15s;
        text-align: left;
        min-width: 230px;
        height: 100%;
    }

    .card > div {
        position: relative;
        top: -17px;
    }

    .map-background {
        pointer-events: none;
        height: calc(100% - 52px);
        width: 100%;
        display: inline-block;
        border-top-right-radius: 0.7em;
        border-top-left-radius: 0.7em;
    }

    .card-bottom {
        padding: 12px;
    }

    .card-title {
        text-shadow: 0 0 10px black;
        background-image: linear-gradient(to top, rgba(30, 30, 30, 0.6), transparent);
        position: absolute;
        bottom: 0px;
        width: 100%
    }

    .area-actions {
        font-size: 12px;
        display: inline-flex;
    }

    .radius-field {
        width: 50px;
        font-size: 12px;
        height: 10px;
        margin: -10px 10px 0px;
    }

    .radius-field >>> input {
        text-align: center;
    }

    .area-play {
        margin-left: 10px;
    }
</style>
