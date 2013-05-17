
//following http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var pixelSize = 16;
var width = 32;
var height = width;
var maxBadness = 360; //number of frames it takes for badness to capture a cell.
var numMines = 13;

//colors: http://colorschemedesigner.com/#5631Tw0w0w0w0
var purple1 = "#c50080";
var purple2 = "#800053";  

var green1 = "#25d500";
var green2 = "#3DA028";
var green3 = "#59EA3A";

var yellow1 = "#FFF800";
var yellow2 = "#BFBC30";

canvas.width = width*pixelSize;
canvas.height = height*pixelSize;
document.body.appendChild(canvas);

//to integer	
var toInt = function (value) { return ~~value; }


var rnd = function (range) {
	return Math.floor(Math.random()*range);
}

if (typeof KeyEvent == "undefined") {
    var KeyEvent = {
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SPACE: 32,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40
    }
}

var player = {pos: {}};
player.pos.x = toInt(width / 2);
player.pos.y = toInt(height / 2);
player.moveDelay = 5;
player.moveTimer = 0;

var createGrid = function () {
	var grid = [];
	for (var i = 0; i < width; i ++) {
		grid[i] = [];
		for (var j = 0; j < height; j++) {
			grid[i][j] = 0;
		}
	}
	return grid;
}
	
var world = {};
world.wall = createGrid();
world.badness = createGrid();

var mines = [];

for (var x = 0; x < width; x++) {
	world.badness[x][height-1] = maxBadness;
}

var forEachCell = function(thing, func) {
	for (var i = 0; i < width; i ++) {
		for (var j = 0; j < height; j++) {
			func(thing, i, j);
		}
	}
}

forEachCell(world.wall, function(grid, x, y) {
	if (rnd(10) > 7) {
		grid[x][y] = 1;
	}
});

var mineAt = function (x, y) {
	var foundMine = null;
	mines.forEach(function (mine) {
		if (mine.pos.x === x && mine.pos.y === y) {
			foundMine = mine;
		}
	});
	return foundMine;
}

//create mines

for (var i = 0; i < numMines; i++) {
	var x = -1;
	var y = -1;
	while(x === -1) {
		var x = rnd(width);
		var y = rnd(height);
		if (world.wall[x][y] === 0 && mineAt(x, y) === null) {
			var mine = { pos: {}};
			mine.pos.x = x;
			mine.pos.y = y;
			mines.push(mine);
		} else {
			x = -1; //loop again
		}
	}	
}



// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

var drawPixel = function (x, y, color) {
	ctx.fillStyle = color;
	ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Draw everything
var render = function () {
	ctx.fillStyle = purple2;
	ctx.fillRect(0,0, width*pixelSize, height*pixelSize);
	
	forEachCell(world, function (world, x, y) {
		if (world.badness[x][y] >= maxBadness) {
			drawPixel(x, y, green2);
		} else if (world.badness[x][y] > 0) {
			drawPixel(x, y, green3);
		} else if (world.wall[x][y] > 0) {
			drawPixel(x, y, purple1);
		}
	});

	mines.forEach(function (mine) {
		drawPixel(mine.pos.x, mine.pos.y, yellow1);
	});

	drawPixel(player.pos.x, player.pos.y, green1);

	// Score
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica, Arial";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Goblins caught: " + 0, 32, 32);
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;
};

var update = function (delta) {
	updatePlayer();
	updateBadness();
}

var removeMine = function(mine) {
	var index = mines.indexOf(mine);
	mines.splice(index, 1);	
}

var updateBadness = function() {
	forEachCell(world.badness, function (badness, x, y) {
		if (badness[x][y] > 0) {
			if (badness[x][y] < maxBadness) {
				//spread faster onto empty cells
				if (world.wall[x][y] === 0) {
					badness[x][y]+= 3;
				} else {
					badness[x][y] += 1;
				}
			} else {
				if (badness[x][y-1] == 0) {
					badness[x][y-1] = 1;
					//destroy mines if present
					var mine = mineAt(x, y - 1);
					if (mine != null) {
						removeMine(mine);
					}
				}
			}
		}
	})
}

var updatePlayer = function() {
	if (player.moveTimer == 0) {
		var newPos = {};
		newPos.x = player.pos.x;
		newPos.y = player.pos.y;
		if (keysDown[KeyEvent.DOM_VK_LEFT] === true) {
			newPos.x--;
		} else if (keysDown[KeyEvent.DOM_VK_RIGHT] === true) {
			newPos.x++;
		} else if (keysDown[KeyEvent.DOM_VK_UP] === true) {
			newPos.y--;
		} else if (keysDown[KeyEvent.DOM_VK_DOWN] === true) {
			newPos.y++;
		} else {
			newPos = null;
		}	

		if (newPos != null) {
			if (world.wall[newPos.x][newPos.y] != 1) {
				player.pos = newPos;
				player.moveTimer = player.moveDelay;
			}
		}
	} else {
		player.moveTimer--;
	}	
}

var then = Date.now();
setInterval(main, 1000 / 60);
