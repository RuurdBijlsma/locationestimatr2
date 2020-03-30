<template>
    <div class="profile">
        <div v-if="$route.query.id">
            <div v-if="user !== null">
                <h1>Profile for {{user.name}}</h1>
                <div v-if="user.maps.length > 0">
                    <h3 class="subtitle">
                        <v-icon class="sub-icon" :color="$store.state.color">create</v-icon>
                        Maps Created By {{user.name}}
                    </h3>
                    <map-grid :maps="user.maps" img-prefix="../"></map-grid>
                </div>
                <div v-if="user.likes.length > 0">
                    <h3 class="subtitle">
                        <v-icon class="sub-icon" :color="$store.state.color">thumb_up</v-icon>
                        Liked Maps
                    </h3>
                    <map-grid :maps="user.likes" img-prefix="../"></map-grid>
                </div>
            </div>
        </div>
        <h1 v-else>No user selected</h1>
    </div>
</template>

<script>
    import MapCard from "../components/MapCard";
    import MapGrid from "../components/MapGrid";

    export default {
        name: 'Profile',
        components: {MapGrid, MapCard},
        data() {
            return {
                user: null,
            }
        },
        async mounted() {
            if (this.$route.query.id) {
                this.user = await this.$store.dispatch('getUser', this.$route.query.id);
                console.log(this.user);
            }
        },
        methods: {},
        watch: {}
    }
</script>

<style scoped>
    .profile {
        text-align: center;
    }
    .subtitle {
        font-size: 23px;
        margin: 20px;
    }

    .sub-icon {
        margin-right: 10px;
        margin-top:-1px;
    }
</style>
