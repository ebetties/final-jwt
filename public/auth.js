// Check token expiration and show warning popup
function checkTokenExpiration() {
  const token = getCookie('token');
  if (!token) return;

  try {
    const { exp } = jwt.decode(token);

    // Calculate remaining time until token expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = exp - now;

    // Show warning popup 20 seconds before token expiration
    if (expiresIn <= 20) {
      // Show popup warning
      showTokenExpirationWarning();

      // Refresh token automatically after 20 seconds
      setTimeout(refreshToken, expiresIn * 1000);
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}

// Function to show popup warning
function showTokenExpirationWarning() {
  // Show a custom popup warning
  // Implement your own popup/modal logic here
  alert('Your session will expire in 20 seconds. Click OK to refresh the token.');
}

// Function to refresh token
function refreshToken() {
  // Send a request to the server to refresh the token
  fetch('/refresh-token', {
      method: 'POST',
      credentials: 'include' // Include credentials (cookies)
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to refresh token');
      }
      return response.json();
  })
  .then(data => {
      // Update the token in cookies
      document.cookie = `token=${data.token}; path=/; secure; samesite=None`;

      // Check token expiration again
      checkTokenExpiration();
  })
  .catch(error => {
      console.error('Error refreshing token:', error.message);
      // Handle token refresh failure gracefully
      // You can show an error message or log the user out
  });
}

// Function to get cookie value by name
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
}

// Call checkTokenExpiration on page load
checkTokenExpiration();
