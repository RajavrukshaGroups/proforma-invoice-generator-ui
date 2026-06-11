import React, {
  useState,
} from "react";

export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const response =
        await fetch(
          "http://localhost:5000/api/auth/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
            }),
          }
        );

      const data =
        await response.json();

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