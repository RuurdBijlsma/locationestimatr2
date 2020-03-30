<template>
    <div class="settings">
        <h1 class="title lighten-4">Settings</h1>
        <v-switch label="Show finding random location visual (might spoil location)" v-model="showVisual"></v-switch>
        <br>
        <v-color-picker mode="hexa" v-model="color" hide-mode-switch></v-color-picker>
        <br>
        <v-btn @click="clearCache()">Clear Cache</v-btn>
        <br>
        <v-btn @click="resetColor()">Reset Theme Color</v-btn>
        <br>
        <v-btn @click="deleteAccount()" v-if="$store.state.realAccount" color="error">Delete Account</v-btn>
    </div>
</template>

<script>
    export default {
        name: 'Settings',
        components: {},
        data() {
            return {
                color: '',
                showVisual: localStorage.getItem('visualize') && localStorage.visualize === 'true',
            }
        },
        mounted() {
            this.color = this.$vuetify.theme.themes.dark.primary;
        },
        methods: {
            resetColor() {
                this.color = '#02c780';
            },
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
            },
            color() {
                if(this.color){
                    this.$vuetify.theme.themes.dark.primary = this.color;
                    localStorage.color = this.color;
                }
            },
        },
    }
</script>

<style scoped>
    button {
        margin: 10px;
    }
</style>
