
import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";

export default function Polls({ tripId, currentUser }) {
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const pollsRef = collection(db, "trips", tripId, "polls");

    const unsubscribe = onSnapshot(
      pollsRef,
      (snapshot) => {
        const pollList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        pollList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setPolls(pollList);
      },
      (error) => {
        console.error("Poll loading error:", error);
      }
    );

    return unsubscribe;
  }, [tripId]);

  async function handleCreatePoll(e) {
    e.preventDefault();

    const cleanQuestion = question.trim();

    const cleanOptions = options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2) {
      alert("Enter a question and at least two options.");
      return;
    }

    if (cleanOptions.length > 6) {
      alert("You can add a maximum of six options.");
      return;
    }

    if (new Set(cleanOptions.map((item) => item.toLowerCase())).size !== cleanOptions.length) {
      alert("Please remove duplicate options.");
      return;
    }

    setSaving(true);

    try {
      await addDoc(collection(db, "trips", tripId, "polls"), {
        question: cleanQuestion,
        options: cleanOptions,
        votes: {},
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp()
      });

      setQuestion("");
      setOptions("");
    } catch (error) {
      console.error("Poll creation error:", error);
      alert("Unable to create poll. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVote(pollId, optionIndex) {
    try {
      const pollRef = doc(db, "trips", tripId, "polls", pollId);

      await updateDoc(pollRef, {
        [`votes.${currentUser.uid}`]: optionIndex
      });
    } catch (error) {
      console.error("Voting error:", error);
      alert("Unable to submit your vote. Please try again.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Group Polls 🗳️
        </h2>
        <p className="text-slate-500 mt-1">
          Decide your trip plans together.
        </p>
      </div>

      <form
        onSubmit={handleCreatePoll}
        className="bg-white rounded-xl shadow p-5 space-y-4"
      >
        <h3 className="text-lg font-bold text-slate-800">
          Create a Poll
        </h3>

        <input
          type="text"
          placeholder="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={200}
          required
          className="w-full border rounded-lg p-3"
        />

        <textarea
          placeholder={"Enter one option per line:\nGoa\nManali\nOoty"}
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          rows={4}
          required
          className="w-full border rounded-lg p-3"
        />

        <p className="text-xs text-slate-500">
          Add between 2 and 6 options, one per line.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Creating..." : "+ Create Poll"}
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">
          Active Polls
        </h3>

        {polls.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">
            No polls yet. Create the first poll for your trip!
          </div>
        ) : (
          polls.map((poll) => {
            const votes = poll.votes || {};
            const totalVotes = Object.keys(votes).length;
            const myVote = votes[currentUser.uid];

            return (
              <div
                key={poll.id}
                className="bg-white rounded-xl shadow p-5 space-y-4"
              >
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    {poll.question}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1">
                    Created by {poll.createdByName || "Trip member"}
                  </p>
                </div>

                <div className="space-y-3">
                  {(poll.options || []).map((option, index) => {
                    const count = Object.values(votes).filter(
                      (vote) => vote === index
                    ).length;

                    const percentage = totalVotes
                      ? Math.round((count / totalVotes) * 100)
                      : 0;

                    const selected = myVote === index;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleVote(poll.id, index)}
                        className={`w-full text-left border rounded-lg p-3 transition ${
                          selected
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-blue-400"
                        }`}
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-medium text-slate-700">
                            {selected ? "✓ " : ""}
                            {option}
                          </span>

                          <span className="text-sm text-slate-500">
                            {count} vote(s) · {percentage}%
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-sm text-slate-500">
                  {totalVotes} total vote(s). Click an option to vote or change your vote.
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
