import GeoMap from "./GeoMap";
import Google from "./Google";

export default class PolyMap extends GeoMap {
    constructor(polygon, minimumDistanceForPoints, name, id = 'NoId') {
        super('poly', name, id, minimumDistanceForPoints);
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

    isInMap(lat, lon) {
        return Google.maps.geometry.poly.containsLocation({lat: () => lat, lng: () => lon}, this.polygon);
    }
}