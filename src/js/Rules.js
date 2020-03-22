export default class Rules {
    constructor({
                    zoomAllowed = true,
                    panAllowed = true,
                    unlimitedTime = true,
                    unlimitedMoves = true,
                    moveLimit = -1,
                    timeLimit = -1,
                    roundCount = 5,
                    objective = 1
                }) {
        this.zoomAllowed = zoomAllowed;
        this.panAllowed = panAllowed;
        this.unlimitedTime = unlimitedTime;
        this.unlimitedMoves = unlimitedMoves;
        this.moveLimit = moveLimit;
        this.timeLimit = timeLimit;
        this.roundCount = roundCount;
        this.objective = objective;
    }
}