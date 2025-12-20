import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, Shield, FileText, Cookie } from 'lucide-react';

function LegalLayout({ children, title, icon: Icon }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-300">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-testid="link-back-home"
      >
        <ArrowLeft size={18} />
        Retour à l'accueil
      </Link>
      
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        </div>
        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
      
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
        <Link to="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-mentions-legales">Mentions légales</Link>
        <Link to="/politique-confidentialite" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-privacy">Confidentialité</Link>
        <Link to="/cgu" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-cgu">CGU</Link>
        <Link to="/cookies" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-cookies">Cookies</Link>
      </div>
    </div>
  );
}

export function MentionsLegales() {
  return (
    <LegalLayout title="Mentions Légales" icon={Scale}>
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Éditeur du site</h2>
          <p className="text-muted-foreground leading-relaxed">
            Le site <strong>Gustalya</strong> (accessible à l'adresse gustalya.app) est édité par :
          </p>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            <li><strong>Nom :</strong> Gustalya</li>
            <li><strong>Statut :</strong> Application web de partage de recettes familiales</li>
            <li><strong>Email de contact :</strong> contact@gustalya.app</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Hébergement</h2>
          <p className="text-muted-foreground leading-relaxed">
            Le site est hébergé par :
          </p>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            <li><strong>Hébergeur :</strong> Netlify, Inc.</li>
            <li><strong>Adresse :</strong> 512 2nd Street, Suite 200, San Francisco, CA 94107, USA</li>
            <li><strong>Site web :</strong> www.netlify.com</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Propriété intellectuelle</h2>
          <p className="text-muted-foreground leading-relaxed">
            L'ensemble des contenus présents sur Gustalya (textes, images, logos, icônes, sons, logiciels, 
            base de données) sont protégés par le droit d'auteur et le droit des marques.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Les recettes partagées par les utilisateurs restent leur propriété. En les publiant sur Gustalya, 
            ils accordent une licence non exclusive de diffusion au sein de la plateforme et de leurs cercles familiaux.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Responsabilité</h2>
          <p className="text-muted-foreground leading-relaxed">
            Gustalya s'efforce de fournir des informations exactes et à jour. Cependant, nous ne pouvons 
            garantir l'exactitude, la complétude ou l'actualité des informations diffusées sur le site.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Les recettes et conseils de cuisson sont fournis à titre indicatif. L'utilisateur reste 
            responsable de l'adaptation des temps de cuisson selon son matériel et ses préférences.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Crédits</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Icônes :</strong> Lucide Icons (lucide.dev)<br />
            <strong>Polices :</strong> Google Fonts<br />
            <strong>Framework :</strong> React, TailwindCSS
          </p>
        </div>

        <p className="text-sm text-muted-foreground/70 pt-4 border-t border-border">
          Dernière mise à jour : Décembre 2024
        </p>
      </section>
    </LegalLayout>
  );
}

export function PolitiqueConfidentialite() {
  return (
    <LegalLayout title="Politique de Confidentialité" icon={Shield}>
      <section className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Gustalya s'engage à protéger votre vie privée. Cette politique explique comment nous collectons, 
          utilisons et protégeons vos données personnelles conformément au Règlement Général sur la 
          Protection des Données (RGPD).
        </p>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Données collectées</h2>
          <p className="text-muted-foreground leading-relaxed">Nous collectons les données suivantes :</p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Données d'identification :</strong> Nom, prénom, adresse email (via Google Sign-In)</li>
            <li><strong>Photo de profil :</strong> Issue de votre compte Google</li>
            <li><strong>Données de contenu :</strong> Recettes créées, commentaires, préférences culinaires</li>
            <li><strong>Données techniques :</strong> Adresse IP, type de navigateur, pages visitées</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Finalités du traitement</h2>
          <p className="text-muted-foreground leading-relaxed">Vos données sont utilisées pour :</p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li>Gérer votre compte et votre authentification</li>
            <li>Permettre le partage de recettes au sein de vos cercles familiaux</li>
            <li>Personnaliser votre expérience (préférences de voix, thème)</li>
            <li>Améliorer nos services et corriger les bugs</li>
            <li>Assurer la sécurité de la plateforme</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Base légale</h2>
          <p className="text-muted-foreground leading-relaxed">
            Le traitement de vos données repose sur :
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Votre consentement :</strong> lors de la création de compte</li>
            <li><strong>L'exécution du contrat :</strong> pour vous fournir nos services</li>
            <li><strong>Notre intérêt légitime :</strong> pour améliorer la plateforme</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Stockage et sécurité</h2>
          <p className="text-muted-foreground leading-relaxed">
            Vos données sont stockées de manière sécurisée sur les serveurs de Firebase (Google Cloud) 
            situés dans l'Union Européenne. Nous utilisons le chiffrement SSL/TLS pour toutes les 
            communications et l'authentification sécurisée OAuth 2.0.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Durée de conservation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, 
            vos données personnelles sont effacées dans un délai de 30 jours, sauf obligation légale contraire.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Vos droits (RGPD)</h2>
          <p className="text-muted-foreground leading-relaxed">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format lisible</li>
            <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
            <li><strong>Droit de retrait du consentement :</strong> à tout moment</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Pour exercer ces droits, contactez-nous à : <strong>contact@gustalya.app</strong>
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Partage des données</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nous ne vendons jamais vos données. Elles peuvent être partagées avec :
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Google/Firebase :</strong> pour l'authentification et le stockage</li>
            <li><strong>Netlify :</strong> pour l'hébergement</li>
            <li><strong>Vos cercles familiaux :</strong> selon vos paramètres de partage</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pour toute question relative à cette politique ou pour exercer vos droits :<br />
            <strong>Email :</strong> contact@gustalya.app
          </p>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Vous pouvez également déposer une réclamation auprès de la CNIL (Commission Nationale 
            de l'Informatique et des Libertés) : www.cnil.fr
          </p>
        </div>

        <p className="text-sm text-muted-foreground/70 pt-4 border-t border-border">
          Dernière mise à jour : Décembre 2024
        </p>
      </section>
    </LegalLayout>
  );
}

export function CGU() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation" icon={FileText}>
      <section className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          En utilisant Gustalya, vous acceptez les présentes Conditions Générales d'Utilisation (CGU). 
          Veuillez les lire attentivement.
        </p>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Objet</h2>
          <p className="text-muted-foreground leading-relaxed">
            Gustalya est une plateforme de partage de recettes familiales permettant aux utilisateurs 
            de créer, organiser et partager leurs recettes de cuisine au sein de cercles familiaux privés.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Inscription et compte</h2>
          <ul className="space-y-2 text-muted-foreground list-disc list-inside">
            <li>L'inscription est gratuite et s'effectue via Google Sign-In</li>
            <li>Vous devez avoir au moins 13 ans pour utiliser Gustalya</li>
            <li>Vous êtes responsable de la confidentialité de votre compte</li>
            <li>Vous vous engagez à fournir des informations exactes</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Utilisation du service</h2>
          <p className="text-muted-foreground leading-relaxed">Vous vous engagez à :</p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li>Utiliser Gustalya de manière légale et respectueuse</li>
            <li>Ne pas publier de contenu illicite, offensant ou contraire aux bonnes mœurs</li>
            <li>Respecter les droits de propriété intellectuelle d'autrui</li>
            <li>Ne pas tenter de pirater ou perturber le fonctionnement du service</li>
            <li>Ne pas utiliser le service à des fins commerciales sans autorisation</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Contenu utilisateur</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Propriété :</strong> Vous conservez la propriété de vos recettes et contenus.<br />
            <strong>Licence :</strong> En publiant du contenu, vous accordez à Gustalya une licence 
            non exclusive pour l'afficher et le partager selon vos paramètres de confidentialité.<br />
            <strong>Responsabilité :</strong> Vous êtes seul responsable du contenu que vous publiez.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Propriété intellectuelle</h2>
          <p className="text-muted-foreground leading-relaxed">
            Le logo, le nom Gustalya, le design et le code source de l'application sont protégés. 
            Toute reproduction sans autorisation est interdite.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Responsabilités</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Gustalya :</strong> Nous nous efforçons de maintenir le service disponible et sécurisé, 
            mais ne garantissons pas une disponibilité à 100%.<br /><br />
            <strong>Recettes :</strong> Les temps de cuisson et conseils sont indicatifs. Adaptez-les 
            selon votre équipement et vos préférences. En cas d'allergie alimentaire, vérifiez toujours 
            les ingrédients.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Modération</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nous nous réservons le droit de supprimer tout contenu contraire aux présentes CGU 
            et de suspendre ou supprimer les comptes en infraction, sans préavis.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">8. Modification des CGU</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nous pouvons modifier ces CGU à tout moment. Les modifications entrent en vigueur 
            dès leur publication. En continuant à utiliser Gustalya, vous acceptez les nouvelles conditions.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">9. Résiliation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Vous pouvez supprimer votre compte à tout moment depuis votre profil. 
            Gustalya peut également résilier votre accès en cas de violation des CGU.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">10. Droit applicable</h2>
          <p className="text-muted-foreground leading-relaxed">
            Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux 
            français seront compétents.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pour toute question : <strong>contact@gustalya.app</strong>
          </p>
        </div>

        <p className="text-sm text-muted-foreground/70 pt-4 border-t border-border">
          Dernière mise à jour : Décembre 2024
        </p>
      </section>
    </LegalLayout>
  );
}

export function PolitiqueCookies() {
  return (
    <LegalLayout title="Politique des Cookies" icon={Cookie}>
      <section className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Cette politique explique comment Gustalya utilise les cookies et technologies similaires.
        </p>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">1. Qu'est-ce qu'un cookie ?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. 
            Il permet de mémoriser vos préférences et d'améliorer votre expérience.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">2. Types de cookies utilisés</h2>
          
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <h3 className="font-semibold text-foreground mb-2">✅ Cookies essentiels (obligatoires)</h3>
              <p className="text-sm text-muted-foreground">
                Nécessaires au fonctionnement du site. Ils permettent l'authentification, 
                la sécurité et la mémorisation de vos préférences (thème, voix).
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Session d'authentification Firebase</li>
                <li>Préférences utilisateur (localStorage)</li>
                <li>Token de sécurité</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h3 className="font-semibold text-foreground mb-2">📊 Cookies analytiques (optionnels)</h3>
              <p className="text-sm text-muted-foreground">
                Nous aident à comprendre comment vous utilisez Gustalya pour améliorer nos services.
              </p>
              <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                <li>Firebase Analytics (anonymisé)</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">3. Données stockées localement</h2>
          <p className="text-muted-foreground leading-relaxed">
            Gustalya utilise également le stockage local (localStorage) pour mémoriser :
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li>Votre préférence de thème (clair/sombre)</li>
            <li>Votre préférence de voix (femme/homme) pour le mode cuisine</li>
            <li>Vos brouillons de recettes non enregistrés</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">4. Durée de conservation</h2>
          <ul className="space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Cookies de session :</strong> supprimés à la fermeture du navigateur</li>
            <li><strong>Cookies persistants :</strong> jusqu'à 1 an maximum</li>
            <li><strong>LocalStorage :</strong> jusqu'à suppression manuelle</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">5. Gérer vos cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Vous pouvez gérer les cookies via les paramètres de votre navigateur :
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Chrome :</strong> Paramètres → Confidentialité → Cookies</li>
            <li><strong>Firefox :</strong> Options → Vie privée → Cookies</li>
            <li><strong>Safari :</strong> Préférences → Confidentialité</li>
            <li><strong>Edge :</strong> Paramètres → Cookies et autorisations</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-3">
            <strong>Note :</strong> La désactivation des cookies essentiels peut affecter le fonctionnement de Gustalya.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">6. Services tiers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Les services suivants peuvent déposer leurs propres cookies :
          </p>
          <ul className="mt-3 space-y-2 text-muted-foreground list-disc list-inside">
            <li><strong>Google/Firebase :</strong> authentification et analytics</li>
            <li><strong>Netlify :</strong> hébergement et CDN</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Consultez leurs politiques de confidentialité respectives pour plus d'informations.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pour toute question : <strong>contact@gustalya.app</strong>
          </p>
        </div>

        <p className="text-sm text-muted-foreground/70 pt-4 border-t border-border">
          Dernière mise à jour : Décembre 2024
        </p>
      </section>
    </LegalLayout>
  );
}
