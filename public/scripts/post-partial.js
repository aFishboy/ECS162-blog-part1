function handleLikeClick(event) {
    const likeButton = event.target.closest(".like-button");
    const postId = likeButton.getAttribute("data-id");

    fetch(`/like/${postId}`, { method: "POST" })
        .then((response) => {
            if (!response.ok) {
                if (response.status === 401) {
                    return Promise.resolve();
                }
            }
            return response.json();
        })
        .then((data) => {
            if (!data) { 
                return;
            }
            const likeCountElement = likeButton
                .closest(".post-status-bar")
                .querySelector(".like-count");
            likeCountElement.textContent = `${data.likes} Likes`;

            if (data.isLikedByUser) {
                likeButton.classList.add("liked-by-user");
            } else {
                likeButton.classList.remove("liked-by-user");
            }
        })
        .catch((error) => console.error("Error:", error));
}

function handleDeleteClick(event) {
    console.log("delete event");
    const postId = event.target
        .closest(".delete-button")
        .getAttribute("data-id");
    fetch(`/delete/${postId}`, { method: "POST" }).then(() =>
        window.location.reload()
    );
}
