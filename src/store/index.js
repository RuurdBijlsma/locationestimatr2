import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

Vue.use(Vuex);
const db = firebase.firestore();
const storage = firebase.storage().ref()

export default new Vuex.Store({
    state: {
        color: '#02c780',
        user: null,
        homeMaps: [],
    },
    mutations: {
        'setUser': (state, user) => {
            state.user = user;
        },
        'setMaps': (state, maps) => {
            state.maps = maps;
        }
    },
    getters: {},
    actions: {
        async getMaps({commit}) {
            if (this.state.homeMaps.length === 0) {
                const mapsCollection = await db.collection('home-maps').get();
                const maps = [];
                mapsCollection.forEach(map => {
                    maps.push(map.data());
                });
                commit('setMaps', maps);
            }

            return await Promise.all(this.state.maps.map(async map => {
                map.url = await storage.child(map.image).getDownloadURL();
                return map;
            }));
        }
    },
    modules: {}
})
