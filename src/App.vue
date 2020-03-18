<template>
    <v-app dark>
        <router-view></router-view>
    </v-app>
    <!--    <div id="app">-->
    <!--    </div>-->
</template>

<script>


    export default {
        name: 'App',

        components: {},

        data: () => ({
            //
        }),
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
</style>