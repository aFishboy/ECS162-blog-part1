var profileAvatar = document.querySelector(".profile-avatar");
var fileInput = document.querySelector("#avatar-upload");

profileAvatar.addEventListener("click", function () {
    fileInput.click();
});

fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append("image", file);

    fetch("/uploadAvatar", {
        method: "POST",
        body: formData,
    })
        .then((response) => {
            if (response.ok) {
                // If upload is successful, reload the page
                window.location.reload();
            } else {
                throw new Error("Network response was not ok.");
            }
        })
        .catch((error) => {
            console.error("Error uploading avatar:", error);
        });
});
