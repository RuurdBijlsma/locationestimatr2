import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

Vue.use(Vuex);
const db = firebase.firestore();
const storage = firebase.storage().ref();

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
        'setHomeMaps': (state, maps) => {
            state.homeMaps = maps;
        }
    },
    getters: {},
    actions: {
        async getUrl({commit}, imageUrl) {
            return storage.child(imageUrl).getDownloadURL()
        },
        async getHomeMaps({commit}) {
            if (this.state.homeMaps.length === 0) {
                const mapsCollection = await db.collection('home-maps').orderBy('order').get();
                const homeMaps = [];
                mapsCollection.forEach(map => {
                    homeMaps.push(map.data());
                });
                await Promise.all(homeMaps.map(async m => {
                    m.maps = await Promise.all(m.maps.map(async h => {
                        return (await h.get()).data();
                    }))
                }));
                commit('setHomeMaps', homeMaps);
            }

        }
    },
    modules: {}
})
