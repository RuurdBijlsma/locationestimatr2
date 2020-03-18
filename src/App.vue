<template>
    <v-app dark>
        <router-view></router-view>
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
    // TODO: Replace the following with your app's Firebase project configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCwG_dMF4QnKeZ3vd1NwfJFdR5s-e9xc6Y",
        authDomain: "locationestimatr.firebaseapp.com",
        databaseURL: "https://locationestimatr.firebaseio.com",
        projectId: "locationestimatr",
        storageBucket: "locationestimatr.appspot.com",
        messagingSenderId: "304801936344",
        appId: "1:304801936344:web:9abc795a41c685d8d578ad",
        measurementId: "G-206BLL7V72"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();
    console.log(firebase);


    export default {
        name: 'App',
        components: {},
        data: () => ({
            //
        }),
        async mounted() {
            firebase.auth().signInAnonymously().then(s => {
                this.$store.commit('setUser', s.user);
            }).catch(err => {
                console.log("Login error", err);
            });
        }
    };
</script>

<style>
    @import url('https://fonts.googleapis.com/css?family=Material+Icons|Montserrat:200,500,700|Roboto:400,400i,500,600,700,800,900&display=swap');

    html {
        background-color: #222031;
    }

    * {
        font-family: Montserrat, Roboto, Helvetica, Arial, sans-serif;
    }

    #app {
        background-color: #222031;
    }

    input[type='number'] {
        -moz-appearance: textfield;
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
    }
</style>