// Karaoké : votre IA met votre cours en chanson ; vous complétez les trous en chantant, vert si c'est juste, rouge sinon, puis votre score. Ticket #30.
Outil.enregistrer({
  id: 'karaoke',
  titre: 'Karaoké',
  icone: '🎤',
  description: 'Votre cours en chanson, avec des trous à compléter en chantant',
  principe: 'Se tester',
  ticket: 30,
  ordre: 70,
  afficher(zone, O) {
    const { el } = O;
    const memoire = O.memoire('karaoke');

    if (!document.getElementById('style-karaoke')) {
      document.head.append(el('style', { id: 'style-karaoke' }, `
        .f-karaoke .paroles p { margin: 10px 0; line-height: 2.2; font-size: 1.05rem; }
        .f-karaoke .paroles .air { color: var(--doux); font-style: italic; }
        .f-karaoke .trou { width: auto; display: inline-block; padding: 2px 8px; margin: 0 2px; border-width: 2px; }
        .f-karaoke .trou.juste { border-color: var(--succes); background: color-mix(in srgb, var(--succes) 14%, var(--carte)); }
        .f-karaoke .trou.faux { border-color: var(--alerte); background: color-mix(in srgb, var(--alerte) 12%, var(--carte)); }
        .f-karaoke .score { font-size: 2rem; font-weight: 700; color: var(--accent); margin: 8px 0; }
      `));
    }

    const racine = el('div', { class: 'f-karaoke' });
    zone.append(racine);

    // Mémoire : { idMatiere: { paroles, meilleur } }
    const lireMatiere = (id) => Object.assign({ paroles: '', meilleur: 0 }, memoire.lire({})[id]);
    const ecrireMatiere = (id, d) => { const t = memoire.lire({}); t[id] = d; memoire.ecrire(t); };
    const normal = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
    const MOT = /\[([^\]]+)\]/g;

    function prompt(matiere) {
      return 'Voici mes notes de cours sur « ' + matiere.nom + ' ».\n'
        + 'Écris une chanson courte (2 ou 3 couplets et un refrain) qui reprend les définitions et les informations les plus importantes de ces notes, sans rien inventer.\n'
        + 'Choisis l\'air d\'une chanson connue et indique-le sur la première ligne, ainsi : Air : titre de la chanson.\n'
        + 'Mets entre crochets chaque mot clé à retenir, 10 à 15 en tout, par exemple : La [demande] fait monter le [prix].\n'
        + 'Écris seulement l\'air et les paroles, sans titre ni commentaire.\n\n'
        + 'Mes notes :\n' + matiere.notes;
    }

    function dessiner() {
      racine.replaceChildren();
      racine.append(O.choixMatiere(dessiner));
      const matiere = O.matieres.active();
      if (!matiere) return;
      const d = lireMatiere(matiere.id);

      if (!d.paroles) {
        if (!String(matiere.notes || '').trim()) {
          racine.append(el('section', { class: 'carte' },
            el('h2', {}, 'Karaoké'),
            el('p', { class: 'aide' }, 'La chanson se fait à partir de votre cours. Collez d\'abord vos notes dans « Mes cours ».'),
            el('a', { class: 'bouton secondaire', href: '#mes-cours' }, 'Aller à Mes cours')));
          return;
        }
        const colle = el('textarea', { rows: 8, placeholder: 'Collez ici la chanson écrite par votre IA' });
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Votre cours en chanson'),
          el('p', { class: 'aide' }, '1. Ouvrez votre IA : elle écrit une chanson avec les mots clés entre crochets. 2. Relisez-la avec votre cours. 3. Collez-la ici.'),
          el('button', { class: 'bouton secondaire', onclick: () => O.ouvrirIA(prompt(matiere), 'Créer une chanson avec votre IA') }, 'Ouvrir mon IA'),
          colle,
          el('button', {
            class: 'bouton',
            onclick: () => {
              if (!/\[[^\]]+\]/.test(colle.value)) { O.notifier('Aucun mot entre crochets : demandez à votre IA de les ajouter.'); return; }
              ecrireMatiere(matiere.id, { paroles: colle.value, meilleur: 0 });
              dessiner();
            },
          }, 'Enregistrer ma chanson')));
        return;
      }

      // Les paroles, avec un trou à la place de chaque mot clé.
      const trous = [];
      const lignes = d.paroles.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const paroles = el('div', { class: 'paroles' }, lignes.map((ligne) => {
        if (/^air\s*:/i.test(ligne)) return el('p', { class: 'air' }, ligne);
        const morceaux = [];
        let debut = 0;
        for (const m of ligne.matchAll(MOT)) {
          morceaux.push(ligne.slice(debut, m.index));
          const trou = el('input', { type: 'text', class: 'trou', size: Math.max(4, m[1].length + 1), autocomplete: 'off', 'aria-label': 'Mot manquant' });
          trous.push({ trou, mot: m[1] });
          morceaux.push(trou);
          debut = m.index + m[0].length;
        }
        morceaux.push(ligne.slice(debut));
        return el('p', {}, morceaux);
      }));

      const resultat = el('div', { 'aria-live': 'polite' });
      const actions = el('div', { class: 'rangee' });

      function verifier() {
        if (!trous.some((t) => t.trou.value.trim())) { O.notifier('Complétez au moins un trou avant de vérifier.'); return; }
        let justes = 0;
        trous.forEach((t) => {
          const ok = normal(t.trou.value) === normal(t.mot);
          if (ok) justes++;
          t.trou.classList.toggle('juste', ok);
          t.trou.classList.toggle('faux', !ok);
        });
        const x = lireMatiere(matiere.id);
        if (justes > x.meilleur) { x.meilleur = justes; ecrireMatiere(matiere.id, x); }
        resultat.replaceChildren(
          el('p', { class: 'score' }, justes + ' / ' + trous.length),
          el('p', { class: 'aide' }, justes === trous.length ? 'Toutes les paroles sont justes : cours validé !' : 'En vert : juste. En rouge : à revoir. Corrigez puis vérifiez encore.'));
        actions.replaceChildren(
          el('button', { class: 'bouton', onclick: verifier }, 'Vérifier encore'),
          el('button', {
            class: 'bouton secondaire',
            onclick: () => trous.forEach((t) => { if (!t.trou.classList.contains('juste')) { t.trou.value = t.mot; t.trou.classList.remove('faux'); } }),
          }, 'Voir les réponses'),
          el('button', { class: 'bouton secondaire', onclick: () => ecouter(d.paroles) }, '🔊 Écouter la chanson'),
          el('button', { class: 'bouton secondaire', onclick: dessiner }, 'Recommencer'));
      }

      actions.append(el('button', { class: 'bouton', onclick: verifier }, 'Vérifier mes paroles'));
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, 'Chantez et complétez'),
        el('p', { class: 'aide' }, 'Chantez la chanson et remplissez chaque trou de mémoire.'
          + (d.meilleur ? ' Meilleur score : ' + d.meilleur + ' / ' + trous.length + '.' : '')),
        paroles,
        resultat,
        actions,
        el('button', {
          class: 'lien',
          onclick: () => { ecrireMatiere(matiere.id, { paroles: '', meilleur: 0 }); dessiner(); },
        }, 'Changer de chanson')));
    }

    // Lecture à voix haute par le navigateur, proposée seulement après une vérification.
    function ecouter(texte) {
      const voix = window.speechSynthesis;
      if (!voix || !window.SpeechSynthesisUtterance) { O.notifier('Votre navigateur ne sait pas lire à voix haute.'); return; }
      voix.cancel();
      const phrase = new window.SpeechSynthesisUtterance(String(texte).replace(/^air\s*:.*$/im, '').replace(/[[\]]/g, ''));
      phrase.lang = 'fr-FR';
      voix.speak(phrase);
    }

    dessiner();
  },
});
