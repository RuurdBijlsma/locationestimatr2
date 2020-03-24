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
                <v-icon :color="$store.state.color">{{collection.icon}}</v-icon>
                <span class="title">{{collection.name}}</span>
            </div>
            <div class="maps">
                <v-lazy v-for="map in collection.maps" :key="map.name" min-height="207" transition="fade-transition">
                    <div class="card">
                        <v-img class="white--text align-end map-background"
                               aspect-ratio="3/5"
                               :src="'./' + map.image">
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
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'Play',
        components: {},
        data() {
            return {
                areaRadius: 5,
            }
        },
        async mounted() {
            if (this.$store.state.user) {
                this.loadMaps()
            }
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
            async loadMaps() {
                // console.log("Loading called")
                await this.$store.dispatch('loadHomeMaps')
                console.log("LOADED", this.$store.state.homeMaps)
            }
        },
        watch: {
            async '$store.state.user'() {
                this.loadMaps()
            }
        }
    }
</script>

<style scoped>
    .play {
        text-align: center;
    }

    .map-collection {
        margin-bottom: 40px;
    }

    .map-collection-title {
        margin-bottom: 15px;
    }

    .maps {
        display: inline-grid;
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 2em;
        grid-auto-rows: minmax(13em, auto);
        max-width: 1200px;
        width: 90%;
    }

    @media screen and (max-width: calc(1100px + 487px)) {
        .maps {
            grid-template-columns: repeat(3, 1fr) !important;
        }
    }

    @media screen and (max-width: calc(700px + 487px)) {
        .maps {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }

    @media screen and (max-width: calc(621px)) {
        .maps {
            grid-template-columns: repeat(1, 1fr) !important;
        }
    }

    .maps .card {
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 0.7em;
        box-shadow: 0 0 2em 0 rgba(0, 0, 0, 0.2);
        transition: 0.15s;
        text-align: left;
        min-width: 230px;
        height: 100%;
    }

    .maps .card > div {
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

    .map-collection i {
        padding: 4px;
        margin-top: -4px;
    }

    .map-collection .title {
        padding: 5px;
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
