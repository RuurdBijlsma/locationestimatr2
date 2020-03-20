import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        component: Home,
        children: [
            {
                path: '',
                name: 'Home',
                component: () => import('../views/Play')
            },
            {
                path: '/explore',
                name: 'Explore',
                component: () => import('../views/Explore')
            },
            {
                path: '/create',
                name: 'CreateMap',
                component: () => import('../views/CreateMap')
            },
            {
                path: '/settings',
                name: 'Settings',
                component: () => import('../views/Settings')
            },
        ]
    },
    {
        path: '/play',
        name: 'PlayMap',
        component: () => import('../views/PlayMap')
    },

];

const router = new VueRouter({
    routes
});

export default router
