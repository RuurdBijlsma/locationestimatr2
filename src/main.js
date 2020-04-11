import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

const _log = console.log;
window.console.log = (...params) => {
    if (process.env.NODE_ENV === 'development')
        _log(...params);
};

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
