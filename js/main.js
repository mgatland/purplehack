
//following http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var pixelSize = 16;
var width = 32;
var height = width;
var backgroundColor = "rgb()";

//colors: http://colorschemedesigner.com/#5631Tw0w0w0w0
var mainColor = "#c50080";
var mainColor2 = "#800053";
var accentColor = "#25d500";
var accentColor2 = "#3DA028";
var accent2Color = "#FFF800";
var accent2Color2 = "#BFBC30";

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
	}
	return grid;
}
	

var grid = createGrid();


var forEachCell = function(grid, func) {
	for (var i = 0; i < width; i ++) {
		for (var j = 0; j < height; j++) {
			func(grid, i, j);
		}
	}
}

forEachCell(grid, function(grid, x, y) {
	if (rnd(10) > 7) {
		grid[x][y] = 1;
	}
});

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

var drawPixel = function (x, y) {
	ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

// Draw everything
var render = function () {
	ctx.fillStyle = mainColor2;
	ctx.fillRect(0,0, width*pixelSize, height*pixelSize);

	ctx.fillStyle = accent2Color;
	forEachCell(grid, function (grid, x, y) {
		if (grid[x][y] === 1) {
			drawPixel(x, y);
		}
	});

	ctx.fillStyle = accentColor;
	drawPixel(player.pos.x, player.pos.y);

	// Score
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
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
			if (grid[newPos.x][newPos.y] != 1) {
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
