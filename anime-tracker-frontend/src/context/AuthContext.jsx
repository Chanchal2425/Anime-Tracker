import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    // Check existing session on mount
    useEffect(() => {
        API.get("/me/")
            .then(res => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {

        const res = await API.post("/login/", {
            username,
            password,
        });

        console.log("LOGIN RESPONSE:", res.data);

        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);

        setUser(res.data.user);

        console.log("TOKEN SAVED:", localStorage.getItem("access"));
    };
    const register = async (username, password) => {
        await API.post("/register/", { username, password });
        // Optionally auto-login after register
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
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);