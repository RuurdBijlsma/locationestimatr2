<template>
    <div class="play">
        <div class="map-collection">
            <v-icon :color="$store.state.color">brightness_high</v-icon>
            <span class="title">Official Maps</span>
            <div class="maps">
                <v-card dark class="card" max-width="250" v-for="map in officialMaps" :key="map.name">
                    <v-img class="white--text align-end"
                           height="150px"
                           :src="map.url">
                        <v-card-title class="card-title">{{map.name}}</v-card-title>
                    </v-img>
                    <v-card-actions>
                        <div v-if="map.area" class="area-actions">
                            <span>Radius</span>
                            <v-text-field dense outlined type="number" value="10"
                                          class="radius-field"></v-text-field>
                            <span>KM</span>
                        </div>
                        <v-btn :color="$store.state.color" text>Play</v-btn>
                        <v-btn :color="$store.state.color" text v-if="!map.area">Scores</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
        </div>
        <div class="map-collection">
            <v-icon :color="$store.state.color">collections_bookmark</v-icon>
            <span class="title">Country Collection Maps</span>
            <div class="maps"></div>
        </div>
        <div class="map-collection">
            <v-icon :color="$store.state.color">supervised_user_circle</v-icon>
            <span class="title">Featured User Maps</span>
            <div class="maps"></div>
        </div>
        <div class="map-collection">
            <v-icon :color="$store.state.color">flag</v-icon>
            <span class="title">Country Maps</span>
            <div class="maps"></div>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'Play',
        components: {},
        data() {
            return {
                officialMaps: [],
                collectionMaps: [],
                featuredMaps: [],
                countryMaps: [],
            }
        },
        async mounted() {
            if (this.$store.state.user) {
                this.loadMaps()
            }
        },
        methods: {
            async loadMaps() {
                // await this.$store.dispatch('loadMaps');
                console.log("DONE");
                let maps = await this.$store.dispatch('getMaps');
                this.officialMaps = [];
                this.collectionMaps = [];
                this.featuredMaps = [];
                this.countryMaps = [];
                for (let map of maps) {
                    switch (map.type) {
                        case 'official':
                            this.officialMaps.push(map);
                            break;
                        case 'collection':
                            this.collectionMaps.push(map);
                            break;
                        case 'featured':
                            this.featuredMaps.push(map);
                            break;
                        case 'country':
                            this.countryMaps.push(map);
                            break;
                    }
                }
                console.log(this.officialMaps)
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

    .map-collection {
        margin-bottom: 40px;
    }

    .maps {
        min-height: 100px;
        /*width: 100%;*/
        background-color: rgba(0, 0, 0, 0.17);
        border-radius: 10px;
        margin: 5px 0;
    }

    .maps .card {
        margin: 10px;
        display: inline-block;
    }

    .card-title {
        text-shadow: 0 0 10px black;
        background-image: linear-gradient(to top, rgba(30, 30, 30, 0.6), transparent);
    }

    .map-collection i {
        padding: 4px;
        margin-top: -4px;
    }

    .map-collection .title {
        color: #ffffffd6;
        padding: 5px;
    }

    .area-actions {
        font-size: 12px;
        display: flex;
    }

    .radius-field {
        width: 40px;
        font-size: 12px;
        height: 10px;
        margin: -10px 10px 0px;
    }

    .radius-field >>> input {
        text-align: center;
    }
</style>
