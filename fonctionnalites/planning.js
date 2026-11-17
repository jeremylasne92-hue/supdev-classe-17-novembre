// Planning : vos échéances triées par date, des révisions espacées, et un rappel à l'ouverture de l'outil. Ticket #5.
(function () {
  const memoire = Outil.memoire('planning');
  const lire = () => Object.assign({ taches: [] }, memoire.lire({}));

  // Dates au format AAAA-MM-JJ, comptées en jours depuis aujourd'hui
  const versDate = (s) => { const [a, m, j] = String(s).split('-').map(Number); return new Date(a, m - 1, j); };
  const aujourdhui = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const ecart = (s) => Math.round((versDate(s) - aujourdhui()) / 86400000);
  const dansNJours = (n) => {
    const d = aujourdhui();
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const quand = (s) => {
    const n = ecart(s);
    if (n < 0) return 'En retard de ' + (-n) + (n === -1 ? ' jour' : ' jours');
    if (n === 0) return 'Aujourd\'hui';
    if (n === 1) return 'Demain';
    return 'Dans ' + n + ' jours';
  };

  // Rappel à l'ouverture : les échéances en retard, du jour ou du lendemain
  const urgentes = lire().taches.filter((t) => !t.faite && t.date && ecart(t.date) <= 1);
  if (urgentes.length) {
    setTimeout(() => {
      if (location.hash === '#planning') return;
      const t = urgentes.sort((a, b) => a.date.localeCompare(b.date))[0];
      Outil.notifier('Rappel : « ' + t.titre + ' », ' + quand(t.date).toLowerCase()
        + (urgentes.length > 1 ? ', et ' + (urgentes.length - 1) + ' autre(s) dans « Planning »' : '') + '.');
    }, 1500);
  }

  Outil.enregistrer({
    id: 'planning',
    titre: 'Planning',
    icone: '📅',
    description: 'Vos échéances triées par date, des révisions espacées et un rappel à l\'ouverture',
    principe: 'Espacer les révisions',
    ticket: 5,
    ordre: 50,
    afficher(zone, O) {
      const { el } = O;

      if (!document.getElementById('style-planning')) {
        document.head.append(el('style', { id: 'style-planning' }, `
          .f-planning .tache { display: flex; gap: 10px; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; }
          .f-planning .tache .quand { font-size: .85rem; font-weight: 700; color: var(--doux); }
          .f-planning .tache.retard .quand { color: var(--alerte); }
          .f-planning .tache.proche .quand { color: var(--accent); }
          .f-planning .priorite { background: var(--accent); color: #fff; border-radius: var(--rayon); padding: 14px 16px; margin: 12px 0; }
          .f-planning .priorite p { margin: 2px 0; }
          .f-planning .faite { text-decoration: line-through; color: var(--doux); }
        `));
      }

      const racine = el('div', { class: 'f-planning' });
      zone.append(racine);
      const ecrire = (d) => memoire.ecrire(d);
      const nomMatiere = (id) => { const m = id && O.matieres.trouver(id); return m ? m.nom : ''; };
      const nouvelId = () => Math.random().toString(36).slice(2, 10);

      function dessiner() {
        racine.replaceChildren();
        const d = lire();
        const aFaire = d.taches.filter((t) => !t.faite).sort((a, b) => a.date.localeCompare(b.date));
        const faites = d.taches.filter((t) => t.faite);

        if (aFaire.length) {
          const p = aFaire[0];
          racine.append(el('div', { class: 'priorite' },
            el('p', {}, el('strong', {}, 'À faire en priorité')),
            el('p', {}, p.titre + (nomMatiere(p.matiere) ? ' · ' + nomMatiere(p.matiere) : '')),
            el('p', {}, quand(p.date) + ' · ' + versDate(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))));
        }

        // Ajouter une échéance
        const titre = el('input', { type: 'text', placeholder: 'Ex. : Rendre le PowerPoint de marketing' });
        const date = el('input', { type: 'date', value: dansNJours(1) });
        const matieres = O.matieres.liste();
        const matiere = el('select', { 'aria-label': 'Matière' },
          el('option', { value: '' }, 'Aucune'),
          matieres.map((m) => el('option', { value: m.id }, m.nom)));
        racine.append(el('form', {
          class: 'carte',
          onsubmit: (e) => {
            e.preventDefault();
            if (!titre.value.trim() || !date.value) { O.notifier('Indiquez la tâche et sa date.'); return; }
            d.taches.push({ id: nouvelId(), titre: titre.value.trim(), date: date.value, matiere: matiere.value, faite: false });
            ecrire(d);
            O.notifier('Échéance ajoutée.');
            dessiner();
          },
        },
        el('h2', {}, 'Ajouter une échéance'),
        el('label', { class: 'champ' }, el('span', {}, 'Tâche'), titre),
        el('label', { class: 'champ' }, el('span', {}, 'Pour le'), date),
        el('label', { class: 'champ' }, el('span', {}, 'Matière'), matiere),
        el('button', { class: 'bouton', type: 'submit' }, 'Ajouter')));

        // Révisions espacées
        if (matieres.length) {
          const choix = el('select', { 'aria-label': 'Matière à réviser' }, matieres.map((m) => el('option', { value: m.id }, m.nom)));
          racine.append(el('section', { class: 'carte' },
            el('h2', {}, 'Planifier des révisions espacées'),
            el('p', { class: 'aide' }, 'Réviser demain, dans 3 jours puis dans 7 jours aide à retenir plus longtemps qu\'une seule longue séance.'),
            el('label', { class: 'champ' }, el('span', {}, 'Matière'), choix),
            el('button', {
              class: 'bouton secondaire',
              onclick: () => {
                const nom = nomMatiere(choix.value);
                [1, 3, 7].forEach((n) => d.taches.push({
                  id: nouvelId(), titre: 'Réviser ' + nom + ' (quiz ou fiche, 25 minutes)', date: dansNJours(n), matiere: choix.value, faite: false,
                }));
                ecrire(d);
                O.notifier('Trois révisions ajoutées.');
                dessiner();
              },
            }, 'Ajouter 3 révisions')));
        }

        // Liste des échéances
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Mes échéances (' + aFaire.length + ')'),
          aFaire.length
            ? el('ul', { class: 'liste' }, aFaire.map((t) => {
              const n = ecart(t.date);
              return el('li', { class: 'tache' + (n < 0 ? ' retard' : n <= 2 ? ' proche' : '') },
                el('div', {},
                  el('div', { class: 'quand' }, quand(t.date)),
                  el('div', {}, t.titre),
                  nomMatiere(t.matiere) ? el('div', { class: 'aide' }, nomMatiere(t.matiere)) : null),
                el('div', { class: 'rangee' },
                  el('button', { class: 'bouton secondaire', onclick: () => { t.faite = true; ecrire(d); dessiner(); } }, 'Fait'),
                  el('button', { class: 'lien', onclick: () => { d.taches = d.taches.filter((x) => x.id !== t.id); ecrire(d); dessiner(); } }, 'Supprimer')));
            }))
            : el('p', { class: 'aide' }, 'Aucune échéance. Ajoutez vos devoirs et vos examens : l\'outil vous les rappelle à l\'ouverture.')));

        if (faites.length) {
          racine.append(el('section', { class: 'carte' },
            el('h2', {}, 'Terminées (' + faites.length + ')'),
            el('ul', { class: 'liste' }, faites.map((t) => el('li', { class: 'faite' }, t.titre))),
            el('button', { class: 'lien', onclick: () => { d.taches = d.taches.filter((x) => !x.faite); ecrire(d); dessiner(); } }, 'Effacer les tâches terminées')));
        }
      }

      dessiner();
    },
  });
})();
