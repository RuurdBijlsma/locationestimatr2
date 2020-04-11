<template>
    <v-app dark class="app">
        <v-app-bar fixed color="primary" v-if="mobile && !($route.path.startsWith('/play') && $store.state.immersive)">
            <v-btn v-if="$route.path !== '/'" icon to="/">
                <v-icon>home</v-icon>
            </v-btn>
            <v-spacer></v-spacer>
            <v-toolbar-title>Location Estimatr</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn v-if="$route.path !== '/'" style="visibility: hidden" icon @click="$router.push('/')">
                <v-icon>home</v-icon>
            </v-btn>
        </v-app-bar>
        <v-content class="content"
                   :style="mobile && !($route.path.startsWith('/play') && $store.state.immersive) ? `margin-top: 56px` : ''">
            <router-view v-if="loggedIn"></router-view>
        </v-content>
    </v-app>
    <!--    <div id="app">-->
    <!--    </div>-->
</template>

<script>
    // Firebase App (the core Firebase SDK) is always required and must be listed first
    import * as firebase from "firebase/app";

    // If you enabled Analytics in your project, add the Firebase SDK for Analytics
    import "firebase/analytics";

    // Add the Firebase products that you want to use
    import "firebase/auth";
    import "firebase/firestore";
    import {firebaseConfig} from './assets/credentials.json';

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
    // console.log(firebase);


    export default {
        name: 'App',
        components: {},
        data: () => ({
            loggedIn: false,
        }),
        async mounted() {
            window.onresize = () => this.$store.commit('setWindowWidth', window.innerWidth);
            console.log(this.$vuetify);
            this.$vuetify.theme.themes.dark.primary = localStorage.getItem('color') === null ? '#02c780' : localStorage.color;
            let customColor = localStorage.getItem('customColor') === null ? false : JSON.parse(localStorage.customColor);
            this.$store.commit('setCustomColor', customColor);

            if (!navigator.onLine)
                this.loggedIn = true;
            firebase.auth().onAuthStateChanged(user => {
                console.log("AuthStateChanged", user);
                if (user === null) {
                    console.log("User is null, setting login to anonymous");
                    firebase.auth().signInAnonymously().catch(err => {
                        console.log("Login error", err);
                    });
                } else {
                    this.loggedIn = true;
                    this.$store.commit("setUser", user);
                    if (user.email !== null) {
                        this.$store.commit('setRealAccount', user);
                    } else {
                        this.$store.dispatch('initializeUser');
                    }
                }
            });
        },
        computed: {
            mobile() {
                return this.$store.state.windowWidth <= 840;
            }
        }
    };
</script>

<style>
    @import url('https://cdn.materialdesignicons.com/5.0.45/css/materialdesignicons.min.css');
    @import url('https://fonts.googleapis.com/css?family=Material+Icons|Montserrat:200,500,700|Roboto:400,400i,500,600,700,800,900&display=swap');

    html, body {
        background-color: #222031;
        overflow-y: auto !important;
    }

    * {
        font-family: Montserrat, Roboto, Helvetica, Arial, sans-serif;
    }

    #app {
        background-color: #222031;
        overflow-y: hidden;
    }

    .content {
        overflow-y: auto;
    }

    input[type='number'] {
        -moz-appearance: textfield;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }

    .map-element {
        width: 100%;
        height: 100%;
    }

    .map-element * {
        cursor: default;
    }

    /*canvas {*/
    /*    position: fixed;*/
    /*    top: 0;*/
    /*}*/

    .debug-img {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 5;
    }

    .v-btn__content {
        font-weight: bold;
    }

    .gm-style-iw.gm-style-iw-c  {
        color: black;
    }
</style>