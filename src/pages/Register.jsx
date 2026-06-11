import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(
      "http://localhost:5000/api/auth/register",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          formData
        ),
      }
    );

    const data =
      await response.json();

    if (data.success) {
      alert(
        "Registration Successful"
      );
      navigate("/login");
    } else {
      alert(data.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-20"
    >
      <input
        type="text"
        name="name"
        placeholder="Name"
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <button className="bg-green-600 text-white px-4 py-2 w-full">
        Register
      </button>
    </form>
  );
}