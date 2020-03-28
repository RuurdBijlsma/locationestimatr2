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
                meta: {
                    title: route => "LocationEstimatr",
                },
                component: () => import('../views/Play')
            },
            {
                path: '/explore',
                name: 'Explore',
                meta: {
                    title: route => "Explore - LocationEstimatr",
                },
                component: () => import('../views/Explore')
            },
            {
                path: '/create',
                name: 'CreateMap',
                meta: {
                    title: route => "Create Map - LocationEstimatr",
                },
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
                meta: {
                    title: route => "Settings - LocationEstimatr",
                },
                component: () => import('../views/Settings')
            },
            {
                path: '/login',
                name: 'Login',
                meta: {
                    title: route => "Login - LocationEstimatr",
                },
                component: () => import('../views/Login')
            },
            {
                path: '/register',
                name: 'Register',
                meta: {
                    title: route => "Register - LocationEstimatr",
                },
                component: () => import('../views/Register')
            },
            {
                path: '/user',
                name: 'Profile',
                meta: {
                    title: route => "Profile - LocationEstimatr",
                },
                component: () => import('../views/Profile')
            },
        ]
    },
    {
        path: '/play',
        name: 'PlayMap',
        meta: {
            title: route => "Play - LocationEstimatr",
        },
        component: () => import('../views/PlayMap')
    },
    {
        path: '/scores',
        name: 'Scores',
        meta: {},
        component: () => import('../views/Scores')
    },

];

const router = new VueRouter({
    routes,
    mode: 'history',
});

router.afterEach((to, from) => {
    Vue.nextTick(() => {
        if (to.meta.hasOwnProperty('title'))
            document.title = to.meta.title(to)
    })
});

export default router
