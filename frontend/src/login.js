// frontend/src/login.js

/**
 * Simple email validation
 */
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

/**
 * Handle API response
 */
const handleLoginResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  return response.json();
};

/**
 * Handle fetch errors
 */
const handleLoginError = (error) => {
  if (error.name === "TypeError") return "Network error or server not reachable";
  return error.message || "Unexpected error";
};

/**
 * Login user
 */
export const loginUser = async (email, password, apiBaseUrl) => {
  if (!email || !password) throw new Error("Email and password are required");
  if (!isValidEmail(email)) throw new Error("Invalid email format");
  console.log("API Base URL:", apiBaseUrl);
  console.log("Final login URL:", `${apiBaseUrl}/login`);


  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      mode: "cors",
    });

    const data = await handleLoginResponse(response);
    return { success: true, message: data.message, email: data.user.email };
  } catch (error) {
    throw new Error(handleLoginError(error));
  }
};
