

var Overlay = function() {
	var data = [];
	for (var i = 0; i < 4; i++) {
		data[i] = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
	}
	var frame = 0;
	var counter = 0;

	var generateScanlines = function() {
		for (var frame=0; frame < data.length; frame++) {
			var frameData = data[frame];
			var row = frame % 4;
			var column = 0;
			for (var i=0;i<frameData.data.length;i+=4) {
				if (toInt(row / 2) % 2 == 0) {
					var brightness = 255;
					frameData.data[i]=brightness;
					frameData.data[i+1]=brightness;
					frameData.data[i+2]=brightness;
					frameData.data[i+3]=20;
				}
				column++;
				if (column===width*pixelSize) {
					row++;
					column = 0;
				}
			}
		}
	}

	var generateNoise = function() {
		for (var frame=0; frame < data.length; frame++) {
			var frameData = data[frame];
			for (var i=0;i<frameData.data.length;i+=4) {
				var brightness = rnd(256);
				frameData.data[i]=brightness;
				frameData.data[i+1]=brightness;
				frameData.data[i+2]=brightness;
				frameData.data[i+3]=rnd(30);
			}
		}
	}

	this.draw = function() {
		counter++;
		if (counter < 10) {
			return;
		}
		counter = 0;
		frame++;
		if (frame == data.length) {
			frame = 0;
		}
		ctx2.putImageData(data[frame],0,0);
	}

	var mode = 0;

	this.switchMode = function() {
		mode++;
		if (mode > 1) {
			mode = 0;
		}
		if (mode === 0) {
			generateScanlines();
		} else if (mode === 1) {
			generateNoise();
		}
	}
	generateScanlines();
}
