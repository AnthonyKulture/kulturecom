# Plan de refonte : anthonyprofit.com (UI/UX + SEO/GEO)

**Date :** 2026-10-21 · **Objectif :** un site plus simple, un positionnement très fort, et un visiteur qui clique sur ce qu'il cherche dès son arrivée. On garde une touche innovante. Ce plan prolonge `ACTION-PLAN.md`, qui couvre le SEO technique et les actions hors code.

**Sources :**
- inventaire du code actuel ;
- captures de l'accueil en ligne (1440 × 900 et 390 × 844) ;
- analyse de redback-optimisation.fr : accueil, sitemaps, llms.txt, robots.txt, données structurées, 13 pages ;
- comparatif de 8 consultants SEO/GEO indépendants bien classés : Sarah El Gharbi, Paul Vengeons, Julien Gourdon, Le Référenceur Futé, EnovSEO, Antoine Moury, Mama SEO et Alexandre Fuchs.

Légende : ❓ décision à prendre · 🟩 code · 🟦 hors code · ✅ fait

## Décisions du 21/10 et avancement

- **Positionnement : A, « Conçu, codé, cité ».** H1 : « Votre site, trouvé sur Google et recommandé par ChatGPT. »
- **Prix « dès X € » affichés** dans les portes, le menu, les pages de service (en haut et dans la FAQ), sur À propos et dans `llms.txt`. Ils viennent tous d'une seule source, `src/lib/facts.ts`. Grille revue à la baisse le 21/10 pour convertir : offres d'entrée de 390 à 790 €.
- **Contact :** formulaire maison en 3 étapes (besoin → budget → coordonnées) et bouton « Être rappelé ». L'envoi passe par une fonction Cloudflare et l'API Brevo (`functions/api/lead.ts`). La provenance de la visite (paramètres UTM, `oppref`, site d'origine) est jointe à chaque demande.
- **Touche innovante :** portes vivantes, et test IA en direct en phase 3. Le cylindre WebGL est retiré.

- **Direction artistique (21/10) : « Riviera ».**
  - Fond blanc, gris froids et un seul accent bleu Méditerranée `#24508c`, réservé aux boutons, aux prix et à un mot du titre.
  - Deux polices sans serif : Urbanist pour les titres et le logo, Geist pour le texte et les libellés.
  - Boutons en pilule et cartes arrondies.
  - Les anciennes bandes sombres deviennent des bandes bleu très pâle.
  - Les tokens sont dans `src/styles/global.css`.

**✅ Phase 1 terminée (en local, non déployée)**
- Accueil à 7 blocs : hero à 4 portes, bande clients, « Conçu. Codé. Cité. » avec le tableau freelance / agence / plateforme, 3 études de cas, FAQ, contact.
- Nouveau menu, barre d'action mobile, fenêtre de rappel, pied de page compact.
- View Transitions natives, et suppressions : préchargeur, rideau, Lenis, OGL, transitions épinglées, 23 images.
- Résultat : environ 4 Ko de JavaScript sur l'accueil (environ 210 Ko avant), et une page de 5 400 px sur ordinateur (10 000 avant).

**✅ Passe UX / lisibilité (21/10)**
- **Échelle de texte unique :**
  - titres de page 34 à 60 px, titres de section 26 à 40 px ;
  - texte courant 17 à 18 px (interligne 1,6), texte secondaire 15 px minimum, étiquettes 13 px minimum ;
  - lignes de 75 caractères au plus.
- **Pages de service en entonnoir :**
  1. ce que c'est, avec le prix et le délai ;
  2. ce que vous obtenez ;
  3. les formules ;
  4. les étapes ;
  5. les projets ;
  6. la FAQ repliable ;
  7. le contact.
  L'explication longue reste sur la page, repliée sous « En savoir plus ».
- **`/services/` devient « Par où commencer ? »** : on y choisit sa situation.
- **Un bouton d'action en haut de la page À propos, et un bloc contact sur Projets.**

**✅ Visuels (21/10)**
- **Accueil :** une bande de 16 logos clients, uniformisés en silhouettes couleur encre (`public/clients/`, liste dans `src/lib/clients.ts`).
  - Elle défile dans l'en-tête, avec un fondu sur les côtés, et s'arrête au survol.
  - La vitrine « site + smartphone » a été abandonnée.
- **Pages de service :** un visuel en en-tête.
  - Création de site : montage Sun Beach House.
  - Outils & IA : montage CodeFlow.
  - SEO & GEO : prisme bleu généré par IA.
  - Identité de marque : papeterie bleue et blanche générée par IA.

**🟦 À faire de ton côté avant la mise en ligne du formulaire**
- Créer un compte Brevo et vérifier un expéditeur, par exemple `site@anthonyprofit.com`.
- Ajouter dans Cloudflare Pages (Settings → Variables and secrets) `BREVO_API_KEY` en secret, puis `LEAD_FROM`, et `LEAD_TO` si besoin.
- Tant que ce n'est pas fait, le formulaire propose d'envoyer la demande par e-mail ou WhatsApp, déjà remplie.

**Reste à faire en phases 2 et 3 :**
- gabarit de service unifié et méthode unique (4 étapes) ;
- `/services/` en tableau « situation → service » ;
- bloc d'offres sur les pages de service ;
- page Monaco, glossaire GEO et test IA en direct.

---

## 1. Diagnostic de l'existant

| Constat | Effet |
|---|---|
| **Aucun bouton d'action dans le premier écran**, sur ordinateur comme sur mobile. On n'y trouve que le menu et le bandeau cookies. | Le visiteur venu d'une annonce ne sait pas où cliquer. |
| **Accueil d'environ 10 000 px** et 9 blocs, dont 6 dispositifs d'images qui réutilisent les mêmes photos : préchargeur, carrousel mobile de 20 images, images qui suivent la souris, image de transition, cylindre WebGL, photo Promesse. | C'est long, lourd et répétitif, et le message se dilue. |
| **Préchargeur** de 0,9 à 6,7 s. Le sous-titre est encore flou après 4,5 s sur mobile. | La première impression arrive tard. |
| **Promesse floue** : « Des sites conçus pour séduire, optimisés pour être trouvé » et « Creative developer SEO GEO ». | Elle ne dit ni pour qui, ni où, ni ce qui te distingue (l'IA, ChatGPT, un seul interlocuteur). |
| **Le seul `h1` de l'accueil est la version mobile**, masquée sur ordinateur. | C'est un signal SEO faible. |
| **Les 4 services sont présentés 4 fois** (accueil, /services/, À propos, services liés). La méthode compte 5 étapes sur À propos et 4 sur les pages de service. « Disponible Q4 2026 » est déjà périmé. | Les incohérences gênent la confiance et la lecture des IA. |
| **GSAP est chargé sur toutes les pages** pour le rideau de transition (environ 70 Ko). Le pied de page fait la hauteur de l'écran. Le contact apparaît 3 fois en fin d'accueil. | Du poids et des répétitions inutiles. |

## 2. Ce que montrent redback et les concurrents

**Ce qui marche chez eux, et que l'on reprend :**
- **Une promesse en une phrase, ancrée localement.** Au-dessus, un petit bandeau d'identité (métier, ville).
- **Une offre d'entrée gratuite, cadrée et rapide comme action principale.** Redback demande l'URL, l'e-mail et le prénom, et promet un rapport sous 48 h. Ailleurs, c'est un appel de 30 min offert.
- **Des prix « à partir de » publics :** 6 consultants sur 8 en affichent, avec une date de mise à jour.
- **Un tableau « votre situation → prestation → prix »** : chez redback, c'est la page `/par-ou-commencer/`.
- **Un outil interactif qui démontre le savoir-faire :** test « votre marque est-elle dans ChatGPT ? », simulateur de prix.
- **Des preuves chiffrées sur l'accueil, avec de vraies études de cas derrière.** Le nombre d'avis Google est affiché.
- **Des blocs faciles à citer :**
  - des définitions encadrées ;
  - des tableaux comparatifs ;
  - des statistiques datées ;
  - une FAQ dont chaque réponse commence par la réponse ;
  - dans les articles, un encadré « Ce qu'il faut retenir ».
- **Un llms.txt complet** (services, prix, zones) et un robots.txt qui traite chaque famille de robots.

**Les opportunités, que personne ne saisit :**
- **Aucun site ne propose d'entrées par besoin dès le premier écran.** Redback a l'idée, mais il l'a reléguée sur une page secondaire.
- **Personne ne combine design, code, SEO/GEO, ChatGPT Ads et identité de marque.** Les offres sont cloisonnées.
- **Plusieurs pages « consultant SEO Nice » sont écrites par des consultants qui n'y sont pas** : c'est interchangeable et sans client local. Tu es vraiment niçois, avec des clients sur la Riviera (Monaco, St Barth).

**Ce qu'on évite :**
- un accueil-fleuve (redback : 16 sections et environ 3 600 mots) ;
- sur mobile, un premier bouton situé sous la ligne de flottaison ;
- des faits incohérents d'une page à l'autre (redback : 32 ou 50 avis, deux numéros de téléphone, des prix différents entre le balisage et les pages) ;
- les classements « meilleur consultant à [ville] » où l'auteur se place premier, et les boutons « demande à ChatGPT de me retenir » ;
- une note moyenne balisée sur sa propre entreprise ;
- les pages villes clonées.

## 3. Positionnement ❓

**Recommandation : « Conçu, codé, cité. »**
Tu es le seul interlocuteur qui conçoit, code et rend visible, y compris dans les réponses des IA.

| Élément | Proposition |
|---|---|
| Bandeau d'identité, au-dessus du H1 | Freelance à Nice · Design · Code · SEO & GEO |
| H1 | **Votre site, trouvé sur Google et recommandé par ChatGPT.** |
| Sous-titre | Je conçois, code et référence votre site ou votre outil sur-mesure. Un seul interlocuteur, du design à la première citation dans les IA. |
| Preuves courtes | 5 marques accompagnées · Lighthouse ≥ 95 · Réponse sous 48 h |
| Title de l'accueil | Freelance web à Nice : sites, apps & IA, SEO & GEO · Anthony Profit |

**Deux variantes :**
- **B, « le choix de l'IA sur la Riviera ».** La porte d'entrée est ChatGPT, et la cible ce sont les métiers à fort panier et à clientèle internationale : hôtellerie, immobilier, nautisme. C'est plus pointu, mais plus étroit.
- **C, « de l'idée à la première citation ».** On vise les créateurs d'entreprise avec des formules marque + site + visibilité à prix fixe. Ce positionnement réunit tes 4 métiers, mais il te tire vers des paniers plus petits.

**On arrête de dire :**
- « Creative developer » ;
- « pour séduire » ;
- « Disponible Q4 2026 », à remplacer par « Réponse sous 48 h » ;
- « 8 ans d'expérience », tant que la question 2018 / 2019 n'est pas tranchée.

## 4. Architecture et navigation 🟩

**Menu : 4 entrées et un bouton.**
`Services ▾` · `Réalisations` · `Guides` · `À propos` · **[Démarrer un projet]** · FR/EN

- Le sous-menu Services montre les 4 services, chacun avec une ligne de bénéfice. Il se termine par « Pas sûr ? Décrivez votre besoin » vers le formulaire.
- Sur mobile : le logo, le bouton du menu, et une **barre d'action fixée en bas** (Démarrer · WhatsApp) qui apparaît après le choix sur les cookies.
- **Toutes les URL actuelles sont conservées :** aucune redirection, aucune perte SEO.
- `/services/` devient le tableau **« votre situation → le bon service → l'offre d'entrée »**.
- `/contact/` reçoit un vrai formulaire.
- Pas de page `/tarifs/` (décision du 21/10).
- Nouvelles pages (phase 3) :
  - `/check-up-visibilite-ia/` : l'offre d'entrée ;
  - **une seule page locale, Monaco.** Elle est justifiée par 2 clients du yachting et aura un vrai angle sectoriel.
  - un **glossaire GEO**.

## 5. Accueil : de 9 blocs à 7 blocs 🟩

**Premier écran sur ordinateur (1440 × 900) :**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ AnthonyPROFIT     Services ▾   Réalisations   Guides   À propos   [Démarrer un projet]  FR │
├────────────────────────────────────────────────────────────────────────────┤
│  Freelance à Nice · Design · Code · SEO & GEO                              │
│                                                                            │
│  VOTRE SITE, TROUVÉ SUR GOOGLE                                             │
│  et recommandé par ChatGPT.                                                │
│  Je conçois, code et référence votre site ou votre outil sur-mesure.       │
│                                                                            │
│  Vous voulez…                                                              │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ 01            │ │ 02            │ │ 03            │ │ 04            │   │
│  │ Être trouvé   │ │ Créer ou      │ │ Gagner du     │ │ Lancer ma     │   │
│  │ sur Google    │ │ refaire mon   │ │ temps avec    │ │ marque        │   │
│  │ et ChatGPT  → │ │ site        → │ │ l'IA        → │ │             → │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│  Pas sûr ? Check-up visibilité IA offert →    WhatsApp · Réponse sous 48 h │
│  5 marques accompagnées · Lighthouse ≥ 95                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Premier écran sur mobile (390 × 844).** Les 4 portes doivent tenir dans l'écran.

```
┌──────────────────────────┐
│ AnthonyPROFIT   FR   ☰   │
│ Freelance à Nice         │
│ VOTRE SITE, TROUVÉ SUR   │
│ GOOGLE et recommandé     │
│ par ChatGPT.             │
│ ┌──────────────────────┐ │
│ │ Être trouvé (Google, │ │
│ │ ChatGPT)           → │ │
│ │ Créer mon site     → │ │
│ │ Gagner du temps (IA)→│ │
│ │ Lancer ma marque   → │ │
│ └──────────────────────┘ │
│ [Démarrer]   [WhatsApp]  │ ← barre fixe
└──────────────────────────┘
```

**Les 4 portes** sont de vrais liens vers les pages de service.
- **Prix :** chacune peut afficher « dès X € », si tu le décides ❓.
- **Mesure :** chaque clic envoie un événement GA4 `select_door`, ce qui permet de voir quels besoins dominent.
- **Formulaire :** le besoin choisi est pré-rempli si le visiteur y arrive.

**Les 7 blocs :**
1. **Le hero** ci-dessus.
2. **Une bande de logos clients** : Surly, Vaulk, Sun Beach House, Royal Yacht, Eden Rock.
3. **La signature innovante.** Il n'y en a qu'une, voir le § 8.
4. **« Un seul interlocuteur »** : 3 engagements, plus un court tableau freelance / agence / plateforme. Le tableau est facile à citer.
5. **3 études de cas chiffrées** (Surly, Vaulk, Sun Beach House). Chacune montre un chiffre clé et un lien vers sa fiche.
6. **Une FAQ courte de 5 questions** : prix, délais, Nice ou à distance, GEO, ChatGPT Ads. Chaque réponse commence par la réponse.
7. **Contact** : formulaire de 3 champs, WhatsApp et e-mail. Le pied de page devient compact (il ne fait plus la hauteur de l'écran).

**On supprime :**
- le préchargeur ;
- la transition épinglée entre le hero et la suite ;
- le portrait épinglé ;
- le chapitre « Promesse » ;
- le carrousel mobile de 20 images ;
- les images qui suivent la souris ;
- les légendes génériques du cylindre ;
- le rideau GSAP entre les pages, remplacé par les **View Transitions** natives du navigateur (0 Ko de JS) ;
- Lenis, au profit du défilement natif.

**Cible :** une page d'environ 4 000 à 5 000 px sur ordinateur, au lieu de 10 000.

## 6. Gabarit de page de service unique (aussi page d'atterrissage ChatGPT Ads) 🟩

1. **Hero** : le H1 reprend la question du client, deux lignes y répondent, puis un bouton « Démarrer », la preuve courte et la date « Mis à jour le ».
2. **Problème et enjeu** : 3 ou 4 lignes.
3. **Encadré définition**, facile à citer (par exemple « Le GEO, c'est… »), et un tableau quand il est utile (SEO / GEO / ChatGPT Ads).
4. **Ce que vous obtenez** : les livrables.
5. **La méthode en 4 étapes, la même partout.** On l'aligne aussi sur la page À propos.
6. **Une étude de cas chiffrée.**
7. **L'offre d'entrée**, avec son prix si tu le décides ❓.
8. **Une FAQ de 5 à 7 questions.**
9. **Le formulaire**, avec le besoin pré-rempli.

Le formulaire enregistre dans des champs cachés `utm_source`, `utm_campaign` et `oppref` (le paramètre de clic de ChatGPT Ads). Tu sauras ainsi quels contacts viennent des annonces.

## 7. Conversion 🟩 ❓

- **Le formulaire court**, au choix :
  - **(a)** un formulaire maison : une fonction Cloudflare Pages envoie l'e-mail via Resend ou Brevo, avec Cloudflare Turnstile contre le spam ;
  - **(b)** Tally ou Formspree, sans code serveur ;
  - **(c)** une prise de rendez-vous Cal.com de 20 minutes, en plus.
  - Dans tous les cas, l'envoi déclenche `generate_lead` avec `method=form`.
- **L'offre d'entrée gratuite : « Check-up visibilité IA ».** Je teste 5 questions de ton métier dans ChatGPT et Perplexity, et j'envoie un rapport d'une page sous 48 h. Il mène ensuite vers l'audit payant. Elle remplace « demander un devis », qui intimide davantage.
- **Une barre d'action fixe sur mobile**, et un WhatsApp toujours accessible.

## 8. La touche innovante ❓ (une seule signature, utile)

| Option | Idée | Poids |
|---|---|---|
| **Portes vivantes** (recommandée dans tous les cas) | Au survol ou au toucher, chaque porte montre une micro-démo du résultat en CSS/SVG : une réponse ChatGPT qui cite le client, une jauge Lighthouse à 100, un flux d'automatisation, un logo qui se compose. | Très léger |
| **Cylindre WebGL recyclé** | Le cylindre actuel devient la galerie des réalisations : chaque image est cliquable et la légende donne le nom du projet et son chiffre clé. Le défilement passe de 200-320 svh à 120 svh environ. Une liste simple est prévue si l'utilisateur réduit les animations. | Environ 60 Ko |
| **Test de visibilité IA en direct** (phase 3) | Le visiteur saisit son métier et sa ville, voit si ChatGPT le cite, et reçoit le rapport complet par e-mail. C'est à la fois une démo de ton offre « outils & IA » et l'aimant à contacts le plus fort du marché. | Fonction Cloudflare + clé API (quelques centimes par test) + anti-abus |

## 9. SEO / GEO (en plus de `ACTION-PLAN.md`) 🟩

- **Une seule source pour les faits** (`src/lib/facts.ts`) : téléphone, e-mail, ville, SIREN, date de création, nombre de projets, délai de réponse, prix, date de mise à jour. Elle alimente les pages, le JSON-LD, `llms.txt` et `llms-full.txt`. On évite ainsi les incohérences relevées chez redback.
- **Un `h1` visible et unique** sur chaque page, accueil compris.
- **Des blocs faciles à citer** sur chaque page de service : définition, tableau, FAQ, date de mise à jour.
- **Les articles** suivent un gabarit fixe : « Ce qu'il faut retenir », sommaire, titres en questions, sources datées, bio de l'auteur. On suit le plan éditorial de `ACTION-PLAN.md`, en commençant par « ChatGPT Ads en France ».
  - Il faut **revérifier la date d'ouverture de ChatGPT Ads en France** avant de l'utiliser comme argument, car les sources divergent.
- **Une seule page locale (Monaco)**, avec de vraies preuves. Pas de pages villes clonées.
- **Les avis Google** seront affichés quand ta fiche Google en aura. On ne balise pas de note moyenne sur ta propre entreprise.
- **robots.txt** : on garde l'accès des robots IA et on peut bloquer les aspirateurs inutiles (Diffbot, img2dataset).

## 10. Direction visuelle et performance 🟩

- **On garde l'identité** : crème, noir et olive (#74714f) ; Archivo Black, Instrument Serif et Geist. On réduit à **une seule animation forte**, plus des micro-interactions : survol et appui des portes, View Transitions. On respecte `prefers-reduced-motion`.
- **Budgets :**
  - JS de l'accueil : au plus 60 Ko (environ 210 Ko aujourd'hui) ;
  - JS des pages intérieures : au plus 15 Ko ;
  - sur mobile : LCP < 2 s, CLS < 0,05, INP < 200 ms.
- **Accessibilité AA** : les portes sont de vrais liens, les focus sont visibles et le lien d'évitement est conservé.

## 11. Phases

| Phase | Contenu | Vérification |
|---|---|---|
| **1. Accueil et navigation** | Positionnement, hero à 4 portes, 7 blocs, menu, barre mobile, suppressions (préchargeur, rideau, Lenis…), pied de page compact | Bouton et portes visibles à 360 et 390 px · un seul h1 · budget JS · Lighthouse |
| **2. Gabarit service et conversion** | Gabarit unique, méthode unifiée, formulaire, champs UTM et `oppref`, `facts.ts`, /services/ en tableau « situation → service » | Événements `generate_lead` (formulaire, e-mail, WhatsApp) · données structurées valides · llms.txt synchronisé |
| **3. Aimants et contenus** | Check-up visibilité IA (page, puis test en direct), page Monaco, glossaire GEO, articles | Contacts par source (`chatgpt` / organique) · indexation |

**Après chaque phase :** build, contrôles automatiques, mise en ligne, puis mesure avec le taux de clic des portes, le taux de `generate_lead` et la profondeur de défilement.

## 12. Décisions à prendre ❓

1. **Positionnement** : A « Conçu, codé, cité » (recommandé), B « Le choix de l'IA sur la Riviera » ou C « De l'idée à la première citation ».
2. **Prix** : afficher « dès X € » dans les portes et sur les pages de service, ou pas pour l'instant.
3. **Contact** : formulaire maison, Tally/Formspree et/ou Cal.com.
4. **Touche innovante** : portes vivantes, avec ou sans le cylindre recyclé, avec ou sans test IA en direct (phase 3).
5. **Toujours en attente** (`ACTION-PLAN.md`) :
   - « freelance depuis 2018 » contre une immatriculation en 2019 ;
   - « sans template » alors que 2 études de cas sont sur WordPress.
