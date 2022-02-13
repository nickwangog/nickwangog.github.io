function loadPictures() {
	const folder = "imgs/us";
	let j = 0;
	let column;

	$.ajax({
		url: folder,
		success: function (data) {
			$(data)
				.find("a")
				.attr("href", function (i, val) {
					if (val.match(/\.(jpe?g|png|gif)$/i)) {
						if (j === 0) {
							let row = document.getElementById("row");
							column = document.createElement("div");
							column.className="column";
							row.append(column);
						}
						let img = document.createElement('img');
						img.src = val;
						column.append(img);
						j++;
						if (j === 4) {
							j = 0;
						}
					}
				});
		},
		error: function () {
			alert("The website needs to be run on a local server!");
		  }
	});
}

loadPictures();
