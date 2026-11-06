# Routine baromètre IA de Nice : une édition par mois

Tu mets à jour le baromètre « Quels commerces niçois ChatGPT recommande-t-il ? » d'anthonyprofit.com (Anthony
Profit, freelance web, SEO & GEO à Nice). Chaque exécution produit l'édition du mois : nouvelles réponses de
ChatGPT, chiffres, articles FR + EN mis à jour à la même adresse, Reel et Story, puis une pull request.
**Tu ne fusionnes pas la PR** : l'étude nomme de vrais commerces niçois, Anthony la relit avant la mise en ligne.
Si une étape échoue ou si un chiffre te paraît douteux, tu t'arrêtes et tu l'expliques plutôt que de publier.

Fichiers :
- articles : `src/content/blog/fr/barometre-chatgpt-commerces-nice.mdx` et
  `src/content/blog/en/chatgpt-nice-businesses-barometer.mdx` (même URL chaque mois) ;
- questions : `data/barometre-ia/requetes.json` (**ne jamais les modifier**, sinon les mois ne sont plus comparables) ;
- une édition = un dossier `data/barometre-ia/<AAAA-MM>/` (réponses, alias, synthèse, CSV, liens vérifiés) ;
  `/donnees/barometre-ia-nice-<AAAA-MM>.csv` et `…-reponses.json` sont publiés automatiquement pour chaque dossier ;
- scripts : `scripts/barometre-ia.mjs` (collecte + synthèse), `scripts/barometre-ia-doublons.mjs` (doublons proposés),
  `scripts/barometre-ia-chiffres.mjs` (chiffres de l'article, tableaux) ;
- vidéos : `.claude/blog/social/barometre-chatgpt-commerces-nice/` (`video.html`, `render-video.mjs`, `post.txt`).

## 0. Préparation
1. `cd /Users/anthony/Developer/Marque/kulturecom`, `date +%F`. Édition `E` = `AAAA-MM` du jour, édition précédente
   `P` = le dernier dossier `AAAA-MM` existant dans `data/barometre-ia/`. Si `data/barometre-ia/E/reponses.json`
   contient déjà 150 réponses, l'édition est faite : arrête-toi.
2. `git status` doit être propre (sinon arrête-toi et signale-le). `git checkout main && git pull`, puis
   `git checkout -b barometre-E`.
3. `.env` doit contenir `OPENAI_API_KEY` (ne jamais afficher la clé).
4. Lis en entier : ce fichier, les deux articles, `.claude/blog/humanizer.md`, `src/lib/facts.ts`.

## 1. Collecte (environ 1 h, à lancer en arrière-plan)
1. `mkdir -p data/barometre-ia/E && cp data/barometre-ia/P/alias.json data/barometre-ia/E/alias.json`
   (les fusions déjà relues servent d'un mois sur l'autre).
2. `node --env-file=.env scripts/barometre-ia.mjs` : 50 questions × 3 passages, une à la fois (limite de débit du
   compte). Le script reprend où il s'est arrêté si on le relance.
3. S'il affiche « Plus de crédit sur le compte OpenAI », arrête la routine : rien n'est publié. Dis à Anthony
   d'ajouter du crédit (environ 8 $ par édition) sur platform.openai.com > Settings > Billing.
4. Vérifie la fin : `Fini : 150 passage(s)`.

## 2. Doublons de noms
1. `node --env-file=.env scripts/barometre-ia-doublons.mjs` → `data/barometre-ia/E/doublons-proposes.json`.
2. Relis chaque proposition. Fusionne seulement les noms qui désignent **certainement** le même établissement :
   variante d'écriture, ville ou quartier ajouté, « Maître » / « Me », forme juridique, nom du site au lieu du nom.
   Ne fusionne jamais deux adresses d'une même enseigne, ni deux personnes différentes d'un même cabinet. Dans le
   doute, laisse séparé.
3. Ajoute chaque fusion à `data/barometre-ia/E/alias.json` (`"variante": "nom affiché"`). Le nom affiché ne contient
   pas de virgule (il est listé dans des énumérations). Supprime ensuite `doublons-proposes.json`.
4. `node --env-file=.env scripts/barometre-ia.mjs` (0 passage à faire) pour réécrire synthèse et CSV.

## 3. Liens cités
Vérifie que chaque lien cité fonctionne, et garde le relevé :

```bash
E=AAAA-MM; node -e "const r=require('./data/barometre-ia/$E/reponses.json').reponses;console.log([...new Set(r.flatMap(a=>a.citations.map(c=>c.url)))].join('\n'))" > /tmp/urls.txt
(printf "code_http\tcode_curl\turl\n"; cat /tmp/urls.txt | xargs -P 16 -I{} sh -c 'c=$(curl -s -o /dev/null -L --max-redirs 5 -m 20 -A "Mozilla/5.0 (Macintosh) Chrome/130.0" -w "%{http_code}" "$1"; printf "\t$?"); printf "%s\t%s\n" "$c" "$1"' _ {} | sort -k3) > data/barometre-ia/$E/liens-verifies-$(date +%F).tsv
```

Compte comme morts : 404 / 410, nom de domaine sans adresse (`dig +short A` vide), domaine parqué, site affichant
qu'il est bloqué ou suspendu. Revérifie un par un ceux qui échouent (code 000). Ne compte pas les 403, 402 et 429
(robots refusés, paywall). Note combien sont des sites d'entreprises recommandées (champ `site` des entreprises).

## 4. Chiffres et articles
1. `node scripts/barometre-ia-chiffres.mjs --edition E --tableaux` : affiche tous les chiffres et réécrit les tableaux
   « question par question » des deux articles. Reporte **ces** chiffres, jamais un calcul fait à la main.
   Celui de `P` (`--edition P`, sans `--tableaux`) sert à la comparaison.
2. Mets à jour les deux articles (FR, puis l'EN en adaptation fidèle) :
   - frontmatter : le mois dans `title`, la `description` (chiffres), `updatedDate` = aujourd'hui (`pubDate` ne change pas) ;
   - le chapô, le tableau des chiffres clés, la répartition 1 / 2 / 3 fois, les questions sans adresse stable,
     le tableau par secteur (dans l'ordre donné par le script) et l'intertitre qui le résume s'il ne colle plus,
     les exemples chiffrés (yoga, coiffeur, dentiste, site internet : `parQuestion`), le tableau des sites les plus
     cités, les liens morts, la section Méthode (date de collecte), la transparence (citations d'Anthony :
     `anthonyProfit` ; clients : cherche les noms de `src/lib/clients.ts` dans les réponses), la FAQ, l'encadré final
     et la date de la prochaine édition (mois suivant) ;
   - à partir de la 2e édition, une section `## Comment le baromètre évolue d'un mois à l'autre` (EN :
     `## How the barometer changes from month to month`) juste après les chiffres clés : un tableau avec une ligne par
     édition (entreprises différentes, citées une seule fois, citées à chaque fois, sites des entreprises parmi les
     sites cités) et 2 à 4 phrases sur ce qui bouge vraiment. Une variation de 1 ou 2 points n'est pas une tendance :
     dis-le plutôt que de la commenter ;
   - section Données : les liens de l'édition `E` en premier, puis ceux des éditions précédentes.
3. Règles d'écriture : celles de `.claude/blog/ROUTINE.md` §3 (Humanizer, **zéro tiret cadratin ou demi-cadratin**,
   pas de mots IA), tutoiement nulle part dans les articles (vouvoiement), aucune interprétation que les données ne
   montrent pas, aucun commerce cité en négatif (les sites morts restent anonymes).
4. `public/llms.txt` : mets à jour les deux lignes du baromètre (FR et EN) avec les chiffres de `E`.

## 5. Reel et Story
Dans `.claude/blog/social/barometre-chatgpt-commerces-nice/video.html`, remplace les chiffres par ceux de `E` :
total d'entreprises (`data-count` de la scène `total`), 1 / 2 / 3 fois (scène `once` : compteur, barres
`data-grow`, légende), les 6 secteurs dans l'ordre (scène `sectors`), les sources (scène `sources`) et « Novembre
2026 » en pied de page. Pour la scène `answers`, choisis une question avec au moins 15 noms et une seule entreprise
citée 3 fois sur 3. Montre-la dans les trois réponses, avec trois noms par réponse qui ne sont cités **que** dans
cette réponse. Ajuste le texte de la scène (« 20 coiffeurs cités… ») et la question tapée dans la scène `hook`. Pas
de tiret cadratin ou demi-cadratin.
Puis `node .claude/blog/social/barometre-chatgpt-commerces-nice/render-video.mjs` (reel.mp4, story.mp4,
reel-cover.jpg), regarde quelques images extraites avec ffmpeg, et mets `post.txt` à jour avec les nouveaux chiffres.

## 6. Vérification
1. `npm run build` sans erreur ; `dist/donnees/barometre-ia-nice-E.csv` existe.
2. Cherche dans les deux articles, `public/llms.txt` et `video.html` les chiffres de `P` qui ne devraient plus y être
   (hors tableau d'évolution) : aucune occurrence oubliée. `grep -c "[—–]"` sur les deux articles doit donner 0.
3. Les noms stables de `synthese.json` apparaissent tels quels dans les tableaux FR et EN.

## 7. Pull request (sans fusion)
1. `git add data/barometre-ia scripts src/content/blog public/llms.txt .claude/blog/social/barometre-chatgpt-commerces-nice`
   puis commit (`feat(blog): baromètre IA de Nice, édition <mois année>`), `git push -u origin barometre-E`.
2. `gh pr create --base main` : un tableau « P / E » des chiffres clés, ce qui a changé dans les articles, les liens
   morts trouvés, le coût de la collecte (tokens affichés par le script), et ce qu'Anthony doit faire après la fusion :
   - signaler les pages à Bing :
     ```bash
     curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.indexnow.org/indexnow -H "Content-Type: application/json; charset=utf-8" -d '{"host":"anthonyprofit.com","key":"006f68e5dac9baa65a25f8b6602dee59","keyLocation":"https://anthonyprofit.com/006f68e5dac9baa65a25f8b6602dee59.txt","urlList":["https://anthonyprofit.com/blog/barometre-chatgpt-commerces-nice/","https://anthonyprofit.com/en/blog/chatgpt-nice-businesses-barometer/","https://anthonyprofit.com/llms.txt"]}'
     ```
   - poster le Reel et la Story (`post.txt`).
3. Ne fusionne pas. Termine par un résumé court : chiffres clés de `E` contre `P`, lien de la PR, ce qui reste à faire.
