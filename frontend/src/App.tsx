import { useState } from "react";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ExperienceShowcase from "./components/ExperienceShowcase";
import TrendingEvents from "./components/TrendingEvents";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";

function AppContent() {
    const [currentView, setCurrentView] = useState<"home" | "events" | "event_detail" | "dashboard">("home");
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    const handleSelectEvent = (eventId: number) => {
        setSelectedEventId(eventId);
        setCurrentView("event_detail");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <Navbar
                onNavigate={(view) => {
                    setCurrentView(view);
                    if (view !== "event_detail") {
                        setSelectedEventId(null);
                    }
                }}
                currentView={currentView}
            />
            <main>
                {currentView === "home" ? (
                    <>
                        <Hero />
                        <ExperienceShowcase />
                        <TrendingEvents
                            onViewAllClick={() => setCurrentView("events")}
                            onSelectEvent={handleSelectEvent}
                        />
                    </>
                ) : currentView === "events" ? (
                    <EventsPage onSelectEvent={handleSelectEvent} />
                ) : currentView === "dashboard" ? (
                    <UserDashboardPage onExploreClick={() => setCurrentView("events")} />
                ) : selectedEventId ? (
                    <EventDetailPage
                        eventId={selectedEventId}
                        onBack={() => setCurrentView("events")}
                    />
                ) : (
                    <EventsPage onSelectEvent={handleSelectEvent} />
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
