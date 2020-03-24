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
        return Rules.presetNames[this.preset];
    }

    static get presetNames(){
        return ['Easy', 'Normal', 'Hard', 'Extreme', 'Custom'];
    }

    static get presets() {
        return {
            Easy: new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: -1,
                timeLimit: -1,
                roundCount: 5,
                objective: 1,
                preset: 0,
            }),
            Normal: new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                moveLimit: -1,
                timeLimit: -1,
                roundCount: 5,
                objective: 0,
                preset: 1,
            }),
            Hard: new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: false,
                moveLimit: 0,
                timeLimit: -1,
                roundCount: 5,
                objective: 0,
                preset: 2,
            }),
            Extreme: new Rules({
                zoomAllowed: false,
                panAllowed: false,
                unlimitedTime: false,
                unlimitedMoves: false,
                moveLimit: 0,
                timeLimit: 10,
                roundCount: 5,
                objective: 0,
                preset: 3,
            }),
            Custom: new Rules({
                zoomAllowed: true,
                panAllowed: true,
                unlimitedTime: true,
                unlimitedMoves: true,
                timeLimit: 30,
                moveLimit: 5,
                roundCount: 5,
                objective: 0,
                preset: 4,
            }),
        }
    }
}