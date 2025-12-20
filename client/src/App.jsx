import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { CookingAssistant } from './components/CookingAssistant';
import { TimerGrid } from './components/TimerGrid';
import { StatusDisplay } from './components/StatusDisplay';
import { playNotificationSound } from './utils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import { Home as HomeIcon, Sparkles, ChefHat, User, LogOut, Users, Menu, X, HelpCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { FamilyPage } from '@/routes/FamilyPage';
import { RecipesPage } from '@/routes/RecipesPage';
import { Home as HomePage } from '@/routes/HomePage';
import { ProfilePage } from '@/routes/ProfilePage';
import { HelpPage } from '@/routes/HelpPage';
import { MentionsLegales, PolitiqueConfidentialite, CGU, PolitiqueCookies } from '@/routes/LegalPages';
import { ThemeToggle } from './components/ThemeToggle';
import './index.css';

const TimerContext = createContext();

export function useTimers() {
  return useContext(TimerContext);
}

function TimerProvider({ children }) {
  const [timers, setTimers] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (!timer.isRunning || timer.remainingTime <= 0) return timer;
        const newTime = timer.remainingTime - 1;
        if (newTime === 0) {
          playNotificationSound();
        }
        return { ...timer, remainingTime: newTime };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTimer = (name, duration, category) => {
    const newTimer = {
      id: Date.now(),
      ingredientId: "custom",
      name,
      totalTime: duration,
      remainingTime: duration,
      isRunning: false,
      category
    };
    setTimers(prev => [...prev, newTimer]);
  };

  const toggleTimer = (id) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, isRunning: !t.isRunning } : t
    ));
  };

  const resetTimer = (id) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, remainingTime: t.totalTime, isRunning: false } : t
    ));
  };

  const deleteTimer = (id) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const clearAllTimers = () => {
    setTimers([]);
  };

  return (
    <TimerContext.Provider value={{ timers, addTimer, toggleTimer, resetTimer, deleteTimer, clearAllTimers }}>
      {children}
    </TimerContext.Provider>
  );
}

function CookingPage() {
  const navigate = useNavigate();
  const { timers, addTimer, toggleTimer, resetTimer, deleteTimer, clearAllTimers } = useTimers();

  const handleAddTimer = (name, duration, category) => {
    addTimer(name, duration, category);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6 animate-in slide-in-from-right-10 fade-in duration-300">
      <div className="flex flex-col gap-4 text-center">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-foreground">👨‍🍳 Assistant de Cuisine Pro</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Le mode expert pour gérer toutes vos cuissons simultanément.</p>
        </div>
        <div className="flex justify-center">
          <StatusDisplay timers={timers} />
        </div>
      </div>

      <div className="space-y-6">
        <CookingAssistant onAddTimer={handleAddTimer} />
        
        {timers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Timers Actifs</h3>
              <button onClick={clearAllTimers} className="text-xs sm:text-sm font-medium text-red-500 hover:underline">
                Tout effacer
              </button>
            </div>
            <TimerGrid 
              timers={timers} 
              onToggle={toggleTimer} 
              onReset={resetTimer} 
              onDelete={deleteTimer} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-6xl">🚧</div>
      <h2 className="text-2xl font-bold text-foreground">{title} - En construction</h2>
      <p className="text-muted-foreground">Cette fonctionnalité sera bientôt disponible !</p>
      <Link 
        to="/"
        className="mt-6 rounded-xl bg-primary px-6 py-2 text-primary-foreground shadow-md hover:bg-primary/90"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const { currentUser, login, logout, loading } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/', label: 'Notre Table', icon: <HomeIcon size={20} />, mobileLabel: 'Table' },
    { path: '/famille', label: 'Ma Famille', icon: <Users size={20} />, mobileLabel: 'Famille' },
    { path: '/mes-recettes', label: 'Mes Recettes', icon: <Sparkles size={20} />, mobileLabel: 'Recettes' },
    { path: '/guide-cuisson', label: 'Guide Cuisson', icon: <ChefHat size={20} />, mobileLabel: 'Cuisson' },
    { path: '/profil', label: 'Profil', icon: <User size={20} />, mobileLabel: 'Profil' },
    { path: '/aide', label: 'Aide', icon: <HelpCircle size={20} />, mobileLabel: 'Aide' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Aller au contenu principal
      </a>
      {!isMobile && (
        <nav role="navigation" aria-label="Navigation principale" className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-105">
              <img src="/favicon.png" alt="Gustalya" className="h-10 w-10 rounded-full transition-transform group-hover:rotate-6" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gustalya
              </span>
            </Link>

            <div className="flex items-center gap-0.5">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all duration-300",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "transition-transform duration-300",
                    isActive(item.path) && "scale-110"
                  )}>
                    {item.icon}
                  </span>
                  <span className="hidden lg:inline">{item.label}</span>
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-accent/50 px-3 py-2">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="" className="h-7 w-7 rounded-full ring-2 ring-primary/20" />
                    )}
                    <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    data-testid="button-logout"
                    className="flex items-center gap-2 rounded-xl bg-destructive/10 p-2.5 text-destructive transition-all hover:bg-destructive/20 hover:scale-105"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  disabled={loading}
                  data-testid="button-login"
                  className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Connexion Google'}
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {isMobile && (
        <header role="banner" className="sticky top-0 z-50 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl safe-top">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="Gustalya" className="h-8 w-8 rounded-full" />
              <span className="text-lg font-bold text-foreground">Gustalya</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {currentUser ? (
                <button onClick={logout} className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                  <LogOut size={18} />
                </button>
              ) : (
                <button
                  onClick={login}
                  disabled={loading}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main 
        role="main"
        id="main-content"
        className={cn(
          "mx-auto max-w-6xl",
          isMobile ? "px-4 py-6 pb-28" : "px-8 py-8"
        )}
      >
        {children}
      </main>

      {!isMobile && (
        <footer role="contentinfo" className="border-t border-border bg-card/50 mt-12">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img src="/favicon.png" alt="Gustalya" className="h-5 w-5 rounded-full" />
                <span>© 2024 Gustalya. Tous droits réservés.</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-mentions-legales">Mentions légales</Link>
                <Link to="/politique-confidentialite" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-privacy">Confidentialité</Link>
                <Link to="/cgu" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-cgu">CGU</Link>
                <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-cookies">Cookies</Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {isMobile && (
        <>
          <footer role="contentinfo" className="border-t border-border bg-card/30 py-4 mb-20">
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary" data-testid="mobile-mentions-legales">Mentions légales</Link>
              <span className="text-muted-foreground/30">•</span>
              <Link to="/politique-confidentialite" className="text-muted-foreground hover:text-primary" data-testid="mobile-privacy">Confidentialité</Link>
              <span className="text-muted-foreground/30">•</span>
              <Link to="/cgu" className="text-muted-foreground hover:text-primary" data-testid="mobile-cgu">CGU</Link>
              <span className="text-muted-foreground/30">•</span>
              <Link to="/cookies" className="text-muted-foreground hover:text-primary" data-testid="mobile-cookies">Cookies</Link>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/60 mt-2">© 2024 Gustalya</p>
          </footer>
          <nav role="navigation" aria-label="Navigation principale mobile" className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl safe-bottom">
            <div className="grid grid-cols-6 gap-0.5 px-1 py-2">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-200",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary scale-105" 
                      : "text-muted-foreground active:scale-95"
                  )}
                >
                  <span className={cn(
                    "transition-transform",
                    isActive(item.path) && "scale-110"
                  )}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-medium">{item.mobileLabel}</span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

function MainApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/famille" element={<FamilyPage />} />
        <Route path="/mes-recettes" element={<RecipesPage />} />
        <Route path="/guide-cuisson" element={<CookingPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/aide" element={<HelpPage />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/cookies" element={<PolitiqueCookies />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <TimerProvider>
            <MainApp />
          </TimerProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
