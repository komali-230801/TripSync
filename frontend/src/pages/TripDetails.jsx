
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot
} from "firebase/firestore";

import { db } from "../services/firebase";

export default function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const tripRef = doc(db, "trips", tripId);

    const unsubscribe = onSnapshot(
      tripRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setTrip({
            id: snapshot.id,
            ...snapshot.data()
          });
          setError("");
        } else {
          setTrip(null);
          setError("Trip not found.");
        }

        setLoading(false);
      },
      (err) => {
        console.error("Error loading trip:", err);
        setError("Unable to load trip details.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tripId]);

  if (loading) {
    return <p className="p-8">Loading trip details...</p>;
  }

  if (error || !trip) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error || "Trip not found."}</p>
        <button
          onClick={() => navigate("/my-trips")}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Back to My Trips
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => navigate("/my-trips")}
          className="text-blue-600 mb-6"
        >
          ← Back to My Trips
        </button>

        <div className="bg-white p-8 rounded-xl shadow">

          <h1 className="text-3xl font-bold text-gray-800">
            {trip.tripName}
          </h1>

          <p className="text-blue-600 text-xl mt-3">
            📍 {trip.destination}
          </p>

          <div className="mt-6 space-y-3 text-gray-600">

            <p>
              <strong>Start Date:</strong> {trip.startDate}
            </p>

            <p>
              <strong>End Date:</strong> {trip.endDate}
            </p>

            <p>
              <strong>Description:</strong>{" "}
              {trip.description || "No description added."}
            </p>

          </div>

          <hr className="my-6" />

          <h2 className="text-2xl font-bold">
            Trip Itinerary
          </h2>

          <p className="text-gray-500 mt-2">
            Your activities and travel schedule will appear here.
          </p>

        </div>
      </div>
    </div>
  );
}
