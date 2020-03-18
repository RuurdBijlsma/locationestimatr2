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
                    :color="color"
                    dark>
                <v-list dense
                        nav
                        class="py-0">
                    <v-list-item two-line class="px-0" v-if="loggedIn">
                        <v-list-item-content>
                            <v-list-item-title>RuteNL</v-list-item-title>
                            <v-list-item-subtitle>ruurd@bijlsma.dev</v-list-item-subtitle>
                        </v-list-item-content>
                        <v-btn text small>Logout</v-btn>
                    </v-list-item>

                    <v-divider></v-divider>

                    <v-list-item link>
                        <v-list-item-icon>
                            <v-icon>home</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>Play</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item link>
                        <v-list-item-icon>
                            <v-icon>explore</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>Explore Maps</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item link>
                        <v-list-item-icon>
                            <v-icon>map</v-icon>
                        </v-list-item-icon>

                        <v-list-item-content>
                            <v-list-item-title>Map Maker</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item link>
                        <v-list-item-action>
                            <v-icon color="darken-1">settings</v-icon>
                        </v-list-item-action>
                        <v-list-item-title class="text--darken-1">Settings</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-navigation-drawer>
        </aside>
        <main class="middle-content">
            <div>
                <div class="map-collection">
                    <v-icon :color="color">brightness_high</v-icon>
                    <span class="title">Official Maps</span>
                    <div class="maps">
                        <v-card dark class="card" max-width="250">
                            <v-img class="white--text align-end"
                                   height="100px"
                                   src="https://cdn.vuetifyjs.com/images/cards/docks.jpg">
                                <v-card-title>World</v-card-title>
                            </v-img>
                            <v-card-actions>
                                <v-btn :color="color" text>Play</v-btn>
                                <v-btn :color="color" text>Scores</v-btn>
                            </v-card-actions>
                        </v-card>
                        <v-card dark class="card" max-width="250">
                            <v-img class="white--text align-end"
                                   height="100px"
                                   src="https://cdn.vuetifyjs.com/images/cards/docks.jpg">
                                <v-card-title>My Area</v-card-title>
                            </v-img>
                            <v-card-actions>
                                <span>Radius</span>
                                <v-text-field type="number" value="10"></v-text-field>
                                <span>KM</span>
                                <v-btn :color="color" text>Play</v-btn>
                            </v-card-actions>
                        </v-card>
                    </div>
                </div>
                <div class="map-collection">
                    <v-icon color="#02c780">collections_bookmark</v-icon>
                    <span class="title">Country Collection Maps</span>
                    <div class="maps"></div>
                </div>
                <div class="map-collection">
                    <v-icon color="#02c780">supervised_user_circle</v-icon>
                    <span class="title">Featured User Maps</span>
                    <div class="maps"></div>
                </div>
                <div class="map-collection">
                    <v-icon color="#02c780">flag</v-icon>
                    <span class="title">Country Maps</span>
                    <div class="maps"></div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    export default {
        name: 'Home',
        components: {},
        data() {
            return {
                color: '#02c780',
                drawer: true,
                loggedIn: true,
            }
        }
    }
</script>

<style scoped>
    .home {
        display: flex;
    }

    .left-content {
        height: 100%;
        padding-top: 60px;
    }

    .drawer {
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
        margin: 120px 30px 30px;
        padding: 10px 50px;
    }

    .map-collection {
        margin-bottom: 40px;
    }

    .maps {
        min-height: 100px;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.17);
        border-radius: 10px;
        margin: 5px 0;
        display: flex;
    }

    .maps .card {
        margin:10px;
    }

    .map-collection i {
        padding: 4px;
        margin-top: -4px;
    }

    .map-collection .title {
        color: #ffffffd6;
        padding: 5px;
    }
</style>
