<template>
    <div class="settings">
        <h1 class="title lighten-4">Settings</h1>
        <v-switch label="Show finding random location visual (might spoil location)" v-model="showVisual"></v-switch>
        <v-btn @click="clearCache()">Clear Cache</v-btn>
    </div>
</template>

<script>
    export default {
        name: 'Settings',
        components: {},
        data() {
            return {
                showVisual: localStorage.getItem('visualize') && localStorage.visualize === 'true',
            }
        },
        mounted() {

        },
        methods: {
            clearCache() {
                localStorage.clear();
                location.reload();
            }
        },
        watch: {
            showVisual() {
                localStorage.visualize = this.showVisual;
            }
        },
    }
</script>

<style scoped>

</style>
