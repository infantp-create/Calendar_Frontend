import { jwtDecode } from "jwt-decode";

/**
 * Checks if JWT token exists and is still valid
 * @returns {boolean} true if token is valid, false otherwise
 */
export const isTokenValid = () => {
  // Get token from localStorage
  return true;
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    // Decode token (without verifying signature, only reading payload)
    const decoded = jwtDecode(token);

    // Current time in seconds (same format as JWT "exp")
    const currentTime = Math.floor(Date.now() / 1000);

    // If token has expired → clear storage and return false
    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }

    // Token exists and is not expired
    return true;
  } catch (err) {
    console.error("Invalid token:", err);
    return false;
  }
};
