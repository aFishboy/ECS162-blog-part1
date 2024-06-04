/*
 You want to show a subset of the emojis. About 200. However,
 you also want the user to be able to search all emojis,
 so, put them in this array when the array is empty so 
 that you have them.
*/

let allEmojis = []; // Global list to hold all emojis

function toggleEmojiPanel() {
    const container = document.getElementById("emoji-container");
    container.style.display =
        container.style.display === "none" ? "block" : "none";
    if (container.style.display === "block" && allEmojis.length == 0) {
        // go "Fetch" you some emojis and show them off with displayEmojies
        fetch("/emoji") //aidan api key
            .then((response) => response.json())
            .then((data) => {
                allEmojis = data;
                displayEmojis(allEmojis);
            });
    }
}

function displayEmojis(emojis, limit = 200) {
    const container = document.getElementById("emoji-grid");
    container.innerHTML = ""; // Clear previous results
    if (Array.isArray(emojis) && emojis.length > 0) {
        emojis.slice(0, limit).forEach((emoji) => {
            const emojiElement = document.createElement("span");
            emojiElement.textContent = emoji.character;
            emojiElement.title = emoji.slug; // Showing the emoji name on hover
            emojiElement.style.cursor = "pointer";
            emojiElement.onclick = () => insertEmoji(emoji.character);
            container.appendChild(emojiElement);
        });
    } else {
        container.textContent = "No emojis found. Try a different search!";
    }
}

function searchEmojis() {
    const searchTerm = document
        .getElementById("emoji-search")
        .value.toLowerCase();
    const filteredEmojis = allEmojis.filter((emoji) =>
        emoji.slug.includes(searchTerm)
    );
    displayEmojis(filteredEmojis);
}

function insertEmoji(emoji) {
    // put an emoji on a form somehow.
    const textarea = document.querySelector('textarea[name="content"]');
    textarea.value += emoji;
    // do this when you're doing getting the emoji on the form
    //
    textarea.focus(); // Keep focus on the textarea
}

const imageUploadInput = document.getElementById("image-upload");
const uploadImageLabel = document.getElementById("upload-image-label");
const imagePreview = document.getElementById("image-preview");

imageUploadInput.addEventListener("change", () => {
    if (imageUploadInput.files.length > 0) {
        let file = imageUploadInput.files[0];
        let fileName = file.name;
        const fileExtension = fileName.substring(fileName.lastIndexOf("."));
        const baseFileName = fileName.substring(0, fileName.lastIndexOf("."));

        if (baseFileName.length > 7) {
            fileName = baseFileName.substring(0, 7) + fileExtension;
        }

        const reader = new FileReader();

        reader.onload = () => {
            uploadImageLabel.textContent = fileName;
            imagePreview.src = reader.result;
            imagePreview.style.display = "block";
        };

        reader.readAsDataURL(file);
    } else {
        uploadImageLabel.textContent = "Upload Image";
        imagePreview.src = "";
        imagePreview.style.display = "none";
    }
});
