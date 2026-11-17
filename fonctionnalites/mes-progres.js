// Mes progrès : vos notes de quiz par matière, leur évolution et les notions à revoir. Ticket #11.
Outil.enregistrer({
  id: 'mes-progres',
  titre: 'Mes progrès',
  icone: '📈',
  description: 'Vos notes de quiz par matière, vos progrès et les notions à revoir',
  principe: 'Se tester',
  ticket: 11,
  ordre: 30,
  afficher(zone, O) {
    const { el } = O;

    if (!document.getElementById('style-mes-progres')) {
      document.head.append(el('style', { id: 'style-mes-progres' }, `
        .f-mes-progres .chiffres { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0 12px; }
        .f-mes-progres .chiffres div { background: var(--accent-pale); border-radius: 10px; padding: 10px; text-align: center; }
        .f-mes-progres .chiffres strong { display: block; font-size: 1.5rem; color: var(--accent); font-variant-numeric: tabular-nums; }
        .f-mes-progres .chiffres span { font-size: .8rem; color: var(--doux); }
        .f-mes-progres .histo { display: flex; align-items: flex-end; gap: 4px; height: 64px; padding: 4px 0; border-bottom: 1px solid var(--trait); }
        .f-mes-progres .histo span { flex: 1; max-width: 28px; min-height: 3px; background: var(--accent); border-radius: 3px 3px 0 0; }
        .f-mes-progres .tendance-haut { color: var(--succes); font-weight: 600; }
        .f-mes-progres .tendance-bas { color: var(--alerte); font-weight: 600; }
      `));
    }

    const racine = el('div', { class: 'f-mes-progres' });
    zone.append(racine);

    const matieres = O.matieres.liste();
    if (!matieres.length) {
      racine.append(el('p', { class: 'aide' }, 'Ajoutez d\'abord une matière dans « Mes cours », puis faites un quiz. ',
        el('a', { href: '#mes-cours' }, 'Aller à Mes cours')));
      return;
    }

    // Les notes viennent de la fonctionnalité « Quiz » : { idMatiere: { questions, resultats: [{ date, bonnes, total }], ratees } }
    const quiz = O.memoire('quiz').lire({});
    const pourcent = (r) => (r.total ? Math.round((100 * r.bonnes) / r.total) : 0);
    const avecQuiz = matieres.filter((m) => quiz[m.id] && (quiz[m.id].resultats || []).length);

    if (!avecQuiz.length) {
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, 'Pas encore de note'),
        el('p', { class: 'aide' }, 'Faites un premier quiz : vos notes et les notions à revoir apparaîtront ici.'),
        el('a', { class: 'bouton', href: '#quiz' }, 'Faire un quiz')));
      return;
    }

    const tous = avecQuiz.flatMap((m) => quiz[m.id].resultats);
    const derniers = avecQuiz.map((m) => quiz[m.id].resultats[quiz[m.id].resultats.length - 1]);
    const moyenne = Math.round(derniers.reduce((s, r) => s + pourcent(r), 0) / derniers.length);
    const aRevoir = avecQuiz.reduce((s, m) => s + (quiz[m.id].ratees || []).length, 0);

    racine.append(el('div', { class: 'chiffres' },
      el('div', {}, el('strong', {}, String(tous.length)), el('span', {}, 'quiz faits')),
      el('div', {}, el('strong', {}, moyenne + ' %'), el('span', {}, 'dernières notes')),
      el('div', {}, el('strong', {}, String(aRevoir)), el('span', {}, 'notions à revoir'))));

    for (const m of avecQuiz) {
      const d = quiz[m.id];
      const resultats = d.resultats.slice(-10);
      const premier = d.resultats[0];
      const dernier = d.resultats[d.resultats.length - 1];
      const ecart = pourcent(dernier) - pourcent(premier);
      const ratees = d.ratees || [];

      racine.append(el('section', { class: 'carte' },
        el('h2', {}, m.nom),
        el('p', {}, 'Dernière note : ' + dernier.bonnes + ' / ' + dernier.total + ' (' + pourcent(dernier) + ' %) · ' + d.resultats.length + ' quiz'),
        el('div', { class: 'histo', role: 'img', 'aria-label': 'Vos ' + resultats.length + ' dernières notes, en pourcentage' },
          resultats.map((r) => el('span', { style: 'height:' + Math.max(pourcent(r), 4) + '%', title: r.bonnes + ' / ' + r.total }))),
        d.resultats.length > 1
          ? el('p', { class: ecart >= 0 ? 'tendance-haut' : 'tendance-bas' },
            ecart > 0 ? 'En progrès : +' + ecart + ' points depuis votre premier quiz.'
              : ecart === 0 ? 'Stable depuis votre premier quiz.'
                : ecart + ' points depuis votre premier quiz : revoyez vos erreurs.')
          : el('p', { class: 'aide' }, 'Refaites le quiz pour voir votre évolution.'),
        ratees.length
          ? el('div', {},
            el('h2', {}, 'Notions à revoir (' + ratees.length + ')'),
            el('ul', { class: 'liste' }, ratees.map((t) => el('li', {}, t))),
            el('button', {
              class: 'bouton',
              onclick: () => { O.matieres.choisir(m.id); O.naviguer('quiz'); },
            }, 'Revoir mes erreurs'))
          : el('p', {}, 'Aucune notion à revoir : bravo.')));
    }
  },
});
