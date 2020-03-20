<template>
    <div class="home">
        <aside class="left-content">
            <div class="logo">
                <div class="logo-image"></div>
                <div class="logo-text">
                    <p>Location</p>
                    <p>Estimatr</p>
                </div>
            </div>
            <v-navigation-drawer
                    class="drawer"
                    permanent
                    v-model="drawer"
                    :color="$store.state.color"
                    dark>
                <v-list dense
                        nav
                        class="py-0">
                    <v-list-item to="/" exact>
                        <v-list-item-icon>
                            <v-icon>home</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>Play</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item to="/explore">
                        <v-list-item-icon>
                            <v-icon>explore</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>Explore Maps</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item to="/create">
                        <v-list-item-icon>
                            <v-icon>map</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>Map Maker</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item to="/settings">
                        <v-list-item-action>
                            <v-icon color="darken-1">settings</v-icon>
                        </v-list-item-action>
                        <v-list-item-title class="text--darken-1">Settings</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-navigation-drawer>
        </aside>
        <main class="middle-content">
            <router-view></router-view>
        </main>
    </div>
</template>

<script>
    export default {
        name: 'Home',
        components: {},
        data() {
            return {
                drawer: true,
                loggedIn: false,
            }
        }
    }
</script>

<style scoped>
    .home {
        display: flex;
    }

    .left-content {
        padding-top: 60px;
        position: fixed;
    }

    .drawer {
        padding-top: 10px;
        border-bottom-right-radius: 10px;
        border-top-right-radius: 10px;
        min-height: 500px;
        box-shadow: 0 0 30px 0 rgba(0, 0, 0, 0.45);
    }

    .logo {
        display: flex;
        justify-content: space-between;
        width: 110px;
        margin-left: 30px;
    }

    .logo-image {
        width: 40px;
        height: 40px;
        background-image: url(../assets/favicon256.png);
        background-size: 60%;
        background-repeat: no-repeat;
        background-position: 50% 20%;
    }

    .logo-text {
        font-size: 14px;
        background: -webkit-linear-gradient(#0cde4d, #39d37a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        line-height: 110%;
    }

    .logo-text p {
        margin: 0;
    }

    .middle-content {
        flex-grow: 1;
        margin: 120px 0px 15px 256px;
        padding: 10px 30px;
    }
</style>
