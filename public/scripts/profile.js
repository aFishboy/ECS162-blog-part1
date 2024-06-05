

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        fetch('/deleteAccount', {
            method: 'POST',
        }).then(response => {
            if (response.ok) {
                window.location.href = '/login'; 
            } else {
                alert('Failed to delete account.');
            }
        }).catch(error => console.error('Error:', error));
    }
}

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

