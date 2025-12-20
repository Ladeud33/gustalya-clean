import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";

// Pages
import { Home } from "@/pages/Home";
import { CookingPage } from "@/pages/CookingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cooking" component={CookingPage} />
      {/* Profile, Auth, etc. can be added here */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Navigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/90 p-2 shadow-xl backdrop-blur-lg dark:bg-zinc-900/90 border border-white/20">
       <div className="flex items-center gap-2">
         <button 
           onClick={() => setLocation("/")}
           className={`rounded-full px-6 py-3 font-medium transition-all ${location === "/" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-gray-100"}`}
         >
           Accueil
         </button>
         <button 
           onClick={() => setLocation("/cooking")}
           className={`rounded-full px-6 py-3 font-medium transition-all ${location === "/cooking" ? "bg-gradient-cooking text-white shadow-lg" : "text-muted-foreground hover:bg-gray-100"}`}
         >
           Cuisiner
         </button>
       </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-gradient-background font-sans text-foreground selection:bg-primary/20">
               <Header />
               <main className="container mx-auto min-h-[calc(100vh-140px)] px-4 py-8">
                 <Router />
               </main>
               <Navigation />
               <Footer />
               <Toaster />
            </div>
          </TooltipProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
