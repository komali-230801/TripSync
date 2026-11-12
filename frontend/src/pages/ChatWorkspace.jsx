import AIAssistant from "./AIAssistant";
import Polls from "./Polls";
import ExpenseTracker from "./ExpenseTracker";
import Itinerary from "./Itinerary";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  writeBatch,
  setDoc,
  arrayUnion,
  updateDoc
} from "firebase/firestore";

import { db, rtdb } from "../services/firebase";

import {
  ref,
  onValue
} from "firebase/database";

export default function ChatWorkspace() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeChat, setActiveChat] = useState("ai");

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
const [inviteSending, setInviteSending] = useState(false);
const [pendingInvitations, setPendingInvitations] = useState([]);
const [memberStatuses, setMemberStatuses] = useState({});
  // LOAD USER TRIPS
  useEffect(() => {
    if (!currentUser) return;

    const tripsQuery = query(
      collection(db, "trips"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
      const tripList = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

      setTrips(tripList);
    });

    return unsubscribe;
  }, [currentUser]);

    // LOAD PENDING INVITATIONS
  useEffect(() => {
    if (!currentUser?.email) return;

    const invitationsQuery = query(
      collection(db, "invitations"),
      where("inviteeEmail", "==", currentUser.email.toLowerCase()),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      invitationsQuery,
      (snapshot) => {
        setPendingInvitations(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data()
          }))
        );
      },
      (error) => {
        console.error("Invitations loading error:", error);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // LOAD REAL-TIME MEMBER ONLINE STATUS
  useEffect(() => {
    if (!selectedTrip?.members?.length) {
      setMemberStatuses({});
      return;
    }

    const unsubscribers = selectedTrip.members.map((userId) => {
      const statusRef = ref(rtdb, `status/${userId}`);

      return onValue(
        statusRef,
        (snapshot) => {
          const status = snapshot.val();

          setMemberStatuses((previous) => ({
            ...previous,
            [userId]: status?.state || "offline"
          }));
        },
        (error) => {
          console.error("Presence loading error:", error);
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [selectedTrip]);


  // LOAD REAL-TIME GROUP MESSAGES
  useEffect(() => {
    if (activeChat !== "trip" || !selectedTrip) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, "trips", selectedTrip.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        setMessages(messageList);
      },
      (error) => {
        console.error("Message loading error:", error);
      }
    );

    return unsubscribe;
  }, [activeChat, selectedTrip]);

  // SEND MESSAGE
  async function handleSendMessage(e) {
    e.preventDefault();

    const messageText = newMessage.trim();

    if (!messageText || !selectedTrip || sending) return;

    setSending(true);

    try {
      await addDoc(
        collection(db, "trips", selectedTrip.id, "messages"),
        {
          text: messageText,
          senderId: currentUser.uid,
          senderName:
            currentUser.displayName || currentUser.email,
          createdAt: serverTimestamp()
        }
      );

      setNewMessage("");
    } catch (error) {
      console.error("Message sending error:", error);
      alert("Unable to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

async function handleInviteMember(e) {
  e.preventDefault();

  const email = inviteEmail.trim().toLowerCase();

  if (!email || !selectedTrip || inviteSending) return;

  if (email === currentUser.email?.toLowerCase()) {
    alert("You are already a member of this trip!");
    return;
  }

  setInviteSending(true);

  try {
    const invitationId = `${selectedTrip.id}_${email}`;

    await setDoc(doc(db, "invitations", invitationId), {
      tripId: selectedTrip.id,
      tripName: selectedTrip.tripName,
      inviterId: currentUser.uid,
      inviterName: currentUser.displayName || currentUser.email,
      inviteeEmail: email,
      status: "pending",
      createdAt: serverTimestamp()
    });

    setInviteEmail("");
    alert("Invitation sent successfully!");

  } catch (error) {
    console.error("Invitation error:", error);
    alert("Unable to send invitation. Please try again.");
  } finally {
    setInviteSending(false);
  }
}
async function handleAcceptInvitation(invitation) {
  try {
    const batch = writeBatch(db);

    batch.update(
      doc(db, "invitations", invitation.id),
      { status: "accepted" }
    );

    batch.update(
      doc(db, "trips", invitation.tripId),
      {
        members: arrayUnion(currentUser.uid)
      }
    );

    await batch.commit();

    alert("You have successfully joined the trip!");

  } catch (error) {
    console.error("Accept invitation error:", error);
    alert("Unable to accept invitation. Please try again.");
  }
}

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  function formatTime(timestamp) {
    if (!timestamp?.toDate) return "Sending...";

    return timestamp.toDate().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const chatTitle =
    activeChat === "ai"
      ? "AI Travel Assistant"
      : selectedTrip?.tripName || "Trip Chat";

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">

      {/* SIDEBAR */}
      <aside
  className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 md:static md:translate-x-0 md:shrink-0 ${
    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>

        <div className="p-5 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-blue-400">
            TripSync ✈️
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Plan together. Travel together.
          </p>
        </div>

        <div className="p-4">
          <button
            onClick={() => navigate("/create-trip")}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
          >
            + Create New Trip
          </button>
        </div>

        <div className="px-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            Conversations
          </p>

          <button
            onClick={() => {
  setActiveChat("ai");
  setSelectedTrip(null);
  setIsSidebarOpen(false);
}}
            className={`w-full text-left p-3 rounded-lg mb-2 ${
              activeChat === "ai"
                ? "bg-slate-700"
                : "hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <p className="font-semibold">
                  AI Travel Assistant
                </p>
                <p className="text-xs text-slate-400">
                  Your personal travel planner
                </p>
              </div>
            </div>
          </button>
        </div>
        {/* PENDING INVITATIONS */}
        {pendingInvitations.length > 0 && (
          <div className="px-4 mt-4">
            <p className="text-xs uppercase tracking-wider text-yellow-400 mb-3">
              Invitations ({pendingInvitations.length})
            </p>

            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-slate-800 rounded-lg p-3 mb-3"
              >
                <p className="font-semibold text-sm">
                  {invitation.tripName}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Invited by {invitation.inviterName}
                </p>

                <button
                  onClick={() => handleAcceptInvitation(invitation)}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm font-semibold"
                >
                  Accept Invitation
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 mt-5 flex-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            Your Trip Groups
          </p>

          {trips.length === 0 ? (
            <p className="text-sm text-slate-400">
              No trips yet. Create your first trip!
            </p>
          ) : (
            trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => {
  setSelectedTrip(trip);
  setActiveChat("trip");
  setIsSidebarOpen(false);
}}
                className={`w-full text-left p-3 rounded-lg mb-2 ${
                  activeChat === "trip" &&
                  selectedTrip?.id === trip.id
                    ? "bg-slate-700"
                    : "hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg">
                    🌍
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {trip.tripName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {trip.destination}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-700">
          <p className="font-semibold truncate">
            {currentUser?.displayName || "Traveller"}
          </p>
          <p className="text-xs text-slate-400 truncate mb-3">
            {currentUser?.email}
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </aside>
      {isSidebarOpen && (
  <div
    className="fixed inset-0 bg-black/50 z-40 md:hidden"
    onClick={() => setIsSidebarOpen(false)}
  />
)}

      {/* CHAT WINDOW */}
      <main className="flex-1 flex flex-col min-w-0">

        
<header className="bg-white border-b px-4 md:px-6 py-4">
  <button
    onClick={() => setIsSidebarOpen(true)}
    className="md:hidden mb-3 text-2xl text-slate-700"
  >
    ☰
  </button>
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-slate-800">
        {chatTitle}
      </h2>

      <p className="text-sm text-slate-500">
        {activeChat === "ai"
          ? "Your personal travel planning space"
          : selectedTrip?.destination}
      </p>

{activeChat === "trip" && selectedTrip && (
  <div className="flex flex-wrap gap-3 mt-3">
    {selectedTrip.members?.map((userId) => {
      const isOnline = memberStatuses[userId] === "online";

      return (
        <div
          key={userId}
          className="flex items-center gap-2 text-xs text-slate-600"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? "bg-green-500" : "bg-slate-400"
            }`}
          ></span>

          <span>
            {userId === currentUser.uid ? "You" : `Member ${userId.slice(-4)}`}
          </span>

          <span className="text-slate-400">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      );
    })}
  </div>
)}

    </div>

    {activeChat === "trip" && selectedTrip && (
      <form
        onSubmit={handleInviteMember}
        className="flex w-full md:w-auto gap-2"
      >
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Friend's email address"
          required
className="min-w-0 flex-1 md:w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"        />

        <button
          type="submit"
          disabled={!inviteEmail.trim() || inviteSending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {inviteSending ? "Sending..." : "Invite"}
        </button>
      </form>
    )}
  </div>
</header>

        {activeChat === "trip" && selectedTrip && (
<nav className="bg-white border-b px-3 md:px-6 py-3 flex flex-wrap gap-2">
    <button
      onClick={() => setActiveSection("chat")}
      className={`w-[calc(50%-0.25rem)] md:w-auto px-3 md:px-5 py-2 rounded-lg font-medium text-sm md:text-base ${
        activeSection === "chat"
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      💬 Chat
    </button>

    <button
      onClick={() => setActiveSection("itinerary")}
className={`w-[calc(50%-0.25rem)] md:w-auto px-3 md:px-5 py-2 rounded-lg font-medium text-sm md:text-base ${        activeSection === "itinerary"
          ? "bg-blue-600 text-white"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      📅 Itinerary
    </button>
    <button
  onClick={() => setActiveSection("expenses")}
className={`w-[calc(50%-0.25rem)] md:w-auto px-3 md:px-5 py-2 rounded-lg font-medium text-sm md:text-base ${    activeSection === "expenses"
      ? "bg-blue-600 text-white"
      : "bg-slate-100 text-slate-700"
  }`}
>
  💰 Expenses
</button>
<button
  onClick={() => setActiveSection("polls")}
className={`w-[calc(50%-0.25rem)] md:w-auto px-3 md:px-5 py-2 rounded-lg font-medium text-sm md:text-base ${    activeSection === "polls"
      ? "bg-blue-600 text-white"
      : "bg-slate-100 text-slate-700"
  }`}
>
  🗳️ Polls
</button>

  </nav>
)}

        {/* MESSAGES */}
<section className="flex-1 min-w-0 overflow-y-auto p-3 md:p-6">
 
{activeChat === "trip" &&
 activeSection === "expenses" &&
 selectedTrip ? (

  <ExpenseTracker
    tripId={selectedTrip.id}
    members={selectedTrip.members || []}
    currentUser={currentUser}
  />
) : activeChat === "trip" &&
     activeSection === "polls" &&
     selectedTrip ? (

  <Polls
    tripId={selectedTrip.id}
    currentUser={currentUser}
  />
) : activeChat === "trip" &&
     activeSection === "itinerary" &&
     selectedTrip ? (

  <Itinerary tripId={selectedTrip.id} />

) : activeChat === "ai" ? (

  <AIAssistant />

) : messages.length === 0 ? (

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="text-5xl mb-4">💬</div>

    <h2 className="text-xl font-bold text-slate-700">
      Start your group conversation!
    </h2>

    <p className="text-slate-500 mt-2">
      Send the first message to your travel group.
    </p>
  </div>

) : (

  messages.map((message) => {
    const isMyMessage =
      message.senderId === currentUser.uid;

    return (
      <div
        key={message.id}
        className={`flex mb-4 ${
          isMyMessage ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${
            isMyMessage
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-800"
          }`}
        >
          {!isMyMessage && (
            <p className="text-xs font-bold mb-1 text-blue-600">
              {message.senderName}
            </p>
          )}

          <p className="break-words whitespace-pre-wrap">
            {message.text}
          </p>

          <p className="text-xs text-right mt-2 opacity-70">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  })

)}

</section>

        {/* MESSAGE INPUT */}
        {activeChat === "trip" &&
 activeSection === "chat" &&
 selectedTrip ? (
          <form
            onSubmit={handleSendMessage}
className="bg-white border-t p-3 md:p-4 flex gap-2 md:gap-3"          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={2000}
className="min-w-0 flex-1 bg-slate-100 px-3 md:px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-400"            />

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
className="shrink-0 bg-blue-600 text-white px-4 md:px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50"            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        ) : (
          <div className="bg-white border-t p-4 text-center text-sm text-slate-400">
            Select a trip group to send messages.
          </div>
        )}

      </main>
    </div>
  );
}
