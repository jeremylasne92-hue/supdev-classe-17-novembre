// Avec mes mots : vous expliquez une notion avec vos mots, votre IA vérifie à partir de vos notes ; si vous bloquez, elle l'explique simplement. Ticket #17.
Outil.enregistrer({
  id: 'avec-mes-mots',
  titre: 'Avec mes mots',
  icone: '💬',
  description: 'Expliquez une notion avec vos mots, votre IA vérifie ; si vous bloquez, elle l\'explique simplement',
  principe: 'Expliquer avec ses mots',
  ticket: 17,
  ordre: 40,
  afficher(zone, O) {
    const { el } = O;
    const memoire = O.memoire('avec-mes-mots');
    const racine = el('div', { class: 'f-avec-mes-mots' });
    zone.append(racine);

    // Mémoire : { idMatiere: [{ notion, texte, date }] }, les 10 dernières explications
    const lireTout = () => memoire.lire({});
    const historique = (id) => lireTout()[id] || [];
    const garder = (id, entree) => {
      const t = lireTout();
      t[id] = [entree].concat(historique(id)).slice(0, 10);
      memoire.ecrire(t);
    };

    function promptVerifier(matiere, notion, texte) {
      return 'Je révise « ' + matiere.nom + ' ». Voici comment j\'explique la notion « ' + notion + ' » avec mes mots :\n'
        + texte + '\n\n'
        + 'Vérifie mon explication uniquement à partir de mes notes de cours ci-dessous. Réponds en mots simples :\n'
        + '1. ce qui est juste ;\n2. ce qui est faux ou imprécis, en justifiant chaque correction ;\n3. ce qui manque.\n'
        + 'Ne réécris pas toute l\'explication à ma place. Termine par une seule question pour vérifier que j\'ai compris.\n\n'
        + 'Mes notes :\n' + matiere.notes;
    }

    function promptSimple(matiere, notion) {
      return 'Explique-moi la notion « ' + notion + ' » (' + matiere.nom + ') avec des mots simples, comme à un ami qui ne connaît pas le sujet, '
        + 'uniquement à partir de mes notes ci-dessous. Si mes notes n\'en parlent pas, dis-le sans rien inventer.\n'
        + 'Ajoute un exemple concret et un petit schéma en texte, avec des flèches (→).\n'
        + 'Ensuite, demande-moi de la réexpliquer avec mes mots, et attends ma réponse.\n\n'
        + 'Mes notes :\n' + matiere.notes;
    }

    function dessiner() {
      racine.replaceChildren();
      racine.append(O.choixMatiere(dessiner));
      const matiere = O.matieres.active();
      if (!matiere) return;
      if (!String(matiere.notes || '').trim()) {
        racine.append(el('section', { class: 'carte' },
          el('p', { class: 'aide' }, 'Votre IA vérifie votre explication à partir de votre cours. Collez d\'abord vos notes dans « Mes cours ».'),
          el('a', { class: 'bouton secondaire', href: '#mes-cours' }, 'Aller à Mes cours')));
        return;
      }

      const cartes = O.cartes.liste(matiere.id);
      const notion = el('input', { type: 'text', placeholder: 'Ex. : la durée d\'un CDD' });
      const texte = el('textarea', { rows: 6, placeholder: 'Expliquez-la comme à un ami, sans regarder votre cours.' });

      const lireNotion = () => {
        if (!notion.value.trim()) { O.notifier('Indiquez d\'abord la notion à expliquer.'); return null; }
        return notion.value.trim();
      };

      racine.append(
        el('section', { class: 'carte' },
          el('h2', {}, '1. La notion'),
          el('label', { class: 'champ' }, el('span', {}, 'Notion à expliquer'), notion),
          cartes.length
            ? el('button', {
              class: 'lien',
              onclick: () => { notion.value = O.melanger(cartes)[0].q; },
            }, 'Prendre une question de mes cartes au hasard')
            : null),
        el('section', { class: 'carte' },
          el('h2', {}, '2. Avec vos mots'),
          el('p', { class: 'aide' }, 'Si vous savez l\'expliquer simplement, vous l\'avez comprise.'),
          texte,
          el('button', {
            class: 'bouton',
            onclick: () => {
              const n = lireNotion();
              if (!n) return;
              if (!texte.value.trim()) { O.notifier('Écrivez d\'abord votre explication : c\'est l\'exercice.'); return; }
              garder(matiere.id, { notion: n, texte: texte.value.trim(), date: Date.now() });
              O.ouvrirIA(promptVerifier(matiere, n, texte.value.trim()), 'Faire vérifier votre explication');
              dessinerHistorique();
            },
          }, 'Faire vérifier par mon IA')),
        el('section', { class: 'carte' },
          el('h2', {}, 'Je bloque'),
          el('p', { class: 'aide' }, 'Votre IA explique la notion avec des mots simples, un exemple et un schéma, puis vous demande de la réexpliquer.'),
          el('button', {
            class: 'bouton secondaire',
            onclick: () => { const n = lireNotion(); if (n) O.ouvrirIA(promptSimple(matiere, n), 'Expliquer simplement'); },
          }, 'Expliquer simplement')));

      const zoneHistorique = el('div', {});
      racine.append(zoneHistorique);
      function dessinerHistorique() {
        const h = historique(matiere.id);
        zoneHistorique.replaceChildren();
        if (!h.length) return;
        zoneHistorique.append(el('section', { class: 'carte' },
          el('h2', {}, 'Mes dernières explications'),
          el('ul', { class: 'liste' }, h.map((e) => el('li', {},
            el('strong', {}, e.notion), el('br'),
            el('span', { class: 'aide' }, new Date(e.date).toLocaleDateString('fr-FR') + ' : ' + e.texte))))));
      }
      dessinerHistorique();
    }

    dessiner();
  },
});
