import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrendingEvents from "./components/TrendingEvents";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <Navbar />
                <main>
                    <Hero />
                    <TrendingEvents />
                </main>
                <Footer />
                <AuthModal />
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
