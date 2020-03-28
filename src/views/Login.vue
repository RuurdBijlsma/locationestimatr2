<template>
    <div class="login">
        <v-card max-width="600px" :loading="loading">
            <v-card-title>Login</v-card-title>
            <v-card-text>
                <v-form ref="form" @submit="submit">
                    <v-text-field name="email" outlined v-model="email" :rules="emailRules" label="Email"
                                  type="email"></v-text-field>
                    <v-text-field outlined v-model="password" :rules="passRules" label="Password"
                                  type="password"></v-text-field>
                    <p class="caption">Don't have an account yet? Click
                        <router-link to="/register">here</router-link>
                        to register.
                    </p>
                    <p class="error--text caption">{{error}}</p>
                    <v-btn text @click="forgot">Forgot Password</v-btn>
                    <v-btn type="submit" text :color="$store.state.color">Login</v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
    export default {
        name: 'Login',
        components: {},
        data() {
            return {
                loading: false,
                password: '',
                email: '',
                error: '',
                emailRules: [
                    v => !!v || 'E-mail is required',
                    v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
                ],
                passRules: [
                    v => !!v || 'Password is required',
                    v => v.length > 4 || 'Password must be more than 4 characters',
                ],
            }
        },
        async mounted() {
        },
        methods: {
            async forgot() {
                let valid = this.$refs.form.validate('email');
                if (!valid) {
                    this.error = 'Fill in email before clicking forgot password please';
                    return;
                }
                this.loading = true;
                try {
                    await this.$store.dispatch('forgotPassword', {email: this.email});
                } catch (e) {
                    this.error = e.message;
                }
                this.loading = false;
                this.error = "Password recovery link has been sent to " + this.email;
            },
            async submit(e) {
                e.preventDefault();

                let valid = this.$refs.form.validate();
                if (!valid)
                    return;
                this.loading = true;
                let {user, error} = await this.$store.dispatch('login', {
                    email: this.email,
                    password: this.password
                });
                this.loading = false;
                if (error) {
                    this.error = error.message;
                } else {
                    this.$emit('snack', "Successfully logged in!");
                    await this.$router.push('/');
                }
            }
        },
        watch: {}
    }
</script>

<style scoped>
</style>
