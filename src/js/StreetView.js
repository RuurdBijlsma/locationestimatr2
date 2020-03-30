import EventEmitter from 'events';

export default class StreetView extends EventEmitter {
    constructor(map) {
        super();
        this.map = map;
        this.bounds = this.map.getBounds();
        this.smallestContainingTile = this.boundsToSmallestContainingTile(this.bounds);
        // this.smallestContainingTile = {x: 547, y: 377, zoom: 10};
        console.log("Smallest containing tile:", this.smallestContainingTile);
        this.debug = false;
        this.typeColors = [
            {color: [84, 160, 185], id: 'sv'},
            {color: [165, 224, 250], id: 'photo'},
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

    async randomValidLocation(endZoom = 14, type = 'sv', distribution = 'weighted') {
        this.distribution = distribution;
        //We can get initialTile by using the geo map polygon without having to access the google sv coverage
        //{x: 4833, y: 3249, zoom: 13} //cyprus city streets
        let tile = await this.randomValidTile(endZoom, type, this.smallestContainingTile);
        if (tile === false)
            return false;
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
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
        return this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, x, y);
    }

    async waitSleep(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        });
    }

    async randomValidTile(endZoom, type, chosenTile = {x: 0, y: 0, zoom: 0}) {
        if (chosenTile.zoom >= endZoom) {
            return chosenTile;
        }
        const photoSphereZoomLevel = 12;

        let subTiles = await this.getSubTiles(chosenTile.x, chosenTile.y, chosenTile.zoom);
        this.emit('subTiles', subTiles);
        // console.log("TYPE", type, "DISTRIBUTION", this.distribution);

        let validTiles = subTiles
            .filter(tile =>
                (type === 'sv' || type === 'both') && tile.types.sv ||
                (type === 'photo' || type === 'both') && tile.types.photo ||
                //When under photosphere zoom level, also consider sv tiles valid tiles, because photospheres aren't visible yet
                tile.zoom <= photoSphereZoomLevel && tile.types.sv)
            .filter(tile => this.tileIntersectsMap(tile.x, tile.y, tile.zoom));

        if (this.debug) {
            console.log("validTiles", validTiles);
            this.debugImg.forEach(img => {
                img.src = '';
            });
            validTiles.forEach((tile, i) => {
                if (this.debugImg[i] && tile.img) {
                    this.debugImg[i].src = tile.img.src
                }
            });
            if (chosenTile.zoom >= 12) {
                // return;
            }
            // await this.waitSleep(4000);
        }

        //When under photosphere zoom level don't use distribution weighted, because there is no photosphere coverage yet to weight
        let shuffleFun = this.distribution === 'uniform' || (type === 'photo' && chosenTile.zoom + 1 <= photoSphereZoomLevel) ?
            array => this.shuffle(array) :
            array => this.shuffleWeighted(array, item => item.coverage[type]);
        let shuffledTiles = shuffleFun(validTiles);
        for (let tile of shuffledTiles) {
            let subTile = await this.randomValidTile(endZoom, type, tile);
            // console.log("subTile", subTile);
            // await this.waitSleep(2000);
            if (subTile !== false)
                return subTile;
        }
        console.log("Back tracking");
        return false;
    }

    tileEquals(tileA, tileB) {
        return (tileA.x === tileB.x && tileA.y === tileB.y && tileA.zoom === tileB.zoom);
    }

    tileIntersectsMap(tileX, tileY, zoom) {
        let bounds = [];
        bounds.push(this.tilePixelToLatLon(tileX, tileY, zoom, 0, 0));
        bounds.push(this.tilePixelToLatLon(tileX, tileY, zoom, 256, 256));
        bounds.push(this.tilePixelToLatLon(tileX, tileY, zoom, 0, 256));
        bounds.push(this.tilePixelToLatLon(tileX, tileY, zoom, 256, 0));
        //Check if tile corners are in map bounds
        for (let bound of bounds)
            if (this.map.isInMap(...bound))
                return true;

        //Maybe one of the 4 tile corners don't intersect, doesn't mean the two polygons don't intersect
        let mapsBounds = new google.maps.LatLngBounds({lat: bounds[2][0], lng: bounds[2][1]}, {
            lat: bounds[3][0],
            lng: bounds[3][1]
        });

        // Check if map coordinates are in within tile bounds
        let mapContains = false;
        this.map.polygon.getPaths().forEach(path => {
            path.forEach(point => {
                if (mapsBounds.contains(point))
                    mapContains = true;
            });
        });

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
        return new Promise(resolve => {

            let tileCount = (endX - startX) * (endY - startY);
            let iteration = 0;
            let tiles = [];

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    this.getTile(x, y, zoom).then(result => {

                        tiles.push(result);
                        if (++iteration >= tileCount) {
                            resolve(tiles);
                        }

                    });
                }
            }

        });
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
        console.log({bounds});
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

    async getTile(x, y, zoom) {
        return new Promise(async resolve => {
            let response = await fetch(this.getUrl(x, y, zoom));
            let blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = e => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let {coverage, types} = this.getTileCoverage(img);

                    resolve({
                        coverage, types, img, x, y, zoom
                    });
                }
            }
        });
    }

    getColorType(rgba) {
        if (rgba[2] === 0)
            return 'empty';

        const allowedColorDiff = 4;
        typeLoop:
            for (let {id, color} of this.typeColors) {
                for (let i = 0; i < rgba.length; i++) {
                    const componentDifference = Math.abs(color[i] - rgba[i]);
                    if (componentDifference > allowedColorDiff)
                        continue typeLoop;
                }
                return id;
            }
        return 'empty';
    }

    getTileCoverage(img) {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        let data = context.getImageData(0, 0, img.width, img.height).data;
        let coverage = {sv: 0, photo: 0, empty: 0};
        let types = {
            empty: false,
            sv: false,
            photo: false,
        };
        for (let i = 0; i < data.length; i += 4) {
            //If tile is known to have both sv and photo, don't keep checking for there is no more information to get
            // if (!(types.sv && types.photo)) {

            //Has opacity
            // let color = data.slice(i, i + 4);
            let color = data.slice(i, i + 3);
            let colorType = this.getColorType(color);
            if (this.debug) {
                // console.log(JSON.stringify([...color]), colorType);
            }
            types[colorType] = true;
            coverage[colorType]++;
            // }

            // coverage += data[i + 2]; // Blue pixel data
        }
        return {coverage, types};
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