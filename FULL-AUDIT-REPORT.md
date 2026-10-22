# Audit SEO / GEO complet — anthonyprofit.com

**Date :** 2026-10-19 · **Type :** site en production (38 URL indexables) + code source
**Méthode :** 11 agents spécialisés en parallèle (technique, contenu/E-E-A-T, données structurées, sitemap, performance PSI/CrUX, visuel/mobile, GEO/IA, local, SXO, clusters sémantiques, backlinks) + vérifications directes.
**Activité détectée :** prestataire de services local (freelance, Nice / Côte d'Azur, zone de service France + international), bilingue FR/EN, portfolio + génération de leads + blog. Objectif : SEO maximal, être « LLM ready » et préparer des campagnes **ChatGPT Ads** vers les pages de service.
**Rapport précédent :** `FULL-AUDIT-REPORT-2026-06-16.md` (76/100, grille plus souple sur le contenu).

---

## Synthèse

### Score SEO Health : **70 / 100** (mesuré avant les corrections du jour)

| Catégorie | Poids | Score | Pondéré |
|---|---|---|---|
| SEO technique | 22 % | 85 | 18,7 |
| Contenu & E-E-A-T | 23 % | 58 | 13,3 |
| On-page | 20 % | 74 | 14,8 |
| Données structurées | 10 % | 68 | 6,8 |
| Performance (CWV, mobile) | 10 % | 78 | 7,8 |
| Préparation recherche IA (GEO) | 10 % | 51 | 5,1 |
| Images | 5 % | 75 | 3,8 |
| **Total** | | | **≈ 70** |

Scores annexes : local 41/100 (plafonné sans accès à la fiche Google), visuel/mobile 74/100, SXO des pages de service 50 à 60/100.

**Lecture :** la technique est solide (aucun point critique, les 38 URL en 200, hreflang réciproque, contenu en HTML statique, tous les robots d'IA autorisés). Le score est tiré vers le bas par le **contenu** (pages de service courtes, peu de preuves chiffrées, aucun prix), la **citabilité IA** (titres en mots isolés, pas de réponses autonomes, `llms.txt` non conforme) et l'**autorité hors site** (3 backlinks clients, entité Anthony Profit / Kulturecom fragmentée).

### Ce qui a été corrigé aujourd'hui dans le code

| # | Correction | Source |
|---|---|---|
| 1 | Préchargeur plein écran (~3,25 s, scroll bloqué) réservé à l'accueil — les pages de service s'affichent immédiatement | Performance, SXO |
| 2 | Bouton « Décrire mon projet » + « Réponse sous 48 h ouvrées » dès le premier écran des 4 pages de service (FR/EN) | Contenu, SXO, visuel |
| 3 | Polices auto-hébergées (4 woff2 latin, `font-display: swap`, préchargées) — fin du CSS Google bloquant et du préchargement Archivo Black qui pointait vers le mauvais fichier | Performance, technique |
| 4 | Suivi des conversions : événement GA4 `generate_lead` sur chaque clic e-mail / WhatsApp / téléphone, robuste au masquage d'e-mails Cloudflare | ChatGPT Ads |
| 5 | Graphe d'entités unifié : un seul nœud `ProfessionalService` (logo 512 px, fondateur, SIREN, date d'immatriculation, contactPoint, catalogue des 4 services), suppression du doublon `Organization`, portrait réel sur `Person`, GitHub dans `sameAs`, `WebSite` bilingue | Schéma |
| 6 | Pages de service : `Service.provider` → l'activité, zone desservie Nice / Côte d'Azur / France, liens `isPartOf` ; titres de section en vrais `h2` | Schéma, GEO |
| 7 | Articles : `headline` jamais coupé en plein mot, éditeur = l'activité | Schéma |
| 8 | Projets (`/projets/`) : la liste structurée pointe vers les études de cas internes | Schéma |
| 9 | `hreflang x-default` → version FR de la page (et non l'accueil) | Technique |
| 10 | `llms.txt` refait au standard llmstxt.org + nouveau `/llms-full.txt` (texte intégral services, études de cas, guides — généré au build) | GEO |
| 11 | `robots.txt` : robots IA nommés explicitement (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Perplexity-User, Applebot-Extended, Bingbot…) | GEO, technique |
| 12 | Sitemap : `lastmod` réels (articles + pages modifiées) ; `/sitemap.xml` redirigé vers l'index | Sitemap, GEO |
| 13 | Pages de tags de blog : `noindex` jusqu'à 3 articles (quasi-doublons du blog) | Sitemap, clusters |
| 14 | Maillage : bloc « Guides liés » sur les pages de service (champ `pillar` des articles), bloc « Services mobilisés » sur chaque étude de cas | Clusters |
| 15 | Ancrage local : « à Nice » (au lieu de « près de Nice »), Nice dans le sous-titre de l'accueil, les titres SEO des pages SEO/identité et les méta des services | Local |
| 16 | « Kulturecom » et « Nice, Côte d'Azur » visibles dans le footer | GEO, local |
| 17 | Bandeau cookies compact sur mobile (≈105 px au lieu de 146) : ne masque plus le bouton du hero | Visuel |
| 18 | En-tête : plus de collision logo / « Discutons » sous 380 px | Visuel |
| 19 | Contraste : libellés gris clair (2,85:1) passés au gris foncé (5,7:1) sur le blog et les pages de service | Visuel |
| 20 | Divers : coquille « Creative developper », titre principal lu « Création de site » (et non « Création desite »), parité FR/EN (prix, ChatGPT Ads), commentaires HTML contenant des `<h1>` littéraux, méta des services ≤ 160 caractères | Contenu, technique |

Vérifié après build : 48 pages, `astro check` 0 erreur, JSON-LD valide sans référence cassée sur les 47 pages HTML, 1 `h1` par page, aucune requête Google Fonts, préchargeur présent uniquement sur `/` et `/en/`, CTA visible à 360×640 sans chevauchement, `generate_lead` émis pour l'e-mail et WhatsApp.

---

## 1. SEO technique — 85/100

**Conforme (vérifié en ligne) :** 38 URL en 200 avec canonical auto-référent ; aucun doublon de title/description ; hreflang fr/en réciproque avec slugs localisés ; redirections http→https, www→apex, sans slash→slash en un seul saut ; vraies 404 ; HSTS 2 ans, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy ; HTTP/2 + h3, Brotli ; contenu entièrement en HTML (pas de dépendance JS pour l'indexation) ; 22 user-agents d'IA en 200.

**Restant :**
- **[Haute · hors code]** Cloudflare *Email Address Obfuscation* actif : les robots sans JS (OAI-SearchBot, LLM) ne voient pas l'e-mail, et un script bloquant (~450 ms) s'ajoute à chaque page. → désactiver (Scrape Shield).
- **[Moyenne · hors code]** IndexNow absent → activer *Crawler Hints* dans Cloudflare + Bing Webmaster Tools (import depuis Search Console).
- **[Moyenne · code]** Pas de Content-Security-Policy → commencer en `Report-Only`.
- **[Moyenne · code]** H1 de l'accueil masqué au-delà de 640 px (le titre desktop est un `div`) : refonte délicate à cause des animations, à traiter avec précaution.
- **[Basse]** 404 EN en 200 (noindex) ; HSTS `preload` déclaré mais non soumis (hstspreload.org) ; méta > 160 caractères sur les études de cas.

## 2. Contenu & E-E-A-T — 58/100

**Forces :** 5 études de cas réelles, identité d'auteur claire, FAQ utiles (SEO vs GEO, ChatGPT Ads, données IA), lisibilité correcte, pas de contenu générique sur les pages de service.

**Restant :**
- **[Critique · décision]** Pas de prix ni d'offre d'entrée sur aucune page (« devis sur brief ») alors que la SERP (Malt, Codeur, agences) affiche des tarifs ; pas de formulaire ni de prise de rendez-vous.
- **[Critique · contenu]** Preuves faibles pour les offres promues : aucune métrique SEO dans les cas, aucune citation client, la page IA n'a que Surly (sans fonctionnalité IA documentée).
- **[Critique · code, au moment du pixel]** La politique de confidentialité affirme « aucune publicité / aucun cookie publicitaire » : à mettre à jour dès l'installation du pixel ChatGPT Ads.
- **[Haute · décision]** Incohérences à trancher : « pas de mission de moins de 8 semaines » (À propos) vs « 4 à 8 semaines » (FAQ) ; « freelance depuis 2018 / 8 ans » vs immatriculation du 12/05/2019 ; « codé à la main, sans template » vs 2 cas sur WordPress.
- **[Haute · contenu]** Pages de service sous le plancher recommandé (380 à 680 mots pour ~800) ; articles à 685–868 mots, sans statistique sourcée, `updatedDate` jamais renseigné, aucun article sur ChatGPT Ads / IA / apps.
- **[Moyenne]** Accueil : 232 mots ; bio auteur absente sous les articles.

## 3. On-page — 74/100

Titres et descriptions uniques et centralisés (`src/i18n/routes.ts`), slugs propres et localisés. Corrigé aujourd'hui : titres de section en `h2`, Nice dans les titres, méta des services raccourcies, maillage service ↔ guides ↔ études de cas. Restant : titre de l'accueil à 73 caractères (choix assumé, tronqué vers 60 dans Google), méta des études de cas > 160 caractères, titres de méthode en mots isolés (« Audit », « Design ») plutôt qu'en questions.

## 4. Données structurées — 68/100 (avant corrections)

Avant : 3 entités (Person, ProfessionalService, Organization) pour la même réalité avec des données divergentes, `headline` tronqué, Service isolé, ItemList vers les sites clients. **Tout cela est corrigé** (voir tableau). Restant : couverture d'article propre à chaque post (aujourd'hui `og.png`), `datePublished` sur les études de cas, `workTranslation` entre articles FR/EN, `ProfilePage`/`mainEntity` sur À propos (optionnel). Ne pas ajouter d'`AggregateRating` (avis auto-déclarés interdits).

## 5. Performance — 78/100 mobile · 96/100 desktop (PSI, lab)

| Page | Mobile / Desktop | LCP mobile |
|---|---|---|
| /seo-geo/ | 80 / 100 | 4,4 s |
| /creation-site-internet/ | 73 / 99 | 4,6 s |
| /identite-de-marque/ | 74 / 99 | 4,5 s |
| /outils-applications-ia/ | 89 / 99 | 3,1 s |
| / (accueil) | 63 / 82 | 6,3 s |

Pas de données terrain CrUX (trafic Chrome insuffisant). LCP = texte : le temps était du « render delay » dû au CSS Google Fonts bloquant → corrigé (polices locales préchargées). CLS ≈ 0 partout. Restant : script Cloudflare d'obfuscation (hors code), CSS de navigation bloquant (`build.inlineStylesheets`), photo de la Promesse (2400×3600, 404 Ko) sur l'accueil, `srcset` sur les vignettes de preuves, Speculation Rules vers `/contact/`. **À refaire après déploiement : 3 runs PSI par page de service.**

## 6. Images — 75/100

Alt présents partout, WebP majoritaire, CLS nul. Restant : `srcset` sur les vignettes de projets, couvertures d'articles dédiées (≥ 1200 px), photo de la Promesse surdimensionnée.

## 7. Préparation recherche IA (GEO) — 51/100

Citabilité par page (avant corrections) : `/seo-geo/` 52, `/outils-applications-ia/` 48, `/creation-site-internet/` 40, `/identite-de-marque/` 38, articles 35 à 45. Par plateforme : ChatGPT 45 · Perplexity 50 · AI Overviews 45 · Copilot 35.

Corrigé : `llms.txt` conforme + `llms-full.txt`, robots IA nommés, `lastmod`, entité unifiée, Kulturecom/Nice visibles, h2 structurants. Restant : réponses autonomes de 40–60 mots sous des titres-questions, chiffres sourcés, dates « mis à jour » visibles, tableau comparatif SEO vs GEO, vidéo YouTube, présence Bing (Crawler Hints + Webmaster Tools, ChatGPT search s'appuie en partie sur Bing).

## 8. SEO local — 41/100

NAP cohérent avec le registre (SIRENE : Anthony Profit, 2 rue Pierre Pietri, 06000 Nice). Corrigé : « à Nice » partout, Nice dans les titres et le footer. Restant (hors code) : audit de la fiche Google Business Profile (catégories, services, zones, photos, publications), avis clients, Bing Places, Apple Business Connect, Malt, PagesJaunes, page entreprise LinkedIn. **Ne pas créer de pages par ville** (risque de pages satellites sans établissement sur place).

## 9. SXO (pages de service comme landing pages)

| Page | Requête cible | Type de SERP dominant | Verdict |
|---|---|---|---|
| /creation-site-internet/ | création site internet Nice | annuaires / marketplaces (~70 %) | écart moyen |
| /seo-geo/ | consultant SEO GEO freelance | profils Malt/Codeur avec TJM | écart moyen (pas de tarif) |
| /identite-de-marque/ | création identité visuelle Nice | agences + annuaires | requête retargetée aujourd'hui |
| /outils-applications-ia/ | développement application IA PME | hybride agences / guides | aligné à moyen (meilleure page) |

Pour ChatGPT Ads : l'intention conversationnelle (« comment intégrer l'IA dans ma PME ») attend un **guide**, pas une page de service → prévoir des pages d'atterrissage dédiées par famille de requêtes, ou un premier écran qui répond à la question avant de vendre.

## 10. Autorité & backlinks

Common Crawl : site absent du graphe (pas de métrique d'autorité). Domaines référents vérifiés : 3 crédits clients (Surly, Sun Beach House, Eden Rock), tous via `kulturecom.fr` (redirection) — et `http://kulturecom.fr` répond **503** aux robots (WAF de l'hébergeur). Vaulk et Royal Yacht ne te créditent pas. Entité fragmentée : plusieurs profils LinkedIn « Anthony Profit », deux comptes Instagram, homonymes.

## 11. Clusters de contenu

Hub-and-spoke sous les 4 piliers ; 10 articles prioritaires (dont 4 sur ChatGPT Ads / llms.txt / visibilité ChatGPT, le créneau le plus porteur et le plus actuel). Détail dans `ACTION-PLAN.md`. Attention à la cannibalisation : ne pas publier séparément « c'est quoi le GEO » / « SEO vs GEO » (déjà couverts par l'article ChatGPT existant et la FAQ de `/seo-geo/`).

---

## Méthodologie & limites

- Agents spécialisés lancés en parallèle ; plusieurs ont atteint leur limite d'étapes et ont rendu des rapports sur données partielles.
- Performance : PSI v5 en lab (1 run par URL, ±10 points de bruit) ; **aucune donnée terrain CrUX**. Pas d'accès à Search Console, GA4 ni à la fiche Google Business Profile.
- Recherches web biaisées US, sans positions réelles : volumes de mots-clés = ordres de grandeur.
- Faits ChatGPT Ads issus de la presse et de guides tiers (lancement France le 24/08/2026, offres Free/Go, ciblage contextuel, CPC/CPM, pixel + Conversions API, paramètre de clic `oppref`) : **à confirmer dans l'Ads Manager**.
- Les scores « avant corrections » ne sont pas recalculés après corrections : le site doit d'abord être redéployé, puis réaudité.
