import ChatWorkspace from "./pages/ChatWorkspace";
import TripDetails from "./pages/TripDetails";
import MyTrips from "./pages/MyTrips";
import CreateTrip from "./pages/CreateTrip";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import {
  AuthProvider,
  useAuth
} from "./context/AuthContext";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Protect dashboard from users who are not logged in
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Application routes
function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      
      {/* Home page */}
      <Route
        path="/"
        element={
          <Navigate
            to={currentUser ? "/dashboard" : "/register"}
            replace
          />
        }
      />
      <Route
  path="/trip/:tripId"
  element={
    <ProtectedRoute>
      <TripDetails />
    </ProtectedRoute>
  }
/>

      {/* Registration page */}
      <Route
        path="/register"
        element={
          currentUser
            ? <Navigate to="/dashboard" replace />
            : <Register />
        }
      />

      {/* Login page */}
      <Route
        path="/login"
        element={
          currentUser
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      {/* Dashboard page */}
      <Route path="/dashboard" element={<ProtectedRoute><ChatWorkspace /></ProtectedRoute>} />
<Route
  path="/create-trip"
  element={
    <ProtectedRoute>
      <CreateTrip />
    </ProtectedRoute>
  }
/>
<Route
  path="/my-trips"
  element={
    <ProtectedRoute>
      <MyTrips />
    </ProtectedRoute>
  }
/>
      {/* Unknown URLs */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

// Main App
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
