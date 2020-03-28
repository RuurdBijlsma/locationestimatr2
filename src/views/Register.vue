<template>
    <div class="register">
        <v-card max-width="600px" :loading="loading">
            <v-card-title>Register</v-card-title>
            <v-card-text>
                <v-form ref="form" @submit="submit">
                    <v-text-field outlined v-model="email" :rules="emailRules" label="Email"
                                  type="email"></v-text-field>
                    <v-text-field outlined v-model="user" :rules="userRules" label="User Name"></v-text-field>
                    <v-text-field
                            v-model="password"
                            :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="passRules"
                            :type="show ? 'text' : 'password'"
                            label="Password"
                            outlined
                            hint="At least 6 characters"
                            counter
                            @click:append="show = !show"
                    ></v-text-field>
                    <p class="error--text">{{error}}</p>
                    <v-btn type="submit" text :color="$store.state.color">Register</v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
    export default {
        name: 'Register',
        components: {},
        data() {
            return {
                loading: false,
                password: '',
                show: false,
                secondPassword: '',
                email: '',
                user: '',
                error: '',
                emailRules: [
                    v => !!v || 'E-mail is required',
                    v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
                ],
                passRules: [
                    v => !!v || 'Password is required',
                    v => v.length >= 6 || 'Password must be at least 6 characters',
                ],
                userRules: [
                    v => !!v || 'Username is required',
                    v => v.length >= 3 || 'Username must be at least 3 characters',
                ],
                secondPassRules: [
                    v => v === this.password || "Passwords don't match"
                ],
            }
        },
        async mounted() {
        },
        methods: {
            async submit(e) {
                e.preventDefault();

                let valid = this.$refs.form.validate();
                if (!valid)
                    return;
                this.loading = true;
                let {user, error} = await this.$store.dispatch('register', {
                    email: this.email,
                    password: this.password,
                    user: this.user,
                });
                this.loading = false;
                if (error) {
                    this.error = error.message;
                } else {
                    this.$emit('snack', "Successfully created account!");
                    await this.$router.push('/');
                }
            }
        },
        watch: {}
    }
</script>

<style scoped>
</style>
