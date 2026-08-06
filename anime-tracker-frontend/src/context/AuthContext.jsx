import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check existing session on mount
    useEffect(() => {
        const token = localStorage.getItem("access");

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        API.get("/me/")
            .then((res) => setUser(res.data))
            .catch(() => {
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        const res = await API.post("/login/", { username, password });
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        setUser(res.data.user);
    };

    // Add this handler for Google OAuth backend response
// AuthContext.jsx
const googleLogin = async (googleToken) => {
    // Changing from "/google/" to "/auth/google/" matches your Django route
    const res = await API.post("/auth/google/", { token: googleToken });
    
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    setUser(res.data.user);
};

    const register = async (username, password) => {
        await API.post("/register/", { username, password });
        await login(username, password);
    };

    const logout = async () => {
        try {
            await API.post("/logout/");
        } catch (err) {
            console.log(err);
        }
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);