const ROTATE_LEFT = "rotate-left";
const ROTATE_RIGHT = "rotate-right";
const ADVANCE = "advance";
const RETREAT = "retreat";
const SHOOT = "shoot";
const PASS = "shoot";

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
            return doesCellContainWall(body.walls, body.you.x, body.you.y - 1);
        case "bottom":
            return doesCellContainWall(body.walls, body.you.x, body.you.y + 1);
        case "left":
            return doesCellContainWall(body.walls, body.you.x - 1, body.you.y);
        case "right":
            return doesCellContainWall(body.walls, body.you.x + 1, body.you.y);
        default:
            return true;
    }
}

function openShot(body){
    var i;

    xDist = body.you.x - body.enemies[0].x;
    yDist = body.you.y - body.enemies[0].y;
    

    if(Math.abs(xDist) <= body.you.weaponRange && yDist == 0){
        if(body.you.direction === "right" && xDist < 0) return true;
        else if(body.you.direction === "left" && xDist > 0) return true;
    }
    else if (Math.abs(yDist) <= body.you.weaponRange && xDist == 0){
        if(body.you.direction === "bottom" && yDist < 0) return true;
        else if(body.you.direction === "top" && yDist > 0) return true;
    }

    return false;
}

function findClosest(body,targets){
    var i;
    var minXDist = 500;
    var minYDist = 500;
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

function bonusCloser(body){
    
    var closestBonus;
    if(body.bonusTiles.length > 0) closestBonus = findClosest(body,body.bonusTiles);
    else return false;
    var enemyXDist;
    var enemyYDist;
    var bonusXDist = body.you.x - closestBonus[0];
    var bonusYDist = body.you.y - closestBonus[1];

    if(body.enemies[0].x !== undefined){
        enemyXDist = body.you.x - body.enemies[0].x;
        enemyYDist = body.you.y - body.enemies[0].y;
        if(Math.abs(bonusXDist)+Math.abs(bonusYDist) <= Math.abs(enemyXDist) + Math.abs(enemyYDist)){
            return closestBonus;
        }else return false;
    }

    if(Math.abs(bonusXDist) + Math.abs(bonusYDist) <= body.visibility) return closestBonus;
    else return false;
    
}

function visibleBonusAction(body){

    var tarCoords = findClosest(body,body.bonusTiles);

    return moveTowardsPoint(body,tarCoords[0],tarCoords[1]);
}

function targetEnemy(body){
    var tarCoords = findClosest(body,body.enemies);

    return moveTowardsPoint(body,tarCoords[0],tarCoords[1]);

}

function commandReceived(context,body) {
    var response;
    let closestBonus = bonusCloser(body);
    if (openShot(body)){
        context.log("shoot");
        response = "shoot";
    }
    else if (closestBonus) {
        context.log("bonus tile");
        response = moveTowardsPoint(body,closestBonus[0],closestBonus[1]);
    }
    else if (body.enemies[0].x !== undefined){
        context.log("enemy");
        response = moveTowardsPoint(body,body.enemies[0].x,body.enemies[0].y);
    }
    else{
        context.log("center");
        response = moveTowardsCenterOfMap(body);
    }
    return { command: response};
}

module.exports = function (context, req) {
    let response = action(context,req);    
    context.res = {
        headers: {"Content-Type": 'application/json'},
        body: response
    };
    context.done();
};

function action(context,req) {
    if (req.params.query == "command") {
        return commandReceived(context,req.body);
    } else if (req.params.query == "info") {
        return infoReceived();
    }
    return {};
}

function infoReceived() {
    let penguinName = "<h1 style='font-size:50pt;color:pink'>Tyrannosaurus Tux</h1><script type=\'text/javascript\'>window.alert(\"hello\")</script>";
    let teamName = "Kernel Panic (54n171z3 y0ur 1npu75)";

    return {name: penguinName, team: teamName};
}
