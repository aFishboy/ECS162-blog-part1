
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