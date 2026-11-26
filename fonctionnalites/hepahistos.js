// Hepahistos : réviser en jouant, par thème ; un parcours à cocher de la synthèse aux jeux et aux vidéos. Tickets #22 et #29.
Outil.enregistrer({
  id: 'hepahistos',
  titre: 'Hepahistos',
  icone: '🎲',
  description: 'Réviser en jouant : un parcours par thème, de la synthèse aux jeux et aux vidéos',
  principe: 'Mélanger les sujets',
  ticket: 22,
  ordre: 65,
  afficher(zone, O) {
    const { el } = O;
    const memoire = O.memoire('hepahistos');

    if (!document.getElementById('style-hepahistos')) {
      document.head.append(el('style', { id: 'style-hepahistos' }, `
        .f-hepahistos .etoiles { font-size: 1.6rem; letter-spacing: 4px; margin: 4px 0; }
        .f-hepahistos .etape { display: grid; gap: 8px; }
        .f-hepahistos .etape.faite h2 { color: var(--succes); }
        .f-hepahistos .fait { display: flex; gap: 10px; align-items: center; min-height: 44px; font-weight: 600; }
        .f-hepahistos .fait input { width: 22px; height: 22px; margin: 0; flex: none; }
      `));
    }

    const racine = el('div', { class: 'f-hepahistos' });
    zone.append(racine);

    // Mémoire : { idMatiere: [id des étapes faites] }
    const faites = (id) => memoire.lire({})[id] || [];
    const marquer = (id, etape, oui) => {
      const t = memoire.lire({});
      const liste = (t[id] || []).filter((e) => e !== etape);
      t[id] = oui ? liste.concat(etape) : liste;
      memoire.ecrire(t);
    };

    const ETAPES = [
      { id: 'synthese', icone: '📝', nom: 'La synthèse', aide: 'Votre cours résumé sur une page, à écouter si vous voulez.', vers: 'fiche-revision', bouton: 'Faire ma fiche' },
      { id: 'quiz', icone: '❓', nom: 'Le quiz', aide: 'Des questions à choix pour vous tester.', vers: 'quiz', bouton: 'Jouer au quiz' },
      { id: 'questions', icone: '🎯', nom: 'Question-réponse', aide: 'Tapez la réponse sans choix proposés : 1 point par bonne réponse.', vers: 'question-reponse', bouton: 'Jouer' },
      { id: 'karaoke', icone: '🎤', nom: 'Le karaoké', aide: 'Votre cours en chanson, avec des trous à compléter.', vers: 'karaoke', bouton: 'Chanter' },
      { id: 'videos', icone: '🎬', nom: 'Les vidéos', aide: 'Votre IA propose quoi chercher sur YouTube pour les notions difficiles.', bouton: 'Trouver des vidéos' },
    ];

    function promptVideos(matiere) {
      return 'Voici mes notes de cours sur « ' + matiere.nom + ' ».\n'
        + 'Repère les 3 notions les plus difficiles de ces notes. Pour chacune, donne les mots exacts à taper dans YouTube pour trouver une vidéo qui l\'explique, '
        + 'et dis en une phrase ce que la vidéo doit m\'apprendre. N\'invente ni titre de vidéo ni lien.\n\n'
        + 'Mes notes :\n' + matiere.notes;
    }

    function dessiner() {
      racine.replaceChildren();
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, 'Réviser en jouant'),
        el('p', {}, 'Choisissez un thème, puis suivez le parcours. Cochez chaque étape faite pour gagner une étoile.')));
      racine.append(O.choixMatiere(dessiner));
      const matiere = O.matieres.active();
      if (!matiere) return;
      const fait = faites(matiere.id);
      const total = ETAPES.length;
      const n = ETAPES.filter((e) => fait.includes(e.id)).length;

      racine.append(el('section', { class: 'carte' },
        el('p', { class: 'etoiles', 'aria-label': n + ' étoile(s) sur ' + total }, '⭐'.repeat(n) + '☆'.repeat(total - n)),
        el('p', {}, n === total
          ? 'Parcours terminé sur « ' + matiere.nom + ' » : bravo !'
          : n + ' étape(s) sur ' + total + ' pour « ' + matiere.nom + ' ».'),
        n ? el('button', { class: 'lien', onclick: () => { const t = memoire.lire({}); t[matiere.id] = []; memoire.ecrire(t); dessiner(); } }, 'Recommencer le parcours') : null));

      ETAPES.forEach((e, k) => {
        const ok = fait.includes(e.id);
        const action = e.vers
          ? el('button', { class: 'bouton secondaire', onclick: () => O.naviguer(e.vers) }, e.bouton)
          : el('button', {
            class: 'bouton secondaire',
            onclick: () => {
              if (!String(matiere.notes || '').trim()) { O.notifier('Collez d\'abord vos notes dans « Mes cours ».'); return; }
              O.ouvrirIA(promptVideos(matiere), 'Trouver des vidéos avec votre IA');
            },
          }, e.bouton);
        racine.append(el('section', { class: 'carte etape' + (ok ? ' faite' : '') },
          el('h2', {}, (k + 1) + '. ' + e.icone + ' ' + e.nom),
          el('p', { class: 'aide' }, e.aide),
          el('div', { class: 'rangee' }, action),
          el('label', { class: 'fait' },
            el('input', { type: 'checkbox', checked: ok, onchange: (ev) => { marquer(matiere.id, e.id, ev.target.checked); dessiner(); } }),
            'C\'est fait')));
      });
    }

    dessiner();
  },
});
