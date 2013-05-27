
//following http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var pixelSize = 16;
var width = 32;
var height = width;
var maxBadness = 120; //number of frames it takes for badness to capture a cell.
var numMines = 26;
var explosionRadius = 7;
var maxHealth = 120; //frames it takes to die when standing in goop
var maxExpansionAge = 90; //frames that an expansion keeps goop from returning

var expansions = []; //a list of mine expanders {pos {x, y}, age }

//colors: http://colorschemedesigner.com/#5631Tw0w0w0w0
var purple1 = "#c50080";
var purple2 = "#800053";
var purple3 = "#571C43";

var green1 = "#25d500";
var green2 = "#3DA028";
var green3 = "#59EA3A";

var yellow1 = "#FFF800";
var yellow2 = "#BFBC30";

canvas.width = width*pixelSize;
canvas.height = (height+2)*pixelSize;
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
player.health = maxHealth;

var createGrid = function () {
	var gridData = [];
	for (var i = 0; i < width; i ++) {
		gridData[i] = [];
		for (var j = 0; j < height; j++) {
			gridData[i][j] = 0;
		}
	}

	var grid = {};

	grid.isValid = function (x, y) {
		if (x < 0 || x >= width) {
			return false;
		}
		if (y < 0 || y >= height) {
			return false;	
		}
		return true;
	}

	grid.get = function (x, y) {
		if (!this.isValid(x, y)) {
			return 0;
		}
		return gridData[x][y]; 
	}; 

	grid.set = function (x, y, value) {
		if (!this.isValid(x, y)) {
			return;
		}
		gridData[x][y] = value;
	}


	return grid;
}
	
var world = {};
world.wall = createGrid();
world.badness = createGrid();

var mines = [];

var forEachCell = function(thing, func) {
	for (var i = 0; i < width; i ++) {
		for (var j = 0; j < height; j++) {
			func(thing, i, j);
		}
	}
}

forEachCell(world.wall, function(grid, x, y) {
	if (rnd(10) > 7) {
		grid.set(x, y, 1);
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
		if (world.wall.get(x, y) != 1 && mineAt(x, y) === null) {
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
		if (world.badness.get(x, y) >= maxBadness) {
			drawPixel(x, y, green2);
		} else if (world.badness.get(x, y) > 0) {
			drawPixel(x, y, green3);
		} else if (world.wall.get(x, y) > 0) {
			drawPixel(x, y, purple1);
		} else if (world.wall.get(x, y) == -1) {
			drawPixel(x, y, purple3);
		}
	});

	mines.forEach(function (mine) {
		drawPixel(mine.pos.x, mine.pos.y, yellow1);
	});

	var playerColor = (player.health > 0) ? green1 : "rgb(0,0,0)";
	drawPixel(player.pos.x, player.pos.y, playerColor);

	// Score
	/*ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica, Arial";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Goblins caught: " + 0, 32, 32);*/

	//health
	ctx.fillStyle = green2;
	ctx.fillRect(0,(height+1)*pixelSize, width*pixelSize, 1*pixelSize);
	ctx.fillStyle = green1;
	ctx.fillRect(0,(height+1)*pixelSize, toInt(player.health*width/maxHealth)*pixelSize, 1*pixelSize);
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
	updateExpansions();
}

var removeFromArray = function(element, array) {
	var index = array.indexOf(element);
	array.splice(index, 1);
}

var spreadBadnessInto = function(badness, pos) {
	var currentBadness = badness.get(pos.x, pos.y);
	if (currentBadness == 0 && world.wall.get(pos.x, pos.y) <= 0) {
		badness.set(pos.x, pos.y, 1 + rnd(maxBadness / 2));
	}
}

var updateBadness = function() {
	forEachCell(world.badness, function (badness, x, y) {
		var currentBadness = badness.get(x,y);

		if (currentBadness > 0) {
			if (currentBadness < maxBadness) {
				badness.set(x, y, currentBadness + 1);
			} else {
				var above = {x: x, y: y - 1};
				var below = {x: x, y: y + 1};
				var left = {x: x - 1, y: y};
				var right = {x: x + 1, y: y};
				spreadBadnessInto(badness, above);
				spreadBadnessInto(badness, below);
				spreadBadnessInto(badness, left);
				spreadBadnessInto(badness, right);
			}
		}

		//hack to get the badness started
		if (y === height - 1 || y === 0) {
			spreadBadnessInto(badness, {x: x, y:y});
		}
	})
}



var triggerExpansion = function (pos) {
	//clear goop and walls from expansion area
	var explosionSmallRadius = Math.ceil(explosionRadius / 2);
	for (var x = pos.x - explosionSmallRadius; x <= pos.x + explosionSmallRadius; x++) {
		var span = explosionRadius - Math.abs(x - pos.x) * 2;
		for (var y = pos.y - span; y <= pos.y + span; y++) {
			world.badness.set(x,y,0);
			world.wall.set(x, y, -1);
		}
	}
	var expansion = { pos: pos, age: 0};
	expansions.push(expansion);
}



var updateExpansions = function() {
	expansions.forEach(function (expansion) {
		expansion.age++;
		var pos = expansion.pos;

		//clear goop - this is a bit weird, we could've put this logic in the goop spread code
		//todo: duplicate code

		var explosionSmallRadius = Math.ceil(explosionRadius / 2);
		for (var x = pos.x - explosionSmallRadius; x <= pos.x + explosionSmallRadius; x++) {
			var span = explosionRadius - Math.abs(x - pos.x) * 2;
			for (var y = pos.y - span; y <= pos.y + span; y++) {
				world.badness.set(x,y,0);
			}
		}
		if (expansion.age == maxExpansionAge) {
			removeFromArray(expansion, expansions);
		}
	});
}

var updatePlayer = function() {

	if (player.health === 0) {
		return;
	}
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
			if (world.wall.get(newPos.x, newPos.y) != 1) {
				player.pos = newPos;
				player.moveTimer = player.moveDelay;
				//did we step on a mine?
				var mine = mineAt(newPos.x, newPos.y);
				if (mine != null) {
					removeFromArray(mine, mines);
					triggerExpansion(mine.pos);
				}
			}
		}
	} else {
		player.moveTimer--;
	}
	if (world.badness.get(player.pos.x, player.pos.y) > 0) {
		player.health--;
		if (player.health < 0) {
			player.health = 0;
		}
	} else {
		player.health++;
		if (player.health > maxHealth) {
			player.health = maxHealth;
		}
	}
}

var then = Date.now();
setInterval(main, 1000 / 60);
