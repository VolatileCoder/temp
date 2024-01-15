const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

const UP_ARROW = 38;
const DOWN_ARROW = 40;
const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

const PLAYERSTATE_IDLE = 0;
const PLAYERSTATE_WALKING = 1;
const PLAYERSTATE_WHIPPING = 2;

const game = {
    dimensions: {
        width: 900, 
        height: 1600,
        infoHeight: 250,
    },
    constants: {
        brickHeight: 16,
        brickWidth: 50,
        lineThickness: 3,
        doorWidth: 75,
        doorFrameThickness: 10,
        doorHeight: 38,
        thresholdDepth: 20,
        roomMinWidthInBricks: 5,
        roomMinHeightInBricks: 5,
        roomMaxWidthInBricks: 16,
        roomMaxHeightInBricks: 16, 
        spriteFamesPerSecond: 10,
    },
    palette: {
        doorFrame: "#928e85",
        doorDefaultColor: "#4d3737",
        doorBarColor: "#999"
    },
    controller: {
        up:0,
        left:0,
        down:0,
        right:0,
        buttonPressed:0
    }
};

function directionToDegress(direction){
    switch (direction){
        case NORTH:
            return 0;
        case EAST:
            return 90;
        case SOUTH: 
            return 180;
        case WEST:
            return 270;
        default:
            return 0;
    }
}

function newPlayer(){
    return {
        location :{
            x: Math.round(game.dimensions.width / 2),
            y: Math.round(game.dimensions.width / 2),
        },
        lastLocation: {x:0, y:0},
        dimensions: {
            width: 50,
            height:50,
        },
        direction: NORTH,
        hearts: 3.0,
        gold: 0,
        keys: 0,
        bombs: 0,   
        speed: 200,
        state: PLAYERSTATE_IDLE,
        stateStart: Date.now(),
        lastTrans:"",

        render: function(deltaT, state){
            if (!this.element){
                //this.element.remove();
                //this.element = drawRect(0, 0, this.dimensions.width, this.dimensions.height, "#FF0", "#000", game.constants.lineThickness);
                this.element = game.screen.image("img/ed/adventurer.png",0,0,400,150)
            }

            degrees = directionToDegress(this.direction);
            
            animdelta = Date.now() - this.stateStart;
            frame = 0;
            if(this.state != PLAYERSTATE_IDLE || animdelta%3000> (3000 - 1000 / game.constants.spriteFamesPerSecond * 9)){
                frame =Math.round((animdelta / 1000) * game.constants.spriteFamesPerSecond) % 8;
            } else {
                frame = 0;
                
            }

            //console.log({x:this.element.matrix.x(0,0),  y:this.element.attr("y")}); 
            trans0 = "t" + Math.round(this.lastLocation.x - frame * this.dimensions.width) + "," + (this.lastLocation.y  + game.dimensions.infoHeight - this.state *  this.dimensions.height) + "r"+degrees+","+(frame * this.dimensions.width + this.dimensions.width/2) + "," + ((this.dimensions.height/2 + this.state *  this.dimensions.height));
            
            trans =  "t" + (this.location.x - frame * this.dimensions.width) + "," + (this.location.y  + game.dimensions.infoHeight - this.state *  this.dimensions.height) + "r" + degrees + ","+ (frame * this.dimensions.width + this.dimensions.width/2) + "," + ((this.dimensions.height/2 + this.state *  this.dimensions.height));
            rect = "" + ( frame * this.dimensions.width) +  "," + this.state *  this.dimensions.height + "," + (this.dimensions.width) + "," + (this.dimensions.height);
            
            this.element.toFront();
            
            this.element.animate({transform:trans0,"clip-rect": rect},0,null,()=>{
                this.element.animate({transform:trans, "clip-rect": rect},deltaT,'linear');
                this.lastLocation = this.location;
            })
            
        }
    }
}


function clearScreen(){
    if (!game.screen){
        game.screen = Raphael("main", game.dimensions.width, game.dimensions.height);
        game.screen.setViewBox(0, 0, game.dimensions.width, game.dimensions.height, true);
        game.screen.canvas.setAttribute('preserveAspectRatio', 'meet');
        game.screen.canvas.style.backgroundColor = '#334';   
        game.screen.canvas.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space","preserve"); 
    }else{
        game.player.element = null;
        game.screen.clear();
    }
    game.screen.rect(0, 0, game.dimensions.width, game.dimensions.height).attr({"fill":"#000"});
}

function newLevel(){
    game.level = {
        number: 0,
        doorCount: 0,
        maxRooms: 10,
        rooms:[], 
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#048",    
        },
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
        }
    };
    generateMap(game.level);
    return game.level;
}

function generateMap(level){
    enterance = getRoom(0,0);
    var x = level.rooms.length;
    while(!level.rooms[level.rooms.length-1].mapped){
        loopRooms = []
        level.rooms.forEach((room)=>{
            if(!room.mapped){
                loopRooms.push(room);
            }
        })
        loopRooms.forEach((room)=>{
            room.mapped = 1;
            room.doors.forEach((door)=>{
                switch(door.wall){
                    case NORTH:
                        getRoom(room.x,room.y-1);
                        break;
                    case EAST:
                        getRoom(room.x+1,room.y);
                        break;
                    case SOUTH:
                        getRoom(room.x,room.y+1);
                        break;
                    case WEST:
                        getRoom(room.x-1,room.y);
                        break;
                        
                }
            })
        });
    }

    console.log({rooms:level.rooms.length});

    level.rooms[0].palette.floorColor="#064";
    //level.rooms[level.rooms.length-1].palette.floorColor="#800";
    level.rooms[level.rooms.length-1].opened = 0;
    level.rooms[level.rooms.length-1].exit = 1;
    

    var singleDoorRooms = [];
    level.rooms.forEach((room)=>{
        if(room.doors.length == 1 && room.opened == 1){
            singleDoorRooms.push(room);
        }
    })
    keyRoom = level.rooms[level.rooms.length-2];
    if (singleDoorRooms.length>0){
        index = Math.round((singleDoorRooms.length-1) * Math.random());
        keyRoom = singleDoorRooms[index]
    }
    //console.log(index);
    //console.log(singleDoorRooms);
    keyRoom.palette.floorColor = "#880";
    keyRoom.keys = 1;
}


function getRoom(x, y){
    foundRoom = game.level.findRoom(x,y);
    if(foundRoom) return foundRoom;
    return generateRoom(x, y);
}

function generateRoom(x, y){
    room = newRoom();
    room.x = x;
    room.y = y;
    room.palette.floorColor = game.level.palette.floorColor;
    room.palette.clipColor = game.level.palette.clipColor;
    room.palette.wallColor = game.level.palette.wallColor;
    
    room.width = Math.round((((game.constants.roomMaxWidthInBricks - game.constants.roomMinWidthInBricks) * Math.random()) + game.constants.roomMinWidthInBricks)) * game.constants.brickWidth;
    room.height = Math.round((((game.constants.roomMaxHeightInBricks - game.constants.roomMinHeightInBricks) * Math.random()) + game.constants.roomMinHeightInBricks)) * game.constants.brickWidth;
    
    //center by default
    room.left = Math.round((game.dimensions.width - room.width - room.wallHeight*2) / 2);
    room.top = Math.round((game.dimensions.width - room.height - room.wallHeight*2) / 2);

  //force doors
    for(wall = 0; wall<4; wall++){
        oppositeWall = (wall + 2) % 4;
        neighbor = game.level.findNeighbor(room, wall);

        if(neighbor){
            neighboringDoor = neighbor.findDoor(oppositeWall);
            if(neighboringDoor){
                //todo: resize room & calculate offset
                offset = 0;
                doorPadding = game.constants.doorFrameThickness + game.constants.doorWidth/2 + game.constants.brickWidth/2;
                switch (wall){
                    case NORTH:
                        doorX = (-neighboringDoor.offset + neighbor.width/2 + neighbor.left + neighbor.wallHeight);
                        roomCenter = room.left + room.wallHeight + room.width/2;
                        offset = doorX - roomCenter;

                        if ((roomCenter + offset) < (room.left + room.wallHeight + doorPadding)){
                            diff = ((room.left + room.wallHeight + doorPadding) - (roomCenter + offset));
                            newleft = room.left - diff
                            offset += diff;
                            room.left = newleft;
                        }
                        if ((roomCenter + offset) > (room.left + room.wallHeight + room.width - doorPadding)){
                            diff = (roomCenter + offset) -(room.left + room.wallHeight + room.width - doorPadding);
                            room.width +=diff;
                            roomCenter = room.left + room.wallHeight + room.width/2;
                            offset = doorX - roomCenter;
                        }
                        break;
                    case WEST: 
                        doorY = (neighboringDoor.offset + neighbor.height/2 + neighbor.top + neighbor.wallHeight);
                        roomCenter = room.top + room.wallHeight + room.height/2;
                        offset = doorY - roomCenter;

                        if ((roomCenter + offset) < (room.top + room.wallHeight + doorPadding)){
                            diff = ((room.top + room.wallHeight + doorPadding) - (roomCenter + offset));
                            newtop = room.top - diff
                            offset += diff;
                            room.top = newtop;
                        }
                        if ((roomCenter + offset) > (room.top + room.wallHeight + room.height - doorPadding)){
                            diff = (roomCenter + offset) -(room.top + room.wallHeight + room.height - doorPadding);
                            room.height +=diff;
                            roomCenter = room.top + room.wallHeight + room.height/2;                        
                            offset = doorY - roomCenter;
                        }
                        offset = offset *-1
                        break;
                    case SOUTH:
                        doorX = (neighboringDoor.offset + neighbor.width/2 + neighbor.left + neighbor.wallHeight);
                        roomCenter = room.left + room.wallHeight + room.width/2;
                        offset = doorX - roomCenter;

                        if ((roomCenter + offset) < (room.left + room.wallHeight + doorPadding)){
                            diff = ((room.left + room.wallHeight + doorPadding) - (roomCenter + offset));
                            newleft = room.left - diff
                            offset += diff;
                            room.left = newleft;
                        }
                        if ((roomCenter + offset) > (room.left + room.wallHeight + room.width - doorPadding)){
                            diff = (roomCenter + offset) -(room.left + room.wallHeight + room.width - doorPadding);
                            room.width +=diff;
                            roomCenter = room.left + room.wallHeight + room.width/2;
                            offset = doorX - roomCenter;
                        }
                        offset = offset *-1
                        break;
                    case EAST: 
                        doorY = (-neighboringDoor.offset + neighbor.height/2 + neighbor.top + neighbor.wallHeight);
                        roomCenter = room.top + room.wallHeight + room.height/2;
                        offset = doorY - roomCenter;
                        if ((roomCenter + offset) < (room.top + room.wallHeight + doorPadding)){
                            diff = ((room.top + room.wallHeight + doorPadding) - (roomCenter + offset));
                            newtop = room.top - diff
                            offset += diff;
                            room.top = newtop;
                        }
                        if ((roomCenter + offset) > (room.top + room.wallHeight + room.height - doorPadding)){
                            diff = (roomCenter + offset) -(room.top + room.wallHeight + room.height - doorPadding);
                            room.height +=diff;
                            roomCenter = room.top + room.wallHeight + room.height/2;
                            offset = doorY - roomCenter;    
                        }
                        break;
                }

                room.doors.push(newDoor(wall, offset, neighbor.opened, room.barred));    
            }
        }
    }
    do {
        for(wall = 0; wall<4; wall++){
            door = room.findDoor(wall)
            //add new door/room
            if(!door && game.level.findNeighbor(room, wall)==null && game.level.doorCount<game.level.maxRooms && Math.round(Math.random())==1){
                game.level.doorCount++;
                offset = 0;
                sideSize = wall % 2== 0 ? room.width : room.height;
                sideSize -= game.constants.brickWidth*2 
                sideSize -= Math.round(game.constants.doorWidth/2)
                offset = Math.round(Math.random() * sideSize) - (sideSize/2)
                opened = 1;
                room.doors.push(newDoor(wall, offset, opened, room.barred));
            }
        }
    } while (room.doors.length == 0 || room.doors.length == 1 && game.level.doorCount<game.level.maxRooms)
    
    //new doors
    game.level.rooms.push(room);
    return room;
}

function newRoom(){
    return { 
        x: 0,
        y: 0,
        opened:1,
        barred:0,
        mapped:0,
        top :10, 
        left: 100,
        wallHeight: game.constants.brickHeight * 3,
        width: 400,
        height: 600,
        doors:[],
        palette: {
            clipColor:"#642",
            wallColor: "#864",
            floorColor: "#048",    
        },
        render: function(){    
            //render clip area
            game.screen.rect(
                0, 
                game.dimensions.infoHeight, 
                game.dimensions.width, 
                game.dimensions.width
            ).attr({
                "fill":this.palette.clipColor
            });
            
            //render walls
            game.screen.rect(
                this.left,
                this.top + game.dimensions.infoHeight, 
                this.width + this.wallHeight * 2,
                this.height + this. wallHeight * 2
            ).attr({
                "fill": this.palette.wallColor,
                "stroke-width": game.constants.lineThickness
            })


            //render floor
            game.screen.rect(
                this.left + this.wallHeight,
                this.top + this.wallHeight + game.dimensions.infoHeight, 
                this.width, 
                this.height
            ).attr({
                fill: this.palette.floorColor,
                "stroke-width": game.constants.lineThickness
            })

            //render each wall
            renderBricks(this)

            //render doors
            this.doors.forEach((door)=>renderDoor(this, door));

            if(this.exit){
                //render exit
                centerX = this.left + this.wallHeight + this.width/2
                centerY = this.top + this.wallHeight + this.height/2 + game.dimensions.infoHeight

                exitWidth = game.constants.doorWidth;
                exitHeight = game.constants.brickWidth * 2;

                drawRect(centerX - (exitWidth + game.constants.doorFrameThickness*2)/2, centerY -  (exitHeight + game.constants.doorFrameThickness)/2,  (exitWidth + game.constants.doorFrameThickness*2),  (exitHeight + game.constants.doorFrameThickness), game.palette.doorFrame, "#000", game.constants.lineThickness);
                drawRect(centerX - exitWidth/2, (centerY - exitHeight/2)+game.constants.doorFrameThickness/2,  exitWidth,  exitHeight, "#000", "#000", game.constants.lineThickness);

                steps = 6;
                for(step = steps; step>0; step--){
                    stepWidth = exitWidth - step * 4;
                    stepThickness = game.constants.brickHeight+2 - step
                    drawRect(centerX - stepWidth/2, (centerY + exitHeight/2)+game.constants.doorFrameThickness/2-stepThickness*step,  stepWidth,  stepThickness, "#888", "#000", game.constants.lineThickness).attr({opacity:(steps-step)/steps});
                //break;
                }
            }
            
        },
        findDoor: function(wall){
            for(i = 0; i<this.doors.length;i++){
                if(this.doors[i].wall == wall){
                    return this.doors[i];
                }
            }
            return null;
        },
        constrainPlayer: function(x1,y1,x2,y2){
            constrained = {x:x1, y:y1};
            //game.player.dimensions
            constrained.x = constrain(this.left + this.wallHeight, x2, this.left + this.wallHeight + this.width - game.player.dimensions.width);
            constrained.y = constrain(this.top + this.wallHeight, y2, this.top + this.wallHeight + this.height - game.player.dimensions.height);
            
            this.doors.forEach((door)=>{
                switch(door.wall){
                    case NORTH:
                        doorCenter = this.left + this.wallHeight + this.width/2 + door.offset;
                        if (x2 > doorCenter - game.constants.doorWidth/2 && x2 + game.player.dimensions.width < doorCenter + game.constants.doorWidth/2 && y2<this.top+this.wallHeight){
                            constrained.x = x2;
                            constrained.y = y2;
                            if(y2<this.top+this.wallHeight-game.constants.doorHeight){
                                constrained.y = this.top+this.wallHeight-game.constants.doorHeight;
                                //alert("changeroom"); 
                            }
                        }
                        break;
                    case WEST:
                        doorCenter = this.top + this.wallHeight + this.height/2 - door.offset;
                        if (y2 > doorCenter - game.constants.doorWidth/2 && y2 + game.player.dimensions.height < doorCenter + game.constants.doorWidth/2 && x2<this.left+this.wallHeight){
                            constrained.x = x2;
                            constrained.y = y2;
                            if(x2<this.left+this.wallHeight-game.constants.doorHeight){
                                constrained.x = this.left+this.wallHeight-game.constants.doorHeight;
                                //alert("changeroom"); 
                            }
                        }
                        break;
                    case EAST:
                        doorCenter = this.top + this.wallHeight + this.height/2 + door.offset;
                        if (y2 > doorCenter - game.constants.doorWidth/2 && y2 + game.player.dimensions.height < doorCenter + game.constants.doorWidth/2 && x2+game.player.dimensions.width>this.left+this.wallHeight+this.width){
                            constrained.x = x2;
                            constrained.y = y2;
                            if(x2+game.player.dimensions.width>this.left+this.width+this.wallHeight+game.constants.doorHeight){
                                constrained.x = this.left+this.width+this.wallHeight+game.constants.doorHeight-game.player.dimensions.width;
                                //alert("changeroom"); 
                            }
                        }
                        break;
                    case SOUTH:
                        doorCenter = this.left + this.wallHeight + this.width/2 - door.offset;
                        if (x2 > doorCenter - game.constants.doorWidth/2 && x2 + game.player.dimensions.width < doorCenter + game.constants.doorWidth/2 && y2+game.player.dimensions.height>this.top+this.wallHeight+this.height){
                            constrained.x = x2;
                            constrained.y = y2;
                            
                            if(y2+game.player.dimensions.height>this.top+this.wallHeight+this.height+game.constants.doorHeight){
                                constrained.y = this.top+this.wallHeight+this.height+game.constants.doorHeight - game.player.dimensions.height;
                                //alert("changeroom"); 
                            }
                            
                        }
                        break;
                }
            });

            return constrained;
        }
    };
}

function renderBricks(room){
    color="#000";
    rows = room.height/game.constants.brickHeight;
    
    //NORTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.width / 2
    focus.y = cotangent(degreesToRadians(45)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.left + room.wallHeight;
    offset.y = focus.y + room.top + room.wallHeight + game.dimensions.infoHeight;
    
    //Draw NW Corner
    drawAngleSegmentX(degreesToRadians(225), -room.width/2-room.wallHeight, -room.width/2, offset.x, offset.y, color, game.constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=game.constants.brickHeight){
        y1 = -(room.width)/2 - room.wallHeight + y;
        y2 = y1 + game.constants.brickHeight
        column = 0;
    
        for(x = game.constants.brickWidth/2; x < room.width ; x += game.constants.brickWidth/2){
            angle = pointToAngle(room.width / 2, room.width / 2 - x);
            
            if(column % 2 == row % 2){
                drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, game.constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            drawLine(Math.round(cotangent(degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(cotangent(degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
        }
        row++;
    }
    
    //SOUTHERN WALL
    //determine focal point / offset
    focus={};
    focus.x =  room.width / 2
    focus.y = -cotangent(degreesToRadians(225)) * focus.x;
    
    offset={};
    offset.x = focus.x + room.left + room.wallHeight;
    offset.y = focus.y + room.top + room.height + room.wallHeight + game.dimensions.infoHeight;

    drawAngleSegmentX(degreesToRadians(225), room.width/2+room.wallHeight, room.width/2, offset.x, offset.y, color, game.constants.lineThickness);

    row = 1;
    for(y = 0; y<room.wallHeight; y+=game.constants.brickHeight){
        y1 = (room.width)/2 + room.wallHeight - y;
        y2 = y1 - game.constants.brickHeight
        column = 0;
    
        for(x = game.constants.brickWidth/2; x < room.width ; x += game.constants.brickWidth/2){
            angle = pointToAngle(room.width / 2, room.width / 2 - x);
            
            if(column % 2 == row % 2){
                drawAngleSegmentY(angle, y1, y2, offset.x, offset.y, color, game.constants.lineThickness);
                //break;
            }
            //break;
            column ++;
        }
        if(row>1){
            drawLine(Math.round(cotangent(degreesToRadians(225)) * y1)+offset.x, y1 + offset.y, Math.round(cotangent(degreesToRadians(315)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
        }
        row++;
    }


    //EASTERN WALL
    //determine focal point / offset
    focus={};
    focus.y = -room.height / 2
    focus.x = tangent(degreesToRadians(135)) * focus.y;
    
    offset={};
    offset.x = focus.x + room.left + room.wallHeight;
    offset.y = focus.y + room.top + room.height + room.wallHeight + game.dimensions.infoHeight;

    drawAngleSegmentY(degreesToRadians(135), room.height/2+room.wallHeight, room.height/2, offset.x, offset.y, color, game.constants.lineThickness);

    row = 0;
    for(x = 0; x<room.wallHeight; x+=game.constants.brickHeight){
        x1 = -room.height/2 - room.wallHeight + x;
        x2 = x1 + game.constants.brickHeight;
        column = 0;
        //drawLine(x1+ offset.x, 0, x2+offset.x, game.dimensions.height, "#FF0", game.constants.lineThickness);
    
        for(y = game.constants.brickWidth/2; y < room.height ; y += game.constants.brickWidth/2){
            angle = pointToAngle(-room.height / 2+y, -room.height / 2);
            
                if(column % 2 == row % 2){
                    drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, game.constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    drawLine(Math.round(cotangent(degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(cotangent(degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
            drawLine(x1 + offset.x, Math.round(tangent(degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(tangent(degreesToRadians(225))*x1)+offset.y, color, game.constants.lineThickness);
        
        }
        row++;
    }

    //WESTERN WALL
    //determine focal point / offset
    focus={};
    focus.y = -room.height / 2
    focus.x = tangent(degreesToRadians(225)) * focus.y;
    
    offset={};
    offset.x = focus.x + room.left + room.width + room.wallHeight;
    offset.y = focus.y + room.top + room.height + room.wallHeight + game.dimensions.infoHeight;

    drawAngleSegmentY(degreesToRadians(315), -room.height/2-room.wallHeight, -room.height/2, offset.x, offset.y, color, game.constants.lineThickness);
    
    row = 0;
    for(x = 0; x<room.wallHeight; x+=game.constants.brickHeight){
        x1 = room.height/2 + x;
        x2 = x1 + game.constants.brickHeight;
        column = 0;
        //drawLine(x1+ offset.x, 0, x2+offset.x, game.dimensions.height, "#FF0", game.constants.lineThickness);
    
        for(y = game.constants.brickWidth/2; y < room.height ; y += game.constants.brickWidth/2){
            angle = pointToAngle(-room.height / 2+y, -room.height / 2);
            
                if(column % 2 == row % 2){
                    drawAngleSegmentX(angle, x1, x2, offset.x, offset.y, color, game.constants.lineThickness);
                    //break;
                }
            //break;
            column ++;
        }
        if(row>0){
        //    drawLine(Math.round(cotangent(degreesToRadians(135)) * y1)+offset.x, y1 + offset.y, Math.round(cotangent(degreesToRadians(225)) * y1)+offset.x, y1+offset.y, color, game.constants.lineThickness);
            drawLine(x1 + offset.x, Math.round(tangent(degreesToRadians(135))*x1)+offset.y, x1 + offset.x, Math.round(tangent(degreesToRadians(225))*x1)+offset.y, color, game.constants.lineThickness);
        }
        row++;
    }

}

function newDoor(wall, offset, opened, barred){
    return {
        wall: wall % 4,
        color: game.palette.doorDefaultColor,
        offset: offset,
        opened: opened,
        barred: Boolean(barred),
    }
}

function renderDoor(room, door){

    elements = [];
    //draw door. 
    
    focus={};
    focus.x =  (door.wall == NORTH || door.wall == SOUTH ? room.width : room.height) / 2
    //focus.x = room.width /2
    focus.y = cotangent(degreesToRadians(45)) * focus.x;

    offset={};
    offset.x = 0//focus.x + room.left + room.wallHeight;
    offset.y = 0//focus.y + room.top + room.wallHeight + game.dimensions.infoHeight;
            
    game.screen.rect(offset.x,offset.y,1,1).attr({"stroke":"#fff"});

    //DOOR FRAME
    x1 = door.offset - game.constants.doorWidth/2 - game.constants.doorFrameThickness;
    y1 = -focus.x;
    x4 = door.offset + game.constants.doorWidth/2 + game.constants.doorFrameThickness;
    y4 = -focus.x;
    y2 = y1 - game.constants.doorHeight - game.constants.doorFrameThickness;
    x2 = cotangent(pointToAngle(y1,x1)) * y2;
    y3 = y4 - game.constants.doorHeight - game.constants.doorFrameThickness;
    x3 = cotangent(pointToAngle(y4,x4)) * y3;
    elements.push(drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,game.palette.doorFrame,"#000",game.constants.lineThickness));


    //DOOR
    x1 = door.offset - game.constants.doorWidth/2 ;
    y1 = -focus.x;
    x4 = door.offset + game.constants.doorWidth/2;
    y4 = -focus.x;
    dy2 = y1 - game.constants.doorHeight;
    dx2 = cotangent(pointToAngle(y1,x1)) * dy2;
    dy3 = y4 - game.constants.doorHeight;
    dx3 = cotangent(pointToAngle(y4,x4)) * dy3;
    door.opened = game.level.findNeighbor(room, door.wall).opened;
    elements.push(drawPoly(x1,y1,dx2,dy2,dx3,dy3,x4,y4,offset.x,offset.y,door.opened ? "#000" : door.color,"#000",game.constants.lineThickness));

    
    if (door.opened){
        //THRESHOLD

        x1 = door.offset - game.constants.doorWidth/2 ;
        y1 = -focus.x + game.constants.lineThickness;
        x4 = door.offset + game.constants.doorWidth/2;
        y4 = -focus.x + game.constants.lineThickness;
        y2 = y1 - game.constants.thresholdDepth;
        if (x1 > 0){
            x2 = cotangent(pointToAngle(y1,x1)) * y2;        
        }else {
            x2 = x1 - ((cotangent(pointToAngle(y1,x1)) * y2)-x1)/3;
        }
        
        y3 = y4 - game.constants.thresholdDepth;
        if (x4 < 0){
            x3 = cotangent(pointToAngle(y4,x4)) * y3;      
        }else {
            x3 = x4 - ((cotangent(pointToAngle(y4,x4)) * y3)-x4)/3;
        }
        elements.push(drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"90-" +room.palette.floorColor+ ":5-#000:95","#000",0));                
    } else {
        //KEYHOLE

        x0 = door.offset;
        y0 = -focus.x;
        
        y1 = -focus.x - game.constants.doorHeight/5;
        x1 = (cotangent(pointToAngle(y0,x0)) * y1) - game.constants.doorWidth/12;
        
        y4 = -focus.x - game.constants.doorHeight/5;
        x4 = (cotangent(pointToAngle(y0,x0)) * y1) + game.constants.doorWidth/12;

        y2 = y1 - 16;
        x2 = (cotangent(pointToAngle(y0,x0)) * y2) -1 ;        
        y3 = y4 - 16;
        x3 = (cotangent(pointToAngle(y0,x0)) * y3) +1; 

        elements.push(drawPoly(x1,y1,x2,y2,x3,y3,x4,y4,offset.x,offset.y,"#000","#000",0));
        
        elements.push(drawEllipse( (cotangent(pointToAngle(y0,x0)) * y3), y3, 8, 4,offset.x,offset.y,"#000","#000",0));

        
    }

    if(door.barred){
        
        bars = 5;
        for(i=1;i<5; i++){
            x0 = (door.offset - game.constants.doorWidth/2) + (game.constants.doorWidth/5) * i;
            y0 = -room.width/2;
            //game.screen.rect(x0+offset.x,y0+offset.y,1,1).attr({"stroke":"#f3f"});
            y1 = -room.width/2 - game.constants.doorHeight;
            x1 = (cotangent(pointToAngle(y0,x0)) * y1);                    
            //drawPoly(x0,y0,x0,y1,x1,y1,x1,y0,offset.x,offset.y,game.palette.doorBarColor, "#000",0)
            elements.push(drawLine(x0+offset.x, y0+offset.y, x1+offset.x, y1+offset.y, game.palette.doorBarColor, game.constants.lineThickness));
            elements.push(drawLine(dx2+offset.x, dy2+offset.y, dx3+offset.x, dy3+offset.y, "#000", game.constants.lineThickness));
        
        }
    }

    elements.forEach((element)=>{
        //t = "t" + Math.round(focus.x + room.left + room.wallHeight) + "," + Math.round(focus.y + room.top + room.wallHeight + game.dimensions.infoHeight);
        
        //element.transform(t)
        switch (door.wall){
            case NORTH:
                t = "t" + Math.round(focus.x + room.left + room.wallHeight) + "," + Math.round(focus.y + room.top + room.wallHeight + game.dimensions.infoHeight);
                element.transform(t)
                break;
            case SOUTH:
                t = "r180,0,0t" + Math.round(focus.x + room.left + room.wallHeight) *-1+ "," + Math.round(-focus.y + room.top + room.height + room.wallHeight + game.dimensions.infoHeight) *-1;
                element.transform(t)
                break;
            case EAST:
                t = "r90,0,0t" + Math.round(focus.x + room.top + room.wallHeight + game.dimensions.infoHeight) + "," + Math.round(-focus.y + room.left + room.width + room.wallHeight) * -1;
                element.transform(t)
                break;
            case WEST:
                t = "r270,0,0t" + Math.round(focus.x + room.top + room.wallHeight + game.dimensions.infoHeight) * -1 + "," + Math.round(focus.y + room.left + room.wallHeight);
                element.transform(t)
                break;
        } 
    })
}

function pointToAngle(opposite, adjacent){
    return Math.atan(opposite/adjacent);
}

function degreesToRadians(angle){
    return (angle % 360) / 360 * 2 * Math.PI
}

function cotangent(radians){
    return 1/Math.tan(radians);
}

function tangent(radians){
    return Math.tan(radians);
}

function drawAngleSegmentX(angle, startX, endX, translateX, translateY, color, thickness){
    startY = Math.round(tangent(angle) * startX);
    endY = Math.round(tangent(angle) * endX);
    startX+=translateX; endX += translateX;
    startY+=translateY; endY += translateY;
    drawLine(startX, startY, endX, endY, color, thickness);
}

function drawAngleSegmentY(angle, startY, endY, translateX, translateY, color, thickness){
    startX = Math.round(cotangent(angle) * startY);
    endX = Math.round(cotangent(angle) * endY);
    startX+=translateX; endX += translateX;
    startY+=translateY; endY += translateY;
    drawLine(startX, startY, endX, endY, color, thickness);
}


function drawLine(x1,y1,x2,y2,color,thickness){
    path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
    return game.screen.path(path).attr({"stroke-width": thickness, "stroke":color});
}

function drawRect(x,y,w,h,color,strokecolor, thickness){
    return game.screen.rect(x,y,w,h).attr({"stroke-width": thickness, "stroke":strokecolor, "fill": color});
}

function drawPoly(x1,y1,x2,y2,x3,y3,x4,y4, translateX, translateY, fillColor, strokeColor, thickness){
    path =  "M" + (x1 + translateX) + "," + (y1 + translateY) + "L" + (x2 + translateX) + "," + (y2 + translateY) + "L" + (x3 + translateX) + "," + (y3 + translateY) + "L" + (x4 + translateX) + "," + (y4 + translateY) + "Z";
    return game.screen.path(path).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
}

function drawEllipse(x1,y1,r1,r2, translateX, translateY, fillColor, strokeColor, thickness){
    return game.screen.ellipse(x1+translateX, y1+translateY, r1, r2).attr({"stroke-width": thickness, "stroke": strokeColor, "fill": fillColor});
}

function constrain (min, val, max){
    if (val<min) return min;
    if (val>max) return max;
    return val;
}

function gameLoop(lastTime){
    startTime = Date.now();
    deltaT = startTime-lastTime;
    
    //read controller
    x = game.controller.left *-1 + game.controller.right;
    y = game.controller.up*-1  + game.controller.down;
    multplier = 1;
    if(x!=0 && y!=0){
        multplier = 1/Math.sqrt(2);
    }else{
        if (y<0){
            game.player.direction=NORTH;
        }else if(x>0){
            game.player.direction=EAST;
        }else if(y>0){
            game.player.direction=SOUTH;
        }else if(x<0){
            game.player.direction=WEST;
        }
    }
    
    constrained = currentRoom.constrainPlayer(
        game.player.location.x, 
        game.player.location.y,
        game.player.location.x + Math.round(x * game.player.speed * multplier * deltaT/1000),
        game.player.location.y + Math.round(y * game.player.speed * multplier * deltaT/1000)
    )
    if (game.player.location.x != constrained.x || game.player.location.y != constrained.y){
        if (game.player.state!=PLAYERSTATE_WALKING){
            game.player.state = PLAYERSTATE_WALKING;
            game.player.stateStart = Date.now()
        }
        game.player.location.x = constrained.x;
        game.player.location.y = constrained.y;
    }
    else {
        if (game.player.state!=PLAYERSTATE_IDLE){
            game.player.state = PLAYERSTATE_IDLE;
            game.player.stateStart = Date.now()
        }
    }
    
    //game.player.location.x = constrain(currentRoom.left+currentRoom.wallHeight, game.player.location.x, currentRoom.left + currentRoom.width+);
    

    game.player.render(Math.round(deltaT));

    window.setTimeout(()=>gameLoop(startTime), 50);
}

window.onkeyup = function(e){

    switch (e.key){
        case "w":
        case "W":
            game.controller.up = 0;
            break;    
        case "s":
        case "S":
            game.controller.down = 0;
            break;
        case "a":
        case "A":
            game.controller.left = 0;
            break;
        case "d":
        case "D":
            game.controller.right = 0;
            break;
        default:
            return true;
    }
    e.handled= true;
    e.preventDefault();
    return false;
}

window.onkeydown = function(e){
    //TODO:move to controller

    switch (e.key){
        case "w":
        case "W":
            game.controller.up = 1;
            break;
        case "s":
        case "S":
            game.controller.down = 1;
            break;
        case "a":
        case "A":
            game.controller.left = 1;
            break;
        case "d":
        case "D":
            game.controller.right = 1;
            break;    
    }


    direction = null; 
    switch (e.keyCode){
        case UP_ARROW:
            direction = NORTH;
            break;
        case RIGHT_ARROW:
            direction = EAST;
            break;
        case DOWN_ARROW:
            direction = SOUTH;
            break;
        case LEFT_ARROW:
            direction = WEST;
            break;
        default:
            return true;
    }
    if(currentRoom.findDoor(direction)){
        nextRoom = game.level.findNeighbor(currentRoom, direction);

        if(nextRoom.opened){
            currentRoom = nextRoom;
            if (currentRoom.keys){
                currentRoom.keys=0;
                game.player.keys++;
            }
        }else if(game.player.keys>0){
            nextRoom.opened=1;
        }
        clearScreen();
        currentRoom.render();
    }
    e.handled= true;
    e.preventDefault();
    return false;
}
//layBricks();



game.player = newPlayer();
clearScreen();//init Screen
newLevel();
currentRoom = getRoom(0,0);
currentRoom.render();
gameLoop(Date.now());
