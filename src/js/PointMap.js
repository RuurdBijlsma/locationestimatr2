import GeoMap from "./GeoMap";
import Google from "./Google";

export default class PointMap extends GeoMap {
    constructor(points, minimumDistanceForPoints, name, id = 'NoId') {
        super('point', name, id, minimumDistanceForPoints);
        this.points = points;
        this.googlePoints = null;
        this.googlePoints = points.map(p => {
            return {
                ...p,
                position: new Google.maps.LatLng(...p.position)
            }
        });
    }

    getBounds() {
        const bounds = new google.maps.LatLngBounds();
        for (let {position} of this.googlePoints) {
            bounds.extend(position);
        }
        return bounds;
    }
}