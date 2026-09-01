import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import {
    type User,
    type LoginParams,
    type SignupParams,
    loginApi,
    signupApi,
    fetchMeApi,
} from "../api/auth";

import { useToast } from "./ToastContext";

export type AuthModalMode = "login" | "signup";

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isModalOpen: boolean;
    modalMode: AuthModalMode;
    login: (params: LoginParams) => Promise<void>;
    signup: (params: SignupParams) => Promise<void>;
    logout: () => void;
    openModal: (mode?: AuthModalMode) => void;
    closeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("spotlight_token"),
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<AuthModalMode>("login");

    const { toast } = useToast();

    useEffect(() => {
        async function restoreSession() {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetchMeApi();
                setUser(res.user);
            } catch (err) {
                console.warn("Session expired or invalid:", err);
                localStorage.removeItem("spotlight_token");
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }

        restoreSession();
    }, [token]);

    const login = async (params: LoginParams) => {
        const res = await loginApi(params);
        localStorage.setItem("spotlight_token", res.token);
        setToken(res.token);
        setUser(res.user);
        closeModal();
        toast.success("Welcome Back!", `Signed in as ${res.user.email}`);
    };

    const signup = async (params: SignupParams) => {
        const res = await signupApi(params);
        localStorage.setItem("spotlight_token", res.token);
        setToken(res.token);
        setUser(res.user);
        closeModal();
        toast.success("Account Created!", "Welcome to Spotlight.");
    };

    const logout = () => {
        localStorage.removeItem("spotlight_token");
        setToken(null);
        setUser(null);
        toast.info("Signed Out", "You have been logged out successfully.");
    };

    const openModal = (mode: AuthModalMode = "login") => {
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isModalOpen,
                modalMode,
                login,
                signup,
                logout,
                openModal,
                closeModal,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
