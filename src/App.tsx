import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "@/components/ui/Navbar";
import Index from "./pages/Index";
import LotPage from "./pages/LotPage";
import ProfilePage from "./pages/ProfilePage";
import ComparePage from "./pages/ComparePage";
import LeaderboardPage from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Navbar is hidden on the main district page (it has its own HUD)
function ConditionalNavbar() {
  const location = useLocation();
  if (location.pathname === "/") return null;
  return <Navbar />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ConditionalNavbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lot/:username" element={<LotPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
