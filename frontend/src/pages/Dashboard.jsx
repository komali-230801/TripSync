
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const features = [
    {
      title: "Create Trip",
      description: "Plan your next adventure with friends.",
      icon: "✈️",
      path: "/create-trip"
    },
    {
      title: "My Trips",
      description: "View and manage your planned trips.",
      icon: "🌍",
      path: "/my-trips"
    },
    {
      title: "Itinerary",
      description: "Organize destinations and activities.",
      icon: "📅"
    },
    {
      title: "Split Expenses",
      description: "Track expenses and calculate who owes whom.",
      icon: "💰"
    },
    {
      title: "Group Chat",
      description: "Chat and share plans with your friends.",
      icon: "💬"
    },
    {
      title: "AI Travel Assistant",
      description: "Get help planning your next journey.",
      icon: "🤖"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">
          TripSync ✈️
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {currentUser?.displayName || "Traveller"}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">

        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, {currentUser?.displayName || "Traveller"}! 👋
          </h2>

          <p className="text-gray-500 mt-2">
            Plan trips together. Travel better.
          </p>
        </div>

        {/* Create Trip Section */}
        <div className="bg-blue-600 text-white p-8 rounded-2xl mb-10">
          <h3 className="text-2xl font-bold">
            Ready for your next adventure?
          </h3>

          <p className="mt-2 text-blue-100">
            Bring your friends together and plan an amazing trip.
          </p>

          <button
            className="mt-5 bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50"
            onClick={() => navigate("/create-trip")}
          >
            + Create New Trip
          </button>
        </div>

        {/* Features */}
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Explore TripSync
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {features.map((feature) => (
            <div
              key={feature.title}
              onClick={() => feature.path && navigate(feature.path)}
              className={`bg-white p-6 rounded-xl shadow hover:shadow-lg transition ${
                feature.path ? "cursor-pointer" : ""
              }`}
            >
              <div className="text-4xl mb-4">
                {feature.icon}
              </div>

              <h4 className="text-xl font-semibold text-gray-800">
                {feature.title}
              </h4>

              <p className="text-gray-500 mt-2">
                {feature.description}
              </p>
            </div>
          ))}

        </div>
      </main>
    </div>
  );
}
