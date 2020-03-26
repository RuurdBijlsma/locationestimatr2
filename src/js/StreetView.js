import EventEmitter from 'events';

export default class StreetView extends EventEmitter {
    constructor(map) {
        super();
        this.map = map;
        this.debug = false;
        this.typeColors = [
            {color: [84, 160, 185, 131], id: 'sv'},
            {color: [84, 160, 185, 255], id: 'sv'},
            {color: [165, 224, 250, 108], id: 'photo'},
        ];

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
        let tile = await this.randomValidTile(endZoom, type);
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
            return this.randomValidLocation(endZoom, type);
        }
        let randomSvPixel = Math.floor(Math.random() * pixelCounts.count);
        let randomSvIndex = pixelCounts.indices[randomSvPixel];
        let x = (randomSvIndex / 4) % img.width;
        let y = Math.floor((randomSvIndex / 4) / img.width);
        return this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, x, y);
    }

    async randomValidTile(endZoom, type, initialTile = {x: 0, y: 0, zoom: 0}) {
        let chosenTile = initialTile;
        // let chosenTile = {x: 76, y: 50, zoom: 7};
        let previousTiles = [chosenTile];
        let failedTiles = [];
        while (chosenTile.zoom < endZoom) {
            let subTiles = await this.getSubTiles(chosenTile.x, chosenTile.y, chosenTile.zoom);
            this.emit('subTiles', subTiles);

            console.log("TYPE", type, "DISTRIBUTION", this.distribution);
            let validTiles = subTiles
                //Change type to photo to have only photo spheres
                .filter(tile =>
                    (type === 'sv' || type === 'both') && tile.types.sv ||
                    (type === 'photo' || type === 'both') && tile.types.photo ||
                    tile.zoom < 7 && tile.types.sv)
                .filter(tile => this.tileIntersectsMap(tile.x, tile.y, tile.zoom))
                .filter(tile => !this.isFailedTile(tile, failedTiles));
            if (this.debug) {
                console.log(validTiles);
                this.debugImg.forEach(img => {
                    img.src = '';
                });
                validTiles.forEach((tile, i) => {
                    if (this.debugImg[i] && tile.img) {
                        this.debugImg[i].src = tile.img.src
                    }
                });
                if (chosenTile.zoom === 5) {
                    console.log(validTiles);
                    return;
                }
            }

            if (validTiles.length === 0) {
                failedTiles.push(chosenTile);
                let fromTile = chosenTile;
                if (previousTiles.length > 0)
                    chosenTile = previousTiles.splice(-2)[0];
                else
                    chosenTile = initialTile;
                console.log("Took a wrong turn when getting a random tile, going back to zoom " + chosenTile.zoom, chosenTile, 'from', fromTile);
            } else {
                chosenTile = this.pickRandomSubTile(validTiles);
                previousTiles.push(chosenTile);
            }
        }

        return chosenTile;
    }

    isFailedTile(tile, failedTiles) {
        for (let fail of failedTiles)
            if (this.tileEquals(tile, fail))
                return true;
        return false;
    }

    tileEquals(tileA, tileB) {
        return (tileA.x === tileB.x && tileA.y === tileB.y && tileA.zoom === tileB.zoom);
    }

    pickRandomSubTile(tiles) {
        if (this.distribution === "uniform") {
            return tiles[Math.floor(tiles.length * Math.random())];
        }

        let totalCoverage = tiles.map(tile => tile.coverage).reduce((a, b) => a + b);
        let random = Math.random() * totalCoverage;

        for (let tile of tiles) {
            random -= tile.coverage;
            if (random <= 0)
                return tile;
        }

        console.error("Count not find tile");
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

    latLonToTile(latDeg, lonDeg, zoom) {
        let latRad = this.toRadians(latDeg);
        let n = 2.0 ** zoom;
        let xTile = Math.floor((lonDeg + 180.0) / 360.0 * n);
        let yTile = Math.floor((1.0 - Math.log(Math.tan(latRad) + (1 / Math.cos(latRad))) / Math.PI) / 2.0 * n);
        return [xTile, yTile];
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

        const allowedColorDiff = 3;
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
        let coverage = 0;
        let types = {
            empty: false,
            sv: false,
            photo: false,
        };
        for (let i = 0; i < data.length; i += 4) {
            //If tile is known to have both sv and photo, don't keep checking for there is no more information to get
            if (!(types.sv && types.photo)) {
                let color = data.slice(i, i + 4);
                let colorType = this.getColorType(color);
                if (this.debug) {
                    // console.log(JSON.stringify([...color]), colorType);
                }
                types[colorType] = true;
            }

            coverage += data[i + 2]; // Blue pixel data
        }
        return {coverage, types};
    }
}

Array.prototype.shuffle = function () {
    const input = this;

    for (let i = input.length - 1; i >= 0; i--) {

        const randomIndex = Math.floor(Math.random() * (i + 1));
        const itemAtIndex = input[randomIndex];

        input[randomIndex] = input[i];
        input[i] = itemAtIndex;
    }
    return input;
}