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
                component: () => import('../views/CreateMap'),
                children: [{
                    path: '/create/polygon',
                    name: 'CreatePolygonMap',
                    component: () => import('../views/PolyMapEditor')
                }, {
                    path: '/create/point',
                    name: 'CreatePointMap',
                    component: () => import('../views/PointMapEditor')
                },]
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
    {
        path: '/scores',
        name: 'Scores',
        component: () => import('../views/Scores')
    },

];

const router = new VueRouter({
    routes,
    mode: 'history',
});

export default router
