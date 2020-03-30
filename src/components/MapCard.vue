<template>
    <v-lazy class="map-card" min-height="207" transition="fade-transition">
        <div class="card">
            <v-img class="white--text align-end map-background"
                   aspect-ratio="5/3"
                   :src="image">
                <v-card-title class="card-title text-truncate d-inline-block" :title="map.name">{{map.name}}
                </v-card-title>
                <v-card-subtitle class="card-subtitle">
                    <span v-if="map.counts" class="map-counts">
                        <span :title="`${map.counts.plays} completions`" class="map-count-info"><v-icon class="map-count-info-icon" x-small>visibility</v-icon>{{map.counts.plays}}</span>
                        <span :title="`${map.counts.likes} likes`" class="map-count-info"><v-icon class="map-count-info-icon" x-small>thumb_up</v-icon>{{map.counts.likes}}</span>
                        <span :title="`${map.counts.dislikes} dislikes`" class="map-count-info"><v-icon class="map-count-info-icon" x-small>thumb_down</v-icon>{{map.counts.dislikes}}</span>
                    </span>
                    <router-link class="map-user-link" v-if="map.realUser && map.user" :to="`/user?id=${map.user}`" :title="map.userInfo.name">
                        {{map.userInfo.name}}
                    </router-link>
                    <router-link class="map-user-link anonymous" v-else-if="map.user" :to="`/user?id=${map.user}`" title="Anonymous">Anonymous
                    </router-link>
                </v-card-subtitle>
            </v-img>
            <div class="card-bottom">
                <div v-if="map.type === 'area'" class="area-actions">
                    <span>Radius</span>
                    <v-text-field v-model="areaRadius" dense outlined dark type="number"
                                  class="radius-field"></v-text-field>
                    <span>KM</span>
                </div>
                <v-btn v-if="map.type === 'area'" class="area-play" color='primary' small text
                       @mouseup.middle="openMyArea(true)" @mouseup.left="openMyArea(false)">
                    Play
                </v-btn>
                <v-btn v-else color='primary' small text :to="`/play?map=${map.id}`">
                    Play
                </v-btn>
                <v-btn color='primary' small text :to="`/scores?map=${map.id}`"
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
        box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2);
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
        height: calc(100% - 52px);
        width: 100%;
        display: inline-block;
        border-top-right-radius: 0.7em;
        border-top-left-radius: 0.7em;
    }

    .map-background >>> v-image__image {
        pointer-events: none;
    }

    .card-bottom {
        padding: 12px;
    }

    .card-title {
        text-shadow: 0 0 10px black;
        background-image: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
        position: absolute;
        bottom: 0px;
        padding-bottom: 20px;
        width: 100%
    }

    .card-subtitle {
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 100%;
        overflow: hidden;
        position: absolute;
        bottom: -15px;
        font-weight: lighter;
        font-size: 12px;
        opacity: 0.8;
    }

    .card-subtitle * {
        color: white;
    }

    .area-actions {
        font-size: 12px;
        display: inline-flex;
    }

    .radius-field {
        width: 50px;
        font-size: 12px;
        height: 10px;
        margin: -11px 10px 0px;
    }

    .radius-field >>> input {
        text-align: center;
    }

    .area-play {
        margin-left: 10px;
    }

    .map-count-info {
        margin-right: 8px;
    }

    .map-count-info-icon {
        margin-top: -3px;
        margin-right: 3px;
    }

    .map-counts {
        margin-right: 5px;
    }

    .anonymous{
        font-style: italic;
    }
</style>
