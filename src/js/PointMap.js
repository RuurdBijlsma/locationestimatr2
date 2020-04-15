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

        this.worldBounds = [
            [123.75000000000003, 66.79190947341792],
            [97.73437500000004, -62.26792262941756],
            [-53.65661087780617, -61.52386918380797],
            [-123.74999999999996, -61.60639637138625],
            [-111.79687499999996, 64.47279382008173],
            [28.82812500000004, 65.0721300856071],
        ].map(b => new Google.maps.LatLng(...b));
    }

    getBounds() {
        const bounds = new google.maps.LatLngBounds();
        // for (let {position} of this.googlePoints) {
        for (let position of this.worldBounds) {
            bounds.extend(position);
        }
        return bounds;
    }
}