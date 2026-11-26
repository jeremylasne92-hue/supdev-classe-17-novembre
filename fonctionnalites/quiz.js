// Quiz : un QCM écrit par votre IA à partir de vos notes ; vous répondez, puis la correction expliquée et votre note. Ticket #6.
// Classe du 26 novembre : quiz du soir (#27), quiz de réflexion (#28), réponses fiables tirées des notes (#27, #28),
// cartes flash des erreurs en fin de quiz (#26).
Outil.enregistrer({
  id: 'quiz',
  titre: 'Quiz',
  icone: '❓',
  description: 'Un QCM sur votre cours : vous répondez, puis la correction expliquée et votre note',
  principe: 'Se tester',
  ticket: 6,
  ordre: 10,
  barre: true,
  afficher(zone, O) {
    const { el } = O;
    const LETTRES = 'ABCD';
    const memoire = O.memoire('quiz');
    const TYPES = {
      classique: { nom: 'QCM classique : 10 questions', consigne: 'Crée un QCM de 10 questions' },
      soir: { nom: 'Quiz du soir : 5 questions rapides', consigne: 'Crée un quiz du soir de 5 questions courtes, sur les définitions et les faits à retenir par cœur' },
      reflexion: {
        nom: 'Quiz de réflexion : les idées essentielles',
        consigne: 'Repère d\'abord les idées essentielles de mes notes, puis crée un QCM de 8 questions qui vérifient que je les ai comprises (pourquoi, comment, dans quel cas), pas seulement apprises par cœur. Les mauvais choix sont des erreurs fréquentes et crédibles',
      },
    };

    if (!document.getElementById('style-quiz')) {
      document.head.append(el('style', { id: 'style-quiz' }, `
        .f-quiz .choix { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
        .f-quiz .choix button {
          appearance: none; width: 100%; text-align: left; font: inherit; color: var(--texte);
          background: var(--carte); border: 2px solid var(--trait); border-radius: 10px;
          padding: 12px 14px; min-height: 48px; cursor: pointer;
        }
        .f-quiz .choix button:disabled { cursor: default; }
        .f-quiz .choix button.juste { border-color: var(--succes); background: color-mix(in srgb, var(--succes) 12%, var(--carte)); }
        .f-quiz .choix button.faux { border-color: var(--alerte); background: color-mix(in srgb, var(--alerte) 10%, var(--carte)); }
        .f-quiz .verdict-juste { color: var(--succes); font-weight: 700; }
        .f-quiz .verdict-faux { color: var(--alerte); font-weight: 700; }
        .f-quiz .progression { color: var(--doux); font-size: .9rem; margin: 4px 0; }
        .f-quiz .score { font-size: 2.4rem; font-weight: 700; color: var(--accent); margin: 0; }
      `));
    }

    const racine = el('div', { class: 'f-quiz' });
    zone.append(racine);

    // Mémoire : { idMatiere: { questions: [{ q, choix, bonne, explication }], resultats: [{ date, bonnes, total }], ratees: [texte de la question] } }
    const lireTout = () => memoire.lire({});
    const lireMatiere = (id) => Object.assign({ questions: [], resultats: [], ratees: [] }, lireTout()[id]);
    const ecrireMatiere = (id, d) => { const t = lireTout(); t[id] = d; memoire.ecrire(t); };

    // Lit le QCM collé depuis l'IA : « Q: », « A) » à « D) », « Bonne réponse: B », « Explication: ».
    function lireQCM(texte) {
      const questions = [];
      let q = null;
      let champ = null;
      for (const brute of String(texte).split(/\r?\n/)) {
        const ligne = brute.replace(/\*\*/g, '').replace(/^\s*[-*•]\s*/, '').trim();
        if (!ligne) continue;
        let m;
        if ((m = ligne.match(/^(?:\d+\s*[.)]\s*)?(?:q|question)\s*\d*\s*[:.)-]\s*(.+)$/i))) {
          if (q) questions.push(q);
          q = { q: m[1].trim(), choix: [], bonne: -1, explication: '' };
          champ = 'q';
        } else if (q && (m = ligne.match(/^(?:bonne\s+)?r[ée]ponse(?:\s+correcte)?\s*[:.-]\s*\(?([A-D])\b/i))) {
          q.bonne = LETTRES.indexOf(m[1].toUpperCase());
          champ = null;
        } else if (q && (m = ligne.match(/^explication\s*[:.-]\s*(.*)$/i))) {
          q.explication = m[1].trim();
          champ = 'explication';
        } else if (q && (m = ligne.match(/^\(?([A-D])\s*[).:-]\s*(.+)$/i))) {
          q.choix[LETTRES.indexOf(m[1].toUpperCase())] = m[2].trim();
          champ = 'choix';
        } else if (q && champ === 'q') {
          q.q += ' ' + ligne;
        } else if (q && champ === 'explication') {
          q.explication += ' ' + ligne;
        }
      }
      if (q) questions.push(q);
      return questions.filter((x) => x.q && x.choix.filter(Boolean).length >= 2 && x.bonne >= 0 && x.choix[x.bonne]);
    }

    function promptQCM(matiere, type) {
      return 'Voici mes notes de cours sur « ' + matiere.nom + ' ».\n'
        + (TYPES[type] || TYPES.classique).consigne + ', uniquement à partir de ces notes : n\'ajoute aucune notion qui n\'y figure pas.\n'
        + 'Sois fiable : ne pose aucune question dont la réponse n\'est pas clairement dans mes notes, et n\'invente aucune réponse.\n'
        + 'Chaque question a 4 choix et une seule bonne réponse. Pour chaque question, écris une explication courte, en mots simples, qui justifie la bonne réponse en citant brièvement mes notes.\n'
        + 'Respecte exactement ce format, sans titre ni commentaire :\n'
        + 'Q: la question\nA) premier choix\nB) deuxième choix\nC) troisième choix\nD) quatrième choix\nBonne réponse: B\nExplication: une phrase\n\n'
        + 'Mes notes :\n' + matiere.notes;
    }

    function accueil() {
      racine.replaceChildren();
      racine.append(O.choixMatiere(accueil));
      const matiere = O.matieres.active();
      if (!matiere) return;
      const donnees = lireMatiere(matiere.id);

      if (donnees.questions.length) {
        const dernier = donnees.resultats[donnees.resultats.length - 1];
        const ratees = donnees.questions.filter((x) => donnees.ratees.includes(x.q));
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Votre quiz est prêt'),
          el('p', {}, donnees.questions.length + ' questions sur « ' + matiere.nom + ' ».'),
          dernier ? el('p', { class: 'aide' }, 'Dernière note : ' + dernier.bonnes + ' / ' + dernier.total + ' du premier coup.') : null,
          el('div', { class: 'rangee' },
            el('button', { class: 'bouton', onclick: () => jouer(matiere, donnees.questions) }, 'Commencer le quiz'),
            ratees.length
              ? el('button', { class: 'bouton secondaire', onclick: () => jouer(matiere, ratees) }, 'Revoir mes erreurs (' + ratees.length + ')')
              : null)));
      }

      const titre = donnees.questions.length ? 'Créer un nouveau quiz' : 'Créer votre quiz';
      if (!String(matiere.notes || '').trim()) {
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, titre),
          el('p', { class: 'aide' }, 'Le quiz se fait uniquement à partir de votre cours. Collez d\'abord vos notes dans « Mes cours ».'),
          el('a', { class: 'bouton secondaire', href: '#mes-cours' }, 'Aller à Mes cours')));
        return;
      }
      const colle = el('textarea', { rows: 6, placeholder: 'Collez ici le QCM écrit par votre IA' });
      const type = el('select', { 'aria-label': 'Type de quiz' },
        Object.keys(TYPES).map((k) => el('option', { value: k }, TYPES[k].nom)));
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, titre),
        el('label', { class: 'champ' }, el('span', {}, 'Type de quiz'), type),
        el('p', { class: 'aide' }, '1. Ouvrez votre IA : elle écrit les questions à partir de vos notes. 2. Relisez-les avec votre cours. 3. Collez-les ici.'),
        el('button', { class: 'bouton secondaire', onclick: () => O.ouvrirIA(promptQCM(matiere, type.value), 'Créer un QCM avec votre IA') }, 'Ouvrir mon IA'),
        colle,
        el('button', {
          class: 'bouton',
          onclick: () => {
            const questions = lireQCM(colle.value);
            if (!questions.length) {
              O.notifier('Aucune question trouvée : vérifiez les lignes Q:, A) à D) et Bonne réponse:.');
              return;
            }
            ecrireMatiere(matiere.id, { questions, resultats: donnees.resultats, ratees: [] });
            O.notifier(questions.length + ' question(s) prête(s).');
            jouer(matiere, questions);
          },
        }, 'Créer le quiz')));
    }

    function jouer(matiere, questions) {
      const liste = O.melanger(questions);
      let i = 0;
      let bonnes = 0;
      const ratees = [];

      function question() {
        racine.replaceChildren();
        const qu = liste[i];
        let premierEssai = true;
        let fini = false;
        const verdict = el('div', { 'aria-live': 'polite' });
        const suite = el('div', { class: 'rangee' });
        const boutons = [];

        function terminer(juste) {
          fini = true;
          boutons.forEach((b) => { b.disabled = true; });
          boutons[qu.bonne].className = 'juste';
          if (juste && premierEssai) bonnes++;
          else ratees.push(qu.q);
          verdict.replaceChildren(
            el('p', { class: juste ? 'verdict-juste' : 'verdict-faux' },
              juste ? (premierEssai ? 'Bonne réponse !' : 'Bonne réponse, après une erreur.') : 'La bonne réponse est la ' + LETTRES[qu.bonne] + '.'),
            qu.explication ? el('p', {}, qu.explication) : null);
          suite.replaceChildren(el('button', {
            class: 'bouton',
            onclick: () => { i++; if (i < liste.length) question(); else bilan(); },
          }, i + 1 < liste.length ? 'Question suivante' : 'Voir ma note'));
        }

        qu.choix.forEach((texte, idx) => {
          if (!texte) return;
          const b = el('button', {
            type: 'button',
            onclick: () => {
              if (fini) return;
              if (idx === qu.bonne) { terminer(true); return; }
              premierEssai = false;
              b.className = 'faux';
              b.disabled = true;
              verdict.replaceChildren(el('p', { class: 'verdict-faux' }, 'Ce n\'est pas la bonne réponse. Essayez un autre choix.'));
              suite.replaceChildren(el('button', { class: 'bouton secondaire', onclick: () => terminer(false) }, 'Voir la correction'));
            },
          }, LETTRES[idx] + ') ' + texte);
          boutons[idx] = b;
        });

        racine.append(
          el('p', { class: 'progression' }, 'Question ' + (i + 1) + ' sur ' + liste.length + ' · ' + matiere.nom),
          el('section', { class: 'carte' },
            el('h2', {}, qu.q),
            el('div', { class: 'choix' }, boutons.filter(Boolean)),
            verdict,
            suite),
          el('button', { class: 'lien', onclick: accueil }, 'Arrêter le quiz'));
      }

      function bilan() {
        const d = lireMatiere(matiere.id);
        d.resultats = d.resultats.concat({ date: Date.now(), bonnes, total: liste.length }).slice(-30);
        const reussies = liste.map((x) => x.q).filter((t) => !ratees.includes(t));
        d.ratees = d.ratees.filter((t) => !reussies.includes(t)).concat(ratees.filter((t) => !d.ratees.includes(t)));
        ecrireMatiere(matiere.id, d);
        const aRevoir = liste.filter((x) => ratees.includes(x.q));
        const garder = aRevoir.length
          ? el('button', { class: 'bouton secondaire', onclick: () => ajouterCartes(matiere, aRevoir, garder) }, 'Garder ces cartes dans Mes cours')
          : null;

        racine.replaceChildren(el('section', { class: 'carte' },
          el('h2', {}, 'Votre note'),
          el('p', { class: 'score' }, bonnes + ' / ' + liste.length),
          el('p', { class: 'aide' }, 'Réponses justes du premier coup.'),
          aRevoir.length
            ? el('div', {},
              el('h2', {}, 'Notions à revoir'),
              el('ul', { class: 'liste' }, aRevoir.map((x) => el('li', {},
                el('strong', {}, x.q), el('br'),
                'Réponse : ' + LETTRES[x.bonne] + ') ' + x.choix[x.bonne],
                x.explication ? el('span', {}, el('br'), el('span', { class: 'aide' }, x.explication)) : null))))
            : el('p', {}, 'Aucune erreur : bravo.'),
          aRevoir.length
            ? el('div', {},
              el('h2', {}, 'Vos erreurs en cartes flash'),
              el('p', { class: 'aide' }, 'La question d\'abord, la réponse seulement quand vous retournez la carte.'),
              el('div', { class: 'rangee' },
                el('button', { class: 'bouton', onclick: () => cartesFlash(matiere, aRevoir) }, 'Réviser en cartes flash'),
                garder))
            : null,
          el('div', { class: 'rangee' },
            aRevoir.length ? el('button', { class: 'bouton', onclick: () => jouer(matiere, aRevoir) }, 'Recommencer les questions ratées') : null,
            el('button', { class: 'bouton secondaire', onclick: () => jouer(matiere, d.questions) }, 'Refaire tout le quiz')),
          el('button', { class: 'lien', onclick: accueil }, 'Retour')));
      }

      question();
    }

    // Cartes flash des erreurs : la question d'abord, la réponse seulement quand vous retournez la carte (ticket #26).
    function cartesFlash(matiere, paquet) {
      let i = 0;
      function carte() {
        racine.replaceChildren();
        const x = paquet[i];
        const reponse = el('div', { 'aria-live': 'polite' });
        const suite = el('div', { class: 'rangee' });
        const retourner = el('button', {
          class: 'bouton',
          onclick: () => {
            retourner.remove();
            reponse.replaceChildren(
              el('p', { class: 'verdict-juste' }, 'Réponse : ' + x.choix[x.bonne]),
              x.explication ? el('p', {}, x.explication) : null);
            suite.replaceChildren(el('button', {
              class: 'bouton',
              onclick: () => { i++; if (i < paquet.length) carte(); else accueil(); },
            }, i + 1 < paquet.length ? 'Carte suivante' : 'Terminer'));
          },
        }, 'Retourner la carte');
        racine.append(
          el('p', { class: 'progression' }, 'Carte ' + (i + 1) + ' sur ' + paquet.length + ' · ' + matiere.nom),
          el('section', { class: 'carte' },
            el('h2', {}, x.q),
            el('p', { class: 'aide' }, 'Dites la réponse dans votre tête, puis retournez la carte.'),
            retourner,
            reponse,
            suite),
          el('button', { class: 'lien', onclick: accueil }, 'Arrêter les cartes'));
      }
      carte();
    }

    // Ajoute les erreurs aux cartes de « Mes cours », sans doublon (ticket #26).
    function ajouterCartes(matiere, paquet, bouton) {
      const deja = O.cartes.liste(matiere.id).map((c) => c.q);
      const nouvelles = paquet.filter((x) => !deja.includes(x.q));
      nouvelles.forEach((x) => O.cartes.ajouter(matiere.id, x.q, x.choix[x.bonne] + (x.explication ? '. ' + x.explication : '')));
      bouton.disabled = true;
      O.notifier(nouvelles.length ? nouvelles.length + ' carte(s) ajoutée(s) dans Mes cours.' : 'Ces cartes sont déjà dans Mes cours.');
    }

    accueil();
  },
});
