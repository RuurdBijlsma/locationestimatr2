import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import initialCache from '../assets/initialCache.json';

const minute = 1000 * 60;
const day = minute * 60 * 24;
const year = day * 365;


Vue.use(Vuex);
const db = firebase.firestore();
const storage = firebase.storage().ref();
let cache, tempCache;
if (localStorage.getItem("cache") === null) {
    console.log("Using initial cache", initialCache);
    cache = initialCache;
    tempCache = true;
} else {
    cache = JSON.parse(localStorage.cache);
    tempCache = false;
}
if (localStorage.getItem("scores") === null)
    localStorage.scores = JSON.stringify({});
const localScores = JSON.parse(localStorage.scores);

if (document.querySelectorAll(`head link[rel='manifest']`).length === 0) {
    let manifestLink = document.createElement('link');
    manifestLink.setAttribute('rel', 'manifest');
    manifestLink.setAttribute('href', './manifest.json');
    document.querySelector('head').appendChild(manifestLink);
}

async function getCached(key, action, cacheLifetime = 1000 * 60 * 60 * 24) {
    //Refresh cache if it doesn't exist
    let data;
    if (!cache.hasOwnProperty(key)) {
        data = await action();
    } else {
        let date = cache[key].date;
        let now = +new Date();
        //Refresh cache if it's 24+ hours old
        if (navigator.onLine && now - date >= cacheLifetime)
            data = await action();
        if (!navigator.onLine)
            console.warn("Using old cache because browser is offline");
    }
    if (data !== undefined) {
        console.log(`Not using cached ${key}`);
        cache[key] = {
            data,
            date: +new Date()
        };
        localStorage.cache = JSON.stringify(cache);
    } else {
        console.log(`Using cached ${key}`);
    }
    return cache[key].data;
}

async function addCount(mapId, field) {
    let doc = await db.collection('map-counts').doc(mapId);
    let mapCountData = (await doc.get()).data();
    if (mapCountData === undefined) {
        let updatedData = {plays: 0, likes: 0, dislikes: 0};
        updatedData[field] = 1;
        await doc.set(updatedData);
    } else {
        let mapCount = mapCountData[field] === undefined ? 0 : mapCountData[field];
        mapCountData[field] = mapCount + 1;
        await doc.update(mapCountData);
    }
}

async function getMapById(id, cacheTime = year) {
    let get = async () => {
        let mapData = (await db.collection('maps').doc(id).get()).data();
        //map has been deleted :O
        if (mapData === undefined)
            return false;
        let mapCountsTask = new Promise(async resolve => {
            let mapCounts = (await db.collection('map-counts').doc(id).get()).data();
            if (mapCounts === undefined)
                mapCounts = {likes: 0, dislikes: 0, plays: 0};
            mapData.counts = mapCounts;
            resolve();
        });
        let imageTask = new Promise(async resolve => {
            if (mapData.image === 'id') {
                try {
                    mapData.image = await storage.child('images/user/' + id).getDownloadURL();
                } catch (e) {
                    mapData.image = 'images/flags/ad.svg';
                }
            }
            resolve();
        });
        let userTask = new Promise(async resolve => {
            if (mapData.realUser && mapData.user) {
                mapData.userInfo = (await db.collection('users').doc(mapData.user).get()).data();
                if (mapData.userInfo === undefined) {
                    mapData.userInfo = {
                        name: '[Deleted]',
                        maps: [],
                        likes: [],
                    }
                }
            }
            resolve();
        });
        await Promise.all([mapCountsTask, imageTask, userTask]);
        mapData.id = id;
        delete mapData.maps;
        // console.log(mapData);
        delete mapData.kml;
        return mapData;
    };
    return getCached('shallowMap:' + id, get, cacheTime);
}

async function getMapsByIds(ids, cacheTime = year) {
    // console.log({ids})
    // console.log({result});
    return await Promise.all(ids.map(id => getMapById(id, cacheTime)));
}

export default new Vuex.Store({
    state: {
        homeMaps: [],
        realAccount: false,
        user: null,
        customColor: false,
        windowWidth: window.innerWidth,
        immersive: false,
        slowCpu: localStorage.getItem('slowCpu') === null ? false : JSON.parse(localStorage.slowCpu),
    },
    mutations: {
        'setUser': (state, user) => {
            console.log("Setting user");
            state.user = user;
        },
        'setImmersive': (state, immersive) => {
            state.immersive = immersive;
        },
        'setWindowWidth': (state, windowWidth) => {
            state.windowWidth = windowWidth;
        },
        'setRealAccount': (state, real) => {
            state.realAccount = real;
        },
        'setHomeMaps': (state, maps) => {
            state.homeMaps = maps;
        },
        'setSlowCpu': (state, slowCpu) => {
            state.slowCpu = slowCpu;
            localStorage.slowCpu = slowCpu;
        },
        'setCustomColor': (state, customColor) => {
            const defaultThemeColor = '#02c780';
            state.customColor = customColor;
            let themeColor;
            if (customColor !== false) {
                themeColor = customColor.colorBottom;
            } else {
                themeColor = defaultThemeColor;
            }
            let head = document.querySelector('head');
            head.querySelector(`meta[name='theme-color']`).setAttribute('content', themeColor);

            let iconLinks = head.querySelectorAll(`link[rel='icon']`);
            iconLinks.forEach(l => l.remove());

            let newLink = document.createElement('link');
            newLink.setAttribute('rel', 'icon');
            newLink.setAttribute('sizes', `${customColor.width}x${customColor.height}`);
            newLink.setAttribute('href', customColor.image);
            // console.log("Setting new favicon to", customColor, newLink);
            head.appendChild(newLink);
        }
    },
    getters: {
        user: (state, getters) => {
            return firebase.auth().currentUser;
        }
    },
    actions: {
        async updatePassword({commit}, newPassword) {
            let user = firebase.auth().currentUser;
            if (!user.isAnonymous) {
                try {
                    await user.updatePassword(newPassword);
                    return true;
                } catch (e) {
                    return e;
                }
            }
        },
        async submitFeedback({commit}, feedback) {
            db.collection('feedback').add({
                date: new Date,
                message: feedback,
            });
        },
        async deleteAccount({commit}) {
            try {
                await db.collection('users').doc(firebase.auth().getUid()).delete();
                console.warn("DELETING ACCOUNT");
                await firebase.auth().currentUser.delete();
                commit('setRealAccount', false);
                await firebase.auth().signInAnonymously();
                return true;
            } catch (e) {
                return e;
            }
        },
        async getExploreMaps({commit}) {
            let get = async () => {
                let popularMapIds = await db.collection('map-counts')
                    .orderBy('plays', 'desc')
                    .limit(8)
                    .get();
                let popMaps = [];
                popularMapIds.forEach(map => popMaps.push(map.id));

                let likedMapIds = await db.collection('map-counts')
                    .orderBy('likes', 'desc')
                    .limit(8)
                    .get();
                let likeMaps = [];
                likedMapIds.forEach(map => likeMaps.push(map.id));

                console.log(popMaps, likeMaps);
                let [pMaps, lMaps] = await Promise.all([
                    getMapsByIds(popMaps, 5 * day),
                    getMapsByIds(likeMaps, 5 * day),
                ]);
                pMaps = pMaps.filter(p => p !== false);
                lMaps = lMaps.filter(p => p !== false);


                return {popular: pMaps, liked: lMaps};
            };
            let get2 = async () => {
                let newMapIds = await db.collection('maps')
                    .orderBy('date', 'desc')
                    .limit(12)
                    .get();
                let newMaps = [];
                newMapIds.forEach(map => newMaps.push(map.id));
                let nMaps = await getMapsByIds(newMaps);
                return nMaps.filter(p => p !== false && p.counts.plays >= 1);
            };
            let [{popular, liked}, recent] = await Promise.all([
                getCached('explore', get, day),
                getCached('exploreRecent', get2, 15 * minute),
            ]);
            return {popular, liked, recent};
        },
        async getUser({commit, dispatch}, userId) {
            let get = async () => {
                let user = (await db.collection('users').doc(userId).get()).data();

                let [userMaps, userLikes] = await Promise.all([
                    getMapsByIds(user.maps),
                    getMapsByIds(user.likes),
                ]);

                userMaps = userMaps.filter(p => p !== false);
                userLikes = userLikes.filter(p => p !== false);


                user.maps = userMaps;
                user.likes = userLikes;
                return user;
            };
            return await getCached('user:' + userId, get, 5 * minute);
        },
        async logout({commit}) {
            await firebase.auth().signOut();
            commit('setRealAccount', false);
            //Not needed, event handler in App does this now
            // await firebase.auth().signInAnonymously();
        },
        async login({commit}, {email, password}) {
            try {
                let loginInfo = await firebase.auth().signInWithEmailAndPassword(email, password);
                commit('setRealAccount', loginInfo.user);
                return {
                    user: loginInfo.user,
                    error: false,
                };
            } catch (e) {
                return {
                    user: false,
                    error: e,
                };
            }
        },
        async forgotPassword({commit}, {email}) {
            return await firebase.auth().sendPasswordResetEmail(email);
        },
        async register({commit}, {email, password, user}) {
            try {
                let registerInfo = await firebase.auth().createUserWithEmailAndPassword(email, password);
                commit('setRealAccount', registerInfo.user);
                await registerInfo.user.sendEmailVerification();
                await registerInfo.user.updateProfile({
                    displayName: user,
                });
                await db.collection('users').doc(registerInfo.user.uid).set({
                    name: user,
                    date: new Date,
                    maps: [],
                    likes: []
                });
                return {
                    user: registerInfo.user,
                    error: false,
                };
            } catch (e) {
                return {
                    user: false,
                    error: e,
                };
            }
        },
        async addDislike({commit}, mapId) {
            await addCount(mapId, 'dislikes');
        },
        async addLike({commit, dispatch}, mapId) {
            let tasks = [
                addCount(mapId, 'likes'),
                new Promise(async resolve => {
                    let {user, data} = await dispatch('getUserData');

                    let likes = data.likes || [];
                    console.log('user likes', likes);
                    if (!likes.includes(mapId)) {
                        likes.push(mapId);
                        await user.update({likes});
                    }
                    resolve();
                })];
            await Promise.all(tasks);
        },
        async addPlay({commit}, mapId) {
            await addCount(mapId, 'plays');
        },
        async reportMap({commit, state}, {mapId, rules}) {
            await db.collection('reports').add({
                mapId, rules, user: firebase.auth().getUid(), date: new Date(),
            });
        },
        async getScoresByDifficultyAndMap({commit}, {difficulty, map, refresh, limit = 50}) {
            console.log({difficulty, map});
            let getScores = async () => {
                let result = await db.collection('scores')
                    .where('map', '==', map)
                    .where('rules', '==', difficulty)
                    .orderBy('totalScore', 'desc')
                    .orderBy('totalDistance', 'desc')
                    .limit(limit)
                    .get();
                let list = [];
                result.forEach(score => {
                    score = score.data();
                    score.date = +score.date.toDate();
                    list.push(score)
                });
                return list;
            };
            //5 Minutes cache lifetime
            let cacheLifetime = 15 * minute;
            if (refresh)
                cacheLifetime = 0;

            // console.log(scores);
            return await getCached(`scores:${difficulty}:${map}:${limit}`, getScores, cacheLifetime);
        },
        async initializeUser({commit}) {
            let uid = firebase.auth().getUid();
            let user = db.collection('users').doc(uid);
            let userData = (await user.get()).data();
            if (userData === undefined) {
                console.log("Initializing USER", uid);
                await user.set({likes: [], maps: [], name: '', date: new Date});
            }
        },
        async getUserData({commit, dispatch}) {
            let uid = firebase.auth().getUid();
            let user = db.collection('users').doc(uid);
            let userData = (await user.get()).data();
            if (userData === undefined) {
                await dispatch('initializeUser');
                user = db.collection('users').doc(uid);
                userData = (await user.get()).data();
            }
            return {user, data: userData};
        },
        async uploadUserMap({commit, state, dispatch}, data) {
            let image = data.image;
            if (data.image)
                data.image = 'id';
            if (state.realAccount) {
                data.realUser = true;
            }
            data.user = firebase.auth().getUid();
            let doc = await db.collection('maps').add(data);

            let tasks = [];
            tasks.push(new Promise(async resolve => {
                let {user, data} = await dispatch('getUserData');
                let userMaps = data.maps || [];
                console.log('user maps', userMaps);
                userMaps.push(doc.id);
                await user.update({maps: userMaps});
                resolve();
            }));

            if (image) {
                tasks.push(new Promise((resolve, error) => {
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
                }));
            }

            console.log(tasks[0], tasks[1]);
            let [_, mapId] = await Promise.all(tasks);
            return mapId;
        },
        async getChallengeUrl({commit}, data) {
            console.log("Challenge data", data);
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
            let challenge = await getCached('challenge:' + challengeId, getChallengeFromDb, year);
            let map = 'my_area';
            if (challenge.map !== 'my_area') {
                map = await dispatch('getMap', challenge.map);
            }
            return {challenge, map};
        },
        async getMap({commit}, mapKey) {
            let get = async () => {
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
            return await getCached('map:' + mapKey, get, year);
        },
        async getUrl({commit}, imageUrl) {
            try {
                let get = async () => storage.child(imageUrl).getDownloadURL();
                return getCached('storage:image:' + imageUrl, get, year);
            } catch (e) {
                return 'images/flags/ad.svg';
            }
        },
        async loadHomeMaps({commit}) {
            if (this.state.homeMaps.length === 0) {
                console.log("Loading home maps");
                let get = async cacheTime => {
                    const mapsCollection = await db.collection('home-maps').orderBy('order').get();
                    const homeMaps = [];
                    mapsCollection.forEach(map => {
                        homeMaps.push(map.data());
                    });
                    await Promise.all(homeMaps.map(async hm => {
                        let maps = await getMapsByIds(hm.maps.map(m => m.id), cacheTime);
                        maps = maps.filter(m => m !== false);
                        hm.maps = maps;
                    }));
                    console.log(homeMaps);
                    return homeMaps;
                };
                if (tempCache) {
                    console.log("Using temp cache");
                    let homeMaps = await getCached('homeMaps', () => get(year), year);
                    commit('setHomeMaps', homeMaps);
                }
                let homeMaps = await getCached('homeMaps', () => get(day * 5), day * 5);
                commit('setHomeMaps', homeMaps);
            } else {
                // console.log("Don't have to load home maps silly")
            }
        }
    },
    modules: {}
})
