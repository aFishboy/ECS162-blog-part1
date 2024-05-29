const button = document.querySelector(".login-button");
button.addEventListener("click", async () => {
    try {
        const response = await fetch("/auth/google", {
            method: "GET",
        });

        if (response.redirected) {
            // Redirect to the provided URL
            window.location.href = response.url;
        } else {
            // Handle cases where no redirection occurs
            console.log(
                "Login request was successful, but no redirection occurred"
            );
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
});
