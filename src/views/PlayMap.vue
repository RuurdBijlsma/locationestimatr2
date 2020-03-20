<template>
    <div class="play-map">
        <h1>Play Map {{$route.query}}</h1>
    </div>
</template>

<script>
    export default {
        name: 'PlayMap',
        components: {},
        data() {
            return {}
        },
        async mounted() {
            let map = await this.$store.dispatch('getMap', this.$route.query.map);
            console.log(map);
        }
    }
</script>

<style scoped>

</style>
