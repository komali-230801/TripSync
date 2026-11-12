
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);

      alert("Login successful!");

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Invalid email or password. Please try again.");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >

        <h1 className="text-3xl font-bold text-center text-blue-700">
          TripSync
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-6">
          Welcome back! Continue your travel journey.
        </p>

        <h2 className="text-xl font-semibold mb-5 text-center">
          Login to Your Account
        </h2>

        {/* Email */}
        <label className="block mb-2 font-medium">
          Email Address
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-3 rounded-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password */}
        <label className="block mb-2 font-medium">
          Password
        </label>

        <input
          type="password"
          placeholder="Enter your password"
          className="w-full border p-3 rounded-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
        )}

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Register Link */}
        <p className="text-center mt-5 text-gray-600">
          Don't have an account?{" "}

          <Link
            to="/register"
            className="text-blue-600 font-semibold"
          >
            Register
          </Link>
        </p>

      </form>
    </div>
  );
}
