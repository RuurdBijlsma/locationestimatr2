<template>
    <v-app dark>
        <router-view v-if="loggedIn"></router-view>
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
    console.log(firebase);


    export default {
        name: 'App',
        components: {},
        data: () => ({
            loggedIn: false,
        }),
        async mounted() {
            console.log(this.$vuetify);
            this.$vuetify.theme.themes.dark.primary = localStorage.getItem('color') === null ? '#02c780' : localStorage.color;
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
                    if (user.email !== null) {
                        this.$store.commit('setRealAccount', user);
                    } else {
                        this.$store.dispatch('initializeUser');
                    }
                }
            });
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

    canvas {
        position: fixed;
        top: 0;
    }
</style>