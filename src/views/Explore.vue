<template>
    <div class="explore">
        <div v-if="maps.hasOwnProperty('recent')">
            <h3 class="subtitle">
                <v-icon color='primary' class="sub-icon">new_releases</v-icon>
                New Maps
            </h3>
            <v-progress-circular class="spinner" indeterminate v-if="loading"></v-progress-circular>
            <map-grid :loading="loading" :maps="maps.recent" img-prefix="../"></map-grid>
        </div>
        <h3 class="subtitle">
            <v-icon color='primary' class="sub-icon">map</v-icon>
            Popular Maps
        </h3>
        <v-progress-circular class="spinner" indeterminate v-if="loading"></v-progress-circular>
        <map-grid :loading="loading" :maps="maps.popular" img-prefix="../"></map-grid>
        <h3 class="subtitle">
            <v-icon color='primary' class="sub-icon">thumb_up</v-icon>
            Most Liked Maps
        </h3>
        <v-progress-circular class="spinner" indeterminate v-if="loading"></v-progress-circular>
        <map-grid :loading="loading" :maps="maps.liked" img-prefix="../"></map-grid>
    </div>
</template>

<script>
    import MapGrid from "../components/MapGrid";

    export default {
        name: 'Explore',
        components: {MapGrid},
        data() {
            return {
                loading: false,
                maps: {popular: [], liked: []}
            }
        },
        async mounted() {
            this.loading = true;
            this.maps = await this.$store.dispatch('getExploreMaps');
            console.log(this.maps);
            this.loading = false;
            console.log(this.maps);
        },
    }
</script>

<style scoped>
    .explore {
        text-align: center;
    }

    .subtitle {
        font-size: 23px;
        margin: 20px;
    }

    .sub-icon {
        margin-right: 10px;
        margin-top: -1px;
    }

    .spinner {
        display: block;
        margin: 20px auto;
    }
</style>
