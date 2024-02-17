
const SCREENBLACK = "#080808";

const LANDSCAPE = 0;
const PORTRAIT = 1;

const PAUSED = 0;
const RUNNING = 1;

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

const NORTHEAST = NORTH + 0.5;
const SOUTHEAST = EAST + 0.5;
const SOUTHWEST = SOUTH + 0.5;
const NORTHWEST = WEST + 0.5;

const UP_ARROW = 38;
const RIGHT_ARROW = 39;
const DOWN_ARROW = 40;
const LEFT_ARROW = 37;

const DEAD = -1;
const IDLE = 0;
const WALKING = 1;
const ATTACKING = 2;
const HURT = 3;
const DYING = 4;

const UNALIGNED = 0;
const HEROIC = 1;
const DUNGEON = 2;

const SHADOW = -1
const DEFAULT = 0;
const EFFECT = 1;

const PHYSICAL = 0;
const ETHEREAL = 1;

const RANDOM = -1;
const NONE = 0;
const SILVERKEY = 1;
const GOLDKEY = 2;
const REDKEY = 3;
const GREENKEY = 4;
const BLUEKEY = 5;
const HEARTCONTAINER = 6;
const HEART = 7;
const COIN = 8;
const CHALICE = 9;
const CROWN = 10;
const SWORD = 11;
const BEETLE = 12;

const SCREEN_WIDTH = window.screen.width;
const SCREEN_HEIGHT = window.screen.height;

var ORIENTATION = LANDSCAPE;

var constants =  {
    brickHeight: 16,
    brickWidth: 50,
    lineThickness: 3,
    doorWidth: 110,
    doorFrameThickness: 10,
    doorHeight: 70,
    thresholdDepth: 20,
    roomMinWidthInBricks: 5,
    roomMinHeightInBricks: 5,
    roomMaxWidthInBricks: 15,
    roomMaxHeightInBricks: 15, 
    spriteFamesPerSecond: 10,
    controllerRadius: 175,
    controllerCrossThickness: 70,
    maxHeartContainers: 25
};

function onOrientationChange(e) {
    if(e.matches||SCREEN_WIDTH>SCREEN_HEIGHT) {
        ORIENTATION = LANDSCAPE;
        document.getElementById("controller").style.display = "none";
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.width + dimensions.infoHeight, true);
    } else {        
        ORIENTATION = PORTRAIT;
        document.getElementById("controller").style.display = "block";    
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);  
    }
}

function directionToDegress(direction){
    switch (direction){
        case NORTH:
            return 0;
        case NORTHEAST:
            return 45;
        case EAST:
            return 90;
        case SOUTHEAST:
            return 135;
        case SOUTH: 
            return 180;
        case SOUTHWEST:
            return 225;
        case WEST:
            return 270;
        case NORTHWEST:
            return 315;
        default:
            return 0;
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function msToTime(duration) {
    var milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)));
  
    hours = hours > 0 ? ((hours < 10) ? "0" + hours + ":" : hours + ":") : "";
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + minutes + ":" + seconds + "." + milliseconds;
}

function getOpposingTeam(team){
    switch(team){
        case HEROIC:
            return DUNGEON;
        case DUNGEON:
            return HEROIC;
    }
}

function newBox(x, y, w, h) {
    return {
        x: x,
        y: y,
        width: w,
        height: h,
        reset: function(newX, newY, newW, newH){
            this.x = newX;
            this.y = newY;
            this.width = newW;
            this.height = newH;
        },
        center: function() {
            return {
                x: this.x + Math.round(this.width/2),
                y: this.y + Math.round(this.height/2)
            }
        },
        inside: function(box){
            if(
                box && 
                this.x >= box.x && this.x <= box.x + box.width &&
                this.x + this.width >= box.x && this.x + this.width <= box.x + box.width &&
                this.y >= box.y && this.y <= box.y + box.height &&
                this.y + this.height >= box.y && this.y + this.height <= box.y + box.height
            ){
                return true;
            }
            return false;
        },

        collidesWith: function(box){

                // Check for overlap along the X axis
                if (this.x + this.width < box.x || this.x > box.x + box.width) {
                    return false;
                }

                // Check for overlap along the Y axis
                if (this.y + this.height < box.y || this.y > box.y + box.height) {
                    return false;
                }

                // If there is overlap along all axes, collision has occurred
                return true;
        },
        resolveCollision: function(box){

            var overlapX = Math.min(this.x + this.width, box.x + box.width) - Math.max(this.x, box.x);
            var overlapY = Math.min(this.y + this.height, box.y + box.height) - Math.max(this.y, box.y);
        
            if (overlapX > 0 && overlapY > 0) {
                let mtvX = 0;
                let mtvY = 0;
        
                if (overlapX < overlapY) {
                    mtvX = this.center().x < box.center().x ? 1 : -1;
                } else {
                    mtvY = this.center().y < box.center().y ? 1 : -1;
                }
                this.x -= mtvX * overlapX;
                this.y -= mtvY * overlapY;
            }
        },
        intersectRect(box) {
            var left = Math.max(this.x, box.x);
            var top = Math.max(this.y, box.y);
            var right = Math.min(this.x + this.width, box.x + box.width);
            var bottom = Math.min(this.y + box.height, box.y + box.height);
            
            // Check if there's an actual intersection
            if (left < right && top < bottom) {
                return newBox(left, top, right-left, bottom-top);
            } else {
                // No intersection
                return null;
            }
        },
        distance: function(box){
            var c1 = this.center();
            var c2 = box.center();
            var dx = c2.x - c1.x;
            var dy = c2.y - c1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        render: function(color){
            if(!this.element){ 
                this.element = game.screen.rect(this.x, this.y + dimensions.infoHeight, this.width, this.height).attr("stroke", color);
                game.screen.onClear(()=>{this.element = null});
            };
            this.element.attr({x:this.x, y:this.y + dimensions.infoHeight, width: this.width, height: this.height});
        },
        remove: function(){
            if(this.element){
                this.element.remove();
                this.element = null;
            }   
        }
    }
}

function constrain (min, val, max){
    if (val<min) return min;
    if (val>max) return max;
    return val;
}

function right(str,chr)
{
    return str.substr(str.length-chr,str.length)
}

function hexToRGB(hexColor){
    if(hexColor.length==6 || hexColor.length == 3){
        hexColor = "#" + hexColor
    }
    red="00";
    green = "00";
    blue = "00"
    if(hexColor.length == 4){
        red = hexColor.substring(1,2);
        red += red;
        green = hexColor.substring(2,3);
        green += green;
        blue = hexColor.substring(3,4);
        blue += blue;
    }
    if(hexColor.length == 7){
        red = hexColor.substring(1,3);
        green = hexColor.substring(3,5);
        blue = hexColor.substring(5,7);
    }

    return {
        r: parseInt(red,16),
        g: parseInt(green,16),
        b: parseInt(blue,16)
    }
}

function rgbToHex(rgb){
    hex="#"
    hex += right("0" + rgb.r.toString(16),2);
    hex += right("0" + rgb.g.toString(16),2);
    hex += right("0" + rgb.b.toString(16),2);
    return hex;
}

function calculateAlpha(backgroundHex, foregroundHex, foregroundOpacity){
    //alpha * new + (1 - alpha) * old
    backgroundRGB = hexToRGB(backgroundHex);
    foregroundRGB = hexToRGB(foregroundHex);
    return rgbToHex({
        r: Math.round(foregroundRGB.r * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.r),
        g: Math.round(foregroundRGB.g * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.g),
        b: Math.round(foregroundRGB.b * foregroundOpacity + (1-foregroundOpacity) * backgroundRGB.b)
    });
}

const trig = {
    degreesToRadians: function (angle){
        return (angle % 360) / 360 * 2 * Math.PI
    },
    radiansToDegrees: function (angle){
        return angle * 57.2958
    },
    cotangent: function (radians){
        return 1/Math.tan(radians);
    },
    tangent: function (radians){
        return Math.tan(radians);
    },
    pointToAngle: function(opposite, adjacent){
        return Math.atan(opposite/adjacent);
    }
};

const dimensions = {
    width: 910, 
    height: 1618,
    infoHeight: 88,
};

const palette = {
    doorFrame: "#928e85",
    doorDefaultColor: "#4d3737",
    doorBarColor: "#999"
};

function randomEntry(array){
    if(array.length == 0){
        return null;
    }
    index =  Math.floor((array.length-1) * Math.random());
    return array[index]; 
}

function filter(array, fun){
    var array2 = [];
    array.forEach((item)=>{
        if(fun(item)){
            array2.push(item);
        }
    })
    return array2;
}

function remove(array, fun){
    itemsToDelete = filter(array,fun);
    itemsToDelete.forEach((item)=>{
        array.splice(array.indexOf(item),1);
    });
}

function any(array, fun){
    if(!array){
        return false;
    }
    for(var i=0;i<array.length; i++){
        if(fun(array[i])){
            return true;
        }
    }
    return false;
}

function newStatistics(title){
    return {
        damageDealt: 0,
        damageReceived: 0,
        goldCollected: 0,
        keysCollected:0,
        keysSpawned: 0,
        heartsCollected:0,
        chestsSpawned:0,
        chestsOpened:0,
        enemiesKilled: 0,
        enemiesSpawned:0,
        caveSpidersSpawned: 0,
        caveSpidersKilled: 0,
        swordSkeletonsSpawned: 0,
        swordSkeletonsKilled: 0,
        doorsUnlocked:0,
        doorsSpawned:0,
        roomsVisited:0,
        roomsSpawned:0,
        timeSpent:0,
        add: function(s){
            this.damageDealt += s.damageDealt;
            this.damageReceived += s.damageReceived;
            this.goldCollected += s.goldCollected;
            this.keysCollected += s.keysCollected;
            this.keysSpawned += s.keysSpawned;
            this.heartsCollected += s.heartsCollected;
            this.chestsSpawned += s.chestsSpawned;
            this.chestsOpened += s.chestsOpened;
            this.enemiesKilled += s.enemiesKilled;
            this.enemiesSpawned += s.enemiesSpawned;
            this.caveSpidersSpawned += s.caveSpidersSpawned;
            this.caveSpidersKilled += s.caveSpidersKilled;
            this.swordSkeletonsSpawned += s.swordSkeletonsSpawned;
            this.swordSkeletonsKilled += s.swordSkeletonsKilled;
            this.doorsUnlocked += s.doorsUnlocked;
            this.doorsSpawned += s.doorsSpawned;
            this.roomsVisited += s.roomsVisited;
            this.roomsSpawned += s.roomsSpawned;
            this.timeSpent += s.timeSpent;
        },
        finalizeLevelStats: function(){
            this.roomsVisited = filter(game.level.rooms,(r)=>{return r.visited}).length
            this.roomsSpawned = game.level.rooms.length
        },
        render:function(title, box){
            var y = box.y + dimensions.infoHeight + 64;
            var title = game.screen.text(box.center().x, y,title)
            title.attr({ "font-size": "48px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "middle", "font-weight": "bold"});

            var x1 = box.x + 40;
            var x2 = box.x + box.width - 40;
            var indent = 40;
            attrHeaderLeft = { "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "start", opacity:0};
            attrHeaderRight = { "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "end", opacity:0};
            
            attrStatLeft = { "font-size": "24px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "start", opacity:0};
            attrStatRight = { "font-size": "24px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "end", opacity:0};
            
            stats=[];

            y += 64;
            stats.push(game.screen.text(x1, y, "LEVELS CLEARED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y,  numberWithCommas(game.level.number + (game.player.status==DEAD ? 0 : 1))).attr(attrHeaderRight));

            y += 64;
            stats.push(game.screen.text(x1, y, "TIME SPENT:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y,  msToTime(this.timeSpent)).attr(attrHeaderRight));
            

            y += 64;
            stats.push(game.screen.text(x1, y, "ROOMS DISCOVERED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y,  numberWithCommas(this.roomsVisited) + " / " + numberWithCommas(this.roomsSpawned)).attr(attrHeaderRight));
            
            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"DOORS UNLOCKED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.doorsUnlocked) + " / " + numberWithCommas(this.doorsSpawned)).attr(attrStatRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"KEYS COLLECTED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.keysCollected) + " / " + numberWithCommas(this.keysSpawned)).attr(attrStatRight));

            y += 64;
            stats.push(game.screen.text(x1, y,"CHESTS OPENED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.chestsOpened) + " / " + numberWithCommas(this.chestsSpawned)).attr(attrHeaderRight));
            
            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"GOLD COLLECTED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.goldCollected)).attr(attrStatRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"HEARTS COLLECTED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.heartsCollected)).attr(attrStatRight));

            y += 64;
            stats.push(game.screen.text(x1, y,"ENEMIES KILLED:").attr(attrHeaderLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.enemiesKilled) + " / " + numberWithCommas(this.enemiesSpawned)).attr(attrHeaderRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"DAMAGE DEALT:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.damageDealt)).attr(attrStatRight));

            y += 40;
            stats.push(game.screen.text(x1 + indent, y,"DAMAGE RECEIVED:").attr(attrStatLeft));
            stats.push(game.screen.text(x2, y, numberWithCommas(this.damageReceived)).attr(attrStatRight));

            if(this.caveSpidersSpawned>0){       
                y += 40;
                stats.push(game.screen.text(x1 + indent, y,"SPIDERS SQUASHED:").attr(attrStatLeft));
                stats.push(game.screen.text(x2, y, numberWithCommas(this.caveSpidersKilled) + " / " + numberWithCommas(this.caveSpidersSpawned)).attr(attrStatRight));
            }
            if(this.swordSkeletonsSpawned>0){       
                y += 40;
                stats.push(game.screen.text(x1 + indent, y,"SKELETONS SMASHED:").attr(attrStatLeft));
                stats.push(game.screen.text(x2, y, numberWithCommas(this.swordSkeletonsKilled) + " / " + numberWithCommas(this.swordSkeletonsSpawned)).attr(attrStatRight));
            }

            var ms = 0;
            stats.forEach((s,i)=>{
                if(i % 2 == 0){
                    ms += 100;
                }
                setTimeout(()=>{s.animate({opacity:1},250)}, ms);
            });

 
        }

    }    
}

function fadeTo(color, callback){
    game.screen.drawRect(0,dimensions.infoHeight,dimensions.width, dimensions.width, color, color, 0).attr({opacity: 0}).animate({opacity:1}, 350, null, callback);
}

function fadeInFrom(color, callback){
    game.screen.drawRect(0,dimensions.infoHeight,dimensions.width, dimensions.width, color, color, 0).attr({opacity: 1}).animate({opacity:0}, 350, null, callback);
}

function newScreen(domElementId){
    var screen = Raphael(domElementId, dimensions.width, dimensions.height);
    screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);
    screen.canvas.setAttribute('preserveAspectRatio', 'meet');
    screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
    //helper functions

    screen.drawLine = function(x1,y1,x2,y2,color,thickness){
        var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
        return this.path(path).attr({"stroke-width": thickness, "stroke":color});
    };

    screen.drawTriangle =  function(x1,y1,x2,y2,x3,y3, translateX, translateY, fillColor, strokeColor, thickness){
        var path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "Z";
        return this.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };
    
    screen.drawRect = function(x,y,w,h,color,strokecolor, thickness){
        return this.rect(x,y,w,h).attr({"stroke-width": thickness, "stroke":strokecolor, "fill": color});
    };

    screen.drawPoly = function(x1,y1,x2,y2,x3,y3,x4,y4, translateX, translateY, fillColor, strokeColor, thickness){
        var path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "L" + (x4 + translateX) + "," + (y4 + translateY) + "Z";
        return this.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
    };

    screen.drawEllipse = function(x1,y1,r1,r2, translateX, translateY, fillColor, strokeColor, thickness){
        var e = this.ellipse(x1+translateX, y1+translateY, r1, r2)
         e.attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
         return e;
    };

    screen.drawAngleSegmentX = function(angle, startX, endX, translateX, translateY, color, thickness){
        var startY = Math.round(trig.tangent(angle) * startX);
        var endY = Math.round(trig.tangent(angle) * endX);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    };
    
    screen.drawAngleSegmentY = function(angle, startY, endY, translateX, translateY, color, thickness){
        var startX = Math.round(trig.cotangent(angle) * startY);
        var endX = Math.round(trig.cotangent(angle) * endY);
        startX+=translateX; endX += translateX;
        startY+=translateY; endY += translateY;
        return this.drawLine(startX, startY, endX, endY, color, thickness);
    }
    screen._clear = screen.clear;
    screen.clearListeners = [];
    screen.clear = function(){
        failed=[]
        this.clearListeners.forEach((f)=>{
            try{
                f();
            } catch(e){
                failed.push(f);
            }
        });
        failed.forEach((f)=>this.clearListeners.splice(this.clearListeners.indexOf(f),1));
        this._clear();
    }
    screen.onClear = function (handler){
        //register handler
        this.clearListeners.push(handler);
    }

    return screen;
}   

function newControllerBase(){
    return {
        up:0,
        left:0,
        down:0,
        right:0,
        attack:0,
        elements: [],
        read: function(forObject){
            return {
                x: this.left * -1 + this.right,
                y: this.up * -1  + this.down,
                a: this.attack    
            }
        }
    };  
}

function newInputController(){
    var controller = newControllerBase();
    controller.screen = newScreen("controller");

    controller.touchStartOrMove = function(e){
        e.preventDefault(e);
        
        var button = this.elements[this.elements.length-3];
        var dpad = this.elements[this.elements.length-2];
        var controller = this.elements[this.elements.length-1];
        
        var r = e.target.getBoundingClientRect();
     
        //r.y = r.y - dimensions.infoHeight - dimensions.width
        var touches = Array.from(e.touches);
        var dpadTouched = false;
        var buttonTouched = false;
        touches.forEach((t)=>{   
            
            //console.log(r,t,this.screen);
            //console.log(t);


            x = (((t.clientX - r.x)/r.width))//*constants.controllerRadius*2) - constants.controllerRadius;
            y = (((t.clientY - r.y)/r.height))//*constants.controllerRadius*2) - constants.controllerRadius;// * dimensions.height;
            x = x * controller.attr("width");
            y = y * controller.attr("height") + dimensions.infoHeight + dimensions.width;

            d = dpad.getBBox();
            
            if(x>d.x && x<d.x + d.width && y>d.y && y<d.y+d.width){
                dpadTouched = true;
                //this.screen.drawRect(x,y, 10, 10, "#FF0", "#000",0)

                x = ((x - d.x)-d.width/2)/(d.width/2);
                y = ((y - d.y)-d.height/2)/(d.height/2)
            
                d = Math.abs(trig.radiansToDegrees(trig.pointToAngle(y,x)));
                this.up = y < 0 && d > 23 ? 1 : 0;
                this.right = x > 0 && d < 68 ? 1 : 0;
                this.down = y > 0 && d > 22 ? 1 : 0;
                this.left = x < 0 && d < 68 ? 1 : 0;
            }
            
            b = button.getBBox();
            if(x>b.x && x<b.x + b.width && y>b.y && y<b.y+b.width){
                dpadTouched = true;
                buttonTouched = true;
                this.attack = true;
            }

        })
        if(!dpadTouched){
            this.up = 0;
            this.right = 0;
            this.down =  0;
            this.left = 0;
        }
        if(!buttonTouched){
            this.attack = 0;
        }
    };

    controller.render =function(){
        var centerY = Math.round((dimensions.height - dimensions.width - dimensions.infoHeight)/2 + dimensions.width + dimensions.infoHeight);
        var dPadLeft = Math.round(dimensions.width/4);  
        if (this.elements.length ==0){

            var color="#242424";
           this.screen.rect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height - dimensions.width - dimensions.infoHeight).attr({"fill":color, "r": 50});
            color = "#3a3a3a";
            this.elements.push(this.screen.drawEllipse(dPadLeft, centerY, constants.controllerRadius, constants.controllerRadius,0,0,color,"#000",constants.lineThickness));
            color = "#444444";
            this.elements.push(this.screen.drawRect(dPadLeft - constants.controllerCrossThickness/2, centerY - constants.controllerRadius, constants.controllerCrossThickness, constants.controllerRadius*2,color, "#000",constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - constants.controllerRadius, centerY - constants.controllerCrossThickness/2, constants.controllerRadius*2, constants.controllerCrossThickness,color, "#000",constants.lineThickness))
            this.elements.push(this.screen.drawRect(dPadLeft - constants.controllerCrossThickness/2, centerY - constants.controllerCrossThickness/2-constants.lineThickness/2, constants.controllerCrossThickness, constants.controllerCrossThickness + constants.lineThickness,color, color,0))
            this.elements.push(this.screen.drawLine(dPadLeft - constants.controllerCrossThickness/2, centerY - constants.controllerCrossThickness/2, dPadLeft + constants.controllerCrossThickness/2, centerY + constants.controllerCrossThickness/2,"#000",constants.lineThickness))
            this.elements.push(this.screen.drawLine(dPadLeft + constants.controllerCrossThickness/2, centerY - constants.controllerCrossThickness/2, dPadLeft - constants.controllerCrossThickness/2, centerY + constants.controllerCrossThickness/2,"#000",constants.lineThickness))
            var arrowMargin = 4 * constants.lineThickness;
            var arrowHeight = 40;
            color = "#303030";
            this.elements.push(this.screen.drawTriangle(
                dPadLeft, centerY - constants.controllerRadius + arrowMargin,
                dPadLeft + constants.controllerCrossThickness/2 - arrowMargin, centerY - constants.controllerRadius + arrowHeight, 
                dPadLeft - constants.controllerCrossThickness/2 + arrowMargin, centerY - constants.controllerRadius + arrowHeight,  
                0,0, color, "#000",0//constants.lineThickness
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft + constants.controllerRadius - arrowMargin, centerY,
                dPadLeft + constants.controllerRadius - arrowHeight, centerY + constants.controllerCrossThickness/2 - arrowMargin, 
                dPadLeft + constants.controllerRadius - arrowHeight, centerY - constants.controllerCrossThickness/2 + arrowMargin,  
                0,0, color, "#000",0
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft, centerY + constants.controllerRadius - arrowMargin,
                dPadLeft + constants.controllerCrossThickness/2 - arrowMargin, centerY + constants.controllerRadius - arrowHeight, 
                dPadLeft - constants.controllerCrossThickness/2 + arrowMargin, centerY + constants.controllerRadius - arrowHeight,  
                0,0, color, "#000",0
            ));
            this.elements.push(this.screen.drawTriangle(
                dPadLeft - constants.controllerRadius + arrowMargin, centerY,
                dPadLeft - constants.controllerRadius + arrowHeight, centerY + constants.controllerCrossThickness/2 - arrowMargin, 
                dPadLeft - constants.controllerRadius + arrowHeight, centerY - constants.controllerCrossThickness/2 + arrowMargin,  
                0,0, color, "#000",0
            ));
            
            
            var el = this.screen.drawEllipse(Math.round(dimensions.width*.75), centerY, constants.controllerRadius/2, constants.controllerRadius/2,0,0,"#800","#000",constants.lineThickness);
            this.elements.push(el);

            var el2 = this.screen.drawEllipse(dPadLeft, centerY, constants.controllerRadius, constants.controllerRadius,0,0,"90-rgba(200,200,200,0.05)-rgba(0,0,0,0.2):50","#000",constants.lineThickness).attr({"opacity":.2})
            this.elements.push(el2);

            var el3 = this.screen.drawRect(0, dimensions.width + dimensions.infoHeight, dimensions.width, dimensions.height-(dimensions.width + dimensions.infoHeight),"#000","#000",constants.lineThickness).attr({"opacity":.1})
            el3.touchstart((e)=>{this.touchStartOrMove(e)});
            el3.touchmove((e)=>{this.touchStartOrMove(e)});
            el3.touchend((e)=>{this.touchStartOrMove(e)});
            this.elements.push(el3);
        }

        var butt = this.elements[this.elements.length-3];
        butt.attr({fill:this.attack ? "#600" : "#800"})

        var el = this.elements[this.elements.length-2];
        //read controller
        var x = this.left * -1 + this.right;
        var y = this.up * -1  + this.down;

        var degrees = 0;
        //read state
        if(x == 0 && y == 0){
            el.hide();
            return;
        }
        degrees = 
            x == -1 && y == 1 ? 225 :
            x == 1 && y == -1 ? 45 :
            x == -1 && y == -1 ? 315 :
            x == 1 && y == 1 ? 135 :
            x == -1 ? 270 :
            x == 1 ? 90 :     
            y == -1 ? 0 :
            y == 1 ? 180 : 
            0 ;
        el.show();
        el.transform("r" + degrees + "," + dPadLeft + "," + centerY);
    };

    window.onkeyup = function(e){
        switch (e.key){
            case "w":
            case "W":
                controller.up = 0;
                break;    
            case "s":
            case "S":
                controller.down = 0;
                break;
            case "a":
            case "A":
                controller.left = 0;
                break;
            case "d":
            case "D":
                controller.right = 0;
                break;
            case " ":
                controller.attack = 0;
                break;
            default:
                switch (e.keyCode){
                    case UP_ARROW:
                        controller.up = 0;
                        break;
                    case RIGHT_ARROW:
                        controller.right = 0;
                        break;
                    case DOWN_ARROW:
                        controller.down = 0;
                        break;
                    case LEFT_ARROW:
                        controller.left = 0;
                        break;
                    default:
                        return true;
                }
        }
        e.handled= true;
        e.preventDefault();
        return false;
    };
    
    window.onkeydown = function(e){
        switch (e.key){
            case "w":
            case "W":
                controller.up = 1;
                break;
            case "s":
            case "S":
                controller.down = 1;
                break;
            case "a":
            case "A":
                controller.left = 1;
                break;
            case "d":
            case "D":
                controller.right = 1;
                break;
            case " ":
                controller.attack = 1;
                break;
            default:
                switch (e.keyCode){
                    case UP_ARROW:
                        controller.up = 1;
                        break;
                    case RIGHT_ARROW:
                        controller.right = 1;
                        break;
                    case DOWN_ARROW:
                        controller.down = 1;
                        break;
                    case LEFT_ARROW:
                        controller.left = 1;
                        break;
                    default:
                        return true;
                }
        }
    
        e.handled= true;
        e.preventDefault();
        return false;
    };

    return controller;
}

function newRandomController(){
    var controller = newControllerBase();
    controller.randomize = function(){
    
        this.up = Math.round(Math.random());
        this.down = Math.round(Math.random());
        this.left = Math.round(Math.random());
        this.right = Math.round(Math.random());
        time = Math.round(Math.random()*1000)+250;
        controller.nextRandomization = Date.now() + time;
        //setTimeout(()=>{this.randomize()}, time)
    }
    controller.randomize();
    controller.read = function(forObject){
        if(this.nextRandomization<Date.now()){
            this.randomize();
        }

        this.attack = 0;
        
        opposingTeam = getOpposingTeam(forObject.team);
        forObject.getObjectsInRangeOfAttack().forEach((o)=>{
            if(o.team == opposingTeam){
                this.attack = 1;
            }
        });

        forObject.getObjectsInView().forEach((o)=>{
            if(o.team == opposingTeam){
                diffX = Math.abs(forObject.box.center().x - o.box.center().x);
                diffY = Math.abs(forObject.box.center().y - o.box.center().y);
                if(Math.abs(diffY-diffX)>25){
                        
                    if(diffY > diffX){     
                        this.left = 0;
                        this.right = 0;
                        if(forObject.box.center().y>o.box.center().y){
                            this.up = 1;
                            this.down = 0;
                        }else{
                            this.up = 0;
                            this.down = 1;
                        }
                    }else{
                        this.up = 0;
                        this.down = 0;
                        if(forObject.box.center().x>o.box.center().x){
                            this.left = 1;
                            this.right = 0;
                        }else{
                            this.left = 0;
                            this.right = 1;
                        }
                        
                    }
                    
                }
            }
        });

        return {
            x: this.left * -1 + this.right,
            y: this.up * -1  + this.down,
            a: this.attack
        }
    }

    return controller;
}

function newSprite(screen, frameset, imageWidth, imageHeight, spriteWidth, spriteHeight, x, y){
    return {
        screen: screen,
        image: {
            frameset: frameset,
            width: imageWidth,
            height: imageHeight
        },
        size: {
            width: spriteWidth,
            height: spriteHeight
        },
        location: {
            x: x,
            y: y, 
            r: 0
        },
        _lastLocation: {
            x: x,
            y: y, 
            r: 0
        },
        scale: 1,
        animation: {
            index: 0,
            series: 0,
            frame: 0,
            startTime: Date.now()
        },
        _lastAnimation:{
            index: -1,
            series: -1,
            frame: -1
        },
        opacity: 1,
        ready: 1,
        setAnimation: function(index,series){
            if (index!=this.animation.index||series!=this.animation.series){
                this.animation.index = index;
                this.animation.series = series;
                this.animation.frame = 0;
                this.animation.startTime = Date.now();
            }
        },
        setFrame: function(index, series, frame){
                this.animation.index = index;
                this.animation.series = series;
                this.animation.frame = frame;
                this.animation.startTime = 0;
        },
        _buildTranslation: function (x, y, r){
            var tx = Math.round(x * (1/this.scale) - this.animation.frame * this.size.width);
            var ty = Math.round(y * (1/this.scale) - this.animation.series *  this.size.height) + dimensions.infoHeight;
            var t = "t" + tx + "," + ty 
            if(this.scale!=1){
                t="s"+this.scale +","+this.scale+",0,0" + t;
            }
            if(r == 0){
                return t
            }
            var rx = Math.round(this.animation.frame * this.size.width + this.size.width/2);
            var ry = Math.round(this.animation.series *  this.size.height + this.size.height/2);
            return t + "r" + r + "," + rx + "," + ry;
        },
        _buildClipRect: function (){
            var x = Math.round(this.animation.frame * this.size.width) 
            var y = Math.round(this.animation.series * this.size.height)+1
            var w = this.size.width;
            var h = this.size.height-2;
            return "" + x + "," + y +"," + w + "," + h;
        },
        _calculateCurrentFrame: function(deltaT) {
            if (this.animation.startTime == 0){
                return this.animation.frame;
            }
            var animdelta = Date.now() - this.animation.startTime;
            var frame = Math.round((animdelta / 1000) * constants.spriteFamesPerSecond) % Math.round(this.image.width/this.size.width);
            return frame;
        },
        render: function(deltaT){
    
            this.animation.frame = this._calculateCurrentFrame(deltaT);
            if(this.animation.startTime==0)
            {
                forceRender = true
            }
            if(!this.element){
                this.element = this.screen.image(this.image.frameset[this.animation.index], 0, 0, this.image.width, this.image.height).attr({opacity:0});
                this._lastLocation.x = this.location.x;
                this._lastLocation.y = this.location.y;
                this._lastLocation.r = this.location.r;
                this.screen.onClear(()=>{this.element = null});
                this.ready = 1  
                this._lastIndex = this.animation.index;
                forceRender = true
            } 
            if(this._lastIndex != this.animation.index){
                this.element.attr("src",this.image.frameset[this.animation.index]);
                this._lastIndex = this.animation.index;
            }
    
            var trans0 = this._buildTranslation(this._lastLocation.x, this._lastLocation.y, this._lastLocation.r);
            var trans1 = this._buildTranslation(this.location.x, this.location.y, this.location.r);
    
            var rect = this._buildClipRect(); 

         
            frameChanged = (this._lastAnimation.frame != this.animation.frame || this._lastAnimation.index != this.animation.index || this._lastAnimation.series != this.animation.series)
            positionChanged = (this.location.x!=this._lastLocation.x || this.location.y != this._lastLocation.y || this.location.r != this._lastLocation.r);

            if ((frameChanged || positionChanged || forceRender) && this.element && this.ready==1){
                this.ready = 0;
                this.element.attr({opacity:this.opacity}).animate({transform:trans0, "clip-rect": rect},0, 'linear',()=>{
                    if (this.element){        
                        this.element.animate({transform:trans1, "clip-rect": rect}, deltaT, 'linear',()=>{
                            this.ready = 1
                        });
                    }
                });
            }   
    
            this._lastAnimation.frame = this.animation.frame;
            this._lastAnimation.index = this.animation.index;
            this._lastAnimation.series = this.animation.series;
            this._lastLocation.x = this.location.x;
            this._lastLocation.y = this.location.y;
            this._lastLocation.r = this.location.r;
            this.element.toFront();
            return this.element;
        },
        remove: function(){
            if (this.element){
                this.element.remove();
            }
        }
    }
}

function newGameObject(){
    return {
        box: newBox(0,0,50,50),
        direction: NORTH,
        state: IDLE,
        layer: DEFAULT,
        plane: PHYSICAL,
        team: UNALIGNED,
        _stateStart: Date.now(),
        setState: function(state){
            if (state!=this.state){
                this.state = state;
                this._stateStart = Date.now()
                if(state==ATTACKING){
                    this._lastAttack = Date.now();
                }
            }
        },
        move: function(deltaT) {
            console.warn("unimplemented: move()");
        },
        render: function(deltaT){
            console.warn("unimplemented: render()");
            this.box.render("#F0F");
        },
        remove: function(){
            console.warn("unimplemented: remove()");
            this.box.remove();
        }
    }
}

function newGameCharacter(){
    var character = newGameObject();
    character.health = 0;
    character.maxHealth = 0;
    character.damage = 0;
    character._attackDuration = 500;
    character._attackCooldown = 1000;
    character._hurtDuration = 500;
    character.controller = newControllerBase();
    character.move = function(deltaT) {
        if(this.state == DYING){
            if(Date.now()-this._stateStart <= 700){
                return;
            }
            this.setState(DEAD);
        }
        if(this.state == DEAD){
            return;
        }
        if(this.state == HURT){
            if(Date.now()-this._stateStart < this._hurtDuration){
                return
            }
            this.setState(IDLE);
        }
        if(this.state == ATTACKING){
            if(Date.now()-this._stateStart < this._attackDuration){
                return
            }
            this.setState(IDLE);
        }           
        //read controller
        input = this.controller.read(this);
        
        if(input.a && this.canAttack()){
            this.attack();
        }

        if(this.state == IDLE || this.state == WALKING){
            

            if (input.y<0){
                this.direction=NORTH;
            }else if(input.x>0){
                this.direction=EAST;
            }else if(input.y>0){
                this.direction=SOUTH;
            }else if(input.x<0){
                this.direction=WEST;
            }

            //TODO: always return x & y
            multiplier = 1
            if (Math.abs(input.x)==1 && Math.abs(input.y)==1){
                multiplier = 1/Math.sqrt(2);
            }
            constrained = game.currentRoom.constrain(this,
                this.box.x + input.x * this.speed/1000 * multiplier * deltaT,
                this.box.y + input.y * this.speed/1000 * multiplier * deltaT
            )

            if (constrained && (this.box.x != constrained.x || this.box.y != constrained.y)){
                if (this.state!=WALKING){
                    this.state = WALKING;
                }
                this.box.x = constrained.x;
                this.box.y = constrained.y;
            }
            else {
                if (this.state!=IDLE){
                    this.state = IDLE;
                }
            }   
        }
    };
    character.hurt = function(damage, knockback){
            if(this.state!=HURT && this.state!=DEAD){
                this.health -= damage;
                if(this == game.player){
                    game.level.statistics.damageReceived += damage;
                }
                if(this.health <= 0){
                    this.health = 0;
                    this.setState(DYING);
                    return;
                }
                this.setState(HURT);
                switch (knockback){
                    case NORTH:
                        this.box.y -= damage;
                        break;
                    case EAST:
                        this.box.x += damage;
                        break;
                    case SOUTH: 
                        this.box.y += damage;
                    case WEST:
                        this.box.x -= damage;
                        break;
                }
            }
    };
    character.canAttack = function(){
            if(!this._lastAttack || Date.now() - this._lastAttack > this._attackCooldown){
                return true;
            }
            return false;
    };
    character.attack = function(){
            console.warn("unimplemented: attack()");
    };
    character.getObjectsInView = function(){
            return [];
    };
    character.getObjectsInRangeOfAttack = function(){
            console.warn("unimplemented: getObjectsInRangeOfAttack()");
            return [];
    };
    return character
}

function newInvisibleObject(){
    io = newGameObject();
    io.render = function(deltaT){
        if(game.debug){
            this.box.render("#F0F");
        }
    }
    io.remove = function(){}
    io.move = function(){}
    return io;
}

function newStarburst(){
    starburst = newGameObject();
    starburst.box.width = 25;
    starburst.box.height = 25;
    starburst.layer = DEFAULT;
    starburst.plane = ETHEREAL;
    starburst.render = function(deltaT){
        if( this.state == DEAD){
            return;
        }
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.starburst, 100, 25, 25, 25, this.box.center().x-12, this.box.center().y-12);
            this.sprite.setAnimation(0,0);
             this.sprite.location.r = Math.round(Math.random() * 360);
        }
        this.sprite.render(deltaT); 
    }
    starburst.move = function(deltaT){
        if(Date.now()-this._stateStart>250){
            this.setState(DEAD);
        }
    }    
    starburst.remove = function(){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
        }
    }
    return starburst;
}

function newTreasureChest(content){
    var chest = newGameObject();
    chest.box.width=64;
    chest.box.height=32;
    chest.opened = 0;
    chest.treasureOffset = 0;
    chest.content = content;
    chest.elements = [];
    chest.render = function(deltaT){
        if(this.elements.length == 0){
            this.backgroundSprite = newSprite(game.screen,images.chest,64,256,64,64,this.box.x,this.box.y-32);
            this.elements.push(this.backgroundSprite);
            //TODO: Move to "pickup" object
            this.contentSprite = newSprite(game.screen, images.treasure, 36, 468, 36, 36, this.box.x+14,this.box.y-18)
            this.elements.push(this.contentSprite);
            this.foregroundSprite = newSprite(game.screen,images.chest,64,256,64,64,this.box.x,this.box.y-32);
            this.elements.push(this.foregroundSprite);
            game.screen.onClear(()=>{this.elements=[]});
        }

        if(game.debug){
            this.box.render("#FF0")
            if (this.tripFront) this.tripFront.render("#0F0");
            if (this.tripWest) this.tripWest.render("#0F0");
            if (this.tripEast) this.tripEast.render("#0F0");
            if (this.tripBack) this.tripBack.render("#0F0");
       
        }
        
        if(this.opened){

            this.foregroundSprite.setAnimation(0,1);
            this.contentSprite.setAnimation(0, this.content);
            this.backgroundSprite.setAnimation(0,3);
            
            var offset = (100/1000) * deltaT;
            this.treasureOffset += offset;
            var opacity = constrain(0,1-(this.treasureOffset/100), 1);
            this.contentSprite.opacity = opacity;    
            if(opacity>0){
                this.contentSprite.location.y -= offset;
            }else{
                this.content = NONE 
            }
        } else {
            this.foregroundSprite.setAnimation(0,0);
            this.contentSprite.setAnimation(0, 0);
            this.backgroundSprite.setAnimation(0,2);
        }
        this.backgroundSprite.render(deltaT);
        this.contentSprite.render(deltaT);
        this.foregroundSprite.render(deltaT);
    }
    chest.move = function(deltaT){
        //todo: tripwires, etc
        if(!this.tripFront){
            this.tripFront = newBox(this.box.x-game.player.box.width/2, this.box.y+this.box.height, this.box.width + game.player.box.width, game.player.box.height)
        }
        if(!this.tripWest){
            this.tripWest = newBox(this.box.x-game.player.box.width, this.box.y-game.player.box.height/2, game.player.box.width, this.box.height + game.player.box.height)
        }
        if(!this.tripEast){
            this.tripEast = newBox(this.box.x+this.box.width, this.box.y-game.player.box.height/2, game.player.box.width, this.box.height + game.player.box.height)
        }
        if(!this.tripBack){
            this.tripBack = newBox(this.box.x-game.player.box.width/2, this.box.y-game.player.box.height, this.box.width + game.player.box.width, game.player.box.height)
        }
        if(!this.opened && (
           (game.player.box.inside(this.tripFront) && game.player.direction==NORTH) || 
           (game.player.box.inside(this.tripWest) && game.player.direction==EAST) ||
           (game.player.box.inside(this.tripEast) && game.player.direction==WEST) ||
           (game.player.box.inside(this.tripBack) && game.player.direction==SOUTH)
        )){
            this.opened = true;
            sfx.openChest();
            game.level.statistics.chestsOpened++;
            if(this.content == RANDOM){
                if ((game.player.health/game.player.maxHealth) < Math.random()){
                    this.content = HEART
                } else {
                    this.content = Math.round(Math.random() * 5) + HEART;
                }
            }
            if(this.content >= SILVERKEY && this.content <= BLUEKEY){
                game.player.keys.push(this.content);
                game.level.statistics.keysCollected++;
            } else if (this.content == HEART){
                game.player.health=constrain(0, game.player.health + 10, game.player.maxHealth);
                if(game.player.health>=15){
                    sfx.lowHealth(false)
                }
                game.level.statistics.heartsCollected++;
            } else if (this.content == HEARTCONTAINER){
                game.player.maxHealth += 10;
                game.player.health = game.player.maxHealth;
            } else {
                goldValue = (this.content - HEART ) * 100;
                game.player.gold += goldValue;
                game.level.statistics.goldCollected += goldValue;
            }
            setTimeout(()=>{sfx.treasure(this.content)},500);
        }
    }
    chest.remove = function(){
        if(this.backgroundSprite){
            this.backgroundSprite.remove();
            this.backgroundSprite=null;
        }
        if(this.foregroundSprite){
            this.foregroundSprite.remove();
            this.foregroundSprite=null;
        }
    }
    return chest;
}

function newFloorSpikes(offsetT){
    var floorSpikes = newGameObject();
    floorSpikes.layer = SHADOW;
    floorSpikes.box.width = 0;
    floorSpikes.box.height = 0;
    floorSpikes.setState(0);
    floorSpikes._stateStart += offsetT % 3000;
    floorSpikes.move = function(deltaT){
        if(this.state == 0 && Date.now()-this._stateStart > 3000){
            //WARN
            this.setState(WALKING);
        }else if(this.state ==1 && Date.now()-this._stateStart > 1000){
            //ATTACK!
            this.setState(ATTACKING);
            this.box.width = 62;
            this.box.height = 58;
            game.currentRoom.objects.forEach((o)=>{
                if(o.plane==PHYSICAL && this.box.collidesWith(o.box) && o.hurt!=null){
                    rect = o.box.intersectRect(this.box);
                    if(rect){
                        o.hurt(5, NORTH)
                        sb = newStarburst();
                        sb.box = rect
                        game.currentRoom.objects.push(sb);
                    }
                }
            })

        } else if (this.sprite && this.sprite.animation.series == ATTACKING){
            //RESET TRAP
            if (this.sprite.animation.frame == 4){
                this.box.width = 0;
                this.box.height = 0;
                    
            } else if (this.sprite.animation.frame == 7){
                this.setState(IDLE);
            }
            
        }
    }
    floorSpikes.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen,images.floorSpikes,496, 150, 62, 50,this.box.x, this.box.y);
            game.screen.onClear(()=>{
                this.sprite = null;
            })
        }
        this.sprite.setAnimation(0,this.state)
        this.sprite.render()
    }
    floorSpikes.remove = function(){
        if(this.sprite){
            this.sprite.remove();
            this.sprite = null;
        }
    }
    return floorSpikes;
}

function newExit(){
    var exit = newGameObject();
    exit.box.width = constants.doorWidth;
    exit.box.height = constants.brickWidth * 4;
    exit.plane = ETHEREAL;
    exit.elements = [];
    exit.invisibleObjects = [];
    
    exit.render = function(deltaT){
        if (this.elements.length==0){
            
            exitHeight = constants.brickWidth * 3;

            this.elements.push(game.screen.drawRect(this.box.x - constants.doorFrameThickness, this.box.y + dimensions.infoHeight,  (constants.doorWidth + constants.doorFrameThickness*2),  this.box.height, palette.doorFrame, "#000", constants.lineThickness));
            this.elements.push(game.screen.drawRect(this.box.x, this.box.y + dimensions.infoHeight + constants.doorFrameThickness, this.box.width,  this.box.height - constants.doorFrameThickness, "#000", "#000", constants.lineThickness));
            steps = 6;
            
            for(step = steps; step>0; step--){
                stepWidth = constants.doorWidth - step * 4;
                stepThickness = constants.brickHeight+2 - step
                this.elements.push(game.screen.drawRect(this.box.center().x - stepWidth/2, dimensions.infoHeight + (this.box.y + this.box.height)-stepThickness*step,  stepWidth,  stepThickness, "#888", "#000", constants.lineThickness).attr({opacity:(steps-step)/steps}));
            }
            
            game.screen.onClear(()=>{this.elements=[]});
        }
        if(game.debug){
            this.box.render("#0FF")
            //this.tripBox.render("#F80");
        }
    };

    exit.move = function(deltaT){
        if(exit.invisibleObjects.length==0){
            
            io = newInvisibleObject();
            io.box.x = this.box.x - constants.doorFrameThickness;
            io.box.y = this.box.y;
            io.box.height = this.box.height;
            io.box.width = constants.doorFrameThickness*2;
            game.currentRoom.objects.push(io);
            exit.invisibleObjects.push(io);

            io = newInvisibleObject();
            io.box.x = this.box.x + constants.doorWidth;
            io.box.y = this.box.y;
            io.box.height = this.box.height;
            io.box.width = constants.doorFrameThickness;
            game.currentRoom.objects.push(io);
            exit.invisibleObjects.push(io);
            
            io = newInvisibleObject();
            io.box.x = this.box.x;
            io.box.y = this.box.y;
            io.box.width = this.box.width;
            io.box.height = constants.doorFrameThickness;
            game.currentRoom.objects.push(io);
            exit.invisibleObjects.push(io);
        }
        if (!this.tripBox){
            this.tripBox = newBox(this.box.x, this.box.y + constants.doorFrameThickness * 3, this.box.width, this.box.height/2);
        }
        if(game.player.box.inside(this.box)){
            game.player.sprite.scale= constrain(.85,Math.round(((game.player.box.y - this.box.y) * 100 / this.box.height))/100 +.25,1);
            game.player.speed = constrain(100,((game.player.box.y - this.box.y) / this.box.height)*150,150);
        }
        if(game.player.box.inside(this.tripBox)){
            this.tripped();
        }
    };
    exit.tripped= function(){
       game.state = PAUSED;
       setTimeout(()=>{
        fadeTo(SCREENBLACK, exitLevel);
       },50);
       //exitLevel();
    }
    return exit;
}

function newAdventurer(controller){
    var adventurer = newGameCharacter();
    adventurer.controller = controller;
    adventurer.box.x = Math.round(dimensions.width / 2)-25;
    adventurer.box.y = Math.round(dimensions.width / 2)-25;
    adventurer.box.width = 50;
    adventurer.box.height = 50;
    adventurer.direction = SOUTH; //init facing the player
    adventurer.team = HEROIC;
    adventurer.keys = [];
    adventurer.gold = 0; //in px/sec
    adventurer.speed = 150; //in px/sec
    adventurer.damage = 10;
    adventurer.health = 30;
    adventurer.maxHealth = 30;
    adventurer._attackDuration = 250;
    adventurer._attackCooldown = 750;
    adventurer.whip = {
        thickness: 5,
        length: 175
    }
    adventurer._hurt = adventurer.hurt;
    adventurer.hurt = function(damage, knockback){
        this._hurt(damage, knockback);
        if(this.health<15){
            sfx.lowHealth(true);
        }
        if(this.state == DYING){
            this.direction = SOUTH;
            sfx.lowHealth(false);
            sfx.playerdeath();
        }
    }
    adventurer.render = function(deltaT){
        framestart = Date.now()
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.adventurer, 800, 500, 100, 100, 0, 0);
        }
        if(game.debug){
            this.box.render("#FF0");
        } 
        
        //render whip
        if(this.state == ATTACKING){
            if(!this.whip.element && framestart - this.sprite.animation.startTime > 100){
                switch(this.direction){
                    case NORTH:
                        this.whip.element = game.screen.drawRect(Math.round(this.whip.box.x + this.whip.box.width/2)-2, this.whip.box.y + dimensions.infoHeight, 3, this.whip.box.height, "#624a2e","#000", 2 )
                        break;
                    case EAST:
                        this.whip.element = game.screen.drawRect(this.whip.box.x + 10,  Math.round(this.whip.box.y + this.whip.box.height/2)-2 + dimensions.infoHeight, Math.abs(this.whip.box.width-10), 3, "#624a2e","#000", 2)
                        break;
                    case SOUTH: 
                        this.whip.element = game.screen.drawRect(Math.round(this.whip.box.x + this.whip.box.width/2)-2, this.whip.box.y + dimensions.infoHeight, 3, this.whip.box.height, "#624a2e","#000", 2)
                        break;
                    case WEST:
                        this.whip.element = game.screen.drawRect(this.whip.box.x,  Math.round(this.whip.box.y + this.whip.box.height/2)-2 + dimensions.infoHeight, Math.abs(this.whip.box.width-10), 3, "#624a2e","#000", 2)
                        break;
                    }
            }
        } else {
            if(this.whip.element) this.whip.element.remove();
            this.whip.element = null;
        }
        //render player sprite
        if(this.state == DEAD){
            this.sprite.setFrame(SOUTH, DYING, 7);
            gameOver();
        }
        else{
            this.sprite.setAnimation(this.direction, this.state);

        }
        this.sprite.location.x = (this.box.x - 25) ;
        this.sprite.location.y = (this.box.y - 50) ;
        this.sprite.render(deltaT);
    };
    adventurer.remove = function(deltaT){
        if(this.sprite){
            //this.sprite.remove();
            //this.sprite = null;
        }
        if(game.debug){
            this.box.remove();
        } 
    }
    adventurer.getObjectsInRangeOfAttack = function(){
        if(!this.whip.box){
            this.whip.box = newBox(0,0,0,0)
        }
        switch (this.direction){
 
            case NORTH: 
                this.whip.box.reset(
                    Math.round(this.box.x + this.box.width / 2 - this.whip.thickness / 2),
                    constrain((game.currentRoom.box.y - game.currentRoom.wallHeight / 2) ,this.box.y - this.whip.length, this.box.y),
                    this.whip.thickness,
                    constrain(0, this.whip.length, this.box.y - game.currentRoom.box.y + game.currentRoom.wallHeight / 2)
                )
                break;
            case EAST:
                this.whip.box.reset(
                    constrain(this.box.x + this.box.width,this.box.x + this.box.width,game.currentRoom.box.x+game.currentRoom.box.width + game.currentRoom.wallHeight/2),
                    Math.round(this.box.y - 25 + this.box.height/2 - this.whip.thickness/2),
                    constrain(0, this.whip.length, (game.currentRoom.box.x + game.currentRoom.box.width + game.currentRoom.wallHeight/2) - (this.box.x + this.box.width)),
                    this.whip.thickness
                )
                break;
            case SOUTH:
                this.whip.box.reset(
                    Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                    constrain(this.box.y + this.box.height,this.box.y + this.box.height,game.currentRoom.box.y+game.currentRoom.box.height),
                    this.whip.thickness,
                    constrain(0, this.whip.length, (game.currentRoom.box.y + game.currentRoom.box.height + game.currentRoom.wallHeight/2) - (this.box.y + this.box.height))
                )
                break;
            case WEST:
                this.whip.box.reset(
                    constrain(game.currentRoom.box.x - game.currentRoom.wallHeight/2,this.box.x - this.whip.length, this.box.x),
                    Math.round(this.box.y - 29 + this.box.height/2 - this.whip.thickness/2),
                    constrain(0, this.whip.length, this.box.x - game.currentRoom.box.x + game.currentRoom.wallHeight/2),
                    this.whip.thickness
                )
                break;
        }
        if(game.debug && this.whip.box){
            this.whip.box.render("#A00")
        }
          
        var distance = this.whip.length * 2;
        var collidingWith = null;
        game.currentRoom.objects.forEach((obj)=>{
            if(obj!=this && obj.plane==PHYSICAL && obj.team == getOpposingTeam(this.team)){
                objDistance = this.box.distance(obj.box);
                if(this.whip.box.collidesWith(obj.box) && objDistance < distance){
                    collidingWith = obj;
                    distance = objDistance;
                }
            }
        });
        if(collidingWith!=null){
            return [collidingWith];
        }
        return [];
    },
    adventurer.attack = function(){
        if(this.state != ATTACKING && this.canAttack()){
            this.setState(ATTACKING);
            sfx.whip();
            targets = this.getObjectsInRangeOfAttack(); 
            if(targets.length>0){
                collidingWith = targets[0];
                sb = newStarburst();
                game.currentRoom.objects.push(sb);
                collidingWith.hurt(this.damage, this.direction);
                game.level.statistics.damageDealt += this.damage;
                switch(this.direction){
                    case NORTH:
                        this.whip.box.reset (
                            Math.round(this.box.x + this.box.width / 2 - this.whip.thickness / 2),
                            collidingWith.box.y + collidingWith.box.height,
                            this.whip.thickness,
                            Math.abs(this.box.y - (collidingWith.box.y + collidingWith.box.height))
                        )
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                    case EAST:
                        this.whip.box.reset (
                            this.box.x + this.box.width,
                            Math.round(this.box.y - 25 + this.box.height/2 - this.whip.thickness/2),
                            Math.abs(collidingWith.box.x - (this.box.x + this.box.width)),
                            this.whip.thickness
                        )
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x + this.whip.box.width  - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                    case SOUTH:
                        this.whip.box.reset(
                            Math.round(this.box.x + this.box.width/2 - this.whip.thickness/2),
                            this.box.y + this.box.height,
                            this.whip.thickness,
                            Math.abs(collidingWith.box.y - (this.box.y + this.box.height))
                        )
                        
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y + this.whip.box.height - sb.box.height / 2;
                        break;
                    case WEST:
                        this.whip.box.reset(
                            collidingWith.box.x + collidingWith.box.width,
                            Math.round(this.box.y - 29 + this.box.height/2 - this.whip.thickness/2),
                            Math.abs(this.box.x - (collidingWith.box.x + collidingWith.box.width)),
                            this.whip.thickness  
                        )
                        sb.layer = EFFECT
                        sb.box.x = this.whip.box.x - sb.box.width / 2;
                        sb.box.y = this.whip.box.y - sb.box.height / 2;

                        break;
                }
            }
            
        }
    };
    adventurer._move = adventurer.move;
    adventurer.move = function(deltaT){
        state1 = this.state;
        this._move(deltaT);
        if(this.state!=state1){
            if(this.state==WALKING){
                sfx.walk(true);
            }else{
                sfx.walk(false);
            }

        }
    }

    return adventurer;
}

function newCaveSpider(controller){
    var spider = newGameCharacter();
    spider.box.x = Math.round(dimensions.width / 2)-100;
    spider.box.y = Math.round(dimensions.width / 2)-100;
    spider.box.height = 75;
    spider.box.width = 75;
    spider.team = DUNGEON;
    spider.direction = EAST;
    spider.controller = controller;
    spider.speed = 150;
    spider.health = 20;
    spider.maxHealth = 20;
    spider.damage = 5;
    spider._attackDuration = 500;
    spider._attackCooldown = 1500;
    spider._move = spider.move;
    spider.move= function (deltaT){
        var state1 = this.state;
        this._move(deltaT);
        if(this.state!=state1){
            switch(this.state){
                case WALKING: 
                    sfx.spiderwalk(this, true);
                    break;
                default:
                    sfx.spiderwalk(this,false)
            }
        }
        switch(this.direction){
            case NORTH:
                this.box.width = 75;
                this.box.height = 50;
                break;
            case WEST:
                this.box.width = 75;
                this.box.height = 50;
                break;
            case SOUTH:
                this.box.width = 75;
                this.box.height = 60;
                break;
            case EAST:
                this.box.width = 75;
                this.box.height = 50;
                break;
                        
        }
    };
    spider.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.caveSpider, 800, 500, 100, 100, 0, 0);
        }
        if(game.debug){
           this.box.render("#FFF");
        } 
        
        this.sprite.location.x = this.box.x-15;
        this.sprite.location.y = this.box.y-(this.direction== SOUTH ? 20 : 40);
        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.render(deltaT);
    };
    spider.attack = function(){
        if(this.state != ATTACKING){
            sfx.spiderbite(this);
            this.setState(ATTACKING);
        }
        opposingTeam = getOpposingTeam(this.team)
        targets = spider.getObjectsInRangeOfAttack();
        targets.forEach((o)=>{
            if(o.team == opposingTeam){
                rect = this._attackBox.intersectRect(o.box)
                if(rect){
                    o.hurt(this.damage);
                    sb=newStarburst()
                    sb.box = rect;
                    game.currentRoom.objects.push(sb);
                }
            }
        });
    };
    spider.getObjectsInView=function(){
        //initialize the view box
        if(!this._viewBox){
            this._viewBox = newBox(0,0,50,50);
        }
        //reposition the view box
        switch(this.direction){
            case NORTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y + this.box.height - this._viewBox.height
                break;
            case EAST:    
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
            case SOUTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y 
                break;
            case WEST:
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x + this.box.width - this._viewBox.width;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
        }
        if (game.debug){
            this._viewBox.render("#FF0");
        }
        inView = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.box.collidesWith(this._viewBox)){
                inView.push(o);
            }
        })

        return inView;
    }
    spider.getObjectsInRangeOfAttack = function(){
        //initialize the attack box
        if(!this._attackBox){
            this._attackBox = newBox(0,0,25,25);
        }
        //reposition the attack box
        switch(this.direction){
            case NORTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y - this._attackBox.height
                break;
            case EAST:
                this._attackBox.x = this.box.x + this.box.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);
                break;
            case SOUTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y + this.box.height;
                break;
            case WEST:
                this._attackBox.x = this.box.x - this._attackBox.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);   
                break;
        }
        if (game.debug){
            this._attackBox.render("#800");
        }
        inRange = []
        game.currentRoom.objects.forEach((o)=>{
            if(o!=this && this._attackBox.collidesWith(o.box)){
                inRange.push(o);
            }
        });
        return inRange;
    }
    spider.remove = function(){
        if(this.sprite){
            this.sprite.remove();
        }
        if(spider.bitePlayer){
            spider.bitePlayer.stop();
            spider.bitePlayer.dispose();
        }
        if(spider.walkPlayer){
            spider.walkPlayer.stop();
            spider.walkPlayer.dispose();
        } 
        if(game.debug){
            this.box.remove();
        }
    };
    spider._hurt = spider.hurt;
    spider.hurt = function(damage, knockback){
        startHealth=this.health;
        this._hurt(damage,knockback);
        if(startHealth>0 && this.health<=0){
            game.level.statistics.caveSpidersKilled++;
            game.level.statistics.enemiesKilled++;
            sfx.spiderDeath();
        }
    }

    
    return spider;
}

function newSwordSkeleton(controller){
    var skeleton = newGameCharacter();
    skeleton.box.x = Math.round(dimensions.width / 2)-100;
    skeleton.box.y = Math.round(dimensions.width / 2)-100;
    skeleton.box.height = 50;
    skeleton.box.width = 50;
    skeleton.team = DUNGEON;
    skeleton.direction = EAST;
    skeleton.controller = controller;
    skeleton.speed = 25;
    skeleton.health = 30;
    skeleton.maxHealth = 30;
    skeleton.damage = 10;
    skeleton._attackDuration = 500;
    skeleton._attackCooldown = 1500;
    skeleton._move = skeleton.move;
    skeleton.move= function (deltaT){
        if(!this.sprite || this.sprite.animation.frame>4){
            this.speed = 10;
        } else {
            this.speed = 50;
        }

        if(this.sprite && this.state == ATTACKING && !this.attacked && this.sprite.animation.frame==3){
            this.attacked==true;
            opposingTeam = getOpposingTeam(this.team)
            targets = skeleton.getObjectsInRangeOfAttack();
            targets.forEach((o)=>{
                if(o.team == opposingTeam){
                  rect = this._attackBox.intersectRect(o.box)
                    if(rect){
                        o.hurt(this.damage, this.direction);
                        sb=newStarburst()
                        sb.box = rect
                        game.currentRoom.objects.push(sb);
                    }
                }
            }); 
        }

        var state1 = this.state;
        this._move(deltaT); 
        if(this.state!=state1){
            switch(this.state){
                case WALKING: 
                    sfx.skeletonwalk(this, true);
                    break;
                default:
                    sfx.skeletonwalk(this,false)
            }
        }
    };
    skeleton.render = function(deltaT){
        if(!this.sprite){
            this.sprite = newSprite(game.screen, images.swordSkeleton, 1200, 750, 150, 150, this.box.x-50, this.box.y-75);
            this.sprite._lastLocation.x = this.box.x-50;
            this.sprite._lastLocation.y = this.box.y-75;    
        }
        if(game.debug){ 
           this.box.render("#FFF");
        } 
        this.sprite.setAnimation(this.direction, this.state);
        this.sprite.render(deltaT);
        //if (this.sprite.animation.frame!==2&&this.sprite.animation.frame!==6){
            this.sprite.location.x = this.box.x-50;
            this.sprite.location.y = this.box.y-75;    
        //}
    };
    skeleton.attack = function(){
        if(this.state != ATTACKING){
            sfx.skeletonattack(this);
            this.setState(ATTACKING);
            this.attacked==false;
        }
       
    };
    skeleton.getObjectsInView=function(){
        //initialize the view box
        if(!this._viewBox){
            this._viewBox = newBox(0,0,50,50);
        }
        //reposition the view box
        switch(this.direction){
            case NORTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y + this.box.height - this._viewBox.height
                break;
            case EAST:    
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
            case SOUTH:
                this._viewBox.height = 500;
                this._viewBox.width = 200;
                this._viewBox.x = this.box.center().x - this._viewBox.width/2;
                this._viewBox.y = this.box.y 
                break;
            case WEST:
                this._viewBox.width = 500;
                this._viewBox.height = 200;
                this._viewBox.x = this.box.x + this.box.width - this._viewBox.width;
                this._viewBox.y = this.box.center().y - this._viewBox.height/2
                break;
        }
        if (game.debug){
            this._viewBox.render("#FF0");
        }
        inView = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.box.collidesWith(this._viewBox)){
                inView.push(o);
            }
        })

        return inView;
    }
    skeleton.getObjectsInRangeOfAttack = function(){
        //initialize the attack box
        if(!this._attackBox){
            this._attackBox = newBox(0,0,50,50);
        }
        //reposition the attack box
        switch(this.direction){
            case NORTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y - this._attackBox.height
                break;
            case EAST:
                this._attackBox.x = this.box.x + this.box.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);
                break;
            case SOUTH:
                this._attackBox.x = this.box.center().x - Math.round(this._attackBox.width / 2);
                this._attackBox.y = this.box.y + this.box.height;
                break;
            case WEST:
                this._attackBox.x = this.box.x - this._attackBox.width;
                this._attackBox.y = this.box.center().y - Math.round(this._attackBox.height/2);   
                break;
        }
        if (game.debug){
            this._attackBox.render("#800");
        }
        inRange = []
        game.currentRoom.objects.forEach((o)=>{
            if(o!=this && this._attackBox.collidesWith(o.box)){
                inRange.push(o);
            }
        });
        return inRange;
    }
    skeleton.remove = function(){
        if(this.sprite){
            this.sprite.remove();
        }
        if(skeleton.attackPlayer){
            skeleton.attackPlayer.stop();
            skeleton.attackPlayer.dispose();
        }
        if(skeleton.walkPlayer){
            skeleton.walkPlayer.stop();
            skeleton.walkPlayer.dispose();
        } 
        if(game.debug){
            this.box.remove();
        }
    };
    skeleton._hurt = skeleton.hurt;
    skeleton.hurt = function(damage, knockback){
        startHealth=this.health;
        this._hurt(damage,knockback);
        if(startHealth>0 && this.health<=0){
            game.level.statistics.swordSkeletonsKilled++;
            game.level.statistics.enemiesKilled++;
            sfx.skeletonDeath();
        }
    }

    
    return skeleton;
}

function newTorch(){
    var torch = newGameObject();
    torch.box.width=0;
    torch.box.height=0;
    torch.move = function(deltaT) {console.warn("unimplemented: attack()");};
    torch.hurt = function(damage, knockback){};
    torch.plane = ETHEREAL;
    torch.layer = DEFAULT;
    torch.intensity = 1;
    torch.wall = NORTH;
    torch.particles=[];
    torch.move = function(deltaT){
        if(!this.nextFlicker || this.nextFlicker<Date.now()){
            this.intensity = Math.random();
            this.offsetX = Math.random() * 7 - 3.5;
            this.offsetY = Math.random() * 7 - 3.5;
            this.nextFlicker = Date.now() + Math.random() * 50 + 50;
            if(this.sprite){
                this.sprite.setFrame(0, Math.floor(this.intensity * 4) % 4, Math.floor(Math.random()*8) % 8)
                this.sprite._lastLocation.r = this.sprite.location.r = this.wall * 90;
            }
            if(this.intensity > .75){
                particle = game.screen.drawRect(this.box.center().x + Math.random() * 10 - 5, this.box.center().y + Math.random() * 10 - 5 + dimensions.infoHeight,2,2,"#fea","#000",0).attr("opacity",.75);
                particle.kill = Date.now() + 1000 * Math.random() + 250;
                this.particles.push(particle);
            }
        }
    };
    torch.elements = [];
    torch.render = function(deltaT){
        //console.warn("unimplemented: render()");
        this.box.render("#FFF")
        if(this.elements.length==0){
            game.screen.onClear(()=>{this.elements=[]});
            this.sprite = newSprite(game.screen, images.torch, 512,256, 64, 64,this.box.x-32, this.box.y-32);
            this.elements.push(this.sprite)
        }

        this.sprite.render()
        this.particles.forEach((p)=>{
            switch(this.wall) {
                case NORTH:
                    p.attr({y: p.attr("y")-deltaT/1000 * 50})
                    break;
                case EAST:
                    p.attr({x: p.attr("x")+deltaT/1000 * 50})   
                    break; 
                case SOUTH:
                    p.attr({y: p.attr("y")+deltaT/1000 * 50})
                    break;
                case WEST:
                    p.attr({x: p.attr("x")-deltaT/1000 * 50})
                    break;
            }
        });
        remove(this.particles, (p)=>{
            if(p.kill<Date.now()){
                p.remove();
                return true;
            }
            return false;
        })
    };
    torch.remove = function(){
        this.sprite.remove();
    }
    return torch;

}

function newTorchLight(torch){
    var torchLight = newGameObject();
    torchLight.torch = torch
    torchLight.box = torch.box;
    torchLight.plane = ETHEREAL;
    torchLight.layer = EFFECT;
    torchLight.move = function(deltaT){};
    torchLight.elements = [];
    torchLight.render = function(deltaT){
        //console.warn("unimplemented: render()");
        if(this.elements.length==0){
            this.lightingElement = game.screen.drawEllipse(this.box.center().x, this.box.center().y, this.intensity * 10 + 140, this.intensity * 10 + 140, 0,  dimensions.infoHeight, "#fea","#000",0)
            this.lightingElement.attr({"fill":"#fea","opacity": .15});
            this.elements.push(this.lightingElement);
            game.screen.onClear(()=>{this.elements=[]});
        }
        this.lightingElement.attr({
            "rx": this.torch.intensity * 10 + 140,
            "ry": this.torch.intensity * 10 + 140,
            "opacity": this.torch.intensity * .0125 + .025,
            //"clip-rect": "" + this.box.center().x + "," + this.box.center().y + "," + 140 + "," + 140 
        });
        this.lightingElement.transform("t" + this.torch.offsetX + "," + this.torch.offsetY);

        this.lightingElement.toFront();
    };
    torchLight.remove = function(){
        if(this.lightingElement){
            this.lightingElement.remove();
        }
        
        this.box.remove();
    }
    return torchLight;

}

function newGame() {
    return {
        //debug: true,        
        screen: newScreen("main"),
        player: newAdventurer(newInputController()),
        statistics: newStatistics(),
        state: RUNNING
    };
}

function clearScreen(){
    if (!game.screen){
        
        var controllerHeight = dimensions.height-dimensions.infoHeight-dimensions.width;
        /*
        game.screen = Raphael("main", dimensions.width, dimensions.height);
        game.screen.setViewBox(0, 0, dimensions.width, dimensions.height, true);
        game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
        game.screen.canvas.style.backgroundColor = '#000';   
        game.screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
        
        game.screen2 = Raphael("controller", dimensions.width, dimensions.height);
        game.screen2.setViewBox(0, 0, dimensions.width, dimensions.height, true);
        game.screen2.canvas.setAttribute('preserveAspectRatio', 'meet');

        game.screen2.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
        gameElement2 = game.screen2.rect(0, dimensions.height-controllerHeight, dimensions.width, controllerHeight).attr({"fill":"#181818", "r": 50});
        */
        onResize();
    }else{      
        game.screen.clear();
    }

    var gameElement = game.screen.rect(0, 0, dimensions.width, dimensions.height).attr({"fill":SCREENBLACK});

}   

function newLevel(levelNumber){
    level = {
        number: levelNumber,
        world:0,
        rooms:[], 
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#048",    
        },
        statistics: newStatistics(),
        findRoom: function(x,y){
            for(i=0;i<this.rooms.length;i++){
                if(this.rooms[i].x==x && this.rooms[i].y==y){
                    return this.rooms[i];
                }
            }
            return null;
        },
        findNeighbor: function(room, direction){
            if(!room) return null;
            switch(direction){
                case NORTH:
                    return this.findRoom(room.x, room.y - 1);
                case EAST:
                    return this.findRoom(room.x + 1, room.y);
                case SOUTH:
                    return this.findRoom(room.x, room.y + 1);
                case WEST:
                    return this.findRoom(room.x - 1, room.y);
                default:
                    return null
            }
        },
        getRoom: function(x, y){
            foundRoom = this.findRoom(x,y);
            if(foundRoom) return foundRoom;
            room = newRoom(x, y)
            this.rooms.push(room);
            return room;
        },
        extents: function(){
            var nMost;
            var eMost;
            var sMost;
            var wMost;
            this.rooms.forEach((r)=>{
                if(nMost==null || nMost.y>r.y || (nMost.y == r.y && r.doors.length<=nMost.doors.length)){
                    nMost = r;
                }
                if(eMost==null || eMost.x<r.x || (eMost.x == r.x && r.doors.length<=eMost.doors.length)){
                    eMost = r;
                }
                if(sMost==null || sMost.y<r.y || (sMost.y == r.y && r.doors.length<=sMost.doors.length)){
                    sMost = r;
                }
                if(wMost==null || wMost.x>r.x || (wMost.x == r.x && r.doors.length<=wMost.doors.length)){
                    wMost = r;
                }
            })
            var extents=[];
            extents.push(nMost);
            extents.push(eMost);
            extents.push(sMost);
            extents.push(wMost);
            return extents;
        },
        _init: function(){
            //complexity math
            var defaultOffset = constants.doorWidth + constants.brickWidth + constants.doorFrameThickness * 3;
            var roomsPerRegion = 0 
            if(this.number <= 23){
                roomsPerRegion = (((this.number % 4) + 1) * 5) + 5;
                maxRegion = Math.floor(this.number/4);
            } else {
                roomsPerRegion = (((this.number - 24) + 1) * 5) + 25;
                maxRegion = BLUEKEY
            }
            this.world =  Math.floor(this.number/4) + 1;
            var hasBoss = (levelNumber % 4 == 3);

            //build map
            for(var region = NONE;region <= maxRegion; region++){
                regionRooms = [];
                //get entrance
                var entrance;
                this.doorCount = 0;
                if(this.rooms.length==0){
                    entrance = this.getRoom(0,0)//TODO: move to level
             
                } else {
                    extents = this.extents();
                    
                    //pick a random direction
                    direction = Math.round(4 * Math.random()) % 4;
             

                    extent = extents[direction];
                    switch(direction){
                        case NORTH:
                            entrance = this.getRoom(extent.x, extent.y - 1);
                            break;
                        case EAST:
                            entrance = this.getRoom(extent.x + 1, extent.y);
                            break;
                        case SOUTH:
                            entrance = this.getRoom(extent.x, extent.y + 1);
                            break;
                        case WEST:
                            entrance = this.getRoom(extent.x - 1, extent.y);
                            break;
                    }
                    //regionRooms.push(entrance);

                    

                    //TODO: Lock entrance if not starting position.
                    entrance.opened = false;
                    entrance.lock = region;
                    entrance.region = region;
                    
                    extent.doors.push(newDoor(this,extent,direction, 0));
                    entrance.doors.push(newDoor(this,entrance,(direction + 2) % 4, 0));
                }

                entrance.region = region;
                regionRooms.push(entrance); 
                
                while(regionRooms.length < roomsPerRegion){
                    seedRoom = randomEntry(regionRooms);
                    if (seedRoom == regionRooms[0] && seedRoom.doors.length == 3)
                    {
                        continue;
                    }
                    seedDirection = Math.round(4 * Math.random()) % 4;
                    if(seedRoom.findDoor(seedDirection)==null){
                        neighbor = this.findNeighbor(seedRoom,seedDirection);
                
                        
                        if(neighbor == null){
                            switch(seedDirection){
                                case NORTH:
                                    neighbor = this.getRoom(seedRoom.x, seedRoom.y - 1);
                                    break;
                                case EAST:
                                    neighbor = this.getRoom(seedRoom.x + 1, seedRoom.y);
                                    break;
                                case SOUTH:
                                    neighbor = this.getRoom(seedRoom.x, seedRoom.y + 1);
                                    break;
                                case WEST:
                                    neighbor = this.getRoom(seedRoom.x - 1, seedRoom.y);
                                    break;
                                default:
                                    console.warn({"unexpected seedDirection": seedDirection});
                                    
                            }
                            regionRooms.push(neighbor);
                        }else{
                            if(neighbor.region!=region || neighbor == regionRooms[0]){
                                continue
                            }
                        }
    
                        neighbor.region = region;   
                        seedRoom.doors.push(newDoor(this,seedRoom,seedDirection, 0));
                        neighbor.doors.push(newDoor(this,neighbor,(seedDirection + 2) % 4, 0));
                    }
                }


            }
            
            var exitRoom;
            var maxKey;
            if(this.number <= 19){
                var extents = this.extents();
                    
                //pick a random direction
                var direction = Math.round(4 * Math.random()) % 4;
         
                var extent = extents[direction];
                switch(direction){
                    case NORTH:
                        exitRoom = this.getRoom(extent.x, extent.y - 1);
                        break;
                    case EAST:
                        exitRoom = this.getRoom(extent.x + 1, extent.y);
                        break;
                    case SOUTH:
                        exitRoom = this.getRoom(extent.x, extent.y + 1);
                        break;
                    case WEST:
                        exitRoom = this.getRoom(extent.x - 1, extent.y);
                        break;
                }
                //regionRooms.push(entrance);

                //Lock entrance if not starting position.
                exitRoom.opened = false;
                maxKey = maxRegion + 1;
                exitRoom.lock = maxKey;
                exitRoom.region = maxKey;
                extent.doors.push(newDoor(this,extent,direction, 0));
                exitRoom.doors.push(newDoor(this,exitRoom,(direction + 2) % 4, 0));
                this.statistics.doorsSpawned++;
              
            } else {
                var extents = this.extents();   
                exitRoom = randomEntry(filter(extents,(r)=>{return r.doors.length==1 && r.region == maxRegion}))
                maxKey = maxRegion;
            }
            //TODO: size reasonably, randomize
            //minWidth = constants.roomMinWidthInBricks
            //minHeight = constants.roomMinHeightInBricks
            
            //exitRoom.box.width = Math.floor((Math.random() * (constants.roomMaxWidthInBricks - minWidth)) + minWidth) * constants.brickWidth;
            //exitRoom.box.height =constants.brickWidth;//Math.floor((Math.random() * (constants.roomMaxHeightInBricks - minHeight)) + minHeight) * constants.brickWidth;

            exitRoom.exit = 1;

            //jitter rooms
            for(var i=0;i<level.rooms.length;i++){
                
                room = level.rooms[i];
                room.jittered = true;
                if(i == 0){
                
                    room.doors.forEach((d)=>{d.stabilize()});
                   continue;
                }
                room.box.x = Math.round(Math.random() * ((dimensions.width - room.wallHeight * 2 ) - room.box.width)) + room.wallHeight;
                room.box.y = Math.round(Math.random() * ((dimensions.width - room.wallHeight * 2 ) - room.box.height)) + room.wallHeight;
            
                
                doorPadding = constants.doorFrameThickness + constants.doorWidth/2 + constants.brickWidth/2;

                for(wall = 0; wall<4; wall++){
                    oppositeWall = (wall + 2) % 4;
                    door = room.findDoor(wall);
                    if (!door){
                        continue;
                    }
                    neighbor = level.findNeighbor(room, wall);
                    if(!neighbor.jittered){
                        continue;
                    }
                    
                    neighboringDoor = neighbor.findDoor(oppositeWall);
                    
                    switch(wall){
                        case NORTH:
                            doorX = (-neighboringDoor.offset + neighbor.box.width/2 + neighbor.box.x + neighbor.wallHeight);
                            roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                            offset = doorX - roomCenter;
        
                            if ((roomCenter + offset) < (room.box.x + room.wallHeight + doorPadding)){
                                diff = ((room.box.x + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newleft = room.box.x - diff
                                offset += diff;
                                room.box.x = newleft;
                            }
                            if ((roomCenter + offset) > (room.box.x + room.wallHeight + room.box.width - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.x + room.wallHeight + room.box.width - doorPadding);
                                room.box.width +=diff;
                                roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                                offset = doorX - roomCenter;
                            }
                            door.offset = offset;
                            break;
                        case WEST: 
                            doorY = (neighboringDoor.offset + neighbor.box.height/2 + neighbor.box.y + neighbor.wallHeight);
                            roomCenter = room.box.y + room.wallHeight + room.box.height/2;
                            offset = doorY - roomCenter;
    
                            if ((roomCenter + offset) < (room.box.y + room.wallHeight + doorPadding)){
                                diff = ((room.box.y + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newtop = room.box.y - diff
                                offset += diff;
                                room.box.y = newtop;
                            }
                            if ((roomCenter + offset) > (room.box.y + room.wallHeight + room.box.height - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.y + room.wallHeight + room.box.height - doorPadding);
                                room.box.height +=diff;
                                roomCenter = room.box.y + room.wallHeight + room.box.height/2;                        
                                offset = doorY - roomCenter;
                            }
                            offset = offset *-1
                            
                            door.offset = offset;
                            break;
                        case SOUTH:
                            doorX = (neighboringDoor.offset + neighbor.box.width/2 + neighbor.box.x + neighbor.wallHeight);
                            roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                            offset = doorX - roomCenter;
    
                            if ((roomCenter + offset) < (room.box.x + room.wallHeight + doorPadding)){
                                diff = ((room.box.x + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newleft = room.box.x - diff
                                offset += diff;
                                room.box.x = newleft;
                            }
                            if ((roomCenter + offset) > (room.box.x + room.wallHeight + room.box.width - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.x + room.wallHeight + room.box.width - doorPadding);
                                room.box.width +=diff;
                                roomCenter = room.box.x + room.wallHeight + room.box.width/2;
                                offset = doorX - roomCenter;
                            }
                            offset = offset *-1
                            
                            door.offset = offset;
                            break;
                        case EAST: 
                            doorY = (-neighboringDoor.offset + neighbor.box.height/2 + neighbor.box.y + neighbor.wallHeight);
                            roomCenter = room.box.y + room.wallHeight + room.box.height/2;
                            offset = doorY - roomCenter;
                            if ((roomCenter + offset) < (room.box.y + room.wallHeight + doorPadding)){
                                diff = ((room.box.y + room.wallHeight + doorPadding) - (roomCenter + offset));
                                newtop = room.box.y - diff
                                offset += diff;
                                room.box.y = newtop;
                            }
                            if ((roomCenter + offset) > (room.box.y + room.wallHeight + room.box.height - doorPadding)){
                                diff = (roomCenter + offset) -(room.box.y + room.wallHeight + room.box.height - doorPadding);
                                room.box.height +=diff;
                                roomCenter = room.box.y + room.wallHeight + room.box.height/2;
                                offset = doorY - roomCenter;    
                            }
                            
                            door.offset = offset;
                            break;
                        
                    }
                }
            }
        

            this.rooms.forEach((r)=>{r.doors.forEach((d)=>d.stabilize())});
            //set exit
            exit = newExit();
            exit.box.x = exitRoom.box.x + exitRoom.box.width/2 - exit.box.width/2
            exit.box.y = exitRoom.box.y + exitRoom.box.height/2 - exit.box.height/2
            exitRoom.objects.push(exit);

            //pepper with keys
            for(var key = maxKey; key>NONE; key--){
                var keyroom = randomEntry(filter(this.rooms,(r)=>{return r.region < key && r.doors.length == 1 && !r.exit}));
                if (keyroom == null){
                    keyroom = randomEntry(filter(this.rooms,(r)=>{return r.region < key && !r.exit}));    
                }
                if (keyroom.keyroom){//already a keyroom, try again
                    key++;
                    continue;
                }
                var chest = newTreasureChest(key);
                keyroom.spawn(chest);
                keyroom.keyroom = true;
                level.statistics.keysSpawned++;
                level.statistics.chestsSpawned++;
            }
            
            //pepper with random treasure chests & enemies
            minArea = constants.roomMinHeightInBricks * constants.roomMinWidthInBricks * constants.brickWidth * constants.brickWidth;
            maxArea = constants.roomMaxHeightInBricks * constants.roomMaxHeightInBricks * constants.brickWidth * constants.brickWidth ;
            thresholds = Math.round((maxArea-minArea) / 4);
            
            this.rooms.forEach((r,i)=>{
                if(i!=0 && !r.exit){
                    roomArea = r.box.width * r.box.height;
                    maxNumberOfObjects = Math.round((roomArea-minArea) / thresholds)
                    minNumberOfObjects = Math.round(Math.round((roomArea-minArea) / thresholds)/2)
                    enemies = constrain(minNumberOfObjects, Math.round(maxNumberOfObjects * Math.random()), maxNumberOfObjects)
                    for(i=0; i<enemies; i++){
                        if(Math.random()>.5){
                            r.spawn(newSwordSkeleton(newRandomController()));
                            this.statistics.swordSkeletonsSpawned++;
                        }else {
                            r.spawn(newCaveSpider(newRandomController()));
                            this.statistics.caveSpidersSpawned++;
                        }
                        this.statistics.enemiesSpawned++;
                    }
                    chests = constrain(minNumberOfObjects, Math.round(maxNumberOfObjects * Math.random()), maxNumberOfObjects)
                    for(i=0; i<chests; i++){
                        if (!r.keyroom){
                            r.spawn(newTreasureChest(RANDOM));
                            this.statistics.chestsSpawned++;
                        }
                    }
                    if(chests == 0 && r.doors.length == 1 && !r.keyroom){
                        r.spawn(newTreasureChest(RANDOM));
                        this.statistics.chestsSpawned++;
                    }

                    //plant floor spikes
                    r.doors.forEach((d)=>{
                        offsetT = 0; // Math.round(Math.random()*3000);
                        if(Math.random()<=.33){
                            switch (d.wall){
                                case NORTH:
                                    x = r.box.x + r.box.width/2 + d.offset+2;
                                    y = r.box.y;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    x -= 64
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;offsetT
                                    r.objects.push(fs2);
                                    break;
                                    
                                case EAST:
                                    x = r.box.x + r.box.width - 67;
                                    y = r.box.y + r.box.height / 2 + d.offset;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    y -= 48
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;
                                    r.objects.push(fs2);
                                    break;
                                case SOUTH:
                                    x = r.box.x + r.box.width/2 - d.offset+2;
                                    y = r.box.y + r.box.height - 55;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    x -= 64
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;
                                    r.objects.push(fs2);
                                    break;
                                case WEST:
                                    x = r.box.x + 5;
                                    y = r.box.y + r.box.height / 2 - d.offset;
                                    fs1 = newFloorSpikes(offsetT);
                                    fs1.box.x = x;
                                    fs1.box.y = y;
                                    r.objects.push(fs1);
                                    
                                    y -= 48
                                    fs2 = newFloorSpikes(offsetT);
                                    fs2.box.x = x;
                                    fs2.box.y = y;
                                    r.objects.push(fs2);
                                    break;   
                            }
                        }
                    });


                }
            })
            
           

            var startingRoom = this.rooms[0];

            //startingRoom.palette.floorColor="#064";


            var direction = !any(startingRoom.doors,(d)=>{return d.wall==NORTH}) ? NORTH :
                            !any(startingRoom.doors,(d)=>{return d.wall==EAST}) ? EAST :
                            !any(startingRoom.doors,(d)=>{return d.wall==WEST}) ? WEST :
                            SOUTH;


            var entranceDoor = newDoor(level, startingRoom, direction, 0)
            entranceDoor.atmosphere = levelNumber == 0 ? "90-#000:50-#FFe:95" : "#000";
            entranceDoor.forceBars = true;
            entranceDoor.isEntrance = true;
            
            entranceDoor.stabilize();
            this.rooms[0].doors.push(entranceDoor)

             //Add torches
             this.rooms.forEach((room)=>{
                for(var wall = NORTH; wall<=WEST; wall++){
                    wallDoor = room.findDoor(wall);
                    if(wallDoor == null){
                        var torch = newTorch();
                        switch(wall){
                            case NORTH:
                                torch.box.x = room.box.center().x;
                                torch.box.y =  room.box.y - room.wallHeight/2;
                                torch.wall = wall;
                                break;
                            case EAST:
                                torch.box.x = room.box.x + room.box.width + room.wallHeight/2; 
                                torch.box.y = room.box.center().y;
                                torch.wall = wall;
                                break;
                            case SOUTH:
                                torch.box.x = room.box.center().x;
                                torch.box.y =  room.box.y + room.box.height + room.wallHeight/2;
                                torch.wall = wall;
                                break;
                            case WEST:
                                torch.box.x = room.box.x - room.wallHeight/2; 
                                torch.box.y =  room.box.center().y;
                                torch.wall = wall;
                                break;
                        }
                        room.objects.push(torch);
                        room.objects.push(newTorchLight(torch));
                    }
                }
            })
        }
    };

    level._init();
    
    //generateMap(game.level);
    return level;
}

function exitLevel(){
    music.exitLevel();
    var r = newRoom();
    //r.wallHeight = 3 * constants.brickHeight
    r.box.x = r.wallHeight;
    r.palette.clipColor = "#000"
    r.box.width = 3 * constants.brickWidth;
    r.box.height = constants.roomMaxHeightInBricks * constants.brickWidth;
    r.box.y = Math.round((dimensions.width - room.box.height - room.wallHeight*2) / 2) + room.wallHeight;
    var exit = new newExit()
    exit.box.x = r.box.center().x - exit.box.width / 2 ;
    exit.box.y = r.wallHeight + constants.doorFrameThickness * 2;
    exit.tripped = function(){
        game.state = PAUSED;
        setTimeout(()=>{  
            fadeTo(SCREENBLACK,()=>{
                warpTo(game.level.number + 1);
                game.currentRoom.objects.forEach((o)=>o.render(0));
                fadeInFrom(SCREENBLACK,()=>{
                    game.state = RUNNING;
                })
            });
        },50);
      
    }
    r.objects.push(exit);
    var entrance = newDoor(level, room, SOUTH, 0);
    entrance.forceBars = true;
    r.doors.push(entrance);
    game.player.box.x = r.box.center().x - game.player.box.width/2;
    game.player.box.y = r.box.height;
    game.player.sprite._lastLocation.x =  game.player.box.x;
    game.player.sprite._lastLocation.y = game.player.box.y;
    game.player.sprite.scale = 1;
    game.player.speed = 150;
    game.player.direction = NORTH;
    r.objects.push(game.player);

    var wTorch = newTorch();
    wTorch.wall = WEST;
    wTorch.box.x = room.box.x - room.wallHeight / 2;
    wTorch.box.y = dimensions.width * 2 / 3
    r.objects.push(wTorch);
    r.objects.push(newTorchLight(wTorch));

    var eTorch = newTorch();
    eTorch.wall = EAST;
    eTorch.box.x = room.box.x + room.box.width + room.wallHeight / 2;
    eTorch.box.y = dimensions.width  / 3
    r.objects.push(eTorch);
    r.objects.push(newTorchLight(eTorch));
    
    clearScreen();
    r.render();
    game.screen.drawRect(r.x)
    game.currentRoom = r;
    game.currentRoom.objects.forEach((o)=>o.render(0));
    statsBox = newBox(r.box.x + r.box.width + r.wallHeight, 0, dimensions.width - (r.box.x + r.box.width + r.wallHeight), dimensions.width);
    fadeInFrom("#000", ()=>{
        
        game.state = RUNNING;
        game.level.statistics.finalizeLevelStats();
        game.statistics.add(game.level.statistics);
        game.level.statistics.render("LEVEL COMPLETE!", statsBox);
    });
}

function warpTo(levelNumber){
    
    music.explore();
    game.level = newLevel(levelNumber);
    game.level.start = Date.now();
    
    startingRoom = game.level.rooms[0];
    startingRoom.visited = 1;
    game.currentRoom = startingRoom;
    entrance = filter(startingRoom.doors, (d)=>{return d.isEntrance})[0];
    direction=NORTH;
    switch (entrance.wall){
        case NORTH:
            game.player.box.x = entrance.box.center().x - game.player.box.width/2;
            game.player.box.y = entrance.box.y+entrance.box.height - game.player.box.height;
            direction = SOUTH;
            break;
        case EAST:
            game.player.box.x = entrance.box.center().x;
            game.player.box.y = entrance.box.center().y - game.player.box.height/2;
            direction = WEST;
            break;
        case SOUTH:
            game.player.box.x = entrance.box.center().x - game.player.box.width/2;
            game.player.box.y = entrance.box.y;
            direction = NORTH;
            break;
        case WEST:
            game.player.box.x = entrance.box.center().x;
            game.player.box.y = entrance.box.center().y - game.player.box.height/2;
            direction = EAST;
            break;
    }
    
    game.currentRoom.objects.push(game.player);
    
    if(game.player.sprite){
        game.player.sprite.scale = 1;
    }
    game.player.speed = 150;
    game.player.move(0);
    game.player.direction = direction;
    game.player.keys = [];
    clearScreen();
    game.currentRoom.render();
}

function titleScreen(){
    game.state = PAUSED;
    clearScreen();
    var logo = game.screen.image(images.logo, 150, dimensions.infoHeight+150,600, 320);
    var prompt = game.screen.text(dimensions.width/2, dimensions.infoHeight+dimensions.width-250, "PRESS " + (ORIENTATION == PORTRAIT ? "FIRE" : "SPACE BAR") + " TO BEGIN").attr({ "font-size": "48px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "middle", "font-weight": "bold"});  
    torch1 = newTorch();
    torch1.box.y = 375;
    torch1.box.x = 100;
    torch1.wall = NORTH;
    torch2 = newTorch();
    torch2.box.y = 375;
    torch2.box.x = 800;
    torch1.wall = NORTH;
    interval = setInterval(()=>{
        torch1.move(50);
        torch1.render(50);
        torch2.move(50);
        torch2.render(50);
        //torchLight1.render(50);
        //torch2.render();
    },50);
    waitForAttack(()=>{
        music.init();
        music.start();
        prompt.animate({opacity:0},100, "elastic",()=>{
            prompt.animate({opacity:1},100, "elastic",()=>{            
                prompt.animate({opacity:0},100, "elastic",()=>{
                    prompt.animate({opacity:1},100, "elastic",()=>{
                        prompt.animate({opacity:0},100, "elastic",()=>{
                            prompt.animate({opacity:1},100, "elastic",()=>{
                            });
                        });
                        
                        clearInterval(interval);
                        fadeTo("#FFF",()=>{
                            startGame();
                        })
                    });
                });
            });
        });
    });
}

function startGame(){
    game.player.maxHealth = 30;
    game.player.health = game.player.maxHealth;
    game.player.state = IDLE;
    game.player.gold = 0;
    game.statistics = newStatistics();
    warpTo(0);
    game.currentRoom.render(0);
    game.player.render(0);
    fadeInFrom("#FFF",()=>{
        game.state = RUNNING;
    });
}

function gameOver(){
    music.death();
    game.state = PAUSED;
    setTimeout(()=>{
        fadeTo(SCREENBLACK,()=>{
            game.currentRoom.objects.forEach((o)=>{o.remove();});
            game.player.sprite.location.x = 250;
            game.player.sprite.location.y = -16;
            game.player.sprite._lastLocation.x = game.player.sprite.location.x;
            game.player.sprite._lastLocation.y = game.player.sprite.location.y;
            game.player.sprite.setFrame(SOUTH, DYING, 7);
            game.player.sprite.render(0)    
            game.level.statistics.finalizeLevelStats();
            game.statistics.add(game.level.statistics);
            game.statistics.render("YOU DIED!", newBox(50,0,dimensions.width-100,dimensions.width));
        });
        waitForAttack(()=>{fadeTo("#FFF",startGame)});
    },1500)
}

function waitForAttack(callback){
    if(game.player.controller.attack){
        callback();
        return;
    }
    setTimeout(()=>{waitForAttack(callback)},50);
}

function regionColor(region){
    switch (region){
        case SILVERKEY:
            return "#606060";
        case GOLDKEY:
            return "#997700";
        case REDKEY:
            return "#600000";
        case GREENKEY: 
            return "#006000";
        case BLUEKEY: 
            return "#000070";
    }
    return "#864";
}

function drawMap(){
    var screen = game.screen;
    var level = game.level;
    var roomSize=10;
    var roomMargin=1;
    var extents = level.extents();
    level.rooms.forEach((r)=>{
        var extentRoom = (extents.indexOf(r) > -1)
        var centerX = dimensions.width/2 + r.x * (roomSize + roomMargin * 2);
        var centerY = dimensions.width/2 + r.y * (roomSize + roomMargin * 2);
        screen.drawRect(centerX-roomSize/2,centerY-roomSize/2, roomSize, roomSize, r.x==0 && r.y==0 ? "#00FF88" : regionColor(r.region), extentRoom ? "#fff": "#000",1);
        r.doors.forEach((d)=>{
            switch(d.wall){
                case NORTH:
                    screen.drawRect(centerX-2, centerY - roomSize/2 - roomMargin, 4, roomMargin, "#FFF","#000", 0);
                    break;
                
                case EAST:
                    screen.drawRect(centerX + roomSize/2, centerY - 2, roomMargin, 4, "#FFF","#000", 0);
                    break;
                case SOUTH:
                    screen.drawRect(centerX-2, centerY + roomSize/2, 4, roomMargin, "#FFF","#000", 0);
                    break;
                case WEST:
                    screen.drawRect(centerX- roomSize/2 - roomMargin, centerY - 2, roomMargin, 4, "#FFF","#000", 0);
                    break;
            }
        })
    });
}

tiles=[];
for(var i=0; i<100; i++){
    switch(Math.round(Math.random()*7)%7){
        case 0:
            tiles.push("#555555");
        case 1:
            tiles.push("#565656");
        case 2:
            tiles.push("#646464");
        case 3:
            tiles.push("#545454");
        case 4:
            tiles.push("#575454");
        case 5:
            tiles.push("#545457");
        case 6:
            tiles.push("#545754");
    }
}

function newRoom(x,y){
    room =  { 
        x:x, //map address
        y:y, //map address
        box: newBox(0,0,400,600),
        region: NONE,
        opened:1,
        barred:0,
        mapped:0,
        wallHeight: constants.brickHeight * 5,
        doors:[],
        objects:[],
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#753"//"#048",    
        },
        tileSeed: Math.floor(Math.random()*100),
        render: function(){
            //render clip area
            game.screen.rect(
                0, 
                dimensions.infoHeight, 
                dimensions.width, 
                dimensions.width
            ).attr({
                "fill":this.palette.clipColor
            });
            
            //render walls
            game.screen.rect(
                this.box.x - this.wallHeight,
                this.box.y - this.wallHeight + dimensions.infoHeight, 
                this.box.width + this.wallHeight * 2,
                this.box.height + this. wallHeight * 2
            ).attr({
                "fill": this.palette.wallColor,
                "stroke-width": constants.lineThickness
            });
            

            game.screen.drawRect(
                this.box.x - this.wallHeight + constants.brickHeight * 2,
                this.box.y - this.wallHeight + dimensions.infoHeight + constants.brickHeight * 2, 
                this.box.width + this.wallHeight * 2 - constants.brickHeight * 4,
                this.box.height + this. wallHeight * 2  - constants.brickHeight * 4,
                regionColor(this.region),
                "#000",
                0
            );

            
            game.screen.drawRect(
                this.box.x - this.wallHeight + constants.brickHeight * 3,
                this.box.y - this.wallHeight + dimensions.infoHeight + constants.brickHeight * 3, 
                this.box.width + this.wallHeight * 2 - constants.brickHeight * 6,
                this.box.height + this. wallHeight * 2  - constants.brickHeight * 6,
                this.palette.wallColor,
                "#000",
                0
            );




            //render each wall
            renderBricks(this)

            //render doors
            this.doors.forEach((door)=>door.render());

            //render floor
            game.screen.rect(
                this.box.x,
                this.box.y + dimensions.infoHeight, 
                this.box.width, 
                this.box.height
            ).attr({
                fill: this.palette.floorColor,
                "stroke-width": constants.lineThickness
            })
            var t = this.tileSeed;
            var tileWidth = (constants.brickWidth*1.2);
            for(var r=0; r<this.box.height;r+=tileWidth){
                for(var c=0; c<this.box.width;c+=tileWidth){

                    var x = c + this.box.x;
                    var y = r + this.box.y + dimensions.infoHeight;
                    var w = tileWidth;
                    var h = tileWidth;
                    if(c+w>this.box.width){
                        w = this.box.width - c;
                    }
                    if(r+h>this.box.height){
                        h = this.box.height - r;
                    }
                    game.screen.drawRect(x, y, w, h , calculateAlpha(this.palette.floorColor,tiles[t],.25),calculateAlpha(this.palette.floorColor,"#000",.25),1.5)//.attr({opacity:.25});
                    t = (t+1) % tiles.length;
                }   
            }
            var centerX = this.box.x + this.box.width/2
            var centerY = this.box.y + this.box.height/2

        },
        findDoor: function(wall){
            for(i = 0; i<this.doors.length;i++){
                if(this.doors[i].wall == wall){
                    return this.doors[i];
                }
            }
            return null;
        },
        constrain: function(gameObject, x2, y2){
            x1 = gameObject.box.x;
            y1 = gameObject.box.y;
            constrained = newBox(gameObject.box.x, gameObject.box.y, gameObject.box.width, gameObject.box.height);
            //game.player.box
            constrained.x = constrain(this.box.x, x2, this.box.x + this.box.width - gameObject.box.width);
            constrained.y = constrain(this.box.y, y2, this.box.y + this.box.height - gameObject.box.height);
            
            
            //constrain against all other objects
            this.objects.forEach((gameObject2)=>{
                if(gameObject!=gameObject2 && gameObject2.plane == PHYSICAL){
                    if(constrained.collidesWith(gameObject2.box)){
                        //revert to original
                        constrained.resolveCollision(gameObject2.box);
                    }
                }
            })
            if (this.barred) {
                return constrained;
            }
            //TODO: move door concerns?
            allowance = Math.round((constants.doorWidth/2)+constants.doorFrameThickness);
            for(d=0;d<this.doors.length;d++){
                door = this.doors[d];
                if(!door.opened && game.player.keys.indexOf(door.lock)>-1 && game.player.box.inside(door.box)){
                    door.opened = 1;
                    game.level.findNeighbor(this, door.wall).opened=1;
                    game.level.statistics.doorsUnlocked++;
                    sfx.roomOpened();
                    door.render();
                    
                } else if(!door.opened || door.forceBars) {
                    return constrained;
                }
                switch(door.wall){  
                    case NORTH:
                        if(game.player.box.inside(door.box) ){
                            if(y2<y1) constrained.x = door.box.center().x - Math.round(game.player.box.width/2);
                            constrained.y = y2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break;

                    case EAST:

                        if(game.player.box.inside(door.box) ){
                            if(x2>x1) constrained.y = door.box.center().y;
                            constrained.x = x2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break;
                    case SOUTH:
                        if(game.player.box.inside(door.box) ){
                            if(y2>y1) constrained.x = door.box.center().x - Math.round(game.player.box.width/2);
                            constrained.y = y2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break
                    case WEST:
                        if(game.player.box.inside(door.box) ){
                            if(x2<x1) constrained.y = door.box.center().y;
                            constrained.x = x2;
                            if (game.player.box.collidesWith(door.trip)){
                                openNextRoom(door.wall);
                                return newBox(game.player.box.x+1, game.player.box.y+1,game.player.box.width, game.player.box.height);
                            }
                        }
                        break;
                }
            };

            return constrained;
        },
        spawn: function(object){
            do {
                object.box.x = this.box.x + Math.round((this.box.width-object.box.width) * Math.random());
                object.box.y = this.box.y + Math.round((this.box.height-object.box.height) * Math.random());
            } while (any(this.objects, (o)=>{return o.box.collidesWith(object.box)}) || any(this.doors,(d)=>(d.box.collidesWith(object.box))))
            this.objects.push(object);
        }
    };
    room.box.width = Math.round((((constants.roomMaxWidthInBricks - constants.roomMinWidthInBricks) * Math.random()) + constants.roomMinWidthInBricks)) * constants.brickWidth;
    room.box.height = Math.round((((constants.roomMaxHeightInBricks - constants.roomMinHeightInBricks) * Math.random()) + constants.roomMinHeightInBricks)) * constants.brickWidth;
    //center by default
    room.box.x = Math.round((dimensions.width - room.box.width - room.wallHeight*2) / 2) + room.wallHeight;
    room.box.y = Math.round((dimensions.width - room.box.height - room.wallHeight*2) / 2) + room.wallHeight;
    return room;
}

function renderBricks(room){
    color="#000";
    rows = room.box.height/constants.brickHeight;
    
    //NORTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.box.width / 2
    focus.y = trig.cotangent(trig.degreesToRadians(45)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + dimensions.infoHeight;
    
    game.screen.drawAngleSegmentX(trig.degreesToRadians(225), -room.box.width/2-room.wallHeight, -room.box.width/2, offset.x, offset.y, color, constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=constants.brickHeight){
        y1 = -(room.box.width)/2 - room.wallHeight + y;
        y2 = y1 + constants.brickHeight
        column = 0;
    
        for(x = constants.brickWidth/2; x < room.box.width ; x += constants.brickWidth/2){
            angle = trig.pointToAngle(room.box.width / 2, room.box.width / 2 - x);
            
            if(column % 2 == row % 2){
                game.screen.drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
        }
        row++;
    }
    
    //SOUTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.box.width / 2
    focus.y = -trig.cotangent(trig.degreesToRadians(225)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + room.box.height + dimensions.infoHeight;

    game.screen.drawAngleSegmentX(trig.degreesToRadians(225), room.box.width/2+room.wallHeight, room.box.width/2, offset.x, offset.y, color, constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=constants.brickHeight){
        y1 = (room.box.width)/2 + room.wallHeight - y;
        y2 = y1 - constants.brickHeight
        column = 0;
    
        for(x = constants.brickWidth/2; x < room.box.width ; x += constants.brickWidth/2){
            angle = trig.pointToAngle(room.box.width / 2, room.box.width / 2 - x);
            
            if(column % 2 == row % 2){
                game.screen.drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
        }
        row++;
    }


    //EASTERN WALL
    //determine focal point / offset
    focus={};
    focus.y = -room.box.height / 2
    focus.x = trig.tangent(trig.degreesToRadians(135)) * focus.y;
    
    offset={};
    offset.x = focus.x + room.box.x;
    offset.y = focus.y + room.box.y + room.box.height + dimensions.infoHeight;

    game.screen.drawAngleSegmentY(trig.degreesToRadians(135), room.box.height/2+room.wallHeight, room.box.height/2, offset.x, offset.y, color, constants.lineThickness);

    row = 0;
    for(x = 0; x<room.wallHeight; x+=constants.brickHeight){
        x1 = -room.box.height/2 - room.wallHeight + x;
        x2 = x1 + constants.brickHeight;
        column = 0;
        //game.screen.drawLine(x1+ offset.x, 0, x2+offset.x, dimensions.height, "#FF0", constants.lineThickness);
    
        for(y = constants.brickWidth/2; y < room.box.height ; y += constants.brickWidth/2){
            angle = trig.pointToAngle(-room.box.height / 2+y, -room.box.height / 2);
            
                if(column % 2 == row % 2){
                    game.screen.drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
            game.screen.drawLine(x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(225))*x1)+offset.y, color, constants.lineThickness);
        
        }
        row++;
    }

    //WESTERN WALL
    //determine focal point / offset
    focus={};
    focus.y = -room.box.height / 2
    focus.x = trig.tangent(trig.degreesToRadians(225)) * focus.y;
    
    offset={};
    offset.x = focus.x + room.box.x + room.box.width;
    offset.y = focus.y + room.box.y + room.box.height + dimensions.infoHeight;

    game.screen.drawAngleSegmentY(trig.degreesToRadians(315), -room.box.height/2-room.wallHeight, -room.box.height/2, offset.x, offset.y, color, constants.lineThickness);
    
    row = 0;
    for(x = 0; x<room.wallHeight; x+=constants.brickHeight){
        x1 = room.box.height/2 + x;
        x2 = x1 + constants.brickHeight;
        column = 0;
        //game.screen.drawLine(x1+ offset.x, 0, x2+offset.x, dimensions.height, "#FF0", constants.lineThickness);
    
        for(y = constants.brickWidth/2; y < room.box.height ; y += constants.brickWidth/2){
            angle = trig.pointToAngle(-room.box.height / 2+y, -room.box.height / 2);
            
                if(column % 2 == row % 2){
                    game.screen.drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    game.screen.drawLine(Math.round(trig.cotangent(trig.degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(trig.cotangent(trig.degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, constants.lineThickness);
            game.screen.drawLine(x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(trig.tangent(trig.degreesToRadians(225))*x1)+offset.y, color, constants.lineThickness);
        }
        row++;
    }

}

function newDoor(level, room, wall, offset){
    door = {
        room: room,
        wall: wall % 4,
        color: palette.doorDefaultColor,
        atmosphere: "#000",
        offset: offset, 
        forceBars: false,
        render: function(){
            //clear previous rendering
            if(this.elements && this.elements.length>0){
                this.elements.forEach((e)=>e.remove());
                game.screen.onClear(()=>{this.elements = [];});
            }
            this.elements = [];
 
    
            focus={};
            focus.x =  (this.wall == NORTH || this.wall == SOUTH ? this.room.box.width : this.room.box.height) / 2
            //focus.x = this.room.box.width /2
            focus.y = trig.cotangent(trig.degreesToRadians(45)) * focus.x;
        
            offset={};
            offset.x = 0;//focus.x + this.room.box.x + this.room.wallHeight;
            offset.y = 0;//focus.y + this.room.box.y + this.room.wallHeight + dimensions.infoHeight;
        
            //DOOR FRAME
            x1 = this.offset - constants.doorWidth/2 - constants.doorFrameThickness;
            y1 = -focus.x;
            x4 = this.offset + constants.doorWidth/2 + constants.doorFrameThickness;
            y4 = -focus.x;
            y2 = y1 - constants.doorHeight - constants.doorFrameThickness;
            x2 = trig.cotangent(trig.pointToAngle(y1,x1)) * y2;
            y3 = y4 - constants.doorHeight - constants.doorFrameThickness;
            x3 = trig.cotangent(trig.pointToAngle(y4,x4)) * y3;
            this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,palette.doorFrame,"#000",constants.lineThickness));
        
        
            //DOOR
            x1 = this.offset - constants.doorWidth / 2;
            y1 = -focus.x;
            x4 = this.offset + constants.doorWidth / 2;
            y4 = -focus.x;
            dy2 = y1 - constants.doorHeight;
            dx2 = trig.cotangent(trig.pointToAngle(y1,x1)) * dy2;
            dy3 = y4 - constants.doorHeight;
            dx3 = trig.cotangent(trig.pointToAngle(y4,x4)) * dy3;
            
            this.opened = 1;
            portalTo = level.findNeighbor(room, this.wall);
            if(portalTo){
                this.opened = portalTo.opened;
                if(!this.opened){
                    this.lock = portalTo.lock;
                    this.color = regionColor(portalTo.region);
                }
            }
            
            this.elements.push(game.screen.drawPoly(x1,y1,dx2,dy2,dx3,dy3,x4,y4,offset.x,offset.y,"#000",constants.lineThickness));
            this.elements.push(game.screen.drawPoly(x1+10,y1,dx2+10,dy2,dx3-10,dy3,x4-10,y4,offset.x,offset.y,this.atmosphere,constants.lineThickness));

            //THRESHOLD
            x1 = this.offset - constants.doorWidth/2 ;
            y1 = -focus.x + constants.lineThickness - 3;
            x4 = this.offset + constants.doorWidth/2;
            y4 = -focus.x + constants.lineThickness - 3;
            y2 = y1 - constants.thresholdDepth;
            if (x1 > 0){
                x2 = trig.cotangent(trig.pointToAngle(y1,x1)) * y2;        
            }else {
                x2 = x1 - ((trig.cotangent(trig.pointToAngle(y1,x1)) * y2)-x1)/3;
            }
            
            y3 = y4 - constants.thresholdDepth;
            if (x4 < 0){
                x3 = trig.cotangent(trig.pointToAngle(y4,x4)) * y3;      
            }else {
                x3 = x4 - ((trig.cotangent(trig.pointToAngle(y4,x4)) * y3)-x4)/3;
            }
            this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"90-" +this.room.palette.floorColor+ ":5-#000:95","#000",0));                
        
            
            if (!this.opened){
                //DOOR
        
                x1 = this.offset - constants.doorWidth / 2;
                y1 = -focus.x - constants.doorFrameThickness;
                x4 = this.offset + constants.doorWidth / 2;
                y4 = -focus.x - constants.doorFrameThickness;
                dy2 = y1 - constants.doorHeight + constants.doorFrameThickness ;
                dx2 = trig.cotangent(trig.pointToAngle(y1,x1)) * dy2;
                dy3 = y4 - constants.doorHeight + constants.doorFrameThickness;
                dx3 = trig.cotangent(trig.pointToAngle(y4,x4)) * dy3;
                this.elements.push(game.screen.drawPoly(x1,y1,dx2,dy2,dx3,dy3,x4,y4,offset.x,offset.y,this.color,constants.lineThickness));

                
                //KEYHOLE
                x0 = this.offset;
                y0 = -focus.x;
                
                y1 = -focus.x - constants.doorHeight/5;
                x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1) - constants.doorWidth/12;
                
                y4 = -focus.x - constants.doorHeight/5;
                x4 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1) + constants.doorWidth/12;
        
                y2 = y1 - 16;
                x2 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y2) -1 ;        
                y3 = y4 - 16;
                x3 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y3) +1; 
        
                this.elements.push(game.screen.drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"#000","#000",0));
                
                this.elements.push(game.screen.drawEllipse( (trig.cotangent(trig.pointToAngle(y0,x0)) * y3), y3, 8, 4,offset.x,offset.y,"#000","#000",0));
        
                
            }
        
            if(this.room.barred || this.forceBars){
                
                bars = 5;
            
                for(i=1;i<bars; i++){
                    x0 = (this.offset - constants.doorWidth/2) + (constants.doorWidth/bars) * i;
                    y0 = -focus.x - constants.doorFrameThickness //-this.room.box.width/2;
                    y1 = y0-constants.doorHeight + constants.doorFrameThickness;
                    x1 = (trig.cotangent(trig.pointToAngle(y0,x0)) * y1);                    
                    
                    this.elements.push(game.screen.drawLine(x0, y0, x1, y1, "#000", constants.lineThickness*3));
                    this.elements.push(game.screen.drawLine(x0, y0, x1, y1, palette.doorBarColor, constants.lineThickness));
                 
                }
                this.elements.push(game.screen.drawLine(dx2, dy2, dx3, dy3, "#000", constants.lineThickness));
              
            }
            t = ""
            switch (this.wall){
                case NORTH:
                    t = "t" + Math.round(focus.x + this.room.box.x) + "," + Math.round(focus.y + this.room.box.y + dimensions.infoHeight);
                    break;
                case SOUTH:
                    t = "r180,0,0t" + Math.round(focus.x + this.room.box.x) *-1+ "," + Math.round(-focus.y + this.room.box.y + this.room.box.height + dimensions.infoHeight) *-1;
                    break;
                case EAST:
                    t = "r90,0,0t" + Math.round(focus.x + this.room.box.y + dimensions.infoHeight) + "," + Math.round(-focus.y + this.room.box.x + this.room.box.width) * -1;
                    break;
                case WEST:
                    t = "r270,0,0t" + Math.round(focus.x + this.room.box.y + dimensions.infoHeight) * -1 + "," + Math.round(focus.y + this.room.box.x);
                    break;
            }      
            this.elements.forEach((element)=>{
                element.transform(t)
            })
            
            if (game.debug && this.box ){
                this.box.render("#0FF");
            }
            if (game.debug && this.trip ){
                this.trip.render("#F00");
            }
        
        }
    }

    door.stabilize=function(){
        switch(this.wall){
            case NORTH:
                this.box = newBox(
                    room.box.x + room.box.width / 2 + this.offset - constants.doorWidth/2,
                    room.box.y - room.wallHeight,
                    constants.doorWidth,
                    room.wallHeight + game.player.box.height * 1.25
                );
                this.trip = newBox(
                    room.box.x + room.box.width / 2 + this.offset - constants.doorWidth/2,
                    room.box.y - game.player.box.height - 25,
                    constants.doorWidth,
                    game.player.box.height  
                );
                break;
            case EAST:
                this.box = newBox(
                    room.box.x + room.box.width - game.player.box.width * 1.25,
                    room.box.y + room.box.height / 2 + this.offset - constants.doorWidth/2,
                    room.wallHeight + game.player.box.width * 1.25,
                    constants.doorWidth
                );
                this.trip = newBox(
                    room.box.x + room.box.width + 35,
                    room.box.y + room.box.height / 2 + this.offset - constants.doorWidth/2,
                    game.player.box.width,
                    constants.doorWidth
                );
                break;
            case SOUTH:
                this.box = newBox(
                    room.box.x + room.box.width / 2 - this.offset - constants.doorWidth/2,
                    room.box.y + room.box.height - room.wallHeight,
                    constants.doorWidth,
                    room.wallHeight + game.player.box.height * 1.25
                );
                this.trip = newBox(
                    room.box.x + room.box.width / 2 - this.offset - constants.doorWidth/2,
                    room.box.y + room.box.height + 35,
                    constants.doorWidth,
                    game.player.box.height  
                );
                break;
            case WEST:
                this.box = newBox(
                    room.box.x - room.wallHeight,
                    room.box.y + room.box.height / 2 - this.offset - constants.doorWidth/2,
                    room.wallHeight + game.player.box.width * 1.25,
                    constants.doorWidth
                );
                this.trip = newBox(
                    room.box.x - room.wallHeight,
                    room.box.y + room.box.height / 2 - this.offset - constants.doorWidth/2,
                    game.player.box.width,
                    constants.doorWidth
                );
                break;
            default:
                console.warn({"unexpected wall": wall});  
        }
    }

    return door
}

function getEntranceLocation(room, wall){
    wall = wall % 4
    var door = room.findDoor(wall);
    var loc = {x:0, y:0};
    switch (wall){
        case NORTH:
            return {
                x : game.player.box.x,//room.box.x + room.wallHeight + door.offset + room.box.width/2,
                y : room.box.y - constants.doorHeight + constants.doorFrameThickness + game.player.box.height
            };
        case EAST: 
            return {
                x : room.box.x + room.box.width - game.player.box.width, 
                y : game.player.box.y//room.box.y + room.wallHeight - constants.doorHeight/2
            };
        
        case SOUTH:
            return {
                x : game.player.box.x,//room.box.x + room.wallHeight + door.offset + room.box.width/2,
                y : room.box.y + room.box.height - game.player.box.height/2
            };
        case WEST: 
            return {
                x : room.box.x + game.player.box.width/2,
                y : game.player.box.y//room.box.y + room.wallHeight - constants.doorHeight/2
            };
        
        default:
            console.warn("unexpected wall: " + wall)
            return {x:0, y:0};
    }
}

function gameLoop(lastTime){
    var startTime = Date.now();
    var deltaT = Math.round(startTime-lastTime);
    if(deltaT>1000) deltaT == 1000;
    if(game.state == RUNNING){
            
        if(game.level){
            game.level.statistics.timeSpent+=deltaT;
        }

        //console.log(deltaT);
        //Move objects and collected the dead ones.
        var deadObjects = [];
        game.currentRoom.objects.forEach((o)=>{
            if(o.state != DYING || o.state != DEAD){
                o.move(deltaT);
            }
            if(o.state == DEAD ){
                deadObjects.push(o);
            }
        });
        
        barred = 0;
        game.currentRoom.objects.forEach((o)=>{
            if(o.team == DUNGEON && o.state != DYING && o.state != DEAD){
                barred = 1;
            }
        });
        if(game.currentRoom.barred!=barred){
            if(barred){
                sfx.roomBarred()
            }else{
                sfx.roomOpened()    
            }
            game.currentRoom.barred = barred;

            game.currentRoom.doors.forEach((d)=>{d.render();});
        }

        //Sort List of objects in current room by their y values.
        game.currentRoom.objects.sort((a,b)=>{return a.layer < b.layer ? -1 : a.layer > b.layer ? 1 : a.box.y < b.box.y ? -1 : a.box.y > b.box.y ? 1 : 0;})

        //Render all objects in current room in order.  
        game.currentRoom.objects.forEach((o)=>o.render(deltaT));
        
        //remove the dead objects.
        deadObjects.forEach((o)=>{
            if(o!=game.player){
                game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(o),1)
            }
            o.remove();
        });

        
    }

    if(game.level){
        renderInfo();
        
    }
    //Render our controller
    game.player.controller.render();//TODO: find a better way to reference this. 
    
    window.setTimeout(()=>gameLoop(startTime),0);
}

function openNextRoom(direction){
    if(game.currentRoom.findDoor(direction)){
        nextRoom = game.level.findNeighbor(game.currentRoom, direction);
        if(nextRoom.opened){
            nextRoom.visited = 1;
            nextRoom.objects.push(game.player);
            game.currentRoom.objects.splice(game.currentRoom.objects.indexOf(game.player),1);
            game.currentRoom = nextRoom;
            loc = getEntranceLocation(nextRoom,(direction + 2) % 4)
            game.player.box.x = loc.x;
            game.player.box.y = loc.y;
            game.player.sprite._lastLocation.x = loc.x;
            game.player.sprite._lastLocation.y = loc.y;
        }
        clearScreen();
        game.currentRoom.render();
    }
}

function renderInfo(){
    if(!game.infoElements){
        game.infoElements = {};
        game.infoElements.hearts = [];
        game.infoElements.keys = [];
        for(var i=0; i<constants.maxHeartContainers; i++){
            heart = newSprite(game.screen,images.heartContainer,32,128,32,32, i * 36 + 8,-dimensions.infoHeight + 8)
            game.infoElements.hearts.push(heart);
        }
        for(var i=0; i<5; i++){
            game.infoElements.keys.push(newSprite(game.screen, images.keyIcons, 32, 192, 32, 32, i * 36 + 8, -dimensions.infoHeight + 48))
        }
        game.screen.circle(dimensions.width-20,64,10).attr({"fill":"#ffd700", "stroke":"#FFF", "stroke-width": 3});
        text = game.screen.text(dimensions.width-40,64,"1,000,000")
        text.attr({ "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "end"});
        game.infoElements.goldElement = text
        text = game.screen.text(dimensions.width/2,64,"Level 1-1")
        text.attr({ "font-size": "32px", "font-family": "monospace", "fill": "#FFF", "text-anchor": "middle"});
        game.infoElements.levelElement = text
        game.screen.onClear(()=>{game.infoElements=null});
    }
    game.infoElements.hearts.forEach((h, i)=>{
        if(((i + 1) * 10) > game.player.maxHealth){
            h.setAnimation(0,0);
        }else{
            if(((i + 1) * 10) <= game.player.health){
                h.setAnimation(0,3);
            } else if (((i + 1) * 10) - 5 <= game.player.health){
                h.setAnimation(0,2);
            }    else {
                h.setAnimation(0,1);
            }
        }
        h.render(0);
    })
    game.infoElements.keys.forEach((k, i)=>{
        if(game.player.keys.length>i){
            k.setAnimation(0,game.player.keys[i]);
        }else{
            k.setAnimation(0,NONE);
        }
        k.render(0);
    });
    
    game.infoElements.goldElement.attr("text",numberWithCommas(game.player.gold));
    game.infoElements.levelElement.attr("text","Level " + game.level.world + "-" + ((game.level.number % 4) + 1));
}

sfx = {
    play: function(url){

    },
    walk: function(start){
        if(this.walkPlayer){
            if(start){
                this.walkPlayer.start();
            }else{
                this.walkPlayer.stop();    
            }
        }else if(start){    
            this.walkPlayer = new Tone.Player("mp3/footsteps.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.walkPlayer.autostart = true;
            this.walkPlayer.loop=true;
            this.walkPlayer.volume.value = -15;
        }
    },
    openChest: function(){
        if(this.chestPlayer){
            this.chestPlayer.start();
        }else{
            this.chestPlayer = new Tone.Player("mp3/chest.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.walkPlayer.volume.value = -10;
            this.chestPlayer.autostart = true;
        }
    },
    treasure: function(treasure){

        switch(treasure){
            case HEART:
            case HEARTCONTAINER:
                uri = "mp3/heart.mp3";
                break;
            case SILVERKEY:
            case GOLDKEY:
            case REDKEY:
            case GREENKEY:
            case BLUEKEY:
                uri = "mp3/key.mp3";
                break;
            default:
                uri = "mp3/gold.mp3";    
        }                
        if(this.treasurePlayer){
            this.treasurePlayer.stop();
            this.treasurePlayer.dispose();
        }
        this.treasurePlayer = new Tone.Player(uri).toDestination();
        // play as soon as the buffer is loaded
        this.treasurePlayer.autostart = true;
               
    },
    lowHealth: function(start){
        if (start && !this.lowHealthPlayer){
            uri = "mp3/heart.mp3"; 
            this.lowHealthPlayer = new Tone.Player(uri).toDestination();
            this.lowHealthPlayer.volume = 20;
            // play as soon as the buffer is loaded
            this.lowHealthPlayer.loop = true;
            this.lowHealthPlayer.autostart = true;
        }
        if(!start && this.lowHealthPlayer){
            this.lowHealthPlayer.stop();
            this.lowHealthPlayer.dispose();
            this.lowHealthPlayer=null;
        }
    },
    whip: function(){
        if(this.whipPlayer){
            this.whipPlayer.stop();
            this.whipPlayer.dispose();
        }
        url = "";
        switch(Math.round((Math.random()*2) % 3)){
            case 0:
                url="mp3/whip1.mp3";
                break;
            case 1:
                url="mp3/whip2.mp3";
                break;
            case 2:
                url="mp3/whip3.mp3";
                break;
        }        
        this.whipPlayer = new Tone.Player(url).toDestination();
        // play as soon as the buffer is loaded
        this.whipPlayer.autostart = true;
    },
    playerdeath: function(){
        if(this.deathPlayer){
            this.deathPlayer.stop();
            this.deathPlayer.dispose();
        }
        this.deathPlayer = new Tone.Player("mp3/playerdeath.mp3").toDestination();
        // play as soon as the buffer is loaded
        this.deathPlayer.autostart = true;
    },
    spiderbite: function(spider){
        if(spider.bitePlayer){
            spider.bitePlayer.start();
        } else {
            spider.bitePlayer = new Tone.Player("mp3/spiderbite.mp3").toDestination();
            // play as soon as the buffer is loaded
            spider.bitePlayer.autostart = true;    
        }
    },
    spiderwalk: function(spider, walk){
        if(spider.walkPlayer){
            if (walk){
                spider.walkPlayer.start();
            } else {
                spider.walkPlayer.stop();
            }
        } else if(walk){
            spider.walkPlayer = new Tone.Player("mp3/spiderwalk.mp3").toDestination();
            // play as soon as the buffer is loaded
            spider.walkPlayer.loop = true;
            spider.walkPlayer.volume.value = -15;
            spider.walkPlayer.autostart = true;    
        }
    },
    spiderDeath: function(){
        if(this.spiderDeathPlayer){
            this.spiderDeathPlayer.start();
        } else {
            this.spiderDeathPlayer = new Tone.Player("mp3/spiderdeath.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.spiderDeathPlayer.autostart = true;    
        }
    },
    skeletonwalk: function(skeleton, walk){
        if(skeleton.walkPlayer){
            if (walk){
                skeleton.walkPlayer.start();
            } else {
                skeleton.walkPlayer.stop();
            }
        } else if(walk){
            skeleton.walkPlayer = new Tone.Player("mp3/skeletonwalk.mp3").toDestination();
            // play as soon as the buffer is loaded
            skeleton.walkPlayer.loop = true;
            skeleton.walkPlayer.volume.value = -20;
            skeleton.walkPlayer.autostart = true;    
        }
    },
    skeletonattack: function(skeleton){
        if(skeleton.attackPlayer){
            skeleton.attackPlayer.start();
        } else {
            skeleton.attackPlayer = new Tone.Player("mp3/skeletonattack.mp3").toDestination();
            // play as soon as the buffer is loaded
            skeleton.attackPlayer.autostart = true;    
            skeleton.attackPlayer.volume.value = -20; 
        }
    },
    skeletonDeath: function(){
        if(this.skeletonDeathPlayer){
            this.skeletonDeathPlayer.start();
        } else {
            this.skeletonDeathPlayer = new Tone.Player("mp3/skeletondeath.mp3").toDestination();
            // play as soon as the buffer is loaded
            this.skeletonDeathPlayer.autostart = true;   
        }
    },
    roomBarred: function(){
        if(this.roomPlayer){
            this.roomPlayer.stop();
            this.roomPlayer.dispose();
        } 
        this.roomPlayer = new Tone.Player("mp3/roombarred.mp3").toDestination();
        this.roomPlayer.autostart = true;    
    },
    roomOpened:function(){
        if(this.roomPlayer){
            this.roomPlayer.stop();
            this.roomPlayer.dispose();
        } 
        this.roomPlayer = new Tone.Player("mp3/roomopen.mp3").toDestination();
        this.roomPlayer.autostart = true;    
    }
}

music = {
    initalized: false,
    init: function(){
        Tone.start();
        this.initalized == true;
    },
    synths:[],
    play: function(url, loop){
        if (this.player) {
            this.player.stop();
            this.player.dispose();
        }
        this.player = new Tone.Player(url).toDestination();
        // play as soon as the buffer is loaded
        this.player.loop = loop;
        this.player.autostart = true;
        this.player.volume.value = -20;
    },
    fadeOut: function(callback){
        if(this.player){
            if( this.player.volume.value>-50){
                this.player.volume.value-=7;
                setTimeout(()=>{music.fadeOut(callback)}, 75);
            }else {
                
                this.player.stop();
                if(callback){
                    callback();
                }
            }
        } else if (callback){
            callback()
        }
    },
    explore: function(){
        this.fadeOut(()=>{
            this.play("mp3/exploration.mp3", true)
        })
    },
    exitLevel: function(){
        this.fadeOut(()=>{
            this.play("mp3/exitLevel.mp3", true)
        })
    },
    death: function(){
        this.fadeOut(()=>{
            this.play("mp3/death.mp3", true)
        })
    },
    start: function(){
        this.fadeOut(()=>{
            this.play("mp3/start.mp3", false)
        })
    }
}

//images
images = {
    adventurer: [
        "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,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"
    ],
    caveSpider: [
        "data:image/png;base64,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"
        , "data:image/png;base64,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"
        , "data:image/png;base64,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" 
        , "data:image/png;base64,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"
    ],
    swordSkeleton: [
        "data:image/png;base64,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",
        "data:image/png;base64,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",
        "data:image/png;base64,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",
        "data:image/png;base64,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"
    ],
    starburst: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAZCAYAAADHXotLAAACC0lEQVRoQ+1aW47DMAhsztDr7uded8+QVaLQdRxgBuxU2dT9qdQ6Bs8DTNXpMV6nITDP87xsPk3TxAahF7IbjnV/CAxCAmrIgBXY/rHu/7Pp/TnTLvlYhwxCIvJ6w9pBSADks8FaUjk7xq1K1lXBYjW1I0MeIvtIuIf8d7Be7kg03EEIqSoWqAMZQfWKGGE8Ift7W/m1vT/XscR9hRySrYsoCfm+xeplDBe4BFjlYKfmaB2wJsQDYhMfTUgvsHbg1wkGwELTrwucACXxRcF1PoZDISn1/oE4LiE7pQlYStLyEQKpflQ9GAIrUMao/S2wQJwXNrWI2HJQlLESN+iQw6E0GwZAcklBykrE2eVv7V+TEogT2p+IAwkxG2GwIXrCcQ9lKIkV4iH/i5NOEWKSElASAlAlpQMZ6oXBKosN56GcQpyHJuRASkPyFjm9Lw5UeSRAQmLqSTpNiHWVjDbyEBlnlkUhYnFLB1Le7pB6Qu89sdczzspFx2kaXlWXeA2ud0uuMiBaQqYdwto2u+51oAIU7bPm/QvX7UjvSQhK0iH+EoSU5bBWjvcdOrda27efLyTOwTkJl5juk59KtBnOiHMZQlAvWg6N1sD+5E3eUiJ7EIJId9x4CUJYpWfXsf2OXefe3hjSByG8uzJOjPQ6tPb2DskCzJZHBLDmau+Z2xOSLXPsc01lTvnP1i+NE/4l1frFKQAAAABJRU5ErkJggg=="
    ],
    heartContainer: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAABACAYAAAATffeWAAABEklEQVRYR+2WURLCMAhEwyH1kh4yTqK0GwLb1DqjH/SzwDYl8EDKxUcuxpcUKJmDkjloffRnvVBrrdreIjKcLrJtTuhgRZitC6gDftUGebb2TrxgPcGSjTkx3G1xKfAq5bN5QP+pkGwF2puwH3PLNRLxTjp1Y/Q70Xu3na0zy1HIA9YLmBcKlJXbWep5vOqOMWDFd3nwAAjddjj1Xz7kAQZrklTEq4upnT2BJnQPyJ0CgAAsEi+RXhIpD6yIFVjiAYqgwCkeqIgKfMSDJtIEkgd70Qwoe0NlGCyMB55t2A8YDygr9IoiHkQ7wgabFBj3g9VEIq2nwXIkYlHvjrZIxJsT4X5gRaIhQ/cDFWET6vf7wRNfy3oImG3W6QAAAABJRU5ErkJggg=="
    ], 
    keyIcons: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAABgCAYAAAAU0fKgAAABjklEQVRYR+1YQQ6DMAwLz9kv+vT+Ys/ZBCWQNoY0BAmQ2JEuxnZSL9pAwc8QrKcXgF4P6PVgvEc3vws5599IM6W0yRQecGGbFQhIAchiLkDPGLwCsCij83MBRlohCawrZKJ03vLEnMQHAnjM2x2knhGGAG2h28T7Sfh9acqD4bOdXDAPuLD1BAEpAFnMBegZ7IJFGZ1XDMIAI62QBNYVMlE6b0ky8+CBAB7zdgepZ4S78sBt4v0kZCp5kHY2GbwfzIUqXAGQ3g9EMb+ZmSA29c+7QRlJOhdg2g8iEpb9IGJitR8cbWPLxD0H1wHIDkgvuiWEAdR+4O1CmEEYoJVAueQBJed+sBTqQFDXXwcKv1W+GT2bwWsAizI4PxmgBEIx7pCE9RatIPVMd5hYB8LBNrZM3HNwHYDsgGEe/nkPA+hAcHYhzCAMoANhnkjn/wdE5Y8H/dFAYMGQxVyAnhX4BoC/uEVZn58NMAWC0O+WsNyiiIlVIBxtY8vEPQfXAfRPIM4DxwhvAKhA8HbhAgl/oMsEcHnMNhUAAAAASUVORK5CYII="
    ],
    chest: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAACACAYAAABqZmsaAAACX0lEQVR4Xu2bO07EMBCGNyUd0rZ0VFyAnvNwHs5DzwWo6GhXoqMMchRHtnfG83K0kfi3irTz+P2N10nG3ul048904/wnCAABEAABicA8aKFi8/QEzK8vZzb/2/ul+k5hS+biBMwP57vu4L8vv9X3SvurfJSA7shzVguBxqfK2QoQR56DWQk0flveKwG9WpbMPQSS/+pHClChj5SAKkVJQI0/BfKWoPBdclcCtPgLlFtVHL5+AW39swqtiHIeVAQsq978WVtPTxbvxTZGIAnISfN1mIAlAEXA4h8mQAEPC5DW8zLp//4Z7rUOpLjq5XiPe8EiQDsPvHNg9Tvm3fAYJTAvqD4HtgS+cAEv6bE8EFrnCgEgAAIgAAIgAAIgQLZouNdv3SMGb5Ve3Ya1aCJihvQHIgJWX/QHYgTQH/C+Hbfd0kP1CY/xcor+gLHVZu4V9+4FyxwYsMRqQqA/sFHCExEIgAAIgAAIgAAIgAAIgAAIgAAIgICXANfIMMczO6wv9jNzmM0cj3LYu01T5SQFaBtVmmZQadM2qLYzfU2g5TDT6F0TardEFPD8eL9o+/j6OeVr7ahLn3RtEbC1bBOFUoQ2ebIr/bjkHAFWgJaCdvQmAdpStOXq4e8JCJVBi98lQCqDBb9JgOWXkG0l/JKAqgyWX0C27c3+bCOt3eoTlpxAavUrbUUBnpETPmyenoDw6LOQHgVOwND7gXUlHJpcmpA4P1DtnA6a8dowsd1z/L+A4qx9lmTPkGj3jVNy79nywtc/B1IQnB/wEhA3r7XzwDsH8P8CsQTadTRot90C/gBLxNqQAb9CEwAAAABJRU5ErkJggg=="
    ],
    treasure: [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAADqCAYAAACvDxUjAAAGjklEQVR4Xu2bsW4cRwyG5yojtQAHSCO1cpcmlY2oyFOkyhukc2upVZeXCJB3SCHArtKki1pdG0B1oGoCcoezJIfD4azOgS6+BYSTtLvfcTjkP9xd7i4daNsdiJNOoLEnTz46+WjsgfERpzg6nI9yQXV9OnI2Ah4eHpBzcXFBpjXneaBMAA0qQHFuD4QQ+Lm7u0vX19doCXxeXV2hZRpmgSoETirbTfn8AJ8A1zATRN/sgZilyOgOjWDW0DTEA8G+TDAeRRZkBEIY+QQ+2VCnpp8MyWAFA5nuGAUkWvUcEKUEWrIVVCOaxkaRXXwUHhrOFt/IydMgLRovb2hkYRly2Ec1EA1d3CxsNSjLL5tBGE/57/fI2b2+JfBUimQCpMcCOBPAmEIi5PE2ffrzVXr34xNa8vHXV+ntt08pnb0n6yrMFDaC7C6ru4VC5vvUwEwQfbMHYpb6Ckkwa2gaMhK2XH3CAsqCjEA1MNEnMP2rz6amvwajAk2lCM+O/ByQUMitoDWiya4S2cVH4aHhbPENo3l1dhyk5ePlDY0sLMkbHtoRKORSQaZUK0ijHPJryALQoAKMKSScDD9Qh9C6C59QDAJIw+waskBqBZmSrCENmF1Dlm/2QMzSQQ1ZYNbQNGQkbJl8wlPGgoxANTCXwm9xdNm2KaQCTaWIUMjngGQNKYcWtihTJJNZ9HfxURwkK8jVydMgrZBbffT5hkYWliGHfXQEConCJCVyKkVyBdgSGVNIhIwl0q8hK2RNd6GQqL+r3naFLaNIA8QDrcLkK2SF+RLpDo3ib7XMlsiQs1cY/NZK5NT0rzAJmkoRoZDKoimQUMitoDWibYkMW7TMFt8onpbPCZAvkRMgX/0nQHpoUiLDoGNQyFYip1IkL8oGmymRoaQtkKFEDhSylUipkFIiHYVsJdIAVcUbKGRMIoMKWWGmRIacLRWylcip6WcwIZFTKSIVUlo0BZIKuRHEItqUyLBFeb0eIpCQyBmQK5EzIFciZ0CuRIZBB1NIPvX627v7mgNzXo/d7URiZ2efWOzEgTRvBZY4RO3rfhtpDxyPD1TY1uwjq4HGLYED6WQlZvVKu3L3+/2H8/PzBLAeiH+zjs4wqHui3jGy6EhBMCwwnTsbUwLiZL/fw46hozUEii8e2SGYBbHKOBfWg1ig7jA9SA/UwEYQDyRgfHZmqlqxplHWK0lpgtaUTXXU8PFz19kM9AIUcs9i9Dxn1Jri+dTZ1yokHPgHG9d3kEtFw3v7GoWkA+Fk2Aio/+YT8RfIabG6KiQHcas8cXJBYVVLKf1PQTAs2Liza4Le7HbpTcBJGmIq5AhmQboK2YP1IK5CapgHGSokwUaQkEICjM/OcStkIJLaQyKaHQIfH0hdbvU7Or2hyYeaj7f0wHfuEoKesGtP956MWvTFkvWRKhZe+X6tuS3YNGjmobhr0RyoPE3HrL5cKn4a2gxokV4GI4f3IGMZuU/YXEHblue0dO5BAjKUrHTQ8SVteHi9oWknNyk3/AfGUOnu6ZlTun7cO1oV8un3X0zO2x9+xv9rWHvdXxpwXOcY2tSArDYYDY321pg9NaN8687aTIPOMGk5zMv8EajKyQhyAi0q6anjf+KjtTWPddXNtui1rXksR6aXo7KWIYJWEmrVswrSkWafVpF+W3V49YgskL2VJFT6yY46vpqsOs2trVD6ZYlkWRdh0+nN61t8Nv79/dJ9qI8pVLz0qbWQLmF0jQQg3nXHO+4WkGx3FTd2YR+scSWqm320xgmLoDtVbJCwZwuIuleb/aUHsOujm8uUfoKbLMVv+m+0hHVsmjeadPehDioreT9rNTId1RGpDUNHevQFg2qSP8dHIrW2ghBCqQMRvgXUQPSNqMhUm5DZgOxCZkAuJAoaQiwQxAWfgBBEg/AkdmkQhpgg0mAdJ847SjjbYhigjO++eUr5jQy2EcT0kfeaghdojWPr+w/FMuvazALWVUS/RMEvH7zedV5E1Hshqj70Hvw2RtUFMlJLR3wUehoTAVnHWPVRV3a6C2TzGsyGPn+oi3J9j4bZWvwYqtiw3oIenfxPO9rdV7VVvIGZ99iguyN/bYB+q33oQ1DzHoQ1C9Yl1/AGAq4U5e4DQFn11r2lId56ImeDg6lWRBB7D4mrwpprVLWym5l0ogVCyVlebEKGyH6csiCo+K6ts6EUxjo6CPoCLaK4Ezd8vVnTC4KZIvwahMfRlnu14kIH4mikoF59NCVs/wIGW4UVw6CISAAAAABJRU5ErkJggg=="
    ],
    torch: [
        "data:image/png;base64,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"
    ],
    floorSpikes:[
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAABLCAYAAABdj0rQAAAEnklEQVR4Xu2dbY6zMBCD4WbcrH1vxs1Y0bft8pE0UrOeQTPPSvsr6qQxCY7tFMaBPxAAgbAIjGFHxsBAAASG1wK/D8Ow/tf+lO3K2ut4PtWn7/IVV+KirM31PlzPdYGvgN+GYfhXWeTKdmXt18WujY2+yzd1JS7K2lzvwhqGwdm5lDhcybLK2jB4gcFRKiAAAkERqJls3GXRplsElPNBWTs9o5cWODoJbXpc3CqPhrkmnmsw+J6pYRN2LqF2LuTgQbUXwwKBFQFcdFx0XPRfBJQ7OGXtqtdADk7+f1zgSl2srE0OTg5+IiuXu+rzW9A3el+u99HgSDUQCIwALjoueisrVrezkxHuZMjB9waLKu9FH5a9DjQ5ObipboZNhGxS2QmDuRBzNHhg/cXQQIAcnBycHJwcXPZ7cTSYWIMVfuMP5okwh8FhcBg8OIMjVEAABIIiQA5ODq7OuVv1cdGNXXQ0WiKNxjP5Yj+LEAaHwVsMq26HwY0ZPKgaYVggkA8BDrrku+aMOBECxGTEZMRkwWOy+zzPt2maqi8+ELbTd8XQA/Pim3Z65kvPZx8+RMc16flsV98wOAwOgwdn8ESKhKGCQC4EiMmIydQxWKs+MZlxTOamFzp1TpdWoW88mMM6U64DZe3dOoDBYfAWw6rbYXBjBs8lUhgtCARGABcdFx0XPbiLbqYHSg8f6MgW0dzfnV3geic6ewCDw+AweHAGD6xAGBoI5EYAFx0XXe2St+rjohu76Gi0RBqN/D92/g+Dw+AthlW3w+DGDJ5btDB6EAiEAC46LjouenAXHc2N5t4ucuV8UNZunYtI2TcMDoPD4MEZPJDiYCggAAJbBHDRcdHVLnmrPi66sYueUquQB8fOg7P+DgIGh8FbDKtuh8GNGdxUxCzLsozjWH0+u7JdWXsF8VP9rH2bTi46G9xffDDP8zJNU/V7KNuVtde59al+1r49b2wZ1/tjYXmCnnWiM+7yclPi4jnPnx7AKkdqfxKpsi5wTDUOunDQRbsO7suy3MZxrL5cRNV+uYMuhbvs7s72x+3K2idz6vDd6VtoLlVoUsKSm74+1Xfp212DHy+EcouGLi57HZ6YO2+bw8vy4gL3BN1zstG3vS72xNxznltp8tICR5OjydHkQTS5+0GXP9bULd27a6fv9zo29QMO+wQXbfr8DuH7dtfgnls0+rbfkjtvi8Nr7uMAycE5ZHOa9Mobn7J2y0R1vrm47BbIwb97ecBjq9/x0oaez9L3d9fMFXNVzv2SGrX65OAbQ81Yk5vq3qtm8IU9s5LplLVP/s8VvAZ3DU4O/h8Bz62rZ9/O2+bwmpwcfHOJPSc6facz/Ex2E+Tgv/PKVaN16Hk0OZr8eHd8n30nB9//Ft1MFxvr/cvk/8aa+5K62DKDd9fgbE3tt6aemKO5bWU/OTg5ODn4EwHxzcdEc5cOuqA9OXu+nRfK+aCs3fIiXPsmB6/fRZW6WFn7pP+umkUb+wEuTGapeyubcJdxu2twcnBycK+HbtqqYZ/eyMHJwTlkU1l7ETQ5OTg5uKs2zZr/W2ly9xycXPSNgItGy6pNs4z7B5MC1Nop4xmHAAAAAElFTkSuQmCC"
    ],
    logo: "data:image/png;base64,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"
}
game = newGame();
portrait = window.matchMedia("(orientation: landscape)");
portrait.addEventListener("change", onOrientationChange)
onOrientationChange(window.matchMedia("(orientation: landscape)"));
titleScreen ();
gameLoop(Date.now());

//drawMap(game.screen,game.level);



//exitLevel();