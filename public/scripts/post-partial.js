function handleLikeClick(event) {
    // you might want to "fetch" something...
    const postId = event.target.closest('.like-button').getAttribute('data-id');
    fetch(`/like/${postId}`, { method: 'POST' })
        .then(() => window.location.reload());
}

function handleDeleteClick(event) {
    console.log("delete event")
    const postId = event.target.closest('.delete-button').getAttribute('data-id');
    fetch(`/delete/${postId}`, { method: 'POST' })
        .then(() => window.location.reload());
}