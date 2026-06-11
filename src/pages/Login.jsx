import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from '../api/axios';

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/api/auth/login", formData);

      const data = response.data;

      if (data.success) {
        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  text-gray-900">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Login
        </h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2 w-full mb-3"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2 w-full mb-3"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white w-full py-2"
        >
          Login
        </button>

        <div className="mt-3 text-center hover:underline hover:cursor-pointer text-blue-600 dark:text-gray-400">
          <Link to="/forgot-password">
            Forgot Password?
          </Link>
        </div>

        {/* <div className="mt-2 text-center hover:underline hover:cursor-pointer text-blue-600 dark:text-gray-400">
          <Link to="/register">
            Create Account
          </Link>
        </div> */}
      </form>
    </div>
  );
}