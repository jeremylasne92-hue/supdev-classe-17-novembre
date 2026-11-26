// Minuteur : une séance de révision de 20 à 30 minutes, puis une pause de 5 minutes, pour rester concentré. Ticket #15.
// Classe du 26 novembre : un conseil du jour pour la concentration et la créativité (#33).
(function () {
  const memoire = Outil.memoire('minuteur');
  const jour = () => new Date().toLocaleDateString('fr-CA');
  const lire = () => {
    const d = Object.assign({ fin: 0, type: 'travail', longueur: 25, duree: 25, seances: 0, jour: jour(), dernier: '' }, memoire.lire({}));
    if (d.jour !== jour()) { d.seances = 0; d.jour = jour(); }
    return d;
  };
  const ecrire = (d) => memoire.ecrire(d);
  const ENCOURAGEMENTS = [
    'Bravo : une séance de plus.',
    'Bien joué. Votre cerveau a mérité sa pause.',
    'Chaque séance compte : continuez comme ça.',
    'Beau travail : vous êtes resté concentré jusqu\'au bout.',
  ];
  const CONSEILS = [
    'Posez votre téléphone dans une autre pièce : votre attention reste à vous.',
    'Commencez par la tâche la plus courte. La réussir donne de l\'élan pour la suite.',
    'Buvez un verre d\'eau avant de commencer : votre cerveau travaille mieux.',
    'Une idée vous traverse ? Notez-la sur un papier et reprenez : vous la retrouverez à la pause.',
    'Changez de lieu de temps en temps : un nouveau décor réveille la créativité.',
    'Pendant la pause, marchez ou regardez au loin plutôt qu\'un écran.',
    'Expliquez votre cours à voix haute, comme à un ami : les idées se relient.',
    'Fixez-vous un seul objectif pour la séance, précis et atteignable.',
  ];

  let veille = null;
  let ecran = null; // redessine le minuteur s'il est affiché

  function finir(d) {
    const travail = d.type === 'travail';
    d.fin = 0;
    d.dernier = travail ? 'travail' : 'pause';
    if (travail) d.seances++;
    ecrire(d);
    Outil.notifier(travail ? 'Séance terminée : place à la pause.' : 'Pause terminée : prêt pour la suite ?');
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* pas de vibreur */ }
    if (ecran) ecran();
  }

  // Le minuteur continue pendant que vous utilisez une autre fonctionnalité.
  function surveiller() {
    if (veille) return;
    veille = setInterval(() => {
      const d = lire();
      if (!d.fin) { clearInterval(veille); veille = null; return; }
      if (d.fin <= Date.now()) { clearInterval(veille); veille = null; finir(d); return; }
      if (ecran) ecran(true);
    }, 1000);
  }
  if (lire().fin) surveiller();

  Outil.enregistrer({
    id: 'minuteur',
    titre: 'Minuteur',
    titreCourt: 'Minuteur',
    icone: '⏱️',
    description: 'Une séance de 20 à 30 minutes sans distraction, puis une pause',
    principe: 'Rester concentré',
    ticket: 15,
    ordre: 60,
    barre: true,
    afficher(zone, O) {
      const { el } = O;

      if (!document.getElementById('style-minuteur')) {
        document.head.append(el('style', { id: 'style-minuteur' }, `
          .f-minuteur .compteur { font-size: clamp(3.5rem, 18vw, 6rem); font-weight: 700; text-align: center; margin: 4px 0; font-variant-numeric: tabular-nums; color: var(--accent); }
          .f-minuteur .pause .compteur { color: var(--succes); }
          .f-minuteur .etiquette { text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; font-size: .85rem; color: var(--doux); margin: 0; }
          .f-minuteur .jauge { height: 10px; background: var(--accent-pale); border-radius: 5px; overflow: hidden; margin: 8px 0 16px; }
          .f-minuteur .jauge span { display: block; height: 100%; background: var(--accent); transition: width 1s linear; }
          .f-minuteur .pause .jauge span { background: var(--succes); }
          .f-minuteur .verifs label { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; font-weight: 400; }
          .f-minuteur .verifs input { width: auto; margin-top: 4px; }
        `));
      }

      const racine = el('div', { class: 'f-minuteur' });
      zone.append(racine);
      let compteur = null;
      let remplissage = null;

      const mmss = (ms) => {
        const s = Math.max(0, Math.ceil(ms / 1000));
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      };
      const avancement = (d) => {
        const total = (d.type === 'travail' ? d.longueur : 5) * 60000;
        return Math.min(100, Math.max(0, 100 * (1 - (d.fin - Date.now()) / total)));
      };

      function demarrer(type, minutes) {
        const d = lire();
        d.type = type;
        d.longueur = minutes;
        d.fin = Date.now() + minutes * 60000;
        d.dernier = '';
        ecrire(d);
        surveiller();
        dessiner();
      }

      function dessiner(seulementLeCompteur) {
        if (racine.isConnected === false) { ecran = null; return; }
        const d = lire();
        if (seulementLeCompteur && compteur && d.fin) {
          compteur.textContent = mmss(d.fin - Date.now());
          remplissage.style.width = avancement(d) + '%';
          return;
        }
        racine.replaceChildren();
        compteur = null;
        if (d.fin) enCours(d);
        else accueil(d);
      }
      ecran = dessiner;

      function enCours(d) {
        const travail = d.type === 'travail';
        compteur = el('p', { class: 'compteur' }, mmss(d.fin - Date.now()));
        remplissage = el('span', { style: 'width:' + avancement(d) + '%' });
        racine.append(el('section', { class: 'carte ' + (travail ? 'travail' : 'pause') },
          el('p', { class: 'etiquette' }, travail ? 'Séance de travail' : 'Pause'),
          compteur,
          el('div', { class: 'jauge' }, remplissage),
          el('p', { class: 'aide' }, travail
            ? 'Une seule tâche à la fois. Si une idée vous distrait, notez-la et revenez-y pendant la pause.'
            : 'Levez-vous, buvez de l\'eau, regardez au loin. Évitez les réseaux sociaux.'),
          el('p', { class: 'aide' }, 'Vous pouvez ouvrir le quiz ou votre fiche : le minuteur continue et vous prévient à la fin.'),
          el('button', {
            class: 'bouton danger',
            onclick: () => { const x = lire(); x.fin = 0; x.dernier = ''; ecrire(x); dessiner(); },
          }, 'Arrêter')));
      }

      function accueil(d) {
        if (d.dernier === 'travail') {
          racine.append(el('section', { class: 'carte' },
            el('h2', {}, 'Séance terminée'),
            el('p', {}, O.melanger(ENCOURAGEMENTS)[0]),
            el('p', { class: 'aide' }, 'Aujourd\'hui : ' + d.seances + (d.seances > 1 ? ' séances.' : ' séance.')),
            el('div', { class: 'rangee' },
              el('button', { class: 'bouton', onclick: () => demarrer('pause', 5) }, 'Commencer la pause de 5 minutes'),
              el('button', { class: 'lien', onclick: () => { const x = lire(); x.dernier = ''; ecrire(x); dessiner(); } }, 'Passer la pause'))));
          return;
        }
        if (d.dernier === 'pause') {
          racine.append(el('p', { class: 'aide' }, 'Pause terminée. On repart pour une séance ?'));
        } else if (d.seances) {
          racine.append(el('p', { class: 'aide' }, 'Aujourd\'hui : ' + d.seances + (d.seances > 1 ? ' séances.' : ' séance.')));
        }

        // Conseil du jour pour la concentration et la créativité, toujours positif (ticket #33).
        const conseil = el('p', {}, O.melanger(CONSEILS)[0]);
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Conseil du jour'),
          conseil,
          el('button', { class: 'lien', onclick: () => { conseil.textContent = O.melanger(CONSEILS.filter((c) => c !== conseil.textContent))[0]; } }, 'Un autre conseil')));

        racine.append(
          el('section', { class: 'carte' },
            el('h2', {}, 'Durée de la séance'),
            el('div', { class: 'rangee' }, [20, 25, 30].map((n) => el('button', {
              class: n === d.duree ? 'bouton' : 'bouton secondaire',
              'aria-pressed': n === d.duree ? 'true' : 'false',
              onclick: () => { const x = lire(); x.duree = n; ecrire(x); dessiner(); },
            }, n + ' min')))),
          el('section', { class: 'carte verifs' },
            el('h2', {}, 'Avant de commencer'),
            el('label', {}, el('input', { type: 'checkbox' }), 'Téléphone en mode « Ne pas déranger » : les notifications attendront.'),
            el('label', {}, el('input', { type: 'checkbox' }), 'Les onglets et les applications inutiles sont fermés.'),
            el('label', {}, el('input', { type: 'checkbox' }), 'Je sais ce que je révise : un quiz, une fiche ou mes notes.')),
          el('button', { class: 'bouton', onclick: () => demarrer('travail', d.duree) }, 'Commencer la séance de ' + d.duree + ' minutes'));
      }

      dessiner();
    },
  });
})();
