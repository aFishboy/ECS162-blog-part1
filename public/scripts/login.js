const button = document.querySelector(".login-button");
button.addEventListener("click", async () => {
    try {
        const response = await fetch("/login", {
            method: "POST",
            body: JSON.stringify({}),
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (response.redirected) {
            // Check if the response was redirected
            if (response.url === "/") {
                // Redirect to the home page if login was successful
                window.location.href = "/";
            } else {
                // Redirect to the login page with error message if login failed
                window.location.href = "/login?error=Invalid+username";
            }
        } else {
            // Handle other cases (if needed)
            console.log(
                "Login request was successful, but no redirection occurred"
            );
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
});
