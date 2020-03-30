<template>
    <div class="settings">
        <h1 class="title lighten-4">Settings</h1>
        <v-switch label="Show finding random location visual (might spoil location)" v-model="showVisual"></v-switch>
        <v-btn @click="clearCache()">Clear Cache</v-btn>
        <v-btn @click="deleteAccount()" v-if="$store.state.realAccount" color="error">Delete Account</v-btn>
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
            deleteAccount() {
                if (confirm("Are you sure you want to delete your account? This is irreversible!")) {
                    this.$store.dispatch('deleteAccount');
                    this.$emit('snack', 'Your account has been deleted');
                }
            },
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
