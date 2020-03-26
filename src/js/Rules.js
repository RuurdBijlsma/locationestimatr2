export default class Rules {
    constructor({
                    zoomAllowed = true,
                    panAllowed = true,
                    unlimitedTime = true,
                    unlimitedMoves = true,
                    moveLimit = -1,
                    timeLimit = -1,
                    roundCount = 5,
                    objective = 1,
                    svType = 0,
                    distribution = 0,
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
        this.svType = svType;
        this.distribution = distribution;
        this.preset = preset;
    }

    get presetName() {
        return Rules.presetNames[this.preset];
    }

    static get distributionTypes() {
        return ['Prefer Dense Roads', 'Completely Random'];
    }

    static get svTypes() {
        return ['Roads', 'PhotoSpheres', 'Roads and PhotoSpheres'];
    }

    static get presetNames() {
        return ['Relaxed (roads)', 'Relaxed (PhotoSpheres)', 'Normal', 'Hard', 'Custom'];
    }

    static get presets() {
        return {
            'Relaxed (roads)': new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: -1,
                timeLimit: -1,
                roundCount: 5,
                objective: 1,
                svType: 0,
                distribution: 0,
                preset: 0,
            }),
            'Relaxed (PhotoSpheres)': new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: -1,
                timeLimit: -1,
                roundCount: 5,
                objective: 0,
                svType: 1,
                distribution: 0,
                preset: 1,
            }),
            'Normal': new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: -1,
                timeLimit: -1,
                roundCount: 5,
                objective: 0,
                svType: 0,
                distribution: 0,
                preset: 2,
            }),
            'Hard': new Rules({
                zoomAllowed: false,
                panAllowed: false,
                unlimitedTime: false,
                unlimitedMoves: false,
                moveLimit: 0,
                timeLimit: 10,
                roundCount: 5,
                objective: 0,
                svType: 2,
                distribution: 0,
                preset: 3,
            }),
            'Custom': new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                timeLimit: 30,
                moveLimit: 5,
                roundCount: 5,
                objective: 0,
                svType: 0,
                distribution: 0,
                preset: 4,
            }),
        }
    }
}