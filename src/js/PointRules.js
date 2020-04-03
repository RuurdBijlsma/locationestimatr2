export default class PointRules {
    constructor({
                    zoomAllowed = true,
                    panAllowed = true,
                    unlimitedTime = true,
                    unlimitedMoves = true,
                    moveLimit = -1,
                    timeLimit = -1,
                    roundCount = -1,
                    objective = 1,
                    preset = 0,
                }) {
        this.zoomAllowed = zoomAllowed;
        this.panAllowed = panAllowed;
        this.unlimitedTime = unlimitedTime;
        this.unlimitedMoves = unlimitedMoves;
        this.moveLimit = moveLimit;
        this.timeLimit = timeLimit;
        this.roundCount = roundCount;
        this.objective = objective;
        this.preset = preset;
    }

    get presetName() {
        return PointRules.presetNames[this.preset];
    }

    static get presetNames() {
        return ['Normal', 'Hard', 'Custom'];
    }

    static get presets() {
        return {
            'Normal': new PointRules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: -1,
                timeLimit: -1,
                roundCount: -1,
                objective: 0,
                preset: 0,
            }),
            'Hard': new PointRules({
                zoomAllowed: false,
                panAllowed: false,
                unlimitedTime: false,
                unlimitedMoves: false,
                moveLimit: 0,
                timeLimit: 10,
                roundCount: -1,
                objective: 0,
                preset: 1,
            }),
            'Custom': new PointRules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: 5,
                timeLimit: 30,
                roundCount: -1,
                objective: 0,
                preset: 2,
            }),
        }
    }
}