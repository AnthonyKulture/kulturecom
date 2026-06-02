# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Web Design Skills (installed locally in `.agents/skills/`)

Treize skills de design web sont installés sous `.agents/skills/<name>/SKILL.md`. Le harness Claude Code ne les charge **pas** automatiquement — lis le `SKILL.md` correspondant **avant de générer le design** quand le trigger matche.

**Comment les utiliser :**
1. Identifie le skill pertinent via les triggers ci-dessous
2. `Read` le fichier `.agents/skills/<name>/SKILL.md` pour charger ses règles
3. Applique-les pendant la génération (typographie, palette, layout, motion, etc.)
4. Si plusieurs skills matchent, combine-les (ex: `design-taste-frontend` + `high-end-visual-design` + `minimalist-ui`)

### Skills code-frontend (générer du HTML/CSS/JS/React)

| Skill | Quand l'utiliser |
|---|---|
| **design-taste-frontend** | Default pour landing pages, portfolios, redesigns. Anti-slop, lit le brief, choisit la direction. Commence ici. |
| **design-taste-frontend-v1** | Version v1 (legacy). N'utiliser que si compatibilité exacte demandée. |
| **gpt-taste** | Quand on veut une UI très éditoriale + GSAP avancé (ScrollTrigger, pinning, scrubbing), structure AIDA stricte, bento grids. |
| **high-end-visual-design** | Pour donner un feel "agence haut de gamme" : typo, ombres, cards, animations. Bloque les défauts cheap. |
| **minimalist-ui** | Interfaces éditoriales clean, palette monochrome chaude, bento plat, pastels muets. Pas de gradient/ombre lourde. |
| **industrial-brutalist-ui** | Esthétique brutaliste/militaire/terminal, grilles rigides, typo extrême, dégradation analogique. |
| **redesign-existing-projects** | Pour upgrader un site existant : audit, retrait des patterns AI génériques, application des standards premium sans casser le fonctionnel. |
| **image-to-code** | Quand la tâche est visuellement importante : générer d'abord les images de design, les analyser, puis coder pour matcher. |
| **stitch-design-taste** | Génère un `DESIGN.md` agent-friendly (typo, couleurs, layout, motion) avant le code. Utile pour cadrer un projet. |

### Skills image-generation (NE génèrent PAS de code, génèrent des concepts visuels)

| Skill | Quand l'utiliser |
|---|---|
| **brandkit** | Brand-guidelines decks, logo systems, identity boards (3×3, 2×3, etc.). Pour brief de marque/identité. |
| **imagegen-frontend-web** | Concepts visuels de landing pages : **1 image horizontale par section**, palette cohérente, variété compositionnelle. |
| **imagegen-frontend-mobile** | Concepts d'écrans d'apps iOS/Android dans mockup phone subtil. |

### Skill comportemental

| Skill | Quand l'utiliser |
|---|---|
| **full-output-enforcement** | Quand l'utilisateur demande du code exhaustif sans placeholder. Bannit `// ...rest of code`. |

**Note :** `skills-lock.json` à la racine verrouille les versions. Ne pas modifier sans raison.
