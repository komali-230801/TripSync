
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(fullName, email, password);

      alert("Account created successfully!");

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(err.message);

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
          Plan trips together. Travel better.
        </p>

        <h2 className="text-xl font-semibold mb-5 text-center">
          Create Your Account
        </h2>

        {/* Full Name */}
        <label className="block mb-2 font-medium">
          Full Name
        </label>

        <input
          type="text"
          placeholder="Enter your full name"
          className="w-full border p-3 rounded-lg mb-4"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

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
          placeholder="Minimum 6 characters"
          className="w-full border p-3 rounded-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-sm mb-4">
            {error}
          </p>
        )}

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        {/* Login Link */}
        <p className="text-center mt-5 text-gray-600">
          Already have an account?{" "}

          <Link
            to="/login"
            className="text-blue-600 font-semibold"
          >
            Login
          </Link>
        </p>

      </form>
    </div>
  );
}
