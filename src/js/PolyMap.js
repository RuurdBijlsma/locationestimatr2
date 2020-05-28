import GeoMap from "./GeoMap";
import Google from "./Google";

export default class PolyMap extends GeoMap {
    constructor(polygon, settings, minimumDistanceForPoints, name, id = 'NoId') {
        super('poly', settings, name, id, minimumDistanceForPoints);
        this.polygon = polygon;
    }

    getBounds() {
        const bounds = new Google.maps.LatLngBounds();
        this.polygon.getPaths().forEach(path => {
            path.forEach(pos => {
                bounds.extend(pos);
            });
        });
        return bounds;
    }

    containsLocation(lat, lon) {
        return Google.maps.geometry.poly.containsLocation(new Google.maps.LatLng(lat, lon), this.polygon);
    }
}