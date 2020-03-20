<template>
    <div class="settings">
        <h1 class="title lighten-4">Settings</h1>
        <v-btn @click="clearCache()">Clear Cache</v-btn>
    </div>
</template>

<script>
    export default {
        name: 'Settings',
        components: {},
        data() {
            return {}
        },
        mounted() {

        },
        methods: {
            clearCache() {
                localStorage.clear();
                location.reload();
            }
        }
    }
</script>

<style scoped>

</style>
