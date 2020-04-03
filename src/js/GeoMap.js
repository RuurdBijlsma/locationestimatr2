export default class GeoMap {
    constructor(type, name, id = 'NoId', minimumDistanceForPoints = 100000) {
        this.type = type;
        this.name = name;
        this.id = id;
        this.maxScore = 5000;
        this.minimumDistanceForPoints = minimumDistanceForPoints;
    }

    getBounds() {
        console.error("Not Implemented");
    }

    scoreCalculation(distance) {
        if (distance < 7.5)
            return this.maxScore;

        let score = (this.minimumDistanceForPoints - distance) / (this.minimumDistanceForPoints / this.maxScore);
        let scoreDifficulty = 3;

        console.log("1", score);

        if (score < 0)
            return 0;

        score = score ** scoreDifficulty / this.maxScore ** (scoreDifficulty - 1);

        console.log("2", score);

        score = Math.max(0, score);
        score = Math.min(this.maxScore, score);
        console.log("3", score);
        return Math.round(score);
    }
}