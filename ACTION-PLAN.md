# Plan d'action SEO / GEO / ChatGPT Ads — anthonyprofit.com

**Date :** 2026-10-19 · **Score mesuré avant corrections :** 70/100 · Détail : `FULL-AUDIT-REPORT.md`
Légende : ✅ fait aujourd'hui dans le code · 🟦 à faire par toi (hors code) · ❓ décision à prendre (je l'implémente ensuite) · 🟩 code, à faire

---

## ✅ Fait aujourd'hui (20 corrections, voir le rapport)

Préchargeur réservé à l'accueil · bouton d'action en haut des pages de service · polices auto-hébergées · suivi `generate_lead` · graphe d'entités unifié (SIREN, logo, catalogue des 4 services) · `x-default` · `llms.txt` conforme + `llms-full.txt` · robots IA nommés · `lastmod` · tags en noindex · « Guides liés » / « Services mobilisés » · Nice et Kulturecom visibles · bandeau cookies compact · en-tête 360 px · contrastes · coquilles et parité FR/EN.

---

## 🔴 Avant de lancer les campagnes ChatGPT Ads

1. 🟦 **Déployer** ces corrections (commit + push) puis relancer PageSpeed 3 fois sur chaque page de service.
2. 🟦 **Cloudflare → Scrape Shield → Email Address Obfuscation : Off.** Rend l'e-mail lisible par les robots IA et supprime un script bloquant (~450 ms).
3. 🟦 **GA4 → marquer `generate_lead` comme événement clé** (après le premier clic mesuré), puis vérifier dans DebugView.
4. 🟦 **URL de destination avec UTM** dans l'Ads Manager, par exemple :
   `https://anthonyprofit.com/seo-geo/?utm_source=chatgpt&utm_medium=cpc&utm_campaign=seo-geo`
5. 🟦 + 🟩 **Pixel ChatGPT Ads** : crée-le dans l'Ads Manager (Outils › Conversions) et envoie-moi son identifiant. Je l'installe derrière le consentement, j'adapte le texte du bandeau et je mets à jour la politique de confidentialité, qui affirme aujourd'hui « aucune publicité / aucun cookie publicitaire ».
6. ❓ **Prix / offre d'entrée** : un « à partir de » ou un forfait d'appel par service (exemples : mini-audit SEO/GEO, diagnostic IA, logo + charte). C'est le premier frein relevé par les audits contenu et SXO.
7. ❓ **Formulaire court ou prise de rendez-vous** (Calendly, Cal.com) en plus de l'e-mail et de WhatsApp, et un lien d'appel `tel:` si tu acceptes les appels.
8. ❓ **Pages d'atterrissage dédiées aux annonces** (en `noindex`), une par famille de requêtes : « apparaître dans ChatGPT », « intégrer l'IA dans ma PME », « créer un site à Nice ». Titre principal = titre de l'annonce, réponse à la question dès le premier paragraphe, bouton + preuve côte à côte.

## 🟠 Haute priorité (≤ 2 semaines)

9. ❓ **Trancher les incohérences**, puis je corrige les textes :
   - ✅ « pas de mission de moins de 8 semaines » (À propos) : phrase supprimée (FR + EN) ;
   - « freelance depuis 2018 » contre une immatriculation au 12/05/2019 ;
   - « codé à la main, sans template » contre 2 cas sur WordPress.
10. 🟦 **Preuves** : 2 à 3 citations clients (avec accord) ; des chiffres réels de Search Console / GA4 pour Sun Beach House (SEO/GEO) ; un mini-cas IA, même anonymisé. Je les intègre ensuite aux études de cas et aux pages de service.
11. 🟦 **Bing** : Bing Webmaster Tools (import depuis Search Console) + soumission de `sitemap-index.xml` ; activer **Cloudflare Crawler Hints** (IndexNow automatique). ChatGPT search s'appuie en partie sur l'index Bing.
12. 🟦 **Search Console** : soumettre `sitemap-index.xml`, demander l'indexation de `/outils-applications-ia/`, `/en/apps-ai-tools/` et de l'accueil.
13. 🟦 **`kulturecom.fr`** : faire répondre `http://kulturecom.fr` en 301 (il renvoie 503 aux robots via le WAF de l'hébergeur) et rediriger en 301 les anciennes URL (`/portfolio/…`, `/contact/`) vers les pages équivalentes.
14. 🟦 **Crédits clients** : remplacer le lien `kulturecom.fr` par `https://anthonyprofit.com/` chez Surly, Sun Beach House et Eden Rock (ancres variées, par exemple « Site par Anthony Profit, développeur web à Nice ») ; demander le crédit à Vaulk et, si c'est ton travail, à Royal Yacht International.
15. 🟦 **Fiche Google Business Profile** : catégorie principale, services (les 4), zones desservies, photos, publications régulières, lien vers le site ; **demander un avis** aux 5 clients du portfolio (objectif : environ 1 avis toutes les 2 à 3 semaines).
16. 🟩 **Article n°1 : « ChatGPT Ads en France : comment ça marche »**, guide daté et sourcé, relié à `/seo-geo/`. L'agent `redacteur-blog-seo` peut l'écrire, avec `pillar: seo` dans le frontmatter.

## 🟡 Moyenne priorité (≤ 1 mois)

17. 🟩 **Citabilité des pages de service** : titres de méthode en questions, réponse autonome de 40 à 60 mots sous chacun, date « Mis à jour le » visible + `dateModified`.
18. 🟩 **Articles existants** : TL;DR, 3 à 5 statistiques sourcées, paragraphe ChatGPT Ads dans l'article « apparaître dans ChatGPT », `updatedDate`, bio auteur sous chaque article.
19. 🟩 **Couvertures d'articles** (≥ 1200 px), utilisées en image de partage et en `BlogPosting.image`.
20. 🟩 **Performance** : CSS de navigation en ligne (`build.inlineStylesheets`), réduire la photo de la Promesse (2400×3600, 404 Ko), `srcset` sur les vignettes, Speculation Rules vers `/contact/`, suivi des Web Vitals réels vers GA4 (CrUX restera vide un moment).
21. 🟩 **CSP** en `Report-Only` dans `public/_headers`.
22. 🟦 **Entité** : un seul profil LinkedIn (fusionner les doublons), un seul compte Instagram, même nom et même bio partout. Mettre à jour le profil Codeur (ville : Nice) et la bio GitHub (lien vers le site). Créer Malt, Bing Places, Apple Business Connect, PagesJaunes et une page entreprise LinkedIn, puis me donner les URL pour `sameAs`.
23. ❓ **Mentions légales** : ajouter « Nom commercial : Kulturecom » si c'est bien ton enseigne déclarée.

## 🟢 Basse priorité / continu

24. 🟩 Raccourcir les méta des études de cas (> 160 caractères) ; `datePublished` sur les études de cas ; `workTranslation` entre articles FR/EN.
25. 🟩 Accueil : un seul `h1` visible à toutes les largeurs (attention aux animations) ; texte d'accueil un peu plus étoffé.
26. 🟦 Soumettre Vaulk et Sun Beach House à Awwwards / CSS Design Awards ; French Tech Côte d'Azur, annuaire CCI Nice Côte d'Azur.
27. 🟦 Vidéo YouTube courte (démo d'un site Lighthouse 95+, ou « apparaître dans ChatGPT »), à ajouter en `sameAs`.
28. 🟦 Contenu propriétaire à diffuser (presse locale, podcasts) : retour chiffré de ta première campagne ChatGPT Ads, ou « baromètre visibilité IA des PME niçoises ».

---

## Plan éditorial (clusters) — 10 premiers articles

| # | Titre | Slug | Requête | Pilier |
|---|---|---|---|---|
| 1 | ChatGPT Ads en France : comment ça marche | `chatgpt-ads-france-comment-ca-marche` | ChatGPT Ads France | /seo-geo/ |
| 2 | ChatGPT Ads : prix, CPC et budget pour une PME | `chatgpt-ads-prix-budget-pme` | ChatGPT Ads prix | /seo-geo/ |
| 3 | llms.txt : à quoi ça sert, faut-il en créer un ? | `llms-txt-guide` | llms.txt | /seo-geo/ |
| 4 | ChatGPT Ads et RGPD : pixel, consentement, mesure | `chatgpt-ads-rgpd-pixel-consentement` | ChatGPT Ads RGPD | /seo-geo/ |
| 5 | Tester sa visibilité dans ChatGPT : audit en 10 prompts | `auditer-visibilite-chatgpt-10-prompts` | savoir si ChatGPT cite mon entreprise | /seo-geo/ |
| 6 | Prix d'un site vitrine sur mesure à Nice en 2026 | `prix-site-vitrine-sur-mesure-nice` | prix site internet Nice | /creation-site-internet/ |
| 7 | Refonte de site sans perdre son SEO (checklist) | `refonte-site-internet-sans-perdre-seo` | refonte site internet SEO | /creation-site-internet/ |
| 8 | Intégrer l'IA dans une PME : par où commencer | `integrer-ia-pme-par-ou-commencer` | intégrer l'IA dans son entreprise | /outils-applications-ia/ |
| 9 | n8n, Make ou Zapier : que choisir pour sa PME | `n8n-make-zapier-comparatif-pme` | n8n vs Make vs Zapier | /outils-applications-ia/ |
| 10 | Prix d'une identité visuelle freelance | `prix-identite-visuelle-freelance` | prix charte graphique | /identite-de-marque/ |

Chaque article doit avoir : 1 seul service lié (`pillar`), 1 à 2 articles voisins, 1 étude de cas, son jumeau EN (`translationKey`), et une ligne dans `public/llms.txt`.

## Séquence conseillée

1. **Aujourd'hui** : déployer (1), Cloudflare (2), GA4 (3), Search Console et Bing (11, 12).
2. **Avant la 1re campagne** : pixel (5), prix / offre d'entrée (6), contact (7), landings dédiées (8), article ChatGPT Ads (16).
3. **Ce mois-ci** : incohérences (9), preuves (10), kulturecom.fr et crédits (13, 14), fiche Google et avis (15), citabilité (17, 18).
4. **En continu** : 2 articles par mois selon le plan, profils et citations (22, 26 à 28), réaudit dans 4 à 6 semaines.
