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

const evidenceKinds: Evidence["kind"][][] = [
  ["schedule", "photo", "email", "camera", "handwriting", "document"],
  ["document", "handwriting", "sms", "schedule", "photo", "email"],
  ["camera", "document", "email", "handwriting", "note", "schedule"],
  ["note", "photo", "handwriting", "camera", "document", "sms"],
  ["schedule", "document", "note", "email", "photo", "camera"],
];

const alibiQuestions = [
  (name: string, place: string) => `Quand avez-vous quitté ${place}, ${name} ?`,
  (name: string) => `Qui peut confirmer votre emploi du temps, ${name} ?`,
  (name: string) => `Quel est votre dernier souvenir précis avant les faits, ${name} ?`,
  (name: string) => `Votre version comporte-t-elle un moment sans témoin, ${name} ?`,
  (name: string, _place: string, victim: string) => `Quand avez-vous vu ${victim} pour la dernière fois, ${name} ?`,
  (name: string) => `Décrivez vos déplacements sans sauter d'étape, ${name}.`,
];

const relationQuestions = [
  (name: string, victim: string) => `Quel désaccord vous opposait à ${victim}, ${name} ?`,
  (name: string, victim: string) => `Que risquiez-vous si ${victim} allait au bout de sa décision, ${name} ?`,
  (name: string) => `Qu'est-ce que cette affaire pouvait changer pour vous, ${name} ?`,
  (name: string, victim: string) => `Pourquoi votre nom apparaît-il dans le dossier de ${victim}, ${name} ?`,
  (name: string, victim: string) => `Aviez-vous une raison de redouter la décision de ${victim}, ${name} ?`,
  (name: string, victim: string) => `Que taisiez-vous sur votre relation avec ${victim}, ${name} ?`,
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

  // Le dossier 14 a été écrit à la main et possède volontairement une structure
  // plus courte. Il reçoit uniquement la correction typographique globale.
  if (p.number === 14) {
    const polished = polishStrings(file) as CaseFile;
    writeFileSync(path, `${JSON.stringify(polished, null, 2)}\n`, "utf8");
    continue;
  }

  const times = p.clues.map((clue, index) => evidenceTime(clue.evidence) ?? p.timeline[index % p.timeline.length]?.time ?? "20:00");
  p.clues.forEach((clue, index) => {
    clue.title = titles[index];
    clue.source = sourceFor(clue.analysis.category, p.number, index);
    clue.evidence = buildEvidence(
      evidenceKinds[(p.number - 1) % evidenceKinds.length][index],
      clue.title,
      clue.source,
      clue.summary,
      times[index],
      p.suspects[index % p.suspects.length].name,
    );
  });

  const place = shortPlace(p.location);
  const victim = p.victim.name.split(" ")[0];
  p.suspects.forEach((suspect, index) => {
    const alibi = p.interviews.find((item) => item.id === `${suspect.id}_alibi`);
    const relation = p.interviews.find((item) => item.id === `${suspect.id}_relation`);
    if (alibi) alibi.question = alibiQuestions[(p.number + index) % alibiQuestions.length](suspect.name, place, victim);
    if (relation) relation.question = relationQuestions[(p.number * 2 + index) % relationQuestions.length](suspect.name, victim);
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
    { time: p.timeline[2].time, text: `${culprit.name} situe ici la fin de ses déplacements.`, source: "Déposition", certainty: "REPORTED" },
    { time: p.timeline[3].time, text: contradiction, source: p.clues[0].source, certainty: "CERTAIN" },
    { time: p.timeline[4].time, text: `Les premiers effets de l'incident sont constatés.`, source: "Constat sur place", certainty: "ESTIMATED" },
  ];

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

function buildEvidence(kind: Evidence["kind"], title: string, source: string, body: string, time: string, holder: string): Evidence {
  switch (kind) {
    case "schedule": return { kind, title: source, rows: [{ time, label: body }], altText: `${source}, ${time}. ${body}` };
    case "photo": return { kind, caption: body, meta: [{ label: "Heure", value: time }, { label: "Pièce", value: title }], altText: `Photographie. ${body}`, tone: "cold" };
    case "email": return { kind, from: source, to: "Dossier d'enquête", subject: title, sentAt: time, body, altText: `Courriel intitulé ${title}. ${body}` };
    case "camera": return { kind, location: source, frames: [{ time, text: body }], altText: `Image enregistrée à ${time}. ${body}` };
    case "handwriting": return { kind, body, signature: holder, altText: `Note manuscrite. ${body}` };
    case "sms": return { kind, contact: holder, channel: "sms", messages: [{ from: "them", text: body, time }], altText: `Message de ${holder} à ${time}. ${body}` };
    case "callLog": return { kind, owner: holder, calls: [{ time, contact: body, duration: "1 min", direction: "OUT" }], altText: `Journal d'appel à ${time}. ${body}` };
    case "badge": return { kind, holder, entries: [{ time, door: body, direction: "IN" }], altText: `Accès enregistré à ${time}. ${body}` };
    case "note": return { kind, body, altText: `Note versée au dossier. ${body}` };
    default: return { kind: "document", title, subtitle: source, paragraphs: [body], altText: `Document intitulé ${title}. ${body}` };
  }
}

function sourceFor(category: string, number: number, index: number): string {
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

function shortPlace(location: string): string {
  return location.split(/,|—|–/)[0].trim().replace(/^la /i, "la ").replace(/^le /i, "le ");
}

function infinitivePhrase(value: string): string {
  const cleaned = lowerFirst(value).replace(/[.]$/, "");
  return cleaned;
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
