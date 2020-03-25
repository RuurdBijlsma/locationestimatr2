<template>
    <div class="scores">
        <div class="background-image" :style="`background-image: ${bgImage}`"></div>
    </div>
</template>

<script>
    import MapManager from "../js/MapManager";

    export default {
        name: 'Scores',
        components: {},
        data() {
            return {
                map: null,
                image: '',
            }
        },
        async mounted() {
            if (this.$route.query.hasOwnProperty('map')) {
                let mapInfo = await this.$store.dispatch('getMap', this.$route.query.map);
                if (mapInfo.image === 'id')
                    mapInfo.image = '/images/user/' + this.$route.query.map;
                this.$store.dispatch('getUrl', mapInfo.image).then(imageUrl => {
                    console.log("IMAGE URL", imageUrl);
                    this.image = `url(${imageUrl})`;
                });
                console.log(mapInfo);
                this.map = await MapManager.mapToGeoMap(mapInfo, this.$route.query.map);
            } else {
                alert("Malformed URL :(");
            }
        },
        methods: {

        },
        computed: {
            bgImage() {
                if (this.image === '' || !this.image) {
                    return 'linear-gradient(180deg, rgba(9, 6, 50, 1) 0%, rgba(24, 150, 202, 1) 77%, rgba(26, 231, 219, 1) 100%)';
                }
                return this.image;
            }
        }
    }
</script>

<style scoped>
    .rules {
        height: 100%;
        width: 100%;
        display: flex;
        overflow-y: hidden;
        justify-content: center;
        background-color: #99c4e6;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
    }

    .background-image {
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        position: fixed;
        width: calc(100%);
        height: calc(100%);
        top: 0;
        left: 0;
        filter: blur(4px) brightness(0.9);
    }
</style>
