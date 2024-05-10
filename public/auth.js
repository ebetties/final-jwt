
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
      // Show popup warning with countdown
      showTokenExpirationWarning(expiresIn);
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}

// Function to show popup warning with countdown
function showTokenExpirationWarning(countdownSeconds) {
  let secondsLeft = countdownSeconds;

  // Create an interval to update the countdown timer every second
  const countdownInterval = setInterval(() => {
    // Display the countdown timer in the alert message
    alert(`Your session will expire in ${secondsLeft} seconds. Click OK to refresh the token.`);

    // Decrease the remaining time by 1 second
    secondsLeft--;

    // When countdown reaches 0, clear the interval
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      // Optionally, you can also call a function to refresh the token here
      refreshToken();
    }
  }, 1000); // Update the countdown every second
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
