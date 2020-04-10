<template>
    <div class="profile">
        <div v-if="$route.query.id">
            <div v-if="user !== null">
                <h1 v-if="user.name !== ''">Profile for {{user.name}}</h1>
                <h1 v-else class="noverflow">Profile for <span class="id">{{$route.query.id}}</span></h1>
                <p class="caption" v-if="user.name === '' && $route.query.id === $store.getters.user.uid">You have an
                    anonymous account, which means your data isn't
                    permanently linked to you.
                    <router-link to="register">Register</router-link>
                    to link created and liked maps to your account.
                </p>
                <div v-if="user.maps.length > 0">
                    <h3 class="subtitle">
                        <v-icon class="sub-icon" color='primary'>create</v-icon>
                        <span v-if="user.name !== ''">Maps Created By {{user.name}}</span>
                        <span v-else>Created Maps</span>
                    </h3>
                    <map-grid :maps="user.maps" img-prefix="../"></map-grid>
                </div>
                <div v-else-if="$route.query.id === $store.getters.user.uid">
                    <h3 class="subtitle">You haven't created any maps</h3>
                    <v-btn to="/create" outlined>Create Map</v-btn>
                </div>
                <div v-else>
                    <h3 class="subtitle">This use hasn't created any maps</h3>
                </div>
                <div v-if="user.likes.length > 0">
                    <h3 class="subtitle">
                        <v-icon class="sub-icon" color='primary'>thumb_up</v-icon>
                        Liked Maps
                    </h3>
                    <map-grid :maps="user.likes" img-prefix="../"></map-grid>
                </div>
                <div v-else-if="$route.query.id === $store.getters.user.uid">
                    <h3 class="subtitle">You haven't liked any maps</h3>
                    <v-btn to="/" outlined>Play a Map</v-btn>
                </div>
                <div v-else>
                    <h3 class="subtitle">This user hasn't liked any maps</h3>
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
                await this.loadUser();
            }
        },
        methods: {
            async loadUser() {
                let user = await this.$store.dispatch('getUser', this.$route.query.id);
                this.user = user;
                console.log(this.user);
            }
        },
        watch: {
            '$route.query.id'() {
                this.loadUser();
            }
        }
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
        margin-top: -1px;
    }

    .id {
        font-weight: 100;
        font-family: monospace;
        opacity: 0.7;
    }

    .noverflow {
        max-width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;

    }
</style>
