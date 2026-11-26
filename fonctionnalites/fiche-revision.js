// Fiche de révision : votre cours résumé sur une page par votre IA, après avoir noté de mémoire ce que vous retenez. Ticket #13.
// Classe du 26 novembre : une partie du cours seulement (#25), chapitres remis dans l'ordre (#24), version express (#23),
// schémas et calculs expliqués (#21), astuces pour retenir (#25), questions de vérification en fin de fiche (#26).
Outil.enregistrer({
  id: 'fiche-revision',
  titre: 'Fiche de révision',
  icone: '📝',
  description: 'Votre cours résumé sur une page, après avoir noté ce que vous retenez',
  principe: 'Se tester',
  ticket: 13,
  ordre: 20,
  afficher(zone, O) {
    const { el } = O;
    const memoire = O.memoire('fiche-revision');

    if (!document.getElementById('style-fiche-revision')) {
      document.head.append(el('style', { id: 'style-fiche-revision' }, `
        .f-fiche-revision .fiche h3 { font-size: 1.05rem; margin: 16px 0 6px; color: var(--accent); }
        .f-fiche-revision .fiche p { margin: 6px 0; }
        .f-fiche-revision .fiche ul { margin: 6px 0; padding-left: 1.2em; }
        .f-fiche-revision .tableau { overflow-x: auto; margin: 8px 0; }
        .f-fiche-revision .tableau table { border-collapse: collapse; width: 100%; font-size: .95rem; }
        .f-fiche-revision .tableau th, .f-fiche-revision .tableau td { border: 1px solid var(--trait); padding: 6px 8px; text-align: left; vertical-align: top; }
        .f-fiche-revision .tableau th { background: var(--accent-pale); }
        .f-fiche-revision .souvenir { white-space: pre-wrap; color: var(--doux); }
        .f-fiche-revision .options { border: 1px solid var(--trait); border-radius: 10px; padding: 6px 12px; margin: 12px 0; }
        .f-fiche-revision .options legend { font-weight: 600; padding: 0 4px; }
        .f-fiche-revision .option { display: flex; gap: 10px; align-items: center; min-height: 44px; }
        .f-fiche-revision .option input { width: 22px; height: 22px; flex: none; margin: 0; }
      `));
    }

    const racine = el('div', { class: 'f-fiche-revision' });
    zone.append(racine);

    // Mémoire : { idMatiere: { souvenir, texte, format, date } }
    const lireTout = () => memoire.lire({});
    const lireMatiere = (id) => Object.assign({ souvenir: '', texte: '', format: 'page', date: 0 }, lireTout()[id]);
    const ecrireMatiere = (id, d) => { const t = lireTout(); t[id] = d; memoire.ecrire(t); };

    const FORMATS = {
      page: { nom: 'Une page de points clés', consigne: 'une page de points clés, avec un titre court par partie et des listes à puces' },
      tableau: { nom: 'Un tableau', consigne: 'un tableau à deux colonnes, « Notion » et « Ce qu\'il faut retenir », au format Markdown' },
      bulles: { nom: 'Des bulles (carte mentale)', consigne: 'une carte mentale écrite en texte : le sujet au centre, puis chaque idée principale en titre, et ses détails en puces dessous' },
    };

    // Options cochées avant d'ouvrir l'IA (classe du 26 novembre).
    const OPTIONS = [
      { id: 'ordre', nom: 'Remettre les chapitres dans l\'ordre', ticket: 24,
        consigne: 'Commence par remettre mes notes dans l\'ordre des chapitres. Pour chaque chapitre, donne les notions théoriques importantes.' },
      { id: 'essentiel', nom: 'Version express : l\'essentiel seulement', ticket: 23,
        consigne: 'Garde seulement les informations clés. Écarte tout détail inutile pour réviser.' },
      { id: 'schemas', nom: 'Des schémas et des calculs expliqués', ticket: 21,
        consigne: 'Quand une notion s\'y prête, ajoute un petit schéma écrit sur une ligne avec des flèches (A → B → C). Pour chaque calcul de mes notes, donne la formule, puis un exemple résolu pas à pas avec des chiffres. Vérifie chaque calcul deux fois.' },
      { id: 'astuces', nom: 'Des astuces pour retenir les définitions', ticket: 25,
        consigne: 'Pour chaque définition difficile, ajoute une astuce courte pour la retenir : un moyen mnémotechnique, une image ou un exemple de la vie courante.' },
      { id: 'questions', nom: 'Trois questions à la fin pour vérifier', ticket: 26,
        consigne: 'Termine la fiche par un titre « # Pour vérifier », suivi de 3 questions sur la fiche, sans les réponses.' },
    ];

    const nettoyer = (s) => s.replace(/\*\*|__|`/g, '').trim();

    // Affiche le texte de l'IA : titres (#), puces (-), tableaux (|) et paragraphes. Rien n'est inséré comme HTML.
    function rendre(texte) {
      const blocs = [];
      const lignes = String(texte).split(/\r?\n/);
      let i = 0;
      while (i < lignes.length) {
        const l = lignes[i].trim();
        if (!l) { i++; continue; }
        if (l.startsWith('|')) {
          const rangs = [];
          while (i < lignes.length && lignes[i].trim().startsWith('|')) {
            const t = lignes[i].trim();
            if (!/^\|[\s:|-]+\|?$/.test(t)) rangs.push(t.replace(/^\||\|$/g, '').split('|').map(nettoyer));
            i++;
          }
          blocs.push(el('div', { class: 'tableau' }, el('table', {},
            rangs.length ? el('thead', {}, el('tr', {}, rangs[0].map((c) => el('th', {}, c)))) : null,
            el('tbody', {}, rangs.slice(1).map((r) => el('tr', {}, r.map((c) => el('td', {}, c))))))));
          continue;
        }
        if (/^[-*•]\s+/.test(l)) {
          const puces = [];
          while (i < lignes.length && /^\s*[-*•]\s+/.test(lignes[i])) {
            puces.push(el('li', {}, nettoyer(lignes[i].trim().replace(/^[-*•]\s+/, ''))));
            i++;
          }
          blocs.push(el('ul', {}, puces));
          continue;
        }
        const titre = l.match(/^#{1,6}\s+(.*)$/);
        blocs.push(titre ? el('h3', {}, nettoyer(titre[1])) : el('p', {}, nettoyer(l)));
        i++;
      }
      return el('div', { class: 'fiche' }, blocs);
    }

    // Lecture à voix haute par le navigateur, sans rien envoyer sur internet (ticket #32).
    const ECOUTER = '🔊 Écouter la fiche';
    function ecouter(texte, bouton) {
      const voix = window.speechSynthesis;
      if (!voix || !window.SpeechSynthesisUtterance) { O.notifier('Votre navigateur ne sait pas lire à voix haute.'); return; }
      if (voix.speaking) { voix.cancel(); bouton.textContent = ECOUTER; return; }
      const propre = String(texte).split(/\r?\n/)
        .filter((l) => !/^\s*\|[\s:|-]+\|?\s*$/.test(l))
        .map((l) => nettoyer(l.replace(/^\s*(#{1,6}|[-*•]|\|)\s*/, '').replace(/\|/g, ', ')))
        .filter(Boolean).join('.\n');
      const phrase = new window.SpeechSynthesisUtterance(propre);
      phrase.lang = 'fr-FR';
      phrase.onend = () => { bouton.textContent = ECOUTER; };
      voix.speak(phrase);
      bouton.textContent = '⏹ Arrêter la lecture';
    }

    function prompt(matiere, format, partie, choisies) {
      const extras = OPTIONS.filter((o) => choisies.includes(o.id)).map((o) => '- ' + o.consigne).join('\n');
      return 'Voici mes notes de cours sur « ' + matiere.nom + ' ».\n'
        + 'Fais-en une fiche de révision qui tient sur une page, uniquement à partir de ces notes : '
        + 'n\'ajoute aucune information qui n\'y figure pas, et n\'oublie aucune notion importante.\n'
        + (partie ? 'Ne traite que la partie « ' + partie + ' » de mes notes, et n\'utilise que les informations de cette partie.\n' : '')
        + 'Utilise des mots simples et des phrases courtes, sans blabla.\n'
        + 'Présentation : ' + FORMATS[format].consigne + '.\n'
        + (extras ? 'En plus :\n' + extras + '\n' : '')
        + '\nMes notes :\n' + matiere.notes;
    }

    function dessiner() {
      racine.replaceChildren();
      racine.append(O.choixMatiere(dessiner));
      const matiere = O.matieres.active();
      if (!matiere) return;
      const d = lireMatiere(matiere.id);

      // La fiche enregistrée
      if (d.texte) {
        const ecoute = el('button', { class: 'bouton', onclick: () => ecouter(d.texte, ecoute) }, ECOUTER);
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Ma fiche : ' + matiere.nom),
          rendre(d.texte),
          d.souvenir ? el('div', {},
            el('h2', {}, 'Ce que vous aviez retenu de mémoire'),
            el('p', { class: 'souvenir' }, d.souvenir),
            el('p', { class: 'aide' }, 'Comparez : ce qui manque dans votre liste, c\'est ce qu\'il faut revoir en priorité.')) : null,
          el('div', { class: 'rangee' },
            ecoute,
            el('button', { class: 'bouton secondaire', onclick: () => O.naviguer('quiz') }, 'Me tester avec le quiz'),
            el('button', { class: 'bouton secondaire', onclick: () => O.copier(d.texte) }, 'Copier la fiche'),
            el('button', {
              class: 'bouton danger',
              onclick: () => { ecrireMatiere(matiere.id, Object.assign(d, { texte: '', souvenir: '' })); dessiner(); },
            }, 'Refaire la fiche'))));
        return;
      }

      if (!String(matiere.notes || '').trim()) {
        racine.append(el('section', { class: 'carte' },
          el('h2', {}, 'Créer ma fiche'),
          el('p', { class: 'aide' }, 'La fiche se fait uniquement à partir de votre cours. Collez d\'abord vos notes dans « Mes cours ».'),
          el('a', { class: 'bouton secondaire', href: '#mes-cours' }, 'Aller à Mes cours')));
        return;
      }

      // 1. De mémoire d'abord
      const souvenir = el('textarea', {
        rows: 4,
        placeholder: 'Sans regarder votre cours : les idées clés dont vous vous souvenez',
        oninput: (e) => ecrireMatiere(matiere.id, Object.assign(lireMatiere(matiere.id), { souvenir: e.target.value })),
      }, d.souvenir);
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, '1. De mémoire d\'abord'),
        el('p', { class: 'aide' }, 'Écrivez ce que vous retenez avant de lire la fiche : c\'est déjà réviser.'),
        souvenir));

      // 2. La fiche par votre IA
      const choix = el('select', {
        'aria-label': 'Présentation de la fiche',
        onchange: (e) => ecrireMatiere(matiere.id, Object.assign(lireMatiere(matiere.id), { format: e.target.value })),
      }, Object.keys(FORMATS).map((k) => el('option', { value: k, selected: k === d.format }, FORMATS[k].nom)));
      const partie = el('input', { type: 'text', placeholder: 'Exemple : Chapitre 2, ou Les coûts' });
      const cases = OPTIONS.map((o) => el('input', { type: 'checkbox', value: o.id }));
      const colle = el('textarea', { rows: 6, placeholder: 'Collez ici la fiche écrite par votre IA' });
      racine.append(el('section', { class: 'carte' },
        el('h2', {}, '2. Votre fiche'),
        el('label', { class: 'champ' }, el('span', {}, 'Présentation'), choix),
        el('label', { class: 'champ' }, el('span', {}, 'Un chapitre ou un thème seulement (facultatif)'), partie),
        el('fieldset', { class: 'options' },
          el('legend', {}, 'Ajouter à la fiche'),
          OPTIONS.map((o, k) => el('label', { class: 'option' }, cases[k], o.nom))),
        el('button', {
          class: 'bouton secondaire',
          onclick: () => O.ouvrirIA(
            prompt(matiere, choix.value, partie.value.trim(), cases.filter((c) => c.checked).map((c) => c.value)),
            'Créer une fiche avec votre IA'),
        }, 'Ouvrir mon IA'),
        el('p', { class: 'aide' }, 'Relisez la fiche avec votre cours, puis collez-la ici.'),
        colle,
        el('button', {
          class: 'bouton',
          onclick: () => {
            if (!colle.value.trim()) { O.notifier('Collez d\'abord la fiche de votre IA.'); return; }
            ecrireMatiere(matiere.id, Object.assign(lireMatiere(matiere.id), { texte: colle.value, format: choix.value, date: Date.now() }));
            O.notifier('Fiche enregistrée.');
            dessiner();
          },
        }, 'Enregistrer ma fiche')));
    }

    dessiner();
  },
});
