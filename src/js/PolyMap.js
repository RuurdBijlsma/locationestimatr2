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

    containsLocation(lat, lon) {
        if (this.calls === undefined)
            this.calls = 0;
        this.calls++;
        return Google.maps.geometry.poly.containsLocation(new Google.maps.LatLng(lat, lon), this.polygon);
    }
}