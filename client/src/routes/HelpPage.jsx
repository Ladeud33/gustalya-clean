import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, MessageCircle, Mail, HelpCircle, BookOpen, Clock, Users, ChefHat, Share2, Timer } from 'lucide-react';

const FAQ_ITEMS = [
  {
    category: 'Compte',
    icon: <HelpCircle size={20} />,
    questions: [
      {
        q: "Comment créer un compte ?",
        a: "Cliquez sur le bouton 'Connexion Google' en haut de la page. Votre compte sera créé automatiquement avec votre compte Google."
      },
      {
        q: "Comment modifier mon profil ?",
        a: "Allez dans l'onglet 'Profil' et cliquez sur 'Modifier le profil'. Vous pouvez changer votre nom d'affichage et votre photo."
      },
      {
        q: "Comment me déconnecter ?",
        a: "Cliquez sur le bouton de déconnexion (icône de porte) en haut à droite de l'écran."
      }
    ]
  },
  {
    category: 'Recettes',
    icon: <BookOpen size={20} />,
    questions: [
      {
        q: "Comment créer une recette ?",
        a: "Allez dans 'Mes Recettes' et cliquez sur le bouton '+ Nouvelle Recette'. Remplissez le formulaire avec le titre, les ingrédients et les étapes de préparation."
      },
      {
        q: "Comment ajouter une photo à ma recette ?",
        a: "Dans le formulaire de création/modification, cliquez sur la zone d'image pour télécharger une photo depuis votre appareil."
      },
      {
        q: "Comment modifier ou supprimer une recette ?",
        a: "Survolez la carte de votre recette pour voir les boutons de modification (crayon) et de suppression (poubelle)."
      },
      {
        q: "Comment ajouter des durées aux étapes ?",
        a: "Lors de la création d'une recette, chaque étape a un champ 'Durée' optionnel. Entrez le temps (ex: '10 min', '1 heure') pour activer les minuteurs automatiques."
      }
    ]
  },
  {
    category: 'Famille',
    icon: <Users size={20} />,
    questions: [
      {
        q: "Comment créer une famille ?",
        a: "Allez dans l'onglet 'Ma Famille' et cliquez sur 'Créer une Famille'. Donnez un nom à votre famille et un code d'invitation sera généré automatiquement."
      },
      {
        q: "Comment rejoindre une famille existante ?",
        a: "Dans l'onglet 'Ma Famille', cliquez sur 'Rejoindre avec un Code' et entrez le code d'invitation partagé par un membre de la famille."
      },
      {
        q: "Comment partager une recette avec ma famille ?",
        a: "Dans 'Mes Recettes', survolez une recette et cliquez sur l'icône de partage. Confirmez le partage dans la fenêtre qui s'affiche."
      },
      {
        q: "Où voir les recettes partagées par ma famille ?",
        a: "Les recettes partagées apparaissent dans la section 'Recettes de la Famille' sur la page 'Ma Famille'."
      }
    ]
  },
  {
    category: 'Minuteurs',
    icon: <Timer size={20} />,
    questions: [
      {
        q: "Comment utiliser les minuteurs ?",
        a: "Allez dans 'Guide Cuisson', sélectionnez un ingrédient, ajustez le poids et le mode de cuisson, puis ajoutez le minuteur. Il démarrera automatiquement."
      },
      {
        q: "Comment lancer les minuteurs depuis une recette ?",
        a: "Ouvrez une recette et cliquez sur 'Cuisiner'. Le mode cuisson s'ouvre avec les étapes et les minuteurs intégrés pour chaque étape avec une durée."
      },
      {
        q: "Que se passe-t-il quand un minuteur se termine ?",
        a: "Une notification sonore retentit et le minuteur passe en rouge pour vous alerter que la cuisson est terminée."
      },
      {
        q: "Comment gérer plusieurs minuteurs ?",
        a: "Tous vos minuteurs actifs sont visibles dans le 'Guide Cuisson'. Vous pouvez les mettre en pause, les redémarrer ou les supprimer individuellement."
      }
    ]
  },
  {
    category: 'Mode Cuisson',
    icon: <ChefHat size={20} />,
    questions: [
      {
        q: "C'est quoi le mode cuisson ?",
        a: "Le mode cuisson vous guide pas à pas dans la préparation d'une recette. Il affiche chaque étape avec un minuteur dédié si une durée est indiquée."
      },
      {
        q: "Comment utiliser le contrôle vocal ?",
        a: "En mode cuisson, appuyez sur le bouton micro et dites 'suivant' ou 'précédent' pour naviguer entre les étapes sans toucher l'écran."
      },
      {
        q: "Puis-je cuisiner plusieurs recettes en même temps ?",
        a: "Oui ! Dans 'Mes Recettes', activez le mode sélection, choisissez plusieurs recettes, puis cliquez sur 'Cuisiner la sélection'."
      }
    ]
  }
];

const TIPS = [
  { icon: "💡", title: "Astuce photo", tip: "Prenez vos photos de plats avec une lumière naturelle pour de meilleurs résultats." },
  { icon: "⏱️", title: "Minuteurs précis", tip: "Ajoutez des durées aux étapes de vos recettes pour avoir des minuteurs automatiques." },
  { icon: "👨‍👩‍👧‍👦", title: "Partage famille", tip: "Partagez le code de votre famille par WhatsApp pour inviter vos proches facilement." },
  { icon: "🎤", title: "Mains libres", tip: "Utilisez le contrôle vocal en mode cuisson quand vous avez les mains occupées." },
];

export function HelpPage() {
  const [openSection, setOpenSection] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleSection = (category) => {
    setOpenSection(openSection === category ? null : category);
    setOpenQuestion(null);
  };

  const toggleQuestion = (key) => {
    setOpenQuestion(openQuestion === key ? null : key);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <div className="text-5xl mb-4">🆘</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Centre d'Aide</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Trouvez des réponses à vos questions et apprenez à utiliser toutes les fonctionnalités de Gustalya.
        </p>
      </div>

      {/* Quick Tips */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIPS.map((tip, i) => (
          <div
            key={i}
            className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10 p-4 hover:border-primary/40 transition-all"
          >
            <div className="text-3xl mb-2">{tip.icon}</div>
            <h3 className="font-bold text-foreground mb-1">{tip.title}</h3>
            <p className="text-sm text-muted-foreground">{tip.tip}</p>
          </div>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <HelpCircle size={24} className="text-primary" />
            Questions Fréquentes
          </h2>
        </div>

        <div className="divide-y divide-border">
          {FAQ_ITEMS.map((section) => (
            <div key={section.category}>
              <button
                onClick={() => toggleSection(section.category)}
                data-testid={`faq-section-${section.category.toLowerCase()}`}
                className="w-full flex items-center justify-between p-5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary">{section.icon}</span>
                  <span className="font-bold text-card-foreground">{section.category}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {section.questions.length} questions
                  </span>
                </div>
                <ChevronDown
                  size={20}
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    openSection === section.category && "rotate-180"
                  )}
                />
              </button>

              {openSection === section.category && (
                <div className="bg-background/50 divide-y divide-border/50">
                  {section.questions.map((item, idx) => {
                    const key = `${section.category}-${idx}`;
                    return (
                      <div key={idx}>
                        <button
                          onClick={() => toggleQuestion(key)}
                          data-testid={`faq-question-${section.category.toLowerCase()}-${idx}`}
                          className="w-full flex items-center justify-between p-4 pl-12 hover:bg-accent/30 transition-colors text-left"
                        >
                          <span className="font-medium text-card-foreground">{item.q}</span>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2",
                              openQuestion === key && "rotate-180"
                            )}
                          />
                        </button>
                        {openQuestion === key && (
                          <div className="px-12 pb-4 text-muted-foreground text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <MessageCircle size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-card-foreground">Besoin d'aide ?</h3>
              <p className="text-sm text-muted-foreground">Notre équipe est là pour vous</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Si vous ne trouvez pas la réponse à votre question dans la FAQ, n'hésitez pas à nous contacter.
          </p>
          <a
            href="mailto:support@gustalya.com"
            data-testid="link-contact-email"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Mail size={18} />
            Nous contacter
          </a>
        </div>

        <div className="rounded-2xl border-2 border-primary/20 bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-green-500/10 p-3">
              <Share2 size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-card-foreground">Partagez Gustalya</h3>
              <p className="text-sm text-muted-foreground">Invitez vos amis à cuisiner</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Vous aimez Gustalya ? Partagez l'application avec vos amis et votre famille !
          </p>
          <a
            href="https://wa.me/?text=Découvrez%20Gustalya%2C%20l'application%20de%20recettes%20familiales%20!%20🍽️"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-share-whatsapp"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 px-4 py-3 font-bold text-white hover:bg-green-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Partager sur WhatsApp
          </a>
        </div>
      </div>

      {/* App Version */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Gustalya v1.0 • Made with ❤️ pour les familles gourmandes</p>
      </div>
    </div>
  );
}
