import Google from './Google'
import GeoMap from './GeoMap'
import PointMap from "./PointMap";
import PolyMap from "./PolyMap";

class MapManager {
    async areaToGeoMap(coordinates, radius, name = 'My Area', id = 'my_area') {
        let paths = await this.getAreaPaths(...coordinates, radius);
        console.log("AREA PATHS", paths);
        return await this.getMapByPaths(paths, undefined, name, id)
    }

    async mapToGeoMap(map, id) {
        let paths;
        switch (map.type) {
            case 'collection':
                paths = await this.kmlsToPaths(...map.maps.map(map => map.kml));
                break;
            case 'area':
                paths = await this.getAreaPaths(map.lat, map.lng, map.radius);
                break;
            case 'points':
                await Google.wait();
                return this.getMapByPoints(map.points, map.settings, map.name, id);
            case 'kml':
            default:
                paths = await this.kmlsToPaths(map.kml);
                break;
        }

        console.log("?MAP ID", map);
        return await this.getMapByPaths(paths, map.settings, map.name, id);
    }

    getMapByPoints(points, settings, mapName, id) {
        // let bounds = new Google.maps.LatLngBounds();
        // for (let {position} of points) {
        //     bounds.extend(new Google.maps.LatLng(...position));
        // }
        // let ne = bounds.getNorthEast();
        // let sw = bounds.getSouthWest();
        // let bottom = sw.lat();
        // let left = sw.lng();
        // let top = ne.lat();
        // let right = ne.lng();
        //
        // let topLeft = new Google.maps.LatLng(top, left);
        // let topRight = new Google.maps.LatLng(top, right);
        // let bottomLeft = new Google.maps.LatLng(bottom, left);
        // let bottomRight = new Google.maps.LatLng(bottom, right);
        // let path = [topLeft, topRight, bottomLeft, bottomRight];
        // let area = Google.maps.geometry.spherical.computeArea(path);
        // console.log({area, path});
        // let minimumDistanceForPoints = Math.sqrt(area) * 2;
        return new PointMap(points, settings, 500000, mapName, id);
    }

    async getMapByPaths(paths, settings, mapName, id) {
        await Google.wait();

        let poly = new Google.maps.Polygon({
            paths: paths,
            strokeColor: "#00ff7a",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#00ff7a",
            fillOpacity: 0.35,
            draggable: false,
            clickable: false,
        });

        let area = 0;
        poly.getPaths().forEach(path => {
            area += Google.maps.geometry.spherical.computeArea(path);
        });
        console.log({area});

        let minimumDistanceForPoints = Math.sqrt(area) * 2;

        return new PolyMap(poly, settings, minimumDistanceForPoints, mapName, id);
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