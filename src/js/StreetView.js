import EventEmitter from 'events';
import Google from './Google'

export default class StreetView extends EventEmitter {
    constructor(map) {
        super();
        this.map = map;
        this.googleMap = null;
        this.coverageCache = this.importCoverageCache();
        this.bounds = this.map.getBounds();
        this.smallestContainingTile = this.boundsToSmallestContainingTile(this.bounds);

        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        //Google maps coverage images are 256x256
        this.canvas.width = 256;
        this.canvas.height = 256;

        // this.smallestContainingTile = {x: 547, y: 377, zoom: 10};
        this.debug = false;
        this.typeColors = [
            {color: [84, 160, 185], id: 'sv'},
            {color: [165, 224, 250, 102], id: 'photo'},
        ];
        //Has opacity:
        // this.typeColors = [
        //     {color: [84, 160, 185, 131], id: 'sv'},
        //     {color: [84, 160, 185, 255], id: 'sv'},
        //     {color: [165, 224, 250, 108], id: 'photo'},
        // ];

        if (this.debug) {
            let div = document.createElement('div');
            document.body.appendChild(div);
            this.debugImg = [1, 2, 3, 4].map(() => document.createElement('img'));
            this.debugImg.forEach(i => div.appendChild(i));
            div.style.position = 'fixed';
            div.style.top = '0';
            div.style.left = '0';
            div.style.zIndex = '14';
        }
    }

    get googleMap() {
        return this._googleMap;
    }

    set googleMap(v) {
        this._googleMap = v;
        if (v !== null && this.debug)
            v.fitBounds(this.map.getBounds());
    }

    randomValidLocations(locationCount, endZoom = 14, type = 'sv', distribution = 'weighted', onLocation) {
        for (let i = 0; i < locationCount; i++) {

        }
    }

    async randomValidLocation(endZoom = 14, type = 'sv', distribution = 'weighted') {
        this.distribution = distribution;
        //We can get initialTile by using the geo map polygon without having to access the google sv coverage
        //{x: 4833, y: 3249, zoom: 13} //cyprus city streets
        let tile = await this.randomValidTile(endZoom, type, this.smallestContainingTile);
        if (tile === false)
            return false;
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        if (tile.img === false)
            tile.img = await this.getTileImage(tile.x, tile.y, tile.zoom);
        let img = tile.img;
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        let data = context.getImageData(0, 0, img.width, img.height).data;

        let pixelCounts = {count: 0, indices: []};
        for (let i = 0; i < data.length; i += 4) {
            let color = data.slice(i, i + 4);
            let colorType = this.getColorType(color);
            if (colorType === type || (colorType !== 'empty' && type === 'both')) {
                pixelCounts.count++;
                pixelCounts.indices.push(i);
            }
        }

        if (pixelCounts.count === 0) {
            console.error("No blue pixel found");
            return this.randomValidLocation(endZoom, type, distribution);
        }
        let randomSvPixel = Math.floor(Math.random() * pixelCounts.count);
        let randomSvIndex = pixelCounts.indices[randomSvPixel];
        let x = (randomSvIndex / 4) % img.width;
        let y = Math.floor((randomSvIndex / 4) / img.width);
        console.log("Saving cache to file");
        this.saveCoverageCache();
        return this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, x, y);
    }

    async waitSleep(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }

    debugClearTiles() {
        console.log("Clearing tiles", this.polygons);
        if (!this.polygons)
            this.polygons = [];
        this.polygons.forEach(p => {
            p.polygon.setMap(null);
            p.infoWindow.setMap(null);
        });
        this.polygons = [];
    }

    debugVisualizeTile(tile, color = 'red') {
        if (this.googleMap === null)
            return console.warn("No googleMap set");

        console.log("Visualizing tile:", tile.x, tile.y, tile.zoom);
        let tileCoordinates = this.getTileCornerCoordinates(tile.x, tile.y, tile.zoom);
        let path = tileCoordinates.map(tile => new Google.maps.LatLng(...tile));
        let polygon = new Google.maps.Polygon({
            paths: [path],
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.35,
            draggable: false,
            clickable: false,
        });
        const infoWindow = new Google.maps.InfoWindow({
            content: JSON.stringify(tile.coverage),
            position: path[0],
        });
        infoWindow.open(this.googleMap);

        if (!this.polygons)
            this.polygons = [];
        this.polygons.push({polygon, infoWindow});
        polygon.setMap(this.googleMap);
        // console.log("Visualizing tile:", tile, color, this.googleMap, polygon);
    }

    async randomValidTile(endZoom, type, chosenTile = {x: 0, y: 0, zoom: 0}) {
        if (chosenTile.zoom >= endZoom) {
            return chosenTile;
        }
        const photoSphereZoomLevel = 12;

        let subTiles = await this.getSubTiles(chosenTile.x, chosenTile.y, chosenTile.zoom);
        if (!this.debug)
            this.emit('subTiles', subTiles);
        // console.log("TYPE", type, "DISTRIBUTION", this.distribution);

        let validTiles = subTiles
            .filter(tile =>
                type === 'sv' && tile.types.sv ||
                type === 'photo' && tile.types.photo ||
                type === 'both' && (tile.types.photo || tile.types.sv) ||
                //When under photosphere zoom level, also consider sv tiles valid tiles, because photospheres aren't visible yet
                tile.zoom <= photoSphereZoomLevel && tile.types.sv)
            .filter(tile => this.tileIntersectsMap(tile.x, tile.y, tile.zoom));


        let shuffleFun = this.distribution === 'uniform' ?
            array => this.shuffle(array) :
            array => this.shuffleWeighted(array, item => item.coverage[chosenTile.zoom + 1 <= photoSphereZoomLevel ? 'both' : type]);
        let shuffledTiles = shuffleFun(validTiles);

        if (this.debug) {
            console.log("Valid shuffledTiles:", shuffledTiles, 'all tiles: ', subTiles);
            this.debugClearTiles();
            subTiles.forEach(tile => this.debugVisualizeTile(tile, '#ff0000'));
            shuffledTiles.forEach(tile => this.debugVisualizeTile(tile, '#24ff2a'));

            this.debugImg.forEach(img => {
                img.src = '';
            });
            shuffledTiles.forEach((tile, i) => {
                if (this.debugImg[i] && tile.img) {
                    this.debugImg[i].src = tile.img.src
                }
            });
            if (chosenTile.zoom >= 7) {
                // return;
            }
            await this.waitSleep(2000000);
        }

        for (let tile of shuffledTiles) {
            let subTile = await this.randomValidTile(endZoom, type, tile);
            // console.log("subTile", subTile);
            // await this.waitSleep(2000);
            if (subTile !== false) {
                if (this.debug) {
                    console.log("FINAL TILE", subTile);
                    // this.debugImg[0].src = subTile.img.src;
                }
                return subTile;
            }
        }
        console.log("Back tracking");
        return false;
    }

    tileEquals(tileA, tileB) {
        return (tileA.x === tileB.x && tileA.y === tileB.y && tileA.zoom === tileB.zoom);
    }

    getTileCornerCoordinates(tileX, tileY, zoom) {
        return [
            this.tilePixelToLatLon(tileX, tileY, zoom, 0, 0),// top left
            this.tilePixelToLatLon(tileX, tileY, zoom, 256, 0),// top right
            this.tilePixelToLatLon(tileX, tileY, zoom, 256, 256),// bottom right
            this.tilePixelToLatLon(tileX, tileY, zoom, 0, 256),// bottom left
        ];
    }

    tileIntersectsMap(tileX, tileY, zoom) {
        let tileCoordinates = this.getTileCornerCoordinates(tileX, tileY, zoom);
        //Check if tile corners are in map bounds
        for (let coordinate of tileCoordinates)
            if (this.map.containsLocation(...coordinate)) {
                return true;
            }
        // return false;

        //Maybe one of the 4 tile corners don't intersect, doesn't mean the two polygons don't intersect
        let mapsBounds = new Google.maps.LatLngBounds();
        for (let coordinate of tileCoordinates)
            mapsBounds.extend(new Google.maps.LatLng(...coordinate));

        // Check if map coordinates are in within tile bounds
        let mapContains = false;
        this.map.polygon.getPaths().forEach(path => {
            path.forEach(point => {
                if (mapsBounds.contains(point))
                    mapContains = true;
            });
        });

        // console.log("Using mapContains");
        return mapContains;
    }

    async getSubTiles(x, y, zoom) {
        //Zooming multiplies coordinates by 2 (4 sub tiles in a tile)
        let startX = x * 2;
        let startY = y * 2;
        let endX = startX + 2;
        let endY = startY + 2;

        return this.getTilesAtCoordinate(startX, endX, startY, endY, zoom + 1);
    }

    async getTilesAtCoordinate(startX, endX, startY, endY, zoom) {
        let tasks = [];
        for (let y = startY; y < endY; y++)
            for (let x = startX; x < endX; x++)
                tasks.push(this.getTile(x, y, zoom));
        return await Promise.all(tasks);
    }

    tilePixelToLatLon(tileX, tileY, zoom, pixelX, pixelY) {
        tileX += pixelX / 256;
        tileY += pixelY / 256;

        tileX *= 2 ** (8 - zoom);
        tileY *= 2 ** (8 - zoom);

        let lon = tileX / 256 * 360 - 180;
        let n = Math.PI - 2 * Math.PI * tileY / 256;
        let lat = (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));

        return [lat, lon];
    }

    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    boundsToSmallestContainingTile(bounds) {
        let ne = bounds.getNorthEast();
        let sw = bounds.getSouthWest();
        let startZoom = 0;
        let endZoom = 18;
        let resultTile = {x: 0, y: 0, zoom: startZoom};
        for (let zoom = startZoom; zoom <= endZoom; zoom++) {
            let neTile = this.latLonToTile(ne.lat(), ne.lng(), zoom);
            let swTile = this.latLonToTile(sw.lat(), sw.lng(), zoom);
            let equals = this.tileEquals(neTile, swTile);
            if (!equals)
                break;
            resultTile = neTile;
        }
        return resultTile;
    }

    latLonToTile(latDeg, lonDeg, zoom) {
        let latRad = this.toRadians(latDeg);
        let n = 2.0 ** zoom;
        let xTile = Math.floor((lonDeg + 180.0) / 360.0 * n);
        let yTile = Math.floor((1.0 - Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI) / 2.0 * n);
        return {x: xTile, y: yTile, zoom};
    }

    getUrl(x, y, zoom) {
        return `https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i${zoom}!2i${x}!3i${y}!4i256!2m8!1e2!2ssvv!4m2!1scb_client!2sapiv3!4m2!1scc!2s*211m3*211e3*212b1*213e2*211m3*211e2*212b1*213e2!3m3!3sUS!12m1!1e68!4e0`;
        // return `https://mts1.googleapis.com/vt?hl=en-US&lyrs=svv|cb_client:apiv3&style=40,18&x=${x}&y=${y}&z=${zoom}`;
    }

    async getTileImage(x, y, zoom) {
        return new Promise(async resolve => {
            let response = await fetch(this.getUrl(x, y, zoom));
            let blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = e => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => resolve(img);
            }
        });
    }

    async getTile(x, y, zoom) {
        return new Promise(async resolve => {
            if (this.coverageCacheContains(x, y, zoom)) {
                let {coverage, types} = this.getCoverageCache(x, y, zoom);
                console.log("Using cache!", x, y, zoom, coverage);
                resolve({
                    coverage, types, img: false, x, y, zoom
                });
                return;
            }
            let img = await this.getTileImage(x, y, zoom);
            let c = this.getTileCoverage(x, y, zoom, img);
            this.setCoverageCache(x, y, zoom, c);
            let {coverage, types} = this.getCoverageCache(x, y, zoom);
            resolve({
                coverage, types, img, x, y, zoom
            });
        });
    }

    getColorType(rgba) {
        if (rgba[2] === 0)
            return 'empty';

        const allowedColorDiff = 4;
        typeLoop:
            for (let {id, color} of this.typeColors) {
                for (let i = 0; i < color.length; i++) {
                    const componentDifference = Math.abs(color[i] - rgba[i]);
                    if (componentDifference > allowedColorDiff)
                        continue typeLoop;
                }
                return id;
            }
        return 'empty';
    }

    isTileFullyContainedInMap(tileX, tileY, zoom) {
        let coordinates = this.getTileCornerCoordinates(tileX, tileY, zoom);
        for (let coordinate of coordinates) {
            if (!this.map.containsLocation(...coordinate))
                return false;
        }
        return true;
    }

    getTileCoverage(tileX, tileY, zoom, img) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.drawImage(img, 0, 0);
        let data = this.context.getImageData(0, 0, img.width, img.height).data;
        //Coverage [sv, photo]
        let coverage = [0, 0];
        let isFullyContained = this.isTileFullyContainedInMap(tileX, tileY, zoom);

        let chunkSize;
        if (zoom <= 6)
            chunkSize = 32;
        else if (zoom <= 7)
            chunkSize = 16;
        else if (zoom <= 8)
            chunkSize = 8;
        else if (zoom <= 9)
            chunkSize = 4;
        else
            chunkSize = 2;

        for (let y = chunkSize / 2; y < img.height; y += chunkSize) {
            for (let x = chunkSize / 2; x < img.width; x += chunkSize) {
                if (!isFullyContained) {
                    let location = this.tilePixelToLatLon(tileX, tileY, zoom, x, y);
                    if (!this.map.containsLocation(...location))
                        continue;
                }
                let i = (y * img.width + x) * 4;
                let color = data.slice(i, i + 4);
                let colorType = this.getColorType(color);
                if (colorType === 'sv')
                    coverage[0]++;
                if (colorType === 'photo')
                    coverage[1]++;
            }
        }
        return coverage;
    }

    coverageCacheContains(x, y, zoom) {
        let id = this.map.id;
        return this.coverageCache[id] && this.coverageCache[id][zoom] && this.coverageCache[id][zoom][x] && this.coverageCache[id][zoom][x][y];
    }

    getCoverageCache(x, y, zoom) {
        let id = this.map.id;
        let [svCoverage, photoCoverage] = this.coverageCache[id][zoom][x][y];
        return {
            types: {
                sv: svCoverage > 0,
                photo: photoCoverage > 0,
            },
            coverage: {
                sv: svCoverage,
                photo: photoCoverage,
                both: svCoverage + photoCoverage,
            }
        }
    }

    setCoverageCache(x, y, zoom, value) {
        let id = this.map.id;
        if (!this.coverageCache[id])
            this.coverageCache[id] = {};
        if (!this.coverageCache[id][zoom])
            this.coverageCache[id][zoom] = {};
        if (!this.coverageCache[id][zoom][x])
            this.coverageCache[id][zoom][x] = {};
        this.coverageCache[id][zoom][x][y] = value;
    }


    importCoverageCache() {
        if (this.debug)
            return {};
        return localStorage.getItem('tileCoverage') === null ? {} : JSON.parse(localStorage.tileCoverage);
    }

    saveCoverageCache() {
        localStorage.tileCoverage = JSON.stringify(this.coverageCache);
    }

    shuffleWeighted(array, weightField = item => item.weight) {
        if (array.length === 0)
            return array;
        let result = [];
        let len = array.length;
        let totalWeights = array.map(weightField).reduce((a, b) => a + b);
        for (let i = 0; i < len; i++) {
            let randomWeightValue = Math.random() * totalWeights;
            let weightedRandomIndex = -1;
            for (let j = 0; j < array.length; j++) {
                let item = array[j];
                if (weightField(item) > randomWeightValue) {
                    weightedRandomIndex = j;
                    break;
                }
                randomWeightValue -= weightField(item);
            }
            let item = array.splice(weightedRandomIndex, 1)[0];
            totalWeights -= weightField(item);
            result.push(item);
        }
        return result;

    }

    shuffle(input) {
        for (let i = input.length - 1; i >= 0; i--) {

            const randomIndex = Math.floor(Math.random() * (i + 1));
            const itemAtIndex = input[randomIndex];

            input[randomIndex] = input[i];
            input[i] = itemAtIndex;
        }
        return input;
    }
}