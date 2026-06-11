import React, {
  useState,
} from "react";
import API from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const response = await API.post("/api/auth/forgot-password", { email });

      const data = response.data;

      alert(data.message);
    };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-20"
    >
      <input
        type="email"
        placeholder="Email"
        className="border p-2 w-full"
        onChange={(e) =>
          setEmail(
            e.target.value
          )
        }
      />

      <button className="bg-blue-500 text-white p-2 w-full mt-3">
        Send Reset Link
      </button>
    </form>
  );
}