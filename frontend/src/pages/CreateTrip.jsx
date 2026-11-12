
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function CreateTrip() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [tripName, setTripName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateTrip(e) {
    e.preventDefault();
    setError("");

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "trips"), {
        tripName,
        destination,
        startDate,
        endDate,
        description,
        createdBy: currentUser.uid,
        members: [currentUser.uid],
        createdAt: serverTimestamp()
      });

      alert("Trip created successfully!");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("Unable to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">

        <h1 className="text-3xl font-bold mb-2">
          Create New Trip
        </h1>

        <p className="text-gray-500 mb-6">
          Plan your next adventure with friends!
        </p>

        <form onSubmit={handleCreateTrip} className="space-y-4">

          <input
            type="text"
            placeholder="Trip Name"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />

          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />

          <div>
            <label className="block mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>

          <textarea
            placeholder="Trip Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-3 rounded-lg"
            rows="4"
          />

          {error && (
            <p className="text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating Trip..." : "Create Trip"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full border p-3 rounded-lg"
          >
            Cancel
          </button>

        </form>
      </div>
    </div>
  );
}
