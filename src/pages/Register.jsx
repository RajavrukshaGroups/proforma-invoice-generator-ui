import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from '../api/axios';

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

    const response = await API.post("/api/auth/register", formData);

    const data = response.data;

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