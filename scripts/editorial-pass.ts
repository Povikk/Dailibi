import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { CaseFile, Evidence } from "../src/types/case";

const clueTitles: Record<number, [string, string, string, string, string, string]> = {
  1: ["Le badge après la fermeture", "Du bleu dans la cire", "Un marché sans catalogue", "Le monte-charge ne s'arrête pas", "Une note sur l'attribution", "Le dernier cliché de Salomé"],
  2: ["La session de 23 h 17", "Le papier du bureau", "Le contrat de la crise", "Un violon sans silence", "La mesure barrée", "Une annotation vieille d'un mois"],
  3: ["Le passage de service", "Une valise trop bien préparée", "Les comptes de la fondation", "Le veilleur à son poste", "Le message de Yuna", "La chaîne vue de l'extérieur"],
  4: ["Onze minutes dans le journal", "La marque de la pince", "Le manifeste du caboteur", "La radio d'Erell", "Les appels de Jonas", "Une panne qui n'en est pas une"],
  5: ["L'armoire ouverte à contretemps", "Le départ du feu enfermé", "La publication menacée", "Le trajet d'Élise", "Les solvants de Pavel", "Ce que révèle la ventilation"],
  6: ["Une visite avant l'ouverture", "Le numéro d'émulsion", "L'acheteur sans photographie", "Diane aux Archives", "La boîte d'Hélène", "L'amorce de remplacement"],
  7: ["La porte de la sacristie", "Un son impossible", "La dette de la communauté", "L'office d'Augustin", "La corde de Basile", "Ce qui a vraiment sonné"],
  8: ["Le silence dans la playlist", "Du gel sur la molette", "Les cachets détournés", "Mina derrière la vitre", "L'ordonnance d'Alban", "Deux produits, deux usages"],
  9: ["Une entrée dans la serre C", "Le collier de la survivante", "Le brevet concurrent", "Le relevé de Tao", "L'arrosoir de Gaëlle", "Pourquoi une orchidée a résisté"],
  10: ["Six minutes hors du rapport", "Une fibre dans le velours", "L'échéance du créancier", "Le wagon-bar d'une traite", "Les mots empruntés à Alma", "L'empreinte du composteur"],
  11: ["Le code entré après 20 h", "Le rose de la calibration", "La page arrachée", "Éwen au large", "Le flacon de l'inspecteur", "Le rythme fabriqué"],
  12: ["Pia sur l'échelle", "Les paillettes du câble", "Un dossier nommé Libération", "Le cintre opposé", "La clause d'assurance", "La réunion dans le foyer"],
  13: ["Le badge de 6 h 42", "La faute de la machine", "Le virement suisse", "Nassim loin du coffre", "La minute effacée", "Ce que cachait vraiment la caméra"],
  14: ["La sortie du parking", "Le message au comptable", "La caméra de la ruelle", "Un plein trop loin", "Le casier de Nadia", "L'heure qui ne tient pas"],
  15: ["Un reflet au bord de la piste", "L'encre dans la spirale", "Le message supprimé", "Le vestiaire d'Ana", "Une glace trop chaude", "Une figure trop précise"],
  16: ["Le badge de la passerelle", "La poussière rouge", "Des hommes à la sortie", "Deux billets sous un faux nom", "La chambre réservée", "Le protocole de protection"],
  17: ["Le bracelet de sommeil", "Le narcisse de l'essai 47", "Le journal d'Émilie", "La distillation de Karim", "L'offre du concurrent", "Un courriel envoyé trop tard"],
  18: ["Le sceau remplacé", "La résine violette", "Le vocal de Zoé", "Milan dans sa chambre", "Le contrôle d'Armand", "Ce que le couple de serrage ne dit pas"],
  19: ["Une commande à l'aube", "La trajectoire trop parfaite", "Le financement menacé", "Rémi sous la coupole", "Les corrections de Chiara", "Un satellite à la place d'une comète"],
  20: ["L'ouverture de la chambre rouge", "Le cercle humide", "Le contrat photographié", "Marc devant témoins", "La clé d'Hugo", "Le temps de séchage du ficus"],
  21: ["Le passage près de la ruche 12", "Le sirop marqué", "La vente de la reine", "Nour au rucher nord", "Le pesticide de Didier", "Du poison sans pollen"],
  22: ["Une entrée avant la cuisson", "Le chiffre sous l'émail", "La police d'assurance", "Étienne à la préparation", "La porte forcée par Oscar", "Le thermocouple extérieur"],
  23: ["Le montage ouvert de nuit", "Un plongeon sans reflet", "Le billet de Cléo", "Sarah en direct", "La barque de Paul", "Deux images prises la veille"],
  24: ["Quarante secondes au palier", "La poussière du plafond", "Le transfert secret", "Eva au 18e étage", "L'outil d'Hector", "La trappe au-dessus de la cabine"],
  25: ["La ronde dans la galerie", "Le sel du garage", "L'année à faire disparaître", "Mara devant les capteurs", "La bouteille de Sofiane", "Une fuite née dans la caisse"],
  26: ["La caisse ouverte en atelier", "Le fil de la copie", "La lettre de la créatrice", "Yacine au défilé", "Les ciseaux d'Odette", "La reprise que l'original portait"],
  27: ["La carte ouverte à 23 h 08", "La tuile de la clé logistique", "Le contrat de ravitaillement", "Lila en salle de calcul", "Le commentaire de Marta", "La mosaïque sauvegardée"],
  28: ["La porte ouverte à 4 h 09", "La fleur refermée", "Le compromis de vente", "Benoît dans le dernier bus", "La recette du docteur", "Une fiche remise à tous"],
  29: ["La trappe climatique", "La bague dans la cire", "La commission d'assurance", "Côme face à l'horloge", "Le certificat du joaillier", "Étienne au pupitre"],
  30: ["Le froid dans les chaussures", "Des pas sans arrivée", "Le rapport d'Ariane", "Mila à la radio", "Le GPS de Jon", "Une recherche après la disparition"],
};

type Distractors = { motives: [string, string, string]; methods: [string, string, string] };

const accusationDistractors: Record<number, Distractors> = {
  1: { motives: ["Prouver que l'attribution du tableau était erronée", "Faire suspendre une restauration jugée trop coûteuse", "Cacher une dégradation accidentelle de la toile"], methods: ["Échanger la toile pendant son passage par le monte-charge", "Vieillir artificiellement la surface sans déplacer le tableau", "Sortir l'œuvre avec un faux ordre de transport"] },
  2: { motives: ["Faire annuler les coupures imposées au compositeur", "Reporter un concert que le premier violon jugeait impraticable", "Masquer une erreur commise pendant la préparation des partitions"], methods: ["Déclencher une panne générale du réseau de l'Opéra", "Remplacer seulement les pages distribuées aux premiers pupitres", "Modifier le fichier maître pendant la répétition"] },
  3: { motives: ["Protéger les sources de Lina avant la publication", "Empêcher la journaliste de révéler les comptes de la fondation", "Faire croire à un enlèvement pour obtenir une rançon"], methods: ["Faire sortir Lina cachée dans un chariot de service", "La faire passer par la fenêtre jusqu'à une chambre voisine", "Utiliser un double de clé puis tirer la chaîne avec un fil"] },
  4: { motives: ["Réduire la puissance du phare pour protéger les oiseaux", "Provoquer un incident contre le navire commandé par le frère de Jonas", "Cacher une erreur d'entretien du groupe de secours"], methods: ["Couper manuellement l'alimentation depuis le tableau principal", "Neutraliser le groupe électrogène avant la nuit", "Masquer la lampe avec un écran posé devant l'optique"] },
  5: { motives: ["Empêcher le prélèvement destructif de spécimens rares", "Récupérer la place de premier auteur d'une publication", "Détruire un herbier qui contredisait un brevet"], methods: ["Introduire une braise dans l'armoire au moment de la fermeture", "Verser un produit corrosif qui a noirci les planches", "Surchauffer toute la pièce en bloquant la ventilation"] },
  6: { motives: ["Éviter la publication d'une photographie liée à un scandale familial", "Dissimuler une mauvaise attribution faite par l'archiviste", "Revendre toute la boîte à un collectionneur privé"], methods: ["Découper la vue 36 pendant la numérisation", "Remplacer toute la boîte par une série presque identique", "Effacer chimiquement l'image sans retirer le négatif"] },
  7: { motives: ["Vendre la relique pour rembourser l'emprunt de l'abbaye", "Faire fermer une boutique de souvenirs jugée irrespectueuse", "Prouver que la sécurité de la sacristie était insuffisante"], methods: ["Faire sonner une cloche portative depuis la cour", "Entrer dans la sacristie avec la clé du prieur", "Cacher le reliquaire dans le mécanisme de l'horloge"] },
  8: { motives: ["Faire accuser Mina à cause de ses somnifères", "Empêcher Sonia de faire perdre sa fréquence à la radio", "Interrompre l'émission pour créer un scandale publicitaire"], methods: ["Verser le produit dans la théière commune", "Remplacer la tasse avant son entrée dans le studio", "Injecter le sédatif dans le sachet d'infusion"] },
  9: { motives: ["Saboter l'expérience rivale pour sauver un brevet refusé", "Provoquer une épidémie chez un concurrent horticole", "Empêcher la publication d'une erreur d'étiquetage"], methods: ["Faire chuter la température de toute la serre pendant la nuit", "Contaminer l'eau du réservoir principal", "Pulvériser directement un herbicide sur les orchidées"] },
  10: { motives: ["Faire porter le vol sur l'autrice de la lettre", "Toucher l'assurance après avoir sous-évalué le collier", "Empêcher Octavie de remettre le bijou au joaillier"], methods: ["Profiter du sommeil d'Octavie pour prendre la clé", "Échanger l'écrin au wagon-bar", "Faire passer le collier par la fenêtre à un complice"] },
  11: { motives: ["Prolonger les aides versées aux ostréiculteurs", "Prouver publiquement que l'essai scientifique devait échouer", "Cacher une pollution venue de la mer extérieure"], methods: ["Verser le contaminant directement dans le bassin à marée basse", "Relier discrètement le bassin à une prise d'eau de mer", "Remplacer les huîtres par un lot déjà malade"] },
  12: { motives: ["Faire respecter les avertissements du chef machiniste", "Toucher l'indemnité prévue en cas d'annulation", "Retarder une tournée dont le décor n'était pas prêt"], methods: ["Desserrer l'ancrage du câble dans les cintres", "Surcharger la lune pour rompre un câble intact", "Sectionner le câble pendant la mise en tension"] },
  13: { motives: ["Cacher une erreur commise dans la transcription", "Effacer les dettes de la maison de ventes", "Protéger un secret familial visible sur le manuscrit"], methods: ["Vieillir une copie moderne avec un traitement chimique", "Modifier numériquement les photographies du catalogue", "Échanger le manuscrit après l'adjudication"] },
  15: { motives: ["Prendre la place de Mila lors de la sélection", "Cacher les économies faites sur l'entretien de la piste", "Faire annuler une compétition jugée dangereuse"], methods: ["Réchauffer localement la glace avec une résistance", "Répandre de l'alcool depuis la surfaceuse", "Dévisser une lame du patin avant la répétition"] },
  16: { motives: ["Empêcher Romain de témoigner contre sa propre famille", "Organiser sa mise à l'abri avec son avocate", "Faire croire à une disparition pour attirer la presse"], methods: ["Faire sortir Romain déguisé parmi les spectateurs", "Le cacher dans le coffre sous son fauteuil", "Profiter d'une panne d'image pour ouvrir une sortie de secours"] },
  17: { motives: ["Rejoindre le concurrent contre une prime", "Éviter l'échec commercial d'un lancement retardé", "Empêcher Alba de supprimer définitivement la note de narcisse"], methods: ["Télécharger la formule sur une clé dissimulée", "Photographier l'écran du coffre numérique", "Reconstituer la formule à partir des fiches du chimiste"] },
  18: { motives: ["Écarter Tom pour gagner la finale", "Cacher un contrôle de sécurité oublié", "Faire fermer une voie considérée comme dangereuse"], methods: ["Desserrer la vis après le contrôle officiel", "Remplacer la prise rouge par une copie fragile", "Enduire la prise d'un produit glissant"] },
  19: { motives: ["Obtenir le renouvellement d'un financement scientifique", "Discréditer un programme astronomique concurrent", "Cacher des pixels défectueux déjà signalés"], methods: ["Insérer un faux objet dans les fichiers après la prise de vue", "Pointer le télescope vers un satellite connu", "Modifier l'horloge pour combiner trois nuits différentes"] },
  20: { motives: ["Faire tomber le recours contre le projet urbain", "Prouver qu'une clé passe-partout ouvrait la pièce", "Récupérer des plans copiés sans autorisation"], methods: ["Ouvrir la porte avec un double non déclaré", "Photographier les plans depuis le couloir avec un téléobjectif", "Entrer par la gaine de ventilation au-dessus du bureau"] },
  21: { motives: ["Faire accuser l'agriculteur qui traitait le champ voisin", "Empêcher des résultats scientifiques défavorables", "Vendre la colonie entière à un éleveur étranger"], methods: ["Contaminer le pollen rapporté par les butineuses", "Injecter le poison dans le sirop commun aux douze ruches", "Pulvériser un insecticide depuis le champ voisin"] },
  22: { motives: ["Faire accepter le dossier artistique refusé d'Oscar", "Sauver l'atelier traditionnel menacé par la nouvelle série", "Reporter l'exposition pour terminer les commandes"], methods: ["Modifier la courbe de température du four", "Frapper les bols après la cuisson puis les replacer", "Mélanger du sel directement dans tout le lot d'argile"] },
  23: { motives: ["Toucher l'assurance prévue en cas de disparition", "Remplacer Cléo par sa doublure pour finir le film", "Contraindre le studio à financer une nouvelle scène"], methods: ["Faire plonger Cléo puis la cacher sous le ponton", "Couper les trois caméras pendant sa fuite", "Faire remonter une plongeuse dans une barque hors champ"] },
  24: { motives: ["Accéder aux comptes que contenait la clé", "Empêcher un audit de menacer un cadre de la tour", "Démontrer que le mode inspection n'était pas sécurisé"], methods: ["Ouvrir la mallette avec une copie de la clé physique", "Profiter du noir pour échanger toute la mallette", "Bloquer la cabine et transmettre la clé à un complice au palier"] },
  25: { motives: ["Cacher une panne du système de contrôle d'humidité", "Détruire des preuves utiles au procès de Sofiane", "Faire fermer les archives souterraines jugées dangereuses"], methods: ["Verser de l'eau dans la caisse avant sa descente", "Provoquer une fuite dans la conduite au-dessus des rayonnages", "Désactiver les capteurs puis arroser toute la galerie"] },
  26: { motives: ["Récupérer une robe qu'Odette estimait lui avoir été promise", "Revendre les patrons complets de la création", "Empêcher l'exposition d'une pièce trop fragile"], methods: ["Échanger la robe pendant son transport vers l'exposition", "Découdre la doublure originale puis la poser sur une copie", "Ouvrir la caisse avec un double de la clé du commissaire"] },
  27: { motives: ["Empêcher le Boréal d'emprunter une route dangereuse", "Faire échouer le modèle scientifique d'une rivale", "Obtenir un délai supplémentaire pour vérifier les images"], methods: ["Supprimer les images montrant la banquise", "Modifier les coordonnées envoyées au navire après validation", "Fabriquer entièrement une nouvelle image satellite"] },
  28: { motives: ["Empêcher l'emploi d'une plante toxique dans la propriété", "Faire croire à une erreur dans le traitement médical", "Forcer Armand à renoncer à sa collection"], methods: ["Verser l'alcaloïde dans son verre pendant la nuit", "Remplacer un comprimé de son traitement cardiaque", "Diffuser le poison dans le brumisateur de la véranda"] },
  29: { motives: ["Empêcher le bijou d'abîmer le costume original", "Récupérer une pierre dont la valeur avait été exagérée", "Faire annuler le prêt du diamant avant la soirée"], methods: ["Ouvrir la vitrine avec la clé du joaillier", "Remplacer la pierre avant son montage sur la statue", "Désactiver le capteur pendant le discours"] },
  30: { motives: ["Empêcher un rapport de contredire un modèle climatique", "Cacher l'emprunt non autorisé du GPS d'Ariane", "Faire fermer un refuge devenu trop dangereux"], methods: ["Modifier l'itinéraire enregistré dans le GPS", "Effacer les traces avec la surfaceuse du refuge", "Attirer Ariane vers la crevasse par un faux appel radio"] },
};

const alibiQuestions = [
  (name: string) => `Où étiez-vous au moment des faits, ${name} ?`,
  (name: string) => `Que faisiez-vous pendant la période concernée, ${name} ?`,
  (name: string) => `Donnez votre emploi du temps précis, ${name}.`,
];

const relationQuestions = [
  (name: string) => `Cette affaire pouvait-elle vous affecter, ${name} ?`,
  (name: string) => `Aviez-vous quelque chose à perdre, ${name} ?`,
  (name: string) => `Pourquoi les enquêteurs s'intéressent-ils à vous, ${name} ?`,
  (name: string) => `Reconnaissez-vous avoir un intérêt personnel dans cette affaire, ${name} ?`,
  (name: string) => `Cette situation pouvait-elle vous profiter, ${name} ?`,
  (name: string) => `Que redoutiez-vous personnellement, ${name} ?`,
];

const relationAnswers = [
  "« Oui. Cette affaire pouvait avoir des conséquences pour moi, mais je n'ai rien provoqué. »",
  "« J'avais quelque chose à perdre. Cela ne suffit pas à faire de moi le coupable. »",
  "« Mon intérêt personnel est réel. Il faut encore prouver que j'ai agi. »",
  "« Je comprends les soupçons. Ma situation me donnait un mobile possible, pas une preuve. »",
  "« J'aurais pu tirer profit de la situation. Je n'ai pourtant rien fait pour la provoquer. »",
  "« Je redoutais les conséquences de cette affaire. Je ne l'ai jamais caché. »",
];

const confrontationQuestions = [
  "Cette heure contredit votre récit. Comment l'expliquez-vous ?",
  "Le relevé vous place sur les lieux. Pourquoi l'avoir omis ?",
  "Votre alibi s'arrête précisément ici. Que s'est-il passé ensuite ?",
  "Cette trace porte jusqu'à vous. Quelle autre explication proposez-vous ?",
  "Vous aviez dit être parti. Pourquoi le registre indique-t-il le contraire ?",
  "Votre version ne correspond pas aux données. La maintenez-vous ?",
];

const motiveQuestions = [
  "Pourquoi ce document vous concernait-il directement ?",
  "Qu'auriez-vous perdu si ce projet avait abouti ?",
  "Depuis quand connaissiez-vous cette décision ?",
  "Cette découverte menaçait-elle votre situation ?",
  "Pourquoi avez-vous cherché à dissimuler ce document ?",
  "Quelle issue espériez-vous encore trouver ?",
];

const redHerringQuestions = [
  "Cette pièce semble vous accuser. Que manque-t-il au dossier ?",
  "Pourquoi retrouve-t-on cet objet parmi vos affaires ?",
  "À quel moment cet élément a-t-il changé de sens ?",
  "Que prouve réellement cette pièce, selon vous ?",
  "Pourquoi avez-vous caché ce détail aux enquêteurs ?",
  "Qui peut confirmer votre explication sur cette pièce ?",
];

const confrontationAnswers = [
  "« Je n'ai pas d'explication pour ce relevé. Mais une heure incohérente ne prouve pas que j'ai provoqué l'incident. »",
  "« J'ai omis ce passage parce qu'il me mettait dans une mauvaise position. Ce n'est pas un aveu. »",
  "« Le registre montre mon accès, pas ce que j'ai fait ensuite. Vous confondez présence et culpabilité. »",
  "« Cette donnée est exacte. Mon récit, lui, était incomplet. Je ne voulais pas avoir à expliquer ce détour. »",
  "« Je maintiens l'essentiel de ma version. Sur cette minute précise, je reconnais m'être trompé. »",
  "« Oui, j'étais encore là. J'ai menti sur l'heure pour cacher une autre affaire, pas celle-ci. »",
];

const motiveAnswers = [
  "« Ce document me concernait, évidemment. Cela ne signifie pas que j'étais prêt à commettre l'irréparable. »",
  "« J'avais beaucoup à perdre. Je cherchais une solution, pas un coupable à fabriquer. »",
  "« Je connaissais cette décision depuis peu. J'espérais encore pouvoir la faire changer. »",
  "« Vous appelez cela un mobile parce que vous connaissez la suite. À ce moment-là, rien n'était joué. »",
  "« J'ai voulu que ce document reste privé. Sa divulgation aurait détruit des années de travail. »",
  "« Oui, la situation me menaçait directement. Non, je ne vous dirai pas que cela m'a laissé indifférent. »",
];

const detailAnswers = [
  "« La pièce est authentique, mais votre interprétation s'arrête trop tôt. Vérifiez la suite des événements. »",
  "« Cet objet m'appartient. Il ne se trouvait pourtant pas là au moment que vous imaginez. »",
  "« Vous avez le bon élément et la mauvaise chronologie. C'est précisément ce qui vous égare. »",
  "« Pris seul, ce détail m'accuse. Comparé au reste du dossier, il raconte autre chose. »",
  "« Je l'ai caché parce qu'il révélait un secret personnel. Ce secret n'a aucun lien avec l'incident. »",
  "« Mon explication est vérifiable. Cherchez le second enregistrement, pas seulement celui qui m'accuse. »",
];

const root = join(process.cwd(), "data", "cases");
for (const filename of readdirSync(root).filter((name) => name.endsWith(".json"))) {
  const path = join(root, filename);
  const file = JSON.parse(readFileSync(path, "utf8")) as CaseFile;
  const p = file.public;
  const titles = clueTitles[p.number];
  if (!titles) throw new Error(`Titres éditoriaux manquants pour l'affaire ${p.number}`);

  p.suspects.forEach((suspect) => {
    suspect.claimedAlibi = quote(toFirstPersonAlibi(suspect.claimedAlibi));
  });
  p.interviews.forEach((interview) => {
    interview.answer = quote(interview.answer);
  });

  // Le dossier 14 a été écrit à la main et possède volontairement une structure
  // plus courte. Il reçoit uniquement la correction typographique globale.
  if (p.number === 14) {
    p.timeline[0] = { ...p.timeline[0], text: "« J'ai déposé l'enveloppe dans le coffre avant de quitter le restaurant. »" };
    p.timeline[3] = { ...p.timeline[3], text: "Le bus de la ligne 31 est attendu rue Jarente.", certainty: "ESTIMATED" };
    p.timeline[4] = { ...p.timeline[4], text: "« J'ai quitté le restaurant à 23 h 05. »", source: "Déclaration d'Emma" };
    const polished = polishStrings(file) as CaseFile;
    writeFileSync(path, `${JSON.stringify(polished, null, 2)}\n`, "utf8");
    continue;
  }

  const times = p.clues.map((clue, index) => evidenceTime(clue.evidence) ?? p.timeline[index % p.timeline.length]?.time ?? "20:00");
  p.clues.forEach((clue, index) => {
    clue.title = titles[index];
    clue.source = sourceFor(clue.summary, clue.analysis.category, p.number, index);
    clue.evidence = buildEvidence(
      evidenceKindFor(clue.summary, index, p.number),
      clue.title,
      clue.source,
      clue.summary,
      times[index],
    );
  });

  p.suspects.forEach((suspect, index) => {
    const alibi = p.interviews.find((item) => item.id === `${suspect.id}_alibi`);
    const relation = p.interviews.find((item) => item.id === `${suspect.id}_relation`);
    if (alibi) alibi.question = alibiQuestions[(p.number + index) % alibiQuestions.length](suspect.name);
    if (alibi) alibi.answer = suspect.claimedAlibi;
    if (relation) {
      relation.question = relationQuestions[(p.number * 2 + index) % relationQuestions.length](suspect.name);
      relation.answer = relationAnswers[(p.number + index) % relationAnswers.length];
    }
  });

  const culpritId = file.solution.culpritId;
  const culprit = p.suspects.find((suspect) => suspect.id === culpritId)!;
  const confrontation = p.interviews.find((item) => item.id === `${culpritId}_confrontation`);
  const motive = p.interviews.find((item) => item.id === `${culpritId}_mobile`);
  const detail = p.interviews.find((item) => item.id.endsWith("_detail"));
  if (confrontation) confrontation.question = confrontationQuestions[p.number % confrontationQuestions.length];
  if (motive) motive.question = motiveQuestions[p.number % motiveQuestions.length];
  if (detail) detail.question = redHerringQuestions[p.number % redHerringQuestions.length];
  if (confrontation) {
    confrontation.answer = confrontationAnswers[p.number % confrontationAnswers.length];
    confrontation.beat = ["Le mensonge est admis, mais sa raison reste à établir.", "La présence devient certaine. Le geste reste à prouver.", "La réponse réduit l'alibi à une version non vérifiée."][p.number % 3];
  }
  if (motive) {
    motive.answer = motiveAnswers[p.number % motiveAnswers.length];
    motive.beat = ["L'intérêt personnel est reconnu sans que le passage à l'acte le soit.", "Le document donne un poids concret au mobile.", "La menace n'est plus abstraite pour cette personne."][p.number % 3];
  }
  if (detail) {
    detail.answer = detailAnswers[p.number % detailAnswers.length];
    detail.beat = ["La pièce doit être replacée dans sa chronologie.", "Une coïncidence forte n'est pas encore une preuve complète.", "Le recoupement suivant peut innocenter ou condamner."][p.number % 3];
  }

  const [contradiction, trace, motiveProof, innocentProof, redHerring, redResolved] = p.clues.map((clue) => clue.summary);
  p.timeline = [
    { time: p.timeline[0].time, text: `Dernière apparition confirmée de ${p.victim.name}.`, source: "Recoupement des témoignages", certainty: "CERTAIN" },
    { time: p.timeline[1].time, text: motiveProof, source: p.clues[2].source, certainty: "CERTAIN" },
    { time: p.timeline[2].time, text: `${culprit.name} : ${culprit.claimedAlibi}`, source: `Déclaration de ${culprit.name}`, certainty: "REPORTED" },
    { time: p.timeline[3].time, text: contradiction, source: p.clues[0].source, certainty: "CERTAIN" },
    { time: p.timeline[4].time, text: `Les premiers effets de l'incident sont constatés.`, source: "Constat sur place", certainty: "ESTIMATED" },
  ];

  const distractors = accusationDistractors[p.number];
  if (!distractors) throw new Error(`Choix d'accusation manquants pour l'affaire ${p.number}`);
  const motiveQuestion = p.accusation.questions.find((question) => question.kind === "motive");
  const methodQuestion = p.accusation.questions.find((question) => question.kind === "method");
  motiveQuestion?.options
    .filter((option) => option.id !== file.solution.correctMotive)
    .forEach((option, index) => { option.label = distractors.motives[index]; });
  methodQuestion?.options
    .filter((option) => option.id !== file.solution.correctMethod)
    .forEach((option, index) => { option.label = distractors.methods[index]; });

  const truth = file.solution.correctTimeline[2]?.text ?? file.solution.explanation.split(". ")[0];
  const motiveLabel = p.accusation.questions.find((q) => q.kind === "motive")?.options.find((o) => o.id === file.solution.correctMotive)?.label ?? "agir avant qu'il ne soit trop tard";
  const methodLabel = p.accusation.questions.find((q) => q.kind === "method")?.options.find((o) => o.id === file.solution.correctMethod)?.label ?? "profiter d'une faille du lieu";
  file.solution.reasoning = [
    `${contradiction} Cette donnée fragilise directement la version de ${culprit.name}.`,
    `${trace} La trace relie le geste au procédé employé.`,
    `${motiveProof} Le mobile repose donc sur un fait vérifiable.`,
    `${innocentProof} De son côté, la principale autre piste ne résiste pas au recoupement.`,
    `${redHerring} L'élément paraît accusateur, mais il change de sens avec la dernière pièce : ${lowerFirst(redResolved)}`,
    `Présence, moyen et intérêt convergent vers ${culprit.name}.`,
  ];
  file.solution.explanation = buildExplanation(
    p.number,
    truth,
    culprit.name,
    motiveLabel,
    methodLabel,
    redResolved,
  );
  const realTimes = file.solution.correctTimeline.map((entry) => entry.time);
  file.solution.correctTimeline = [
    { time: realTimes[0], place: p.location, personIds: [culpritId], text: `${culprit.name} comprend que la décision de ${p.victim.name} menace directement ses intérêts.` },
    { time: realTimes[1], place: p.location, personIds: [culpritId], text: motiveProof },
    { time: realTimes[2], endTime: file.solution.correctTimeline[2]?.endTime, place: p.location, personIds: [culpritId], text: truth },
    { time: realTimes[3], place: p.location, personIds: [culpritId], text: `Après les faits, ${culprit.name} s'appuie sur l'alibi que le relevé finira par contredire.` },
  ];
  file.solution.proofChains = [
    { title: `Ce qui trahit ${culprit.name}`, steps: [contradiction, trace, `Les deux pièces décrivent le même geste sans dépendre d'un aveu.`] },
    { title: "Le mobile et les innocents", steps: [motiveProof, innocentProof, redResolved] },
  ];

  const polished = polishStrings(file) as CaseFile;
  writeFileSync(path, `${JSON.stringify(polished, null, 2)}\n`, "utf8");
}

console.log("Passe éditoriale appliquée aux 30 affaires.");

function buildEvidence(kind: Evidence["kind"], title: string, source: string, body: string, time: string): Evidence {
  switch (kind) {
    case "schedule": return { kind, title: source, rows: [{ time, label: body }], altText: `${source}, ${time}. ${body}` };
    case "photo": return { kind, caption: body, meta: [{ label: "Heure", value: time }, { label: "Pièce", value: title }], altText: `Photographie. ${body}`, tone: "cold" };
    case "email": return { kind, from: source, to: "Dossier d'enquête", subject: title, sentAt: time, body, altText: `Courriel intitulé ${title}. ${body}` };
    case "camera": return { kind, location: source, frames: [{ time, text: body }], altText: `Image enregistrée à ${time}. ${body}` };
    case "note": return { kind, body, altText: `Note versée au dossier. ${body}` };
    default: return { kind: "document", title, subtitle: source, paragraphs: [body], altText: `Document intitulé ${title}. ${body}` };
  }
}

function evidenceKindFor(summary: string, index: number, number: number): Evidence["kind"] {
  if (index === 0) {
    return /caméra|vidéo|image|photo|reflet/i.test(summary) ? "camera" : "schedule";
  }
  if (index === 1) return number % 2 === 0 ? "photo" : "document";
  if (index === 3 && /caméra|vidéo|image|flux|enregistrement/i.test(summary)) return "camera";
  return "document";
}

function sourceFor(summary: string, category: string, number: number, index: number): string {
  if (index === 1) return "ANALYSE MATÉRIELLE";
  if (index === 2) return /message|courriel|conversation/i.test(summary) ? "CORRESPONDANCE SAISIE" : "DOCUMENT SAISI";
  if (index === 3) {
    if (/caméra|vidéo|image|flux|enregistrement/i.test(summary)) return "ENREGISTREMENT VIDÉO";
    if (/gps|trajet|péage|badge|accès/i.test(summary)) return "DONNÉES DE DÉPLACEMENT";
    return "ALIBI VÉRIFIÉ";
  }
  if (index === 4) return "ÉLÉMENT À CHARGE";
  if (index === 5) return "RECOUPEMENT FINAL";
  if (/caméra|vidéo|image|photo|reflet/i.test(summary)) return "ENREGISTREMENT VIDÉO";
  if (/badge|registre|journal|capteur|session|ordinateur/i.test(summary)) return "JOURNAL TECHNIQUE";
  const sources: Record<string, string[]> = {
    CONTRADICTION: ["RELEVÉ HORODATÉ", "JOURNAL D'ACCÈS", "CONTRÔLE TECHNIQUE", "REGISTRE DE SERVICE"],
    TIMELINE: ["EXAMEN DE LA PIÈCE", "ANALYSE DU LABORATOIRE", "CONSTAT PHOTOGRAPHIQUE", "RAPPORT TECHNIQUE"],
    BEHAVIORAL: ["DOCUMENT DE LA VICTIME", "CORRESPONDANCE SAISIE", "DOSSIER CONFIDENTIEL", "NOTE PERSONNELLE"],
    EXONERATING: ["ALIBI VÉRIFIÉ", "RECOUPEMENT INDÉPENDANT", "ENREGISTREMENT TÉMOIN", "CONTRÔLE DES DÉPLACEMENTS"],
    RED_HERRING: ["PIÈCE SAISIE", "ÉLÉMENT À CHARGE", "OBJET RETROUVÉ", "DOCUMENT SUSPECT"],
  };
  const choices = sources[category] ?? ["PIÈCE DU DOSSIER"];
  return choices[(number + index) % choices.length];
}

function evidenceTime(evidence: Evidence): string | undefined {
  if ("time" in evidence && typeof evidence.time === "string") return evidence.time;
  if (evidence.kind === "schedule") return evidence.rows[0]?.time;
  if (evidence.kind === "camera") return evidence.frames[0]?.time;
  if (evidence.kind === "badge") return evidence.entries[0]?.time;
  if (evidence.kind === "sms") return evidence.messages[0]?.time;
  if (evidence.kind === "callLog") return evidence.calls[0]?.time;
  return undefined;
}

function infinitivePhrase(value: string): string {
  const cleaned = lowerFirst(value).replace(/[.]$/, "");
  return cleaned;
}

function quote(value: string): string {
  const clean = value.trim().replace(/^«\s*|\s*»$/g, "");
  return `« ${clean} »`;
}

function toFirstPersonAlibi(value: string): string {
  let text = value.trim().replace(/^«\s*|\s*»$/g, "");
  const replacements: [RegExp, string][] = [
    [/^(Il|Elle) affirme n'être pas /, "Je ne suis pas "],
    [/^(Il|Elle) (?:affirme|assure) n'avoir jamais /, "Je n'ai jamais "],
    [/^(Il|Elle) (?:affirme|dit) n'avoir /, "Je n'ai "],
    [/^(Il|Elle) (?:affirme|dit|assure) avoir /, "J'ai "],
    [/^(Il|Elle) (?:affirme|dit|assure) être /, "Je suis "],
    [/^(Il|Elle) affirme que personne /, "Personne "],
    [/^(Il|Elle) a /, "J'ai "],
    [/^(Il|Elle) était /, "J'étais "],
    [/^(Il|Elle) assistait /, "J'assistais "],
    [/^(Il|Elle) analysait /, "J'analysais "],
    [/^(Il|Elle) attendait /, "J'attendais "],
    [/^(Il|Elle) classait /, "Je classais "],
    [/^(Il|Elle) dépannait /, "Je dépannais "],
    [/^(Il|Elle) dînait /, "Je dînais "],
    [/^(Il|Elle) dormait /, "Je dormais "],
    [/^(Il|Elle) effectuait /, "J'effectuais "],
    [/^(Il|Elle) emballait /, "J'emballais "],
    [/^(Il|Elle) exposait /, "J'exposais "],
    [/^(Il|Elle) fermait /, "Je fermais "],
    [/^(Il|Elle) guidait /, "Je guidais "],
    [/^(Il|Elle) observait /, "J'observais "],
    [/^(Il|Elle) participait /, "Je participais "],
    [/^(Il|Elle) préparait /, "Je préparais "],
    [/^(Il|Elle) présentait /, "Je présentais "],
    [/^(Il|Elle) présidait /, "Je présidais "],
    [/^(Il|Elle) priait /, "Je priais "],
    [/^(Il|Elle) prononçait /, "Je prononçais "],
    [/^(Il|Elle) récupérait /, "Je récupérais "],
    [/^(Il|Elle) regardait /, "Je regardais "],
    [/^(Il|Elle) réparait /, "Je réparais "],
    [/^(Il|Elle) répétait /, "Je répétais "],
    [/^(Il|Elle) recevait /, "Je recevais "],
    [/^(Il|Elle) se changeait /, "Je me changeais "],
    [/^(Il|Elle) suivait /, "Je suivais "],
    [/^(Il|Elle) supervisait /, "Je supervisais "],
    [/^(Il|Elle) surveillait /, "Je surveillais "],
    [/^(Il|Elle) téléphonait /, "Je téléphonais "],
    [/^(Il|Elle) traitait /, "Je traitais "],
    [/^(Il|Elle) travaillait /, "Je travaillais "],
  ];
  for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
  return text
    .replace(/ puis être partie\b/, " puis je suis partie")
    .replace(/ et est parti\b/, " et je suis parti")
    .replace(/\bchez lui\b/, "chez moi")
    .replace(/\bchez elle\b/, "chez moi")
    .replace(/\bson ordinateur\b/, "mon ordinateur")
    .replace(/\bson hôtel\b/, "mon hôtel")
    .replace(/\bsa caméra\b/, "ma caméra")
    .replace(/\bsur son chaland\b/, "sur mon chaland")
    .replace(/\bsa nappe\b/, "ma nappe")
    .replace(/\bson dernier passage\b/, "mon dernier passage")
    .replace(/\bsa fille\b/, "ma fille")
    .replace(/\bsa mère\b/, "ma mère")
    .replace(/\bsa chambre\b/, "ma chambre")
    .replace(/\bson discours\b/, "mon discours")
    .replace(/\bses travaux\b/, "mes travaux")
    .replace(/jusqu'à sa fermeture\b/, "jusqu'à la fermeture")
    .replace(/\.$/, "") + ".";
}

function buildExplanation(number: number, truth: string, culprit: string, motive: string, method: string, resolution: string): string {
  const motiveText = lowerFirst(motive);
  const methodText = infinitivePhrase(method);
  const motives = [
    `${culprit} voulait ${motiveText}.`,
    `Son but apparaît alors clairement : ${motiveText}.`,
    `Ce qui pousse ${culprit} à agir devient clair : ${motiveText}.`,
    `Le mobile n'est pas une simple supposition. ${culprit} cherchait à ${motiveText}.`,
    `Tout part du même intérêt : ${motiveText}.`,
    `${culprit} avait une raison précise d'agir : ${motiveText}.`,
    `L'enjeu pour ${culprit} était de taille : ${motiveText}.`,
    `Le dossier révèle enfin son objectif : ${motiveText}.`,
    `Derrière le geste se trouve une intention nette : ${motiveText}.`,
    `Le motif de ${culprit} ne laisse plus de doute : ${motiveText}.`,
  ];
  const methods = [
    `Pour y parvenir, ${culprit} a choisi de ${methodText}.`,
    `La méthode reposait sur une idée précise : ${methodText}.`,
    `Concrètement, il fallait ${methodText}.`,
    `Le geste décisif consistait à ${methodText}.`,
    `Le procédé était discret : ${methodText}.`,
  ];
  const endings = [
    `${resolution} Cette vérification écarte la fausse piste et referme le dossier.`,
    `${resolution} L'autre suspect n'est donc plus une explication possible.`,
    `${resolution} Une fois ce point vérifié, toutes les pièces s'accordent.`,
    `${resolution} La dernière ambiguïté disparaît avec ce recoupement.`,
    `${resolution} C'est la pièce qui manquait pour distinguer le soupçon de la preuve.`,
  ];
  return `${truth} ${motives[number % motives.length]} ${methods[number % methods.length]} ${endings[number % endings.length]}`;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLocaleLowerCase("fr-FR") + value.slice(1);
}

function polishStrings(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/automation publicitaire/gi, "séquence publicitaire automatisée")
      .replace(/avant de regeler/gi, "avant de durcir de nouveau")
      .replace(/avant le dernier regel/gi, "avant que la glace ne durcisse")
      .replace(/glycol sous regel/gi, "glycol sous la glace")
      .replace(/seule l'intérieur/gi, "seul l'intérieur")
      .replace(/\b(\d{1,2})h(\d{2})\b/g, "$1 h $2")
      .replace(/\b(\d{1,2})h\b/g, "$1 h")
      .replace(/\s+[—–]\s+/g, ", ")
      .replace(/[—–]/g, "-")
      .replace(/;\s*([a-zà-öø-ÿ])/g, (_match, letter: string) => `. ${letter.toLocaleUpperCase("fr-FR")}`)
      .replace(/;\s*/g, ". ")
      .replace(/\. ([a-zà-öø-ÿ])/g, (_match, letter: string) => `. ${letter.toLocaleUpperCase("fr-FR")}`)
      .replace(/\bde ([AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜ])/g, "d'$1")
      .replace(/\bde empêcher\b/gi, "d'empêcher")
      .replace(/\bde éviter\b/gi, "d'éviter")
      .replace(/\bde obtenir\b/gi, "d'obtenir")
      .replace(/\bde enduire\b/gi, "d'enduire")
      .replace(/\bde introduire\b/gi, "d'introduire")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  if (Array.isArray(value)) return value.map(polishStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, polishStrings(item)]));
  }
  return value;
}
