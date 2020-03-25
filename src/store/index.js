import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";

Vue.use(Vuex);
const db = firebase.firestore();
const storage = firebase.storage().ref();
if (localStorage.getItem("cache") === null)
    localStorage.cache = JSON.stringify({});
const cache = JSON.parse(localStorage.cache);
if (localStorage.getItem("scores") === null)
    localStorage.scores = JSON.stringify({});
const localScores = JSON.parse(localStorage.scores);

async function getCached(key, action) {
    //Refresh cache if it doesn't exist
    let data;
    if (!cache.hasOwnProperty(key)) {
        data = await action();
    } else {
        let date = cache[key].date;
        let now = +new Date();
        let refreshCacheTime = 1000 /*ms*/ * 60 /*s*/ * 60 /*min*/ * 24; /*hours*/ //Refresh cache every 24 hours
        //Refresh cache if it's 24+ hours old
        if (navigator.onLine && now - date >= refreshCacheTime)
            data = await action();
        if (!navigator.onLine)
            console.warn("Using old cache because browser is offline");
    }
    if (data) {
        console.log(`Not using cached ${key}`);
        cache[key] = {
            data,
            date: +new Date()
        };
    } else {
        console.log(`Using cached ${key}`);
    }
    localStorage.cache = JSON.stringify(cache);
    return cache[key].data;
}

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
        async uploadUserMap({commit}, data) {
            return new Promise(async (resolve, error) => {
                let image = data.image;
                if (data.image)
                    data.image = 'id';
                let doc = await db.collection('maps').add(data);
                if (image) {
                    const metadata = {contentType: image.type};
                    const uploadTask = storage.child('images/user/' + doc.id).put(image, metadata);
                    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, snapshot => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done', snapshot);
                    }, (err) => {
                        console.warn("ERROR", err);
                        error(err);
                    }, () => {
                        resolve(doc.id);
                    });
                }
            });
        },
        async getChallengeUrl({commit}, data) {
            console.log("Challenge data", data.radius);
            let appendString = '';
            if (data.radius && data.coordinates) {
                let radius = data.radius;
                let coordinates = data.coordinates;
                appendString = `&area_coordinates=${coordinates}&area_radius=${radius}`;
            }
            delete data.radius;
            delete data.coordinates;
            let dbData = await db.collection('challenges').add(data);
            return location.origin + location.pathname + '?challenge=' + dbData.id + appendString;
        },
        async submitHighScore({commit}, score) {
            if (!localScores[score.map])
                localScores[score.map] = [];
            localScores[score.map].push(score);
            localStorage.scores = JSON.stringify(localScores);
            await db.collection('scores').add(score);
        },
        async getChallenge({commit, dispatch}, challengeId) {
            let getChallengeFromDb = async () => (await db.collection('challenges').doc(challengeId).get()).data();
            let challenge = await getCached('challenge:' + challengeId, getChallengeFromDb);
            let map = 'my_area';
            if (challenge.map !== 'my_area') {
                map = await dispatch('getMap', challenge.map);
            }
            return {challenge, map};
        },
        async getMap({commit}, mapKey) {
            let getMapFromDb = async () => {
                let map = (await db.collection('maps').doc(mapKey).get()).data();
                if (map.type === 'collection') {
                    map.maps = await Promise.all(map.maps.map(async map => {
                        let mapData = (await map.get()).data();
                        delete mapData.maps;
                        return mapData;
                    }))
                }
                return map;
            };
            return await getCached('map:' + mapKey, getMapFromDb);
        },
        async getUrl({commit}, imageUrl) {
            return storage.child(imageUrl).getDownloadURL()
        },
        async loadHomeMaps({commit}) {
            if (this.state.homeMaps.length === 0) {
                let fromHomeMapsFromDb = async () => {
                    const mapsCollection = await db.collection('home-maps').orderBy('order').get();
                    const homeMaps = [];
                    mapsCollection.forEach(map => {
                        homeMaps.push(map.data());
                    });
                    await Promise.all(homeMaps.map(async m => {
                        m.maps = await Promise.all(m.maps.map(async h => {
                            let mapData = (await h.get()).data();
                            delete mapData.maps;
                            mapData.id = h.id;
                            return mapData;
                        }))
                    }));
                    return homeMaps;
                };
                let homeMaps = await getCached('homeMaps', fromHomeMapsFromDb);
                commit('setHomeMaps', homeMaps);
            }
        }
    },
    modules: {}
})
