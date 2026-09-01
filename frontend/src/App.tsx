import { useState } from "react";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ExperienceShowcase from "./components/ExperienceShowcase";
import TrendingEvents from "./components/TrendingEvents";
import EventsPage from "./pages/EventsPage";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";

function AppContent() {
    const [currentView, setCurrentView] = useState<"home" | "events">("home");

    return (
        <>
            <Navbar onNavigate={(view) => setCurrentView(view)} currentView={currentView} />
            <main>
                {currentView === "home" ? (
                    <>
                        <Hero />
                        <ExperienceShowcase />
                        <TrendingEvents onViewAllClick={() => setCurrentView("events")} />
                    </>
                ) : (
                    <EventsPage />
                )}
            </main>
            <Footer />
            <AuthModal />
        </>
    );
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
