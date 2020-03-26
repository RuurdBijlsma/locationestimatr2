<template>
    <div class="home">
        <aside class="left-content" v-if="!mobile">
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
        <v-footer absolute padless class="footer" v-if="$route.path==='/'">
            <v-card flat tile width="100%">
                <v-card-text class="white--text bottom-row">
                    <span class="made-by">Made by <a href="https://ruurd.dev" target="_blank">Ruurd Bijlsma</a></span>
                    <div class="buttons">
                        <v-btn outlined class="gh-button" href="https://github.com/ruurdbijlsma/locationestimatr2"
                               target="_blank">View on Github
                        </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-footer>
        <div class="bottom-content">
            <v-bottom-navigation
                    :color="$store.state.color"
                    v-if="mobile"
                    grow>
                <v-btn to="/" class="bottom-button">
                    <span>Play</span>
                    <v-icon>home</v-icon>
                </v-btn>
                <v-btn to="/explore" class="bottom-button">
                    <span>Explore Maps</span>
                    <v-icon>explore</v-icon>
                </v-btn>
                <v-btn to="/create" class="bottom-button">
                    <span>Map Maker</span>
                    <v-icon>map</v-icon>
                </v-btn>
                <v-btn to="/settings" class="bottom-button">
                    <span>Settings</span>
                    <v-icon>settings</v-icon>
                </v-btn>
            </v-bottom-navigation>
        </div>
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
                windowWidth: window.innerWidth,
            }
        },
        mounted() {
            window.onresize = () => {
                this.windowWidth = window.innerWidth
            }
        },
        watch: {},
        computed: {
            mobile() {
                return this.windowWidth <= 840;
            }
        }
    }
</script>

<style scoped>
    .home {
        /*display: flex;*/
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
        transition: margin-left 0.3s;
    }

    .logo-text {
        font-size: 14px;
        background: -webkit-linear-gradient(#0cde4d, #39d37a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        line-height: 110%;
        transition: opacity 0.3s;
        opacity: 1;
    }

    @media screen and (max-width: 840px) {
        .logo-image {
            margin-left: -25px;
        }

        .logo-text {
            opacity: 0;
        }

        .middle-content {
            margin-left: 0 !important;
            padding: 10px !important;
            padding-bottom: 150px !important;
            margin-top: 10px !important;
        }

        .footer {
            padding-bottom: 58px !important;
        }
    }

    .logo-text p {
        margin: 0;
    }

    .middle-content {
        flex-grow: 1;
        margin: 100px 0 15px 256px;
        padding: 10px 30px 100px;
    }

    .bottom-content {
        position: fixed;
        bottom: 0;
        width: 100%;
    }

    .bottom-button {
        padding: 9px !important;
        display: inline-block;
        height: 100% !important;
    }

    .footer {
        z-index: 0;
        padding-bottom: 0;
    }

    .bottom-row {
        display: flex;
        justify-content: space-between;
    }

    .buttons {

    }

    .made-by {
        padding: 7px 0;
        display: inline-block;
    }
</style>
