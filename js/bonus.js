const pigModal = document.getElementById("pigModal");
const bearModal = document.getElementById("bearModal");
const pigSpan = document.getElementsByClassName("close")[0];
const bearSpan = document.getElementsByClassName("close")[1];
const pigButton = document.getElementById("pig");
const bearButton = document.getElementById("bear");

function myPlay() {
	const audio = new Audio("sounds/quiet.mp3");
	audio.play();
}

pigButton.addEventListener("click", myPlay);

bearButton.onclick = function () {
	bearModal.style.display = "block";
};
pigButton.onclick = function () {
	pigModal.style.display = "block";
};

pigSpan.onclick = function () {
	pigModal.style.display = "none";
};

bearSpan.onclick = function () {
	bearModal.style.display = "none";
};

window.onclick = function (event) {
	if (event.target === pigModal || event.target === bearModal) {
		bearModal.style.display = "none";
		pigModal.style.display = "none";
	}
};
