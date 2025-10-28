// frontend/src/Home.js
import React, { useState } from "react";
import './home.css';

function Home({ email }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Make sure this is your deployed FastAPI backend URL
  const API_BASE_URL = "https://qa-development-site.onrender.com";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate form
    if (!formData.name || !formData.age || !formData.phone || !formData.address) {
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/submit`, { // no trailing slash
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, email }),
      });

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Submission failed: ${response.status}`);
      }

      setMessage("Form submitted successfully!");
      setFormData({ name: "", age: "", phone: "", address: "" });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1>Welcome Home</h1>
      {email && <p>Logged in as: {email}</p>}

      <form className="home-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {message && <p className="form-message">{message}</p>}
    </div>
  );
}

export default Home;
