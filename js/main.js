
//following http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/

// Constants:
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var pixelSize = 16;
var width = 32;
var height = width;
var normalTimeToGrowBadness = 120; //number of frames it takes for badness to capture a cell.
var explosionRadius = 7;
var playerExplosionRadius = 5;
var maxHealth = 120; //frames it takes to die when standing in goop
var maxExpansionAge = 90; //frames that an expansion keeps goop from returning

var screenWipeDurationWinning = 6;
var screenWipeDurationLosing = 16;
var blankBetweenLevelTime = 16;

//colors: http://colorschemedesigner.com/#5631Tw0w0w0w0
var wallColor = "#A00068";
var backgroundColor = "#800053";
var burnedBackgroundColor = "#571C43";

var playerColor = "#B4FFA3";

var badnessColor = "#4281FF";
var badnessOverSpace = "#5559C9";
var badnessOverWalls = "#996DFF";
var badnessFlashColor = badnessOverWalls;

var mineColor = "#FFCC02";
var expansionColor = "#4C3E8E"; //mine color blended with background color
var expansionFlashTime = 4;

var levelColor = wallColor;
var oldLevelColor = burnedBackgroundColor;

var transitionWinTime = 90;
var transitionLoseTime = 60*18;
var transitionCanSkipAfter = 90;

var optionKeyDelay = 45;

//to integer	
var toInt = function (value) { return ~~value; }


var rnd = function (range) {
	return Math.floor(Math.random()*range);
}



var canvas2 = document.createElement("canvas");
var ctx2 = canvas2.getContext("2d");
canvas2.width = width*pixelSize;
canvas2.height = (height+6)*pixelSize;
document.getElementById('overlay').appendChild(canvas2);

var noiseData = [];
for (var i = 0; i < 6; i++) {
	noiseData[i] = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
}
var noiseFrame = 0;
var noiseCounter = 0;

var generateNoise = function() {
	for (var frame=0; frame < noiseData.length; frame++) {
		var frameNoise = noiseData[frame];
		for (var i=0;i<frameNoise.data.length;i+=4) {
			var brightness = rnd(256);
			frameNoise.data[i]=brightness;
			frameNoise.data[i+1]=brightness;
			frameNoise.data[i+2]=brightness;
			frameNoise.data[i+3]=rnd(30);
		}
	}
}

var drawNoise = function() {
	noiseCounter++;
	if (noiseCounter < 10) {
		return;
	}
	noiseCounter = 0;
	noiseFrame++;
	if (noiseFrame == noiseData.length) {
		noiseFrame = 0;
	}
	ctx2.putImageData(noiseData[noiseFrame],0,0);
}

generateNoise();

canvas.width = width*pixelSize;
canvas.height = (height+6)*pixelSize;
document.getElementById('gameframe').appendChild(canvas);

var gameElement = document.getElementById('game');
gameElement.setAttribute("style","width:" + canvas.width + "px; height:" + canvas.height + "px");


if (typeof KeyEvent == "undefined") {
    var KeyEvent = {
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SPACE: 32,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_M: 77
    }
}

// persisted state:
var highestLevel = 0;

// game state:
var expansions; //a list of mine expanders {pos {x, y}, age }
var player;
var numMines;
var world;
var mines;
var level;
var endTransition;
var startTransition;

var optionKeyTimer = 0;

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

var newLevel = function() {

	if (level > highestLevel) {
		highestLevel = level;
	}

	expansions = [];
	player = {pos: {}};
	numMines = level + 2;
	world = {};
	mines = [];
	player.pos.x = toInt(width / 2);
	player.pos.y = toInt(height / 2);
	player.moveDelay = 5;
	player.moveTimer = 0;
	player.health = maxHealth;

	world.wall = createGrid();
	world.badness = createGrid();

	endTransition = null;
	startTransition = {};
	startTransition.age = 0;
	if (level == 1) {
		startTransition.win = false;
	} else {
		startTransition.win = true;
	}

	forEachCell(world.wall, function(grid, x, y) {
		if (rnd(10) > 7) {
			grid.set(x, y, 1);
		}
	});

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
}

var forEachCell = function(thing, func) {
	for (var i = 0; i < width; i ++) {
		for (var j = 0; j < height; j++) {
			func(thing, i, j);
		}
	}
}

var mineAt = function (x, y) {
	var foundMine = null;
	mines.forEach(function (mine) {
		if (mine.pos.x === x && mine.pos.y === y) {
			foundMine = mine;
		}
	});
	return foundMine;
}

level = 1;
newLevel();

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
	drawNoise();

	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0,0, width*pixelSize, height*pixelSize);
	
	forEachCell(world, function (world, x, y) {
		if (world.badness.get(x, y) >= maxBadnessAt(x, y)) {
			var color = badnessColor;
			if (toInt(player.flashing / 4) % 2 != 0) {
				color = badnessFlashColor;
			}
			drawPixel(x, y, color);
		} else if (world.badness.get(x, y) > 0) {
			if (isSpace(x, y)) {
				drawPixel(x, y, badnessOverSpace);
			} else {
				drawPixel(x, y, badnessOverWalls);
			}
		} else if (world.wall.get(x, y) > 0) {
			drawPixel(x, y, wallColor);
		} else if (world.wall.get(x, y) == -1) {
			drawPixel(x, y, burnedBackgroundColor);
		}
	});

	mines.forEach(function (mine) {
		drawPixel(mine.pos.x, mine.pos.y, mineColor);
	});

	drawExpansions();

	drawPlayer();

	drawEndTransition();
	drawStartTransition();

	drawBar(1, player.health, maxHealth, playerColor, burnedBackgroundColor);

	ctx.fillStyle = "#000";
	ctx.fillRect(0,(height+3)*pixelSize, width*pixelSize, 3*pixelSize);
	drawDots(3, highestLevel, oldLevelColor);
	drawDots(3, level, levelColor);

};

var drawExpansions = function() {
	expansions.forEach(function (expansion) {
		if (expansion.age < expansion.flashTime) {
			forEveryCellInDiamond(expansion.pos, expansion.radius, function(x, y) {
				if (world.wall.isValid(x,y)) {
					drawPixel(x, y, expansion.color);	
				}
			});
		}
	});
}

var drawPlayer = function() {
	if (player.hidden) {
		return;
	}
	drawPixel(player.pos.x, player.pos.y, playerColor);
}

var forEveryCellInTeleportAnimation = function(pos, frame, func) {
	for (var j = -1; j <= 1; j++) {
		var xOffset = frame;
		xOffset -= Math.abs(j);
		var width = Math.min(3, xOffset+1);
		for (var i = 0; i < width; i++) {
			func(pos.x - xOffset + i, pos.y + j);
			func(pos.x + xOffset - i, pos.y + j);		
		}
	}
}

var drawScreenWipe = function (frame, duration) {
	//wipe across the screen
	var column = toInt(frame / (duration) * width);
	if (column > width) {
		column = width;
	}
	ctx.fillStyle = "#000";
	ctx.fillRect(0*pixelSize,0*pixelSize, (column+1)*pixelSize, height*pixelSize);
}

var drawScreenUnwipe = function (frame, duration) {
	//wipe across the screen
	var column = toInt(frame / (duration) * width);
	if (column > width) {
		column = width;
	}
	ctx.fillStyle = "#000";
	ctx.fillRect(column*pixelSize,0*pixelSize, (width-column)*pixelSize, height*pixelSize);
}

var drawStartTransition = function() {
	if (startTransition == null) {
		return;
	}

	drawScreenUnwipe(startTransition.age, screenWipeDuration(startTransition));
}

var drawEndTransition = function() {
	if (endTransition == null) {
		return;
	}

	var screenWipeFrame = endTransition.age - (endTransition.duration - screenWipeDuration(endTransition) - blankBetweenLevelTime);
	if (screenWipeFrame > 0) {
		drawScreenWipe(screenWipeFrame, screenWipeDuration(endTransition));
	}

	if (endTransition.win === true) {
		if (endTransition.age == 7) {
			player.hidden = true;
			endTransition.pos = player.pos;	
		}

		if (endTransition.age >= 7) {
			forEveryCellInTeleportAnimation(endTransition.pos, endTransition.age - 7, function(x, y) {
				if (world.wall.isValid(x, y)) {
					drawPixel(x, y, playerColor);	
				}
			});
		}
	}
}

var drawDots = function(row, value, foreColor, backColor) {
	ctx.fillStyle = foreColor;
	for (var n = 0; n < value; n++) {
		ctx.fillRect(n*2*pixelSize, (height+row)*pixelSize, pixelSize, pixelSize);
	}
	if (value * 2 > width) {
		//draw another row
		for (var n = 0; n < value - toInt(width/2); n++) {
				ctx.fillRect((1+n*2)*pixelSize, (height+row+1)*pixelSize, pixelSize, pixelSize);
		}
	}

	if (value * 3 > width) {
		//draw another row
		for (var n = 0; n < value - toInt(width); n++) {
				ctx.fillRect((n*2)*pixelSize, (height+row+2)*pixelSize, pixelSize, pixelSize);
		}
	}
}

var drawBar = function(row, current, max, foreColor, backColor) {
	ctx.fillStyle = backColor;
	var barWidth = toInt(current*width/max);
	//make it always odd
	if (barWidth % 2 == 1 && barWidth > 0) {
		barWidth += 1;
	}
	var barOffset = toInt((width/2 - barWidth/2));
	ctx.fillRect(0,(height+row)*pixelSize, width*pixelSize, 1*pixelSize);
	ctx.fillStyle = foreColor;
	ctx.fillRect(barOffset*pixelSize,(height+row)*pixelSize, barWidth*pixelSize, 1*pixelSize);
}

var updateOptionKeys = function () {
	if (optionKeyTimer > 0) {
		optionKeyTimer--;
	}
	if (optionKeyTimer == 0) {
		if (keysDown[KeyEvent.DOM_VK_M] === true) {
			optionKeyTimer = optionKeyDelay;
			soundUtil.toggleMute();
		}
	}
}

// The main game loop
var main = function () {
	update();
	render();
};

var anyKeysDown = function() {
		if (keysDown[KeyEvent.DOM_VK_LEFT] === true ||
			keysDown[KeyEvent.DOM_VK_RIGHT] === true ||
			keysDown[KeyEvent.DOM_VK_UP] === true ||
			keysDown[KeyEvent.DOM_VK_DOWN] === true ||
			keysDown[KeyEvent.DOM_VK_SPACE] === true ||
			keysDown[KeyEvent.DOM_VK_ENTER] === true ||
			keysDown[KeyEvent.DOM_VK_RETURN] === true) {
			return true;
		}
		return false;
}

var screenWipeDuration = function(transition) {
	if (transition.win === true) {
		return screenWipeDurationWinning;
	} else {
		return screenWipeDurationLosing;
	}
}

var startOfScreenWipe = function(transition) {
	return transition.duration - screenWipeDuration(transition) - blankBetweenLevelTime;
}

var update = function () {
	updatePlayer();
	updateBadness();
	updateExpansions();

	//updateTransition
	if (startTransition != null) {
		startTransition.age++;
		if (startTransition.age == screenWipeDuration(startTransition)) {
			startTransition = null;
		}
	}

	if (endTransition != null) {
		endTransition.age++;

		//optionally skip the lose transition
		if (endTransition.age > transitionCanSkipAfter
			&& endTransition.age < startOfScreenWipe(endTransition)) {
			if (anyKeysDown()) {
				endTransition.age = startOfScreenWipe(endTransition);	
			}
		}

		if (endTransition.age == endTransition.duration) {
			if (endTransition.win === true) {
				level++;
			} else {
				level = 1;
			}
			newLevel();	
		}
	}
	//updateWinOrLoseCondition
	if (mines.length == 0 && endTransition == null) {
		endTransition = {};
		endTransition.age = 0;
		endTransition.win = true;
		endTransition.duration = transitionWinTime;
		soundUtil.playWinSound();
	}
	if (player.health === 0 && endTransition == null) {
		endTransition = {};
		endTransition.age = 0;
		endTransition.win = false;
		endTransition.duration = transitionLoseTime;
	}

	//update music toggle
	updateOptionKeys();
}

var removeFromArray = function(element, array) {
	var index = array.indexOf(element);
	array.splice(index, 1);
}

var spreadBadnessInto = function(badness, pos) {
	var currentBadness = badness.get(pos.x, pos.y);
	if (currentBadness == 0) {
		badness.set(pos.x, pos.y, 1 + rnd(normalTimeToGrowBadness / 2));
	}
}

var isSpace = function(x, y) {
	return (world.wall.get(x, y) <= 0);
}

var maxBadnessAt = function(x, y) {
	if (isSpace(x, y)) {
		return normalTimeToGrowBadness;
	}
	return normalTimeToGrowBadness * 5;
}

var updateBadness = function() {
	forEachCell(world.badness, function (badness, x, y) {
		var currentBadness = badness.get(x,y);

		if (currentBadness > 0) {
			if (currentBadness < maxBadnessAt(x, y)) {
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



var triggerExpansion = function (pos, isPlayer) {
	var expansion = { pos: pos, age: 0, radius: explosionRadius, color: expansionColor, flashTime: expansionFlashTime};
	if (isPlayer === true) {
		expansion.color = playerColor;
		expansion.flashTime *= 2;
		expansion.radius = playerExplosionRadius;
	}

	//clear goop and walls from expansion area
	forEveryCellInDiamond(pos, expansion.radius, function(x, y) {
		world.badness.set(x,y,0);
		world.wall.set(x, y, -1);
	});
	world.wall.set(pos.x, pos.y, 0); //just to make the centre look different

	expansions.push(expansion);
}

var forEveryCellInDiamond = function (pos, bigRadius, func) {
	var smallRadius = Math.ceil(bigRadius / 2);
	for (var x = pos.x - smallRadius; x <= pos.x + smallRadius; x++) {
		var span = bigRadius - Math.abs(x - pos.x) * 2;
		for (var y = pos.y - span; y <= pos.y + span; y++) {
			func(x, y);
		}
	}
}

var updateExpansions = function() {
	expansions.forEach(function (expansion) {
		expansion.age++;
		var pos = expansion.pos;

		//clear goop - this is a bit weird, we could've put this logic in the goop spread code
		//todo: duplicate code
		forEveryCellInDiamond(expansion.pos, expansion.radius, function(x, y) {
			world.badness.set(x,y,0);
		});
		if (expansion.age == maxExpansionAge) {
			removeFromArray(expansion, expansions);
		}
	});
}

var updatePlayer = function() {

	if (player.health === 0) {
		return;
	}
	if (player.hidden) {
		player.flashing = 0;
		soundUtil.stopBuzz();
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
			if (world.wall.isValid(newPos.x, newPos.y)) {
				player.pos = newPos;
				player.moveTimer = player.moveDelay;
				//did we step on a mine?
				var mine = mineAt(newPos.x, newPos.y);
				if (mine != null) {
					removeFromArray(mine, mines);
					triggerExpansion(mine.pos);
					soundUtil.playExpandSound();
				}
			}
		}
	} else {
		player.moveTimer--;
	}
	if (world.badness.get(player.pos.x, player.pos.y) > 0) {
		player.health--;
		if (player.health <= 0) {
			player.health = 0;
			player.flashing = 0;
			soundUtil.stopBuzz();
			player.hidden = true;
			triggerExpansion(player.pos, true);
			soundUtil.playExplodeSound();
		} else {
			player.flashing++;
			soundUtil.playBuzz();
		}
	} else {
		player.flashing = 0;
		soundUtil.stopBuzz();
	}
}

var SoundUtil = function() {
	var audioContext;
	var expandSound;
	var explodeSound;
	var buzzSound;
	var winSound;
	var audioEnabled = true;
	var muted = false;
	var music;

	var audio = new Audio();
	var mp3Support = audio.canPlayType("audio/mpeg");
	var oggSupport = audio.canPlayType("audio/ogg");
	var extension;

	if(mp3Support == "probably" || mp3Support == "maybe") {
		extension = ".mp3";
	} else if(oggSupport == "probably" || oggSupport == "maybe") {
		extension = ".ogg";
	} else {
		console.log("I don't think this browser can play our music.");
		return;
	}

	music = new Audio("music/DJ DOS - LOOP (Creative Commons Attribution-Share Alike 3.0)" + extension); 
	expandSound = new Audio("sounds/thump" + extension);
	explodeSound = new Audio("sounds/explode" + extension);
	buzzSound = new Audio("sounds/buzz" + extension);
	winSound = new Audio("sounds/win" + extension);
	music.loop = true;

	function play(sound) {
		if (muted) {
			return;
		}
		if (sound.duration > 0 && !sound.paused) {
			sound.pause();
			sound.currentTime = 0;
		}
		sound.play();
	}

	this.playExpandSound = function() {
		play(expandSound);
	}

	this.playExplodeSound = function() {
		play(explodeSound);
	}

	this.playWinSound = function() {
		play(winSound);
	}

	this.playBuzz = function() {
		if (muted) {
			return;
		}
		if (buzzSound.duration > 0 && !buzzSound.paused) {
			//ignore, already playing
		} else {
			buzzSound.play();
		}
	}

	this.stopBuzz = function() {
		if (buzzSound.duration > 0 && !buzzSound.paused) {
			buzzSound.pause();
			buzzSound.currentTime = 0;
		}
	}

	this.playMusic = function() {
		music.loop = true;
		music.play();
	}

	this.toggleMute = function() {
		if (muted) {
			muted = false;
			music.play();			
		} else {
			muted = true;
			music.pause();
			this.stopBuzz();
		}
	}
}

var soundUtil = new SoundUtil();
soundUtil.playMusic();
setInterval(main, 1000 / 60);