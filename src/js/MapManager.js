import Google from './Google'
import GeoMap from './GeoMap'

class MapManager {
    async areaToGeoMap(coordinates, radius, name = 'My Area', id = 'my_area') {
        let paths = await this.getAreaPaths(...coordinates, radius);
        console.log("AREA PATHS", paths);
        return await this.getMapByPaths(paths, name, id)
    }

    async mapToGeoMap(map, id) {
        let paths;
        switch (map.type) {
            case 'collection':
                paths = await this.kmlsToPaths(...map.maps.map(map => map.kml));
                break;
            case 'area':
                paths = await this.getAreaPaths(map.lat, map.lon, map.radius);
                break;
            case 'kml':
            default:
                paths = await this.kmlsToPaths(map.kml);
                break;
        }

        console.log("?MAP ID", map);
        return await this.getMapByPaths(paths, map.name, id);
    }

    async getMapByPaths(paths, mapName, id) {
        await Google.wait();

        let poly = new Google.maps.Polygon({
            paths: paths,
            strokeColor: "#FFC107",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FFC107",
            fillOpacity: 0.35
        });

        let area = 0;
        poly.getPaths().forEach(path => {
            area += Google.maps.geometry.spherical.computeArea(path);
        });

        let minimumDistanceForPoints = Math.sqrt(area) * 2;

        return new GeoMap(poly, minimumDistanceForPoints, mapName, id);
    }

    async getAreaPaths(lat, lon, radius, numSides = 20) {
        await Google.wait();
        let center = new Google.maps.LatLng(lat, lon);
        const paths = [], degreeStep = 360 / numSides;

        for (let i = 0; i < numSides; i++) {
            const gpos = Google.maps.geometry.spherical.computeOffset(center, radius, degreeStep * i);
            paths.push({lat: gpos.lat(), lng: gpos.lng()});
        }

        paths.push(paths[0]);
        return paths;
    }

    kmlsToPaths(...kmls) {
        let paths = [];

        for (let kml of kmls)
            paths = paths.concat(this.kmlToPaths(kml));

        return paths;
    }

    kmlToPaths(kml) {
        let paths = [];

        let addPolygonToPaths = (polygon, paths) => {
            let poly = [];
            let coordString = polygon.textContent.trim();
            for (let coordinate of coordString.split(" ")) {
                let [lng, lat, _] = coordinate.split(",").map(n => +n);
                poly.push({
                    lat, lng
                });
            }
            paths.push(poly);
        };

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(kml, "text/xml").firstChild;

        if (xmlDoc.nodeName === "MultiGeometry")
            for (let polygon of xmlDoc.children)
                addPolygonToPaths(polygon, paths);
        else if (xmlDoc.nodeName === "Polygon")
            addPolygonToPaths(xmlDoc, paths);

        return paths;
    }
}

export default new MapManager()