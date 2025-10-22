export const loginUser = async (email, password, apiBaseUrl) => {
  console.log("Calling login API with:", email, password, apiBaseUrl);

  const response = await fetch(`${apiBaseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  console.log("Fetch executed. Status:", response.status);

  const data = await response.json();
  console.log("Response data:", data);

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data.user;
};
