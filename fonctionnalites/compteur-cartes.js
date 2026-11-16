// Compteur de cartes : le nombre de cartes de chaque matière, puis le total, sur l'accueil et en détail. Ticket #1.
// Lecture seule : ce fichier ne modifie et ne supprime aucune carte.
Outil.enregistrer({
  id: 'compteur-cartes',
  titre: 'Compteur de cartes',
  icone: '🔢',
  // L'accueil relit ce texte à chaque affichage : la tuile montre donc les nombres à jour.
  description: {
    toString() {
      const matieres = Outil.matieres.liste();
      if (!matieres.length) return 'Ajoutez une matière : vos cartes seront comptées ici';
      return matieres.map((m) => m.nom + ' : ' + Outil.cartes.liste(m.id).length).join(' · ')
        + ' · Total : ' + Outil.cartes.liste().length;
    },
  },
  principe: 'Expliquer avec ses mots',
  ticket: 1,
  ordre: 2,
  afficher(zone, O) {
    const { el } = O;
    const enCartes = (n) => n + (n > 1 ? ' cartes' : ' carte');

    if (!document.getElementById('style-compteur-cartes')) {
      document.head.append(el('style', { id: 'style-compteur-cartes' },
        '.f-compteur-cartes-ligne { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }'
        + ' .f-compteur-cartes-nombre { font-weight: 700; white-space: nowrap; }'
        + ' .f-compteur-cartes-total { margin: 12px 0 0; font-size: 1.15rem; }'));
    }

    const matieres = O.matieres.liste();
    if (!matieres.length) {
      zone.append(el('p', { class: 'aide' }, "Ajoutez d'abord une matière dans « Mes cours ». ",
        el('a', { href: '#mes-cours' }, 'Aller à Mes cours')));
      return;
    }

    zone.append(
      el('section', { class: 'carte' },
        el('h2', {}, 'Vos cartes par matière'),
        el('ul', { class: 'liste' }, matieres.map((m) =>
          el('li', { class: 'f-compteur-cartes-ligne' },
            el('span', {}, m.nom),
            el('span', { class: 'f-compteur-cartes-nombre' }, enCartes(O.cartes.liste(m.id).length))))),
        el('p', { class: 'f-compteur-cartes-ligne f-compteur-cartes-total' },
          el('strong', {}, 'Total'),
          el('span', { class: 'f-compteur-cartes-nombre' }, enCartes(O.cartes.liste().length)))),
      el('p', { class: 'aide' }, 'Toutes vos cartes sont comptées : celles que vous avez écrites et celles que vous avez collées depuis votre IA.'),
      el('a', { class: 'bouton secondaire', href: '#mes-cours' }, 'Écrire une carte dans Mes cours'));
  },
});
