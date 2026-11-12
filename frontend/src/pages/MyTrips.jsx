
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function MyTrips() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const tripsQuery = query(
      collection(db, "trips"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const tripList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setTrips(tripList);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading trips:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              My Trips
            </h1>
            <p className="text-gray-500">
              All your travel adventures in one place.
            </p>
          </div>

          <button
            onClick={() => navigate("/create-trip")}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg"
          >
            + Create Trip
          </button>
        </div>

        {loading ? (
          <p>Loading your trips...</p>
        ) : trips.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center">
            <h2 className="text-xl font-semibold">
              No trips yet!
            </h2>
            <p className="text-gray-500 mt-2">
              Create your first trip and start planning.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {trips.map((trip) => (
              <div
  key={trip.id}
  onClick={() => navigate(`/trip/${trip.id}`)}
  className="bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
>
                <h2 className="text-xl font-bold">
                  {trip.tripName}
                </h2>

                <p className="text-blue-600 mt-2">
                  📍 {trip.destination}
                </p>

                <p className="text-gray-500 mt-2">
                  {trip.startDate} to {trip.endDate}
                </p>

                <p className="text-gray-600 mt-3">
                  {trip.description || "No description added."}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}
