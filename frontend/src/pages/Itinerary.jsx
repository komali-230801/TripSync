
import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";

export default function Itinerary({ tripId }) {
  const [activities, setActivities] = useState([]);

  const [activityName, setActivityName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  // LOAD SHARED ACTIVITIES
  useEffect(() => {
    if (!tripId) return;

    const activitiesRef = collection(
      db,
      "trips",
      tripId,
      "activities"
    );

    const unsubscribe = onSnapshot(
      activitiesRef,
      (snapshot) => {
        const activityList = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        activityList.sort((a, b) =>
          `${a.date} ${a.time || ""}`.localeCompare(
            `${b.date} ${b.time || ""}`
          )
        );

        setActivities(activityList);
      },
      (error) => {
        console.error("Itinerary loading error:", error);
      }
    );

    return unsubscribe;
  }, [tripId]);

  // ADD ACTIVITY
  async function handleAddActivity(e) {
    e.preventDefault();

    if (!activityName.trim() || !date) {
      alert("Please enter an activity name and date.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(
        collection(db, "trips", tripId, "activities"),
        {
          activityName: activityName.trim(),
          date,
          time,
          location: location.trim(),
          notes: notes.trim(),
          createdAt: serverTimestamp()
        }
      );

      setActivityName("");
      setDate("");
      setTime("");
      setLocation("");
      setNotes("");

    } catch (error) {
      console.error("Activity error:", error);
      alert("Unable to add activity.");
    } finally {
      setSaving(false);
    }
  }

  // DELETE ACTIVITY
  async function handleDelete(activityId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this activity?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "trips", tripId, "activities", activityId)
      );
    } catch (error) {
      console.error("Delete error:", error);
      alert("Unable to delete activity.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto">

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Shared Itinerary 📅
      </h2>

      <p className="text-slate-500 mb-6">
        Plan activities together with your trip members.
      </p>

      {/* ADD ACTIVITY FORM */}
      <form
        onSubmit={handleAddActivity}
        className="bg-white rounded-xl shadow p-5 mb-8 space-y-4"
      >
        <h3 className="font-bold text-lg">
          Add New Activity
        </h3>

        <input
          type="text"
          placeholder="Activity name"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          className="w-full border rounded-lg p-3"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg p-3"
            required
          />

          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border rounded-lg p-3"
          />
        </div>

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        <textarea
          placeholder="Additional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg p-3"
          rows="3"
        />

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "+ Add Activity"}
        </button>
      </form>

      {/* ACTIVITY LIST */}
      <div className="space-y-4">

        <h3 className="text-lg font-bold text-slate-800">
          Planned Activities ({activities.length})
        </h3>

        {activities.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            No activities planned yet. Add your first activity!
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow p-5 flex justify-between gap-4"
            >
              <div className="min-w-0">
                <h4 className="font-bold text-lg text-slate-800">
                  {activity.activityName}
                </h4>

                <p className="text-sm text-blue-600 mt-1">
                  📅 {activity.date}
                  {activity.time && ` • ${activity.time}`}
                </p>

                {activity.location && (
                  <p className="text-sm text-slate-600 mt-2">
                    📍 {activity.location}
                  </p>
                )}

                {activity.notes && (
                  <p className="text-sm text-slate-500 mt-2">
                    {activity.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDelete(activity.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          ))
        )}

      </div>
    </div>
  );
}
