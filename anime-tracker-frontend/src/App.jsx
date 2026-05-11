import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";   // new
import { AnimeDetailProvider } from "./context/AnimeDetailContext";
import { TrailerProvider } from "./context/TrailerContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import Home from "./pages/Home";
import AnimeList from "./pages/AnimeList";
import AddAnime from "./pages/AddAnime";
import Recommendations from "./pages/Recommendations";
import Login from "./pages/Login";         // new
import Register from "./pages/Register";   // new
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>        {/* new: provides user state to everything */}
        <AnimeDetailProvider>
          <TrailerProvider>
            <WatchlistProvider>
              <Navbar />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes – require login */}
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Home />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/anime"
                  element={
                    <RequireAuth>
                      <AnimeList />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/add"
                  element={
                    <RequireAuth>
                      <AddAnime />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/recommendations"
                  element={
                    <RequireAuth>
                      <Recommendations />
                    </RequireAuth>
                  }
                />
              </Routes>
            </WatchlistProvider>
          </TrailerProvider>
        </AnimeDetailProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Redirect to /login if not authenticated
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-container">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default App;