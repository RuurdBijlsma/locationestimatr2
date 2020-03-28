<template>
    <div class="explore">
        <h1>Explore</h1>
        <h3>Popular Maps</h3>
        <map-grid :maps="maps.popular" img-prefix="../"></map-grid>
        <h3>Liked Maps</h3>
        <map-grid :maps="maps.liked" img-prefix="../"></map-grid>
    </div>
</template>

<script>
    import MapGrid from "../components/MapGrid";

    export default {
        name: 'Explore',
        components: {MapGrid},
        data() {
            return {
                maps: {popular: [], liked: []}
            }
        },
        async mounted() {
            this.maps = await this.$store.dispatch('getExploreMaps');
            console.log(this.maps);
        },
    }
</script>

<style scoped>

</style>
