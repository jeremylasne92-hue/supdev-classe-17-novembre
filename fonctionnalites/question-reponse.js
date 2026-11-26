// Question-réponse : vos cartes de « Mes cours » posées une à une ; vous tapez la réponse, 1 point par bonne réponse, la correction seulement après. Ticket #31.
Outil.enregistrer({
  id: 'question-reponse',
  titre: 'Question-réponse',
  icone: '🎯',
  description: 'Vos cartes posées une à une : tapez la réponse, 1 point par bonne réponse',
  principe: 'Se tester',
  ticket: 31,
  ordre: 15,
  afficher(zone, O) {
    const { el } = O;
    const memoire = O.memoire('question-reponse');

    if (!document.getElementById('style-question-reponse')) {
      document.head.append(el('style', { id: 'style-question-reponse' }, `
        .f-question-reponse .juste { color: var(--succes); font-weight: 700; }
        .f-question-reponse .faux { color: var(--alerte); font-weight: 700; }
        .f-question-reponse .progression { color: var(--doux); font-size: .9rem; margin: 4px 0; }
        .f-question-reponse .score { font-size: 2.4rem; font-weight: 700; color: var(--accent); margin: 0; }
      `));
    }

    const racine = el('div', { class: 'f-question-reponse' });
    zone.append(racine);

    // Mémoire : { idMatiere: { meilleur, total } }
    const lireMatiere = (id) => Object.assign({ meilleur: 0, total: 0 }, memoire.lire({})[id]);
    const ecrireMatiere = (id, d) => { const t = memoire.lire({}); t[id] = d; memoire.ecrire(t); };

    // Compare sans tenir compte des majuscules, des accents ni de la ponctuation.
    const normal = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
    const estJuste = (donnee, attendue) => {
      const a = normal(donnee);
      const b = normal(attendue);
      return !!a && (a === b || (a.length >= 3 && (' ' + b + ' ').includes(' ' + a + ' ')));
    };

    function accueil() {
      racine.replaceChildren();
      racine.append(O.choixMatiere(accueil));
      const matiere = O.matieres.active();
      if (!matiere) return;
      const cartes = O.cartes.liste(matiere.id).filter((c) => c.q && c.r);
      if (!cartes.length) {
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Question-réponse'),
          el('p', { class: 'aide' }, 'Le jeu pose les questions de vos cartes. Ajoutez d\'abord des cartes dans « Mes cours » : votre IA peut les écrire pour vous.'),
          el('a', { class: 'bouton secondaire', href: '#mes-cours' }, 'Aller à Mes cours')));
        return;
      }
      const d = lireMatiere(matiere.id);
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, 'Question-réponse'),
        el('p', {}, 'Une question à la fois. Tapez votre réponse : 1 point par bonne réponse. La correction vient seulement après votre essai.'),
        el('p', { class: 'aide' }, cartes.length + ' carte(s) sur « ' + matiere.nom + ' ».'
          + (d.total ? ' Meilleur score : ' + d.meilleur + ' / ' + d.total + '.' : '')),
        el('button', { class: 'bouton', onclick: () => jouer(matiere, O.melanger(cartes).slice(0, 10)) }, 'Commencer')));
    }

    function jouer(matiere, liste) {
      let i = 0;
      let points = 0;

      function question() {
        racine.replaceChildren();
        const c = liste[i];
        const champ = el('input', { type: 'text', autocomplete: 'off', 'aria-label': 'Votre réponse' });
        const verdict = el('div', { 'aria-live': 'polite' });
        const suite = el('div', { class: 'rangee' });
        const valider = el('button', { class: 'bouton', type: 'submit' }, 'Valider ma réponse');

        const suivant = () => el('button', {
          class: 'bouton',
          onclick: () => { i++; if (i < liste.length) question(); else bilan(); },
        }, i + 1 < liste.length ? 'Question suivante' : 'Voir mon score');

        function corriger(e) {
          e.preventDefault();
          if (!champ.value.trim()) { O.notifier('Essayez une réponse avant de voir la correction.'); return; }
          champ.disabled = true;
          valider.remove();
          if (estJuste(champ.value, c.r)) {
            points++;
            verdict.replaceChildren(el('p', { class: 'juste' }, 'Bonne réponse : 1 point.'));
            suite.replaceChildren(suivant());
            return;
          }
          verdict.replaceChildren(
            el('p', { class: 'faux' }, 'Pas tout à fait.'),
            el('p', {}, 'Réponse attendue : ' + c.r),
            el('p', { class: 'aide' }, 'Votre réponse dit la même chose avec d\'autres mots ? Comptez-vous le point.'));
          suite.replaceChildren(
            el('button', {
              class: 'bouton secondaire',
              onclick: () => { points++; verdict.replaceChildren(el('p', { class: 'juste' }, 'Point compté.')); suite.replaceChildren(suivant()); },
            }, 'J\'avais bon : 1 point'),
            suivant());
        }

        racine.append(
          el('p', { class: 'progression' }, 'Question ' + (i + 1) + ' sur ' + liste.length + ' · ' + points + ' point(s)'),
          el('section', { class: 'carte' },
            el('h2', {}, c.q),
            el('form', { onsubmit: corriger }, champ, el('div', { class: 'rangee' }, valider)),
            verdict,
            suite),
          el('button', { class: 'lien', onclick: accueil }, 'Arrêter le jeu'));
        champ.focus();
      }

      function bilan() {
        const matiereId = matiere.id;
        const d = lireMatiere(matiereId);
        const record = !d.total || points / liste.length > d.meilleur / d.total;
        if (record) ecrireMatiere(matiereId, { meilleur: points, total: liste.length });
        racine.replaceChildren(el('section', { class: 'carte' },
          el('h2', {}, 'Votre score'),
          el('p', { class: 'score' }, points + ' / ' + liste.length),
          el('p', { class: 'aide' }, record ? 'Nouveau meilleur score. Bravo !' : 'Rejouez pour battre votre meilleur score.'),
          el('div', { class: 'rangee' },
            el('button', { class: 'bouton', onclick: () => jouer(matiere, O.melanger(liste)) }, 'Rejouer'),
            el('button', { class: 'bouton secondaire', onclick: accueil }, 'Retour'))));
      }

      question();
    }

    accueil();
  },
});
