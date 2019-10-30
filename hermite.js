
var HERMITE = new Hermite_class();
var canvas = document.getElementById("cc");
var ctx = canvas.getContext("2d");
var img_w;
var img_h;
var current_size = false;
var URL = window.webkitURL || window.URL;
var orientation;
var img = new Image();
var orientationTwo = 0;
var rotated = 0;

$("#file_input").change(function(e){
var url = URL.createObjectURL(e.target.files[0]);
img.src = url;
img.crossOrigin = "Anonymous"; //cors support
getOrientation(e.target.files[0], function(orientation){
 			if (orientation == 6 ){
 				orientationTwo = 6;
 			}
 		})
});

img.onload = function(){
    var resize_size = 10; //1-100
	resize(resize_size, img, canvas, ctx, HERMITE , orientationTwo);
	var loginResponse = connectToFilemaker();
	loginResponse.then(function(data){
		var token = data.data.response.token;
		var recordResponse = creatFMRecord (token);
		recordResponse.then(function(data){
			var recordID = data.data.response.recordId;
			var dataForm = new FormData();
			var sendCanvas = document.getElementById('cc');
	        sendCanvas.toBlob(function (blob) {
	        dataForm.append('upload', blob, "image.png");
			uploadToContainerField(token, dataForm, recordID);
			})
    	});
	})
};


function connectToFilemaker(){
	const Url= 'https://jupiter.360works.com/fmi/data/v1/databases/PrecisionUpload/sessions';
	const headers = {
		'Authorization': 'Basic YWRtaW46d2FmZmxlcw==',
		'Content-Type': 'application/json'
	}
	return axios({
		method: 'post',
		url: Url,
		headers: headers,
		data: {}
	})
	.then(function(data){
		return(data);
	})
	.catch(err=>console.log(err))
}

function creatFMRecord(token){
	const Url= 'https://jupiter.360works.com/fmi/data/v1/databases/PrecisionUpload/layouts/Genres/records';
	const headers = {
		'Authorization': 'Bearer ' + token,
		'Content-Type': 'application/json',
	}
	return axios({
		method: 'post',
		url: Url,
		headers: headers,
		crossDomain: true,
		data: { "fieldData": {}},
   		cache : false,
        contentType: false,
        processData: false
	})
	.then(function(data){
		return(data);
	})
	.catch(err=>console.log(err))
	
}

function uploadToContainerField(token, dataForm, recordID){
	const Url= 'https://jupiter.360works.com/fmi/data/v1/databases/PrecisionUpload/layouts/Genres/records/' + recordID + '/containers/Field';
	const headers = {
		'Authorization': 'Bearer ' + token
	}
	axios({
		method: 'post',
		url: Url,
		headers: headers,
		crossDomain: true,
		data: dataForm,
        cache : false,
        contentType: false,
        processData: false
	})
	.then(data=>console.log(data))	
	.catch(err=>console.log(err))
}

function getOrientation(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {

        var view = new DataView(e.target.result);
        if (view.getUint16(0, false) != 0xFFD8)
        {
            return callback(-2);
        }
        var length = view.byteLength, offset = 2;
        while (offset < length) 
        {
            if (view.getUint16(offset+2, false) <= 8) return callback(-1);
            var marker = view.getUint16(offset, false);
            offset += 2;
            if (marker == 0xFFE1) 
            {
                if (view.getUint32(offset += 2, false) != 0x45786966) 
                {
                    return callback(-1);
                }

                var little = view.getUint16(offset += 6, false) == 0x4949;
                offset += view.getUint32(offset + 4, little);
                var tags = view.getUint16(offset, little);
                offset += 2;
                for (var i = 0; i < tags; i++)
                {
                    if (view.getUint16(offset + (i * 12), little) == 0x0112)
                    {
                        return callback(view.getUint16(offset + (i * 12) + 8, little));
                    }
                }
            }
            else if ((marker & 0xFF00) != 0xFF00)
            {
                break;
            }
            else
            { 
                offset += view.getUint16(offset, false);
            }
        }
        return callback(-1);
    };
    reader.readAsArrayBuffer(file);
}

function resize(percentages, img, canvas, ctx, HERMITE, orientationTwo) {
	img_w = img.width;
	img_h = img.height;
	var w =  Math.round(img_w * percentages / 100);
	var h =  Math.round(img_h * percentages / 100);

	//prepare canvas
	canvas.width = img_w;
	canvas.height = img_h;
	
	//draw image
	ctx.drawImage(img, 0, 0);
	HERMITE.resample_single(canvas, w, h, true);
	// if (rotated == 1){
	// 	// ctx.rotate(-0.5 * Math.PI);
 //  //       ctx.translate(-canvas.width, 0);
	// 	// rotated = 0;
	// 	ctx.restore();
	// }
	// if (orientationTwo == 6){
	// 	// 90° rotate right
	// 	// canvas.width = img_h;
	// 	// 	canvas.height = img_w;
 //            ctx.rotate(0.5 * Math.PI);
 //            ctx.translate(0, -canvas.height);
            
 //            rotated = 1;
	// }
}



// ----------- LIBRARY BELOW ------------------------




/**
 * Hermite resize - fast image resize/resample using Hermite filter.
 * Author: ViliusL
 * demo: http://viliusle.github.io/miniPaint/
 */
function Hermite_class() {
	var cores;
	var workers_archive = [];
	var workerBlobURL;

	/**
	 * contructor
	 */
	this.init = function () {
		cores = navigator.hardwareConcurrency || 4;
	}();

	/**
	 * Returns CPU cores count
	 * 
	 * @returns {int}
	 */
	this.getCores = function () {
		return cores;
	};

	/**
	 * Hermite resize. Detect cpu count and use best option for user.
	 * 
	 * @param {HtmlElement} canvas
	 * @param {int} width
	 * @param {int} height
	 * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
	 * @param {boolean} on_finish finish handler. Optional.
	 */
	this.resample_auto = function (canvas, width, height, resize_canvas, on_finish) {
		var cores = this.getCores();

		if (!!window.Worker && cores > 1) {
			//workers supported and we have at least 2 cpu cores - using multithreading
			this.resample(canvas, width, height, resize_canvas, on_finish);
		} else {
			//1 cpu version
			this.resample_single(canvas, width, height, true);
			on_finish();
		}
	};
	
	/**
	 * Hermite resize. Resize actual image.
	 * 
	 * @param {string} image_id
	 * @param {int} width
	 * @param {int} height optional.
	 * @param {int} percentages optional.
	 * @param {string} multi_core optional.
	 */
	this.resize_image = function(image_id, width, height, percentages, multi_core){
		var img = document.getElementById(image_id);
		
		//create temp canvas
		var temp_canvas = document.createElement("canvas");
		temp_canvas.width = img.width;
		temp_canvas.height = img.height;
		var temp_ctx = temp_canvas.getContext("2d");

		//draw image
		temp_ctx.drawImage(img, 0, 0);
		
		//prepare size
		if(width == undefined && height == undefined && percentages != undefined){
			width = img.width / 100 * percentages;
			height = img.height / 100 * percentages;
		}
		if(height == undefined){	
			var ratio = img.width / width;
			height = img.height / ratio;
		}
		width = Math.round(width);
		height = Math.round(height);

		var on_finish = function(){
			var dataURL = temp_canvas.toDataURL();
			img.width = width;
			img.height = height;
			img.src = dataURL;

			delete dataURL;
			delete temp_canvas;
		};

		//resize
		if(multi_core == undefined || multi_core == true){
			this.resample(temp_canvas, width, height, true, on_finish);
		}
		else{
			this.resample_single(temp_canvas, width, height, true);
			on_finish();
		}
	};
	
	/**
	 * Hermite resize, multicore version - fast image resize/resample using Hermite filter.
	 * 
	 * @param {HtmlElement} canvas
	 * @param {int} width
	 * @param {int} height
	 * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
	 * @param {boolean} on_finish finish handler. Optional.
	 */
	this.resample = function (canvas, width, height, resize_canvas, on_finish) {
		var width_source = canvas.width;
		var height_source = canvas.height;
		width = Math.round(width);
		height = Math.round(height);
		var ratio_h_half = Math.ceil(height_source / height / 2);

		//stop old workers
		if (workers_archive.length > 0) {
			for (var c = 0; c < cores; c++) {
				if (workers_archive[c] != undefined) {
					workers_archive[c].terminate();
					delete workers_archive[c];
				}
			}
		}
		workers_archive = new Array(cores);
		var ctx = canvas.getContext("2d");

		//prepare source and target data for workers
		var source = new Array(cores);
		var target = new Array(cores);
		for (var c = 0; c < cores; c++) {
			//source	
			var offset_y = Math.ceil(height_source / cores) * c;
			var block_height = Math.ceil(height_source / cores) + ratio_h_half * cores;
			if (offset_y + block_height > height_source) {
				block_height = height_source - offset_y;
			}
			if (block_height < 1) {
				//size too small, nothing left for this core
				continue;
			}
			source[c] = ctx.getImageData(0, offset_y, width_source, block_height);

			//target
			offset_y = Math.ceil(height / cores) * c;
			block_height = Math.ceil(height / cores);
			if (offset_y + block_height > height) {
				block_height = height - offset_y;
			}
			if (block_height < 1) {
				//size too small, nothing left for this core
				continue;
			}
			target[c] = true;
		}

		//clear and resize canvas
		if (resize_canvas === true) {
			canvas.width = width;
			canvas.height = height;
		} else {
			ctx.clearRect(0, 0, width_source, height_source);
		}

		//start
		var workers_in_use = 0;
		for (var c = 0; c < cores; c++) {
			if (target[c] == undefined) {
				//no job for this worker
				continue;
			}

			workers_in_use++;
			var my_worker = new Worker(workerBlobURL);
			workers_archive[c] = my_worker;

			my_worker.onmessage = function (event) {
				workers_in_use--;
				var core = event.data.core;
				delete workers_archive[core];

				//draw
				target[core] = ctx.createImageData(width, Math.ceil(height / cores));
				target[core].data.set(event.data.target);
				var y = Math.ceil(height / cores) * core;
				ctx.putImageData(target[core], 0, y);

				if (workers_in_use <= 0) {
					//finish
					on_finish();
				}
			};

			var objData = {
				width_source: width_source,
				height_source: height_source,
				width: width,
				height: height,
				core: c,
				cores: cores,
				source: source[c].data.buffer,
			};
			my_worker.postMessage(objData, [objData.source]);
		}
	};
	
	// Build a worker from an anonymous function body - purpose is to avoid separate file
	workerBlobURL = URL.createObjectURL( new Blob([ '(',
		function(){
			//begin worker
			onmessage = function (event) {
				var core = event.data.core;
				var cores = event.data.cores;
				var width_source = event.data.width_source;
				var height_source = event.data.height_source;
				var width = event.data.width;
				var height = event.data.height;

				var ratio_w = width_source / width;
				var ratio_h = height_source / height;
				var ratio_w_half = Math.ceil(ratio_w / 2);
				var ratio_h_half = Math.ceil(ratio_h / 2);

				var source = new Uint8ClampedArray(event.data.source);
				var source_h = source.length / width_source / 4;

				var target_size = width * Math.ceil(height / cores) * 4;
				var target_memory = new ArrayBuffer(target_size);
				var target = new Uint8ClampedArray(target_memory, 0, target_size);

				//j position in original source = j + d_h - d_h_source;
				var d_h_source = Math.ceil(height_source / cores) * core;
				var d_h = Math.ceil(height / cores) * core;

				//calculate
				for (var j = 0; j < Math.ceil(height / cores); j++) {
					for (var i = 0; i < width; i++) {
						var x2 = (i + j * width) * 4;
						var weight = 0;
						var weights = 0;
						var weights_alpha = 0;
						var gx_r = 0;
						var gx_g = 0;
						var gx_b = 0;
						var gx_a = 0;
						var center_y = (d_h + j + 0.5) * ratio_h - d_h_source;

						var yy_start = Math.floor(j * ratio_h);
						var yy_stop = Math.ceil((d_h + j + 1) * ratio_h - d_h_source);
						var xx_start = Math.floor(i * ratio_w);
						var xx_stop = Math.ceil((i + 1) * ratio_w);
						for (var yy = yy_start; yy < yy_stop; yy++) {
							if (yy >= source_h || yy < 0) {
								//extra border check
								continue;
							}
							var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
							var center_x = (i + 0.5) * ratio_w;
							var w0 = dy * dy; //pre-calc part of w
							for (var xx = xx_start; xx < xx_stop; xx++) {
								var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
								var w = Math.sqrt(w0 + dx * dx);
								if (w >= 1) {
									//pixel too far
									continue;
								}
								//hermite filter
								weight = 2 * w * w * w - 3 * w * w + 1;
								//calc source pixel location
								var pos_x = 4 * (xx + yy * width_source);
								//alpha
								gx_a += weight * source[pos_x + 3];
								weights_alpha += weight;
								//colors
								if (source[pos_x + 3] < 255)
									weight = weight * source[pos_x + 3] / 250;
								gx_r += weight * source[pos_x];
								gx_g += weight * source[pos_x + 1];
								gx_b += weight * source[pos_x + 2];
								weights += weight;
							}
						}
						target[x2] = gx_r / weights;
						target[x2 + 1] = gx_g / weights;
						target[x2 + 2] = gx_b / weights;
						target[x2 + 3] = gx_a / weights_alpha;
					}
				}

				//return
				var objData = {
					core: core,
					target: target,
				};
				postMessage(objData, [target.buffer]);
			};
			//end worker
		}.toString(),
	')()' ], { type: 'application/javascript' } ) );

	/**
	 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
	 * 
	 * @param {HtmlElement} canvas
	 * @param {int} width
	 * @param {int} height
	 * @param {boolean} resize_canvas if true, canvas will be resized. Optional.
	 */
	this.resample_single = function (canvas, width, height, resize_canvas) {
		var width_source = canvas.width;
		var height_source = canvas.height;
		width = Math.round(width);
		height = Math.round(height);

		var ratio_w = width_source / width;
		var ratio_h = height_source / height;
		var ratio_w_half = Math.ceil(ratio_w / 2);
		var ratio_h_half = Math.ceil(ratio_h / 2);

		var ctx = canvas.getContext("2d");
		var img = ctx.getImageData(0, 0, width_source, height_source);
		var img2 = ctx.createImageData(width, height);
		var data = img.data;
		var data2 = img2.data;

		for (var j = 0; j < height; j++) {
			for (var i = 0; i < width; i++) {
				var x2 = (i + j * width) * 4;
				var weight = 0;
				var weights = 0;
				var weights_alpha = 0;
				var gx_r = 0;
				var gx_g = 0;
				var gx_b = 0;
				var gx_a = 0;
				var center_y = (j + 0.5) * ratio_h;
				var yy_start = Math.floor(j * ratio_h);
				var yy_stop = Math.ceil((j + 1) * ratio_h);
				for (var yy = yy_start; yy < yy_stop; yy++) {
					var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
					var center_x = (i + 0.5) * ratio_w;
					var w0 = dy * dy; //pre-calc part of w
					var xx_start = Math.floor(i * ratio_w);
					var xx_stop = Math.ceil((i + 1) * ratio_w);
					for (var xx = xx_start; xx < xx_stop; xx++) {
						var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
						var w = Math.sqrt(w0 + dx * dx);
						if (w >= 1) {
							//pixel too far
							continue;
						}
						//hermite filter
						weight = 2 * w * w * w - 3 * w * w + 1;
						var pos_x = 4 * (xx + yy * width_source);
						//alpha
						gx_a += weight * data[pos_x + 3];
						weights_alpha += weight;
						//colors
						if (data[pos_x + 3] < 255)
							weight = weight * data[pos_x + 3] / 250;
						gx_r += weight * data[pos_x];
						gx_g += weight * data[pos_x + 1];
						gx_b += weight * data[pos_x + 2];
						weights += weight;
					}
				}
				data2[x2] = gx_r / weights;
				data2[x2 + 1] = gx_g / weights;
				data2[x2 + 2] = gx_b / weights;
				data2[x2 + 3] = gx_a / weights_alpha;
			}
		}
		//clear and resize canvas
		if (resize_canvas === true) {
			canvas.width = width;
			canvas.height = height;
		} else {
			ctx.clearRect(0, 0, width_source, height_source);
		}

		//draw
		ctx.putImageData(img2, 0, 0);
	};
}