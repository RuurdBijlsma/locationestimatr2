<template>
    <div class="home">
        <aside class="left-content" v-if="!mobile">
            <div class="logo" v-if="$store.state.customColor === false">
                <div class="logo-image"></div>
                <div class="logo-text" :style="`color: ${$vuetify.theme.themes.dark.primary}`">
                    <p>Location</p>
                    <p>Estimatr</p>
                </div>
            </div>
            <div class="logo" v-else>
                <div class="logo-image" :style="`background-image: url(${$store.state.customColor.image})`"></div>
                <div class="logo-text" :style="`background-image: linear-gradient(${$store.state.customColor.colorTop}, ${$store.state.customColor.colorBottom});`">
                    <p>Location</p>
                    <p>Estimatr</p>
                </div>
            </div>
            <v-navigation-drawer
                    class="drawer"
                    permanent
                    v-model="drawer"
                    color='primary'
                    dark>
                <v-list dense
                        nav
                        class="py-0">
                    <v-list-item two-line v-if="$store.state.realAccount">
                        <v-list-item-content>
                            <v-list-item-title class="account" @click="goProfile()">{{$store.state.realAccount.email}}
                            </v-list-item-title>
                            <v-list-item-subtitle class="logout" @click="logout()">Logout</v-list-item-subtitle>
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item v-else @click="goProfile()">
                        <v-list-item-content>
                            <v-list-item-title>My Maps</v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
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
                    <div v-if="!$store.state.realAccount">
                        <v-divider></v-divider>
                        <v-list-item to="login">
                            <v-list-item-title class="text--darken-1">Login</v-list-item-title>
                        </v-list-item>
                        <v-list-item to="register">
                            <v-list-item-title class="text--darken-1">Register</v-list-item-title>
                        </v-list-item>
                    </div>
                </v-list>
            </v-navigation-drawer>
        </aside>
        <main class="middle-content">
            <router-view @loadedMaps="loaded" @snack="showSnack"></router-view>
        </main>
        <v-snackbar v-model="snack">{{ snackText }}
            <v-btn color="primary" text @click="snack = false">Close</v-btn>
        </v-snackbar>
        <v-footer absolute padless class="footer" v-if="$route.path==='/' && showFooter">
            <v-card flat tile width="100%">
                <v-card-text class="white--text bottom-row">
                    <span class="made-by">Made by <a href="https://github.com/ruurdbijlsma" target="_blank">Ruurd Bijlsma</a></span>
                    <div class="buttons">
                        <v-btn outlined class="gh-button" href="https://github.com/ruurdbijlsma/locationestimatr2"
                               target="_blank">View on Github
                        </v-btn>
                        <v-dialog v-model="dialog" width="500">
                            <template v-slot:activator="{ on }">
                                <v-btn outlined v-on="on">Write Feedback</v-btn>
                            </template>
                            <v-card :loading="loadingFeedback">
                                <v-card-title primary-title> Feedback</v-card-title>
                                <v-card-subtitle>Write feedback or report bugs below. (No user data is sent)
                                </v-card-subtitle>
                                <v-card-text>
                                    <v-textarea v-model="feedback"></v-textarea>
                                </v-card-text>
                                <v-divider></v-divider>
                                <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn color="primary" text @click="sendFeedback">Send Feedback</v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-dialog>
                    </div>
                </v-card-text>
            </v-card>
        </v-footer>
        <div class="bottom-content">
            <v-bottom-navigation
                    shift
                    color='primary'
                    v-if="mobile"
                    grow>
                <v-btn to="/" class="bottom-button">
                    <span>Play</span>
                    <v-icon>home</v-icon>
                </v-btn>
                <v-btn to="/explore" class="bottom-button">
                    <span>Explore</span>
                    <v-icon>explore</v-icon>
                </v-btn>
                <v-btn to="/create" class="bottom-button">
                    <span>Make</span>
                    <v-icon>map</v-icon>
                </v-btn>
                <v-btn to="/settings" class="bottom-button">
                    <span>Settings</span>
                    <v-icon>settings</v-icon>
                </v-btn>
                <v-btn v-if="$store.state.realAccount" :to="`/user?id=${$store.state.realAccount.uid}`"
                       class="bottom-button">
                    <span>Profile</span>
                    <v-icon>face</v-icon>
                </v-btn>
                <v-btn v-else to="/login" class="bottom-button">
                    <span>Login</span>
                    <v-icon>account_circle</v-icon>
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
                showFooter: false,
                snack: false,
                snackText: '',
                dialog: false,
                feedback: '',
                loadingFeedback: false,
            }
        },
        mounted() {
        },
        methods: {
            async sendFeedback() {
                this.loadingFeedback = true;
                if (this.feedback.length !== 0) {
                    await this.$store.dispatch('submitFeedback', this.feedback);
                    this.showSnack("Feedback sent!");
                } else {
                    this.showSnack("Feedback can't be empty");
                }
                this.loadingFeedback = false;
                this.dialog = false;
            },
            async goProfile() {
                try {
                    await this.$router.push('/user?id=' + this.$store.getters.user.uid)
                } catch (e) {
                    console.log(e.message);
                }
            },
            async logout() {
                await this.$store.dispatch('logout');
                this.showSnack("Logged out successfully");
            },
            showSnack(text) {
                this.snackText = text;
                this.snack = true;
            },
            loaded() {
                this.showFooter = true;
            }
        },
        watch: {},
        computed: {
            mobile() {
                return this.$store.state.windowWidth <= 840;
            }
        }
    }
</script>

<style scoped>
    .home {
        top: 0;
        position: absolute;
        width: 100%;
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
        background-image: linear-gradient(#0cde4d, #39d37a);
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
        /*padding: 9px !important;*/
        /*display: inline-block;*/
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

    .buttons > * {
        margin-left: 10px;
    }

    .made-by {
        padding: 7px 0;
        display: inline-block;
    }

    .logout, .account {
        cursor: pointer;
        -webkit-touch-callout: none; /* iOS Safari */
        -webkit-user-select: none; /* Safari */
        -khtml-user-select: none; /* Konqueror HTML */
        -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none;
        /* Non-prefixed version, currently
                                         supported by Chrome, Opera and Firefox */
    }

    .account:hover {
        text-decoration: underline;
    }
</style>
