import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

if (process.env.NODE_ENV === 'production')
    window.console.log = () => ({});

import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false;

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app');
