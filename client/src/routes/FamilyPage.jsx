import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Users, Copy, Check, UserPlus, ChefHat, Heart, MessageCircle, Crown, ArrowRight, Send, X, Clock, Play, ArrowLeft, Sparkles, Gift, Lock, Calendar } from 'lucide-react';
import { RecipeDetailModal } from '@/components/RecipeDetailModal';
import { RecipeCookingMode } from '@/components/RecipeCookingMode';
import { MemoryCapsuleModal } from '@/components/MemoryCapsuleModal';
import { GUSTALYA_RECIPES } from '@/data/gustalya-recipes';
import { 
  createFamily, 
  getFamilyByCode, 
  joinFamily, 
  getUserFamily, 
  getFamilyMembers, 
  getFamilyStats,
  getFamilyMessages,
  sendFamilyMessage,
  getFamilyRecipes,
  getUserProfile,
  COOKING_LEVELS,
  getMemoryCapsulesByFamily,
  isCapsuleLocked
} from '@/lib/firebase';

export function FamilyPage() {
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [familyData, setFamilyData] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ memberCount: 0, recipeCount: 0, messageCount: 0 });
  const [messages, setMessages] = useState([]);
  const [familyRecipes, setFamilyRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [memoryCapsules, setMemoryCapsules] = useState([]);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState(null);

  const fetchFamilyData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const result = await getUserFamily(currentUser.uid);
      
      if (result) {
        setFamilyData(result);
        const [membersList, familyStats, familyMessages, recipes, capsules] = await Promise.all([
          getFamilyMembers(result.family.id),
          getFamilyStats(result.family.id),
          getFamilyMessages(result.family.id),
          getFamilyRecipes(result.family.id),
          getMemoryCapsulesByFamily(result.family.id)
        ]);
        setMembers(membersList);
        setStats(familyStats);
        setMessages(familyMessages);
        setFamilyRecipes(recipes);
        setMemoryCapsules(capsules);
      } else {
        setFamilyData(null);
      }
    } catch (err) {
      console.error('Failed to fetch family data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, [currentUser]);

  // Fetch member profile when selected
  useEffect(() => {
    const fetchMemberProfile = async () => {
      if (!selectedMember?.userId) {
        setSelectedMemberProfile(null);
        return;
      }
      
      setLoadingProfile(true);
      try {
        const profile = await getUserProfile(selectedMember.userId);
        setSelectedMemberProfile(profile);
      } catch (err) {
        console.error('Failed to fetch member profile:', err);
        setSelectedMemberProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    fetchMemberProfile();
  }, [selectedMember?.userId]);

  // Helper to format joinedAt date
  const formatJoinDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Get cooking level info
  const getCookingLevelInfo = (level) => {
    return COOKING_LEVELS.find(l => l.value === level) || COOKING_LEVELS[0];
  };

  // Get member's shared recipes
  const getMemberRecipes = () => {
    if (!selectedMember) return [];
    return familyRecipes?.filter(r => r.sharedBy === selectedMember.username) || [];
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('Veuillez entrer un nom pour votre famille');
      return;
    }
    
    if (!currentUser) {
      setError('Vous devez être connecté');
      return;
    }
    
    try {
      await createFamily(familyName, currentUser);
      setShowCreateModal(false);
      setFamilyName('');
      setError('');
      fetchFamilyData();
    } catch (err) {
      setError('Erreur lors de la création');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      setError('Veuillez entrer un code d\'invitation');
      return;
    }
    
    if (!currentUser) {
      setError('Vous devez être connecté');
      return;
    }
    
    try {
      const family = await getFamilyByCode(inviteCode.toUpperCase());
      
      if (!family) {
        setError('Code invalide');
        return;
      }
      
      await joinFamily(family.id, currentUser);
      setShowJoinModal(false);
      setInviteCode('');
      setError('');
      fetchFamilyData();
    } catch (err) {
      setError('Erreur lors de la connexion');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !familyData) return;
    
    try {
      await sendFamilyMessage(familyData.family.id, newMessage.trim(), currentUser);
      setNewMessage('');
      const updatedMessages = await getFamilyMessages(familyData.family.id);
      setMessages(updatedMessages);
      const updatedStats = await getFamilyStats(familyData.family.id);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const copyCode = () => {
    if (familyData?.family?.inviteCode) {
      navigator.clipboard.writeText(familyData.family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">🔐</div>
        <h2 className="text-2xl font-bold text-foreground">Connexion requise</h2>
        <p className="text-muted-foreground">Connectez-vous avec Google pour accéder à votre famille</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!familyData) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <div className="mb-4 text-6xl">👨‍👩‍👧‍👦</div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Rejoignez une Famille</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Créez ou rejoignez une famille pour partager vos recettes préférées avec vos proches !
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => { setShowCreateModal(true); setError(''); }}
            data-testid="button-create-family"
            className="group p-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/50 transition-all"
          >
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Créer une Famille</h3>
            <p className="text-sm text-muted-foreground">Commencez une nouvelle famille et invitez vos proches</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground group-hover:text-foreground">
              <span className="font-medium">Commencer</span>
              <ArrowRight size={16} />
            </div>
          </button>

          <button
            onClick={() => { setShowJoinModal(true); setError(''); }}
            data-testid="button-join-family"
            className="group p-8 rounded-2xl border-2 border-foreground/20 bg-gradient-to-br from-foreground/10 to-foreground/5 hover:border-foreground/50 transition-all"
          >
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Rejoindre avec un Code</h3>
            <p className="text-sm text-muted-foreground">Entrez le code d'invitation reçu de votre famille</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground group-hover:text-foreground">
              <span className="font-medium">Rejoindre</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>

        {showCreateModal && (
          <div className={cn(
            "fixed inset-0 z-50",
            isMobile 
              ? "flex items-end bg-black/50" 
              : "flex items-center justify-center bg-black/50 p-4"
          )}>
            <div className={cn(
              "w-full bg-card shadow-xl",
              isMobile 
                ? "rounded-t-3xl animate-in slide-in-from-bottom duration-300" 
                : "max-w-md rounded-2xl p-6 animate-in zoom-in-95"
            )}>
              {isMobile && (
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              )}
              <div className={isMobile ? "px-6 pb-6" : ""}>
                <h2 className="text-2xl font-bold text-card-foreground mb-4">Créer votre Famille</h2>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Nom de la famille (ex: Famille Dupont)"
                  data-testid="input-family-name"
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-xl border border-border px-4 py-3 font-medium text-muted-foreground hover:bg-accent"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateFamily}
                    data-testid="button-confirm-create"
                    className="flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    Créer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showJoinModal && (
          <div className={cn(
            "fixed inset-0 z-50",
            isMobile 
              ? "flex items-end bg-black/50" 
              : "flex items-center justify-center bg-black/50 p-4"
          )}>
            <div className={cn(
              "w-full bg-card shadow-xl",
              isMobile 
                ? "rounded-t-3xl animate-in slide-in-from-bottom duration-300" 
                : "max-w-md rounded-2xl p-6 animate-in zoom-in-95"
            )}>
              {isMobile && (
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
              )}
              <div className={isMobile ? "px-6 pb-6" : ""}>
                <h2 className="text-2xl font-bold text-card-foreground mb-4">Rejoindre une Famille</h2>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Code d'invitation (ex: ABC123)"
                  data-testid="input-invite-code"
                  maxLength={6}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-center text-2xl font-mono tracking-widest text-foreground uppercase focus:border-primary focus:outline-none"
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 rounded-xl border border-border px-4 py-3 font-medium text-muted-foreground hover:bg-accent"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleJoinFamily}
                    data-testid="button-confirm-join"
                    className="flex-1 rounded-xl bg-foreground px-4 py-3 font-bold text-background hover:bg-foreground/90"
                  >
                    Rejoindre
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { family } = familyData;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-accent/5 px-8 py-10">
        <div className="absolute right-4 top-4 text-4xl opacity-40">👨‍👩‍👧‍👦</div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-family-name">
          {family.name}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2 rounded-xl bg-card/80 px-4 py-2 shadow-sm">
            <span className="text-sm text-muted-foreground">Code famille:</span>
            <span className="font-mono font-bold text-foreground tracking-wider" data-testid="text-invite-code">
              {family.inviteCode}
            </span>
            <button
              onClick={copyCode}
              data-testid="button-copy-code"
              className="ml-2 rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {[
          { label: 'Membres', value: stats.memberCount, emoji: '👥', color: 'bg-primary/10', icon: Users },
          { label: 'Recettes', value: stats.recipeCount, emoji: '📖', color: 'bg-foreground/10', icon: ChefHat },
          { label: 'Messages', value: stats.messageCount, emoji: '💬', color: 'bg-accent', icon: MessageCircle },
        ].map((stat, i) => (
          <div key={i} className={cn("relative overflow-hidden rounded-2xl border-2 border-primary/20 p-5 text-center transition-transform hover:scale-105", stat.color)}>
            <div className="mb-2 text-2xl md:text-3xl">{stat.emoji}</div>
            <div className="mb-1 text-2xl font-bold text-foreground" data-testid={`text-stat-${stat.label.toLowerCase()}`}>
              {stat.value}
            </div>
            <div className="text-xs font-medium text-muted-foreground md:text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
          <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Membres de la Famille
          </h2>
          
          <div className="space-y-3">
            {members.map((member, i) => (
              <button
                key={member.id}
                data-testid={`member-card-${i}`}
                onClick={() => setSelectedMember(member)}
                className="flex items-center gap-3 rounded-xl bg-background p-4 border border-border w-full text-left hover:border-primary/50 hover:bg-accent/50 transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-foreground text-xl text-primary-foreground shadow-lg">
                  {member.photoURL ? (
                    <img src={member.photoURL} alt={member.username} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    member.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-card-foreground">{member.username || 'Membre'}</span>
                    {member.role === 'owner' && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {member.role === 'owner' ? 'Créateur' : 'Membre'}
                  </span>
                </div>
                <ArrowRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
          
          <button
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/20 transition-colors w-full justify-center"
            onClick={copyCode}
            data-testid="button-invite-member"
          >
            <UserPlus size={18} />
            Inviter un membre (copier le code)
          </button>
        </div>

        <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
          <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" />
            Messages Famille
          </h2>
          
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun message encore. Soyez le premier !</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="rounded-xl bg-background p-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-card-foreground">{msg.authorName}</span>
                  </div>
                  <p className="text-sm text-card-foreground/80">{msg.content}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Écrire un message..."
              data-testid="input-message"
              className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              data-testid="button-send-message"
              className="rounded-xl bg-primary p-3 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Section Recettes de la Famille */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
        <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
          <ChefHat size={20} className="text-primary" />
          Recettes de la Famille
        </h2>
        
        {familyRecipes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📖</div>
            <p className="text-muted-foreground">Aucune recette partagée encore.</p>
            <p className="text-sm text-muted-foreground mt-2">Allez dans "Mes Recettes" pour partager vos créations avec la famille !</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {familyRecipes.map((recipe) => (
              <div
                key={recipe.id}
                data-testid={`family-recipe-card-${recipe.id}`}
                onClick={() => setSelectedRecipe(recipe)}
                className="group relative overflow-hidden rounded-xl border border-border bg-background p-4 hover:shadow-lg transition-all cursor-pointer"
              >
                {recipe.imageUrl && (
                  <div className="aspect-video mb-3 overflow-hidden rounded-lg">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{recipe.emoji || '🍽️'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-card-foreground truncate">{recipe.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Partagé par {recipe.sharedBy}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>⏱️ {recipe.prepTime || recipe.time || '—'}</span>
                      <span>•</span>
                      <span>{recipe.difficulty || 'Facile'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Capsules Mémoire */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Gift size={20} className="text-primary" />
            Capsules Mémoire
            {memoryCapsules.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({memoryCapsules.length})</span>
            )}
          </h2>
          <button
            onClick={() => setShowCapsuleModal(true)}
            data-testid="button-create-capsule"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Sparkles size={16} />
            Créer
          </button>
        </div>
        
        {memoryCapsules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎁</div>
            <p className="text-muted-foreground">Aucune capsule mémoire encore.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Créez des capsules pour préserver les souvenirs culinaires de votre famille !
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memoryCapsules.map((capsule) => {
              const isLocked = isCapsuleLocked(capsule);
              const formatDate = (timestamp) => {
                if (!timestamp) return '';
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              };
              
              return (
                <div
                  key={capsule.id}
                  data-testid={`capsule-card-${capsule.id}`}
                  onClick={() => !isLocked && setSelectedCapsule(capsule)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border p-4 transition-all",
                    isLocked 
                      ? "border-muted bg-muted/30 cursor-not-allowed" 
                      : "border-border bg-background hover:shadow-lg cursor-pointer hover:border-primary/50"
                  )}
                >
                  {isLocked && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Lock size={32} className="text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Capsule verrouillée</p>
                      <p className="text-xs text-muted-foreground">
                        Ouverture le {formatDate(capsule.unlockDate)}
                      </p>
                    </div>
                  )}
                  
                  {capsule.images?.length > 0 && (
                    <div className="aspect-video mb-3 overflow-hidden rounded-lg">
                      <img
                        src={capsule.images[0]}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{capsule.ritual ? '📜' : '💝'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-card-foreground truncate">{capsule.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{capsule.story}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Par {capsule.authorName}</span>
                        {capsule.recipeTitle && (
                          <>
                            <span>•</span>
                            <span className="truncate">🍽️ {capsule.recipeTitle}</span>
                          </>
                        )}
                      </div>
                      {capsule.ritual && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                          <Calendar size={12} />
                          Tradition
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Recettes Gustalya */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
        <h2 className="text-xl font-bold text-card-foreground mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          Recettes Gustalya
          <span className="ml-2 text-sm font-normal text-muted-foreground">({GUSTALYA_RECIPES.length} recettes)</span>
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUSTALYA_RECIPES.slice(0, 6).map((recipe) => (
            <div
              key={`gustalya-${recipe.id}`}
              data-testid={`gustalya-recipe-card-${recipe.id}`}
              onClick={() => setSelectedRecipe({
                ...recipe,
                imageUrl: recipe.image,
                prepTime: recipe.time,
                sharedBy: 'Gustalya'
              })}
              className="group relative overflow-hidden rounded-xl border border-border bg-background hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{recipe.emoji}</span>
                  <h3 className="font-bold text-white text-sm truncate">{recipe.title}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
                  <span>⏱️ {recipe.time}</span>
                  <span>•</span>
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          showCookingButton={true}
          onStartCooking={() => {
            setCookingRecipe(selectedRecipe);
            setSelectedRecipe(null);
          }}
          showEditButton={false}
          showShareToFamily={false}
          showSocialShare={true}
        />
      )}

      {/* Member Profile Modal */}
      {selectedMember && (
        <div className={cn(
          "fixed inset-0 z-50",
          isMobile 
            ? "bg-background flex flex-col animate-in slide-in-from-right duration-300" 
            : "flex items-center justify-center bg-black/50 p-4"
        )}>
          {isMobile ? (
            <>
              {/* Mobile header */}
              <div className="flex items-center gap-3 p-4 border-b border-border bg-card safe-area-top">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="rounded-full p-2 text-foreground hover:bg-accent transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-foreground">Profil du membre</h1>
              </div>
              
              {/* Mobile content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative mb-4">
                    {selectedMember.photoURL ? (
                      <img 
                        src={selectedMember.photoURL} 
                        alt={selectedMember.username}
                        className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/20 shadow-xl"
                      />
                    ) : (
                      <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-foreground flex items-center justify-center text-4xl text-primary-foreground ring-4 ring-primary/20 shadow-xl">
                        {selectedMember.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    {selectedMember.role === 'owner' && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-2 shadow-lg">
                        <Crown size={16} className="text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {selectedMember.username || 'Membre'}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedMember.role === 'owner' ? 'Créateur de la famille' : 'Membre de la famille'}
                  </p>
                  {selectedMember.email && (
                    <p className="text-sm text-primary mt-2">{selectedMember.email}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Member Info */}
                  <div className="rounded-2xl bg-card border border-border p-4">
                    <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                      <Users size={18} className="text-primary" />
                      Informations
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Membre depuis</span>
                        <span className="text-sm font-medium text-foreground">
                          {formatJoinDate(selectedMember.joinedAt)}
                        </span>
                      </div>
                      {loadingProfile ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : selectedMemberProfile && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Niveau</span>
                            <span className="text-sm font-medium text-foreground flex items-center gap-1">
                              <span>{getCookingLevelInfo(selectedMemberProfile.cookingLevel).icon}</span>
                              {getCookingLevelInfo(selectedMemberProfile.cookingLevel).label}
                            </span>
                          </div>
                          {selectedMemberProfile.recentActivity?.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Dernière activité</span>
                              <span className="text-sm text-foreground">
                                {formatJoinDate(selectedMemberProfile.recentActivity[0]?.timestamp)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-2xl bg-card border border-border p-4">
                    <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                      <ChefHat size={18} className="text-primary" />
                      Statistiques
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-accent/50 p-3 text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {getMemberRecipes().length}
                        </div>
                        <div className="text-xs text-muted-foreground">Recettes partagées</div>
                      </div>
                      <div className="rounded-xl bg-accent/50 p-3 text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {messages?.filter(m => m.authorId === selectedMember.userId || m.authorName === selectedMember.username).length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Messages</div>
                      </div>
                    </div>
                  </div>

                  {/* Shared Recipes */}
                  {getMemberRecipes().length > 0 && (
                    <div className="rounded-2xl bg-card border border-border p-4">
                      <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                        <Heart size={18} className="text-primary" />
                        Recettes partagées
                      </h3>
                      <div className="space-y-2">
                        {getMemberRecipes().slice(0, 5).map((recipe) => (
                          <button
                            key={recipe.id}
                            onClick={() => {
                              setSelectedMember(null);
                              setSelectedRecipe(recipe);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                          >
                            {recipe.image ? (
                              <img src={recipe.image} alt={recipe.title} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-lg">
                                {recipe.emoji || '🍽️'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">{recipe.title}</div>
                              <div className="text-xs text-muted-foreground">{recipe.time} • {recipe.difficulty}</div>
                            </div>
                            <ArrowRight size={16} className="text-muted-foreground" />
                          </button>
                        ))}
                        {getMemberRecipes().length > 5 && (
                          <p className="text-xs text-center text-muted-foreground pt-2">
                            +{getMemberRecipes().length - 5} autres recettes
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div 
              className="w-full max-w-md rounded-2xl bg-card shadow-2xl animate-in zoom-in-95 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Desktop header */}
              <div className="relative h-32 bg-gradient-to-br from-primary to-foreground">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm p-2 text-white hover:bg-black/50 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                  {selectedMember.photoURL ? (
                    <img 
                      src={selectedMember.photoURL} 
                      alt={selectedMember.username}
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-card shadow-xl"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-foreground flex items-center justify-center text-3xl text-primary-foreground ring-4 ring-card shadow-xl">
                      {selectedMember.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  {selectedMember.role === 'owner' && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                      <Crown size={14} className="text-yellow-900" />
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop content */}
              <div className="pt-16 pb-6 px-6 max-h-[70vh] overflow-y-auto">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-card-foreground mb-1">
                    {selectedMember.username || 'Membre'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.role === 'owner' ? 'Créateur de la famille' : 'Membre de la famille'}
                  </p>
                  {selectedMember.email && (
                    <p className="text-xs text-primary mt-2">{selectedMember.email}</p>
                  )}
                </div>

                {/* Member Info */}
                <div className="text-left space-y-2 mb-4 p-3 rounded-xl bg-accent/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Membre depuis</span>
                    <span className="font-medium text-foreground">{formatJoinDate(selectedMember.joinedAt)}</span>
                  </div>
                  {loadingProfile ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : selectedMemberProfile && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Niveau</span>
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span>{getCookingLevelInfo(selectedMemberProfile.cookingLevel).icon}</span>
                          {getCookingLevelInfo(selectedMemberProfile.cookingLevel).label}
                        </span>
                      </div>
                      {selectedMemberProfile.recentActivity?.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Dernière activité</span>
                          <span className="text-foreground">{formatJoinDate(selectedMemberProfile.recentActivity[0]?.timestamp)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-accent/50 p-3 text-center">
                    <div className="text-xl font-bold text-foreground">
                      {getMemberRecipes().length}
                    </div>
                    <div className="text-xs text-muted-foreground">Recettes</div>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-3 text-center">
                    <div className="text-xl font-bold text-foreground">
                      {messages?.filter(m => m.authorId === selectedMember.userId || m.authorName === selectedMember.username).length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Messages</div>
                  </div>
                </div>

                {/* Shared Recipes */}
                {getMemberRecipes().length > 0 && (
                  <div className="text-left">
                    <h3 className="font-semibold text-sm text-card-foreground mb-2 flex items-center gap-2">
                      <Heart size={14} className="text-primary" />
                      Recettes partagées
                    </h3>
                    <div className="space-y-1.5">
                      {getMemberRecipes().slice(0, 4).map((recipe) => (
                        <button
                          key={recipe.id}
                          onClick={() => {
                            setSelectedMember(null);
                            setSelectedRecipe(recipe);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                        >
                          {recipe.image ? (
                            <img src={recipe.image} alt={recipe.title} className="w-8 h-8 rounded-md object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm">
                              {recipe.emoji || '🍽️'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs text-foreground truncate">{recipe.title}</div>
                            <div className="text-[10px] text-muted-foreground">{recipe.time}</div>
                          </div>
                          <ArrowRight size={12} className="text-muted-foreground" />
                        </button>
                      ))}
                      {getMemberRecipes().length > 4 && (
                        <p className="text-[10px] text-center text-muted-foreground pt-1">
                          +{getMemberRecipes().length - 4} autres
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cooking Mode */}
      {cookingRecipe && (
        <RecipeCookingMode 
          recipe={cookingRecipe} 
          onClose={() => setCookingRecipe(null)}
        />
      )}

      {/* Memory Capsule Creation Modal */}
      {showCapsuleModal && familyData && (
        <MemoryCapsuleModal
          onClose={() => setShowCapsuleModal(false)}
          familyId={familyData.family.id}
          currentUser={currentUser}
          familyMembers={members}
          familyRecipes={familyRecipes}
          onSuccess={() => {
            fetchFamilyData();
          }}
        />
      )}

      {/* Capsule Detail Modal */}
      {selectedCapsule && (
        <div className={cn(
          "fixed inset-0 z-50",
          isMobile 
            ? "bg-background flex flex-col" 
            : "flex items-center justify-center bg-black/50 p-4"
        )}>
          <div className={cn(
            isMobile 
              ? "flex-1 flex flex-col" 
              : "w-full max-w-lg max-h-[90vh] rounded-2xl bg-card shadow-2xl flex flex-col overflow-hidden"
          )}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
              <button 
                onClick={() => setSelectedCapsule(null)}
                className="rounded-full p-2 hover:bg-accent transition-colors"
              >
                {isMobile ? <ArrowLeft size={20} /> : <X size={20} />}
              </button>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{selectedCapsule.title}</h2>
                <p className="text-xs text-muted-foreground">Par {selectedCapsule.authorName}</p>
              </div>
              {selectedCapsule.ritual && (
                <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs flex items-center gap-1">
                  <Calendar size={12} />
                  Tradition
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Images */}
              {selectedCapsule.images?.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedCapsule.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className={cn(
                        "rounded-xl object-cover w-full",
                        i === 0 && selectedCapsule.images.length > 1 ? "col-span-2 aspect-video" : "aspect-square"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Story */}
              <div className="bg-accent/20 rounded-xl p-4">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selectedCapsule.story}</p>
              </div>

              {/* Recipe link */}
              {selectedCapsule.recipeTitle && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Recette liée</p>
                    <p className="font-medium text-foreground">{selectedCapsule.recipeTitle}</p>
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedCapsule.participants?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Users size={14} />
                    Personnes présentes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCapsule.participants.map((name, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-accent text-foreground text-sm">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ritual info */}
              {selectedCapsule.ritual && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    📜 Tradition familiale
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCapsule.ritual.description || 'Tradition récurrente'}
                  </p>
                  <p className="text-xs text-primary mt-2">
                    {selectedCapsule.ritual.frequency === 'weekly' && '📅 Chaque semaine'}
                    {selectedCapsule.ritual.frequency === 'monthly' && '🗓️ Chaque mois'}
                    {selectedCapsule.ritual.frequency === 'yearly' && '🎂 Chaque année'}
                    {selectedCapsule.ritual.frequency === 'special' && '✨ Occasion spéciale'}
                  </p>
                </div>
              )}

              {/* Event date */}
              {selectedCapsule.eventDate && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={14} />
                  Souvenir du {(() => {
                    const date = selectedCapsule.eventDate.toDate ? selectedCapsule.eventDate.toDate() : new Date(selectedCapsule.eventDate);
                    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
