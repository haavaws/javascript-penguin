const ROTATE_LEFT = "rotate-left";
const ROTATE_RIGHT = "rotate-right";
const ADVANCE = "advance";
const RETREAT = "retreat";
const SHOOT = "shoot";
const PASS = "pass";

const MOVE_UP =  {"top" : ADVANCE, "bottom" : ROTATE_LEFT, "right" : ROTATE_LEFT ,"left" : ROTATE_RIGHT };
const MOVE_DOWN =  {"top" : ROTATE_LEFT, "bottom" : ADVANCE, "right" : ROTATE_RIGHT ,"left" : ROTATE_LEFT };
const MOVE_RIGHT = {"top" : ROTATE_RIGHT, "bottom" : ROTATE_LEFT, "right" : ADVANCE ,"left" : ROTATE_LEFT };
const MOVE_LEFT = {"top" : ROTATE_LEFT, "bottom" : ROTATE_RIGHT, "right" : ROTATE_RIGHT,"left" : ADVANCE };

function moveTowardsCenterOfMap(body) {
    let centerPointX = Math.floor((body.mapWidth)/2);
    let centerPointY = Math.floor((body.mapHeight)/2);
    return moveTowardsPoint(body, centerPointX, centerPointY);
}

function moveTowardsPoint(body, pointX, pointY) {
    let penguinPositionX = body.you.x;
    let penguinPositionY = body.you.y;
    let plannedAction = PASS;
    
    if (penguinPositionX < pointX) {
        plannedAction =  MOVE_RIGHT[body.you.direction];
    } else if (penguinPositionX > pointX) {
        plannedAction = MOVE_LEFT[body.you.direction];
    } else if (penguinPositionY < pointY) {
        plannedAction = MOVE_DOWN[body.you.direction];
    } else if (penguinPositionY > pointY) {
        plannedAction = MOVE_UP[body.you.direction];
    }
    if (plannedAction === ADVANCE && wallInFrontOfPenguin(body)) {
        return SHOOT;
    }
    return plannedAction
}

function doesCellContainWall(walls, x, y) {
    if (walls.find(wall => wall.x == x && wall.y == y)) {
        return true;
    }
    return false;
}

function wallInFrontOfPenguin(body) {
    switch(body.you.direction) {
        case "top":
            return doesCellContainWall(body.walls, body.you.x, --body.you.y);
        case "bottom":
            return doesCellContainWall(body.walls, body.you.x, ++body.you.y);
        case "left":
            return doesCellContainWall(body.walls, --body.you.x, body.you.y);
        case "right":
            return doesCellContainWall(body.walls, ++body.you.x, body.you.y);
        default:
            return true;
    }
}

function openShot(body){
    var i;
    for(i=0;i<body.enemies.length;i++){
        xDist = body.you.x - body.enemies[i].x;
        yDist = body.you.y - body.enemies[i].y;
        if(Math.abs(xDist) < body.you.weaponRange && yDist == 0){
            if(body.you.direction === "right" && xDist < 0) return true;
            else if(body.you.direction === "left" && xDist > 0) return true;
        }
        else if (Math.abs(yDist) < body.you.weaponRange && xDist == 0){
            if(body.you.direction === "down" && yDist < 0) return true;
            else if(body.you.direction === "up" && yDist > 0) return true;
        }
    }
}

function findClosest(body,targets){
    var i;
    var minXDist;
    var minYDist;
    var agentXPos = body.you.x;
    var agentYPos = body.you.y;
    var tarX;
    var tarY;

    for (i=0;i<targets.length;i++){
        var tempTarX = targets[i].x;
        var tempTarY = targets[i].y;
        var xDist = agentXPos - tempTarX;
        var yDist = agentYPos - tempTarY;

        if(Math.abs(xDist) + Math.abs(yDist) < Math.abs(minXDist) + Math.abs(minYDist)){
            minXDist = xDist;
            minYDist = yDist;
            tarX = tempTarX;
            tarY = tempTarY;
        }
    }

    return [tarX,tarY];

}

function visibleBonusAction(body){

    var tarCoords = findClosest(body,body.bonusTiles);

    return moveTowardsPoint(body,tarCoords[0],tarCoords[1]);
}

function targetEnemy(body){
    var tarCoords = findClosest(body,body.enemies);

    return moveTowardsPoint(body,tarCoords[0],tarCoords[1]);

}

function moveAwayFromFlames(body){

}

function commandReceived(body) {
    var response;
    if (openShot(body)) response = "shoot";
    else if (body.bonusTiles.length != 0) response = visibleBonusAction(body);
    else if (!body.enemies[0].x) response = targetEnemy(body);
    else response = moveTowardsCenterOfMap(body);
    return { command: response};
}

module.exports = function (context, req) {
    context.log(req.body);
    let response = action(req);    
    context.res = {
        headers: {"Content-Type": 'application/json'},
        body: response
    };
    context.done();
};

function action(req) {
    if (req.params.query == "command") {
        return commandReceived(req.body);
    } else if (req.params.query == "info") {
        return infoReceived();
    }
    return {};
}

function infoReceived() {
    let penguinName = "Pingu";
    let teamName = "Bouvet";

    return {name: penguinName, team: teamName};
}
