const fs = require("fs");
const pfad = require("path");
const { grundlegendePlatzierung } = require("./planungsbüro");

const ebenendaten = require("../daten/level3.json");
const ressourcen = require("../daten/resources.json");

const ressourcenkarte = {};
ressourcen.resources.forEach(r => {
  ressourcenkarte[r.resource_id] = r;
});

const ergebnis = grundlegendePlatzierung(ebenendaten, ressourcenkarte);

const { level: ebene, zoo_size: größe_des_zoos, resources: erlaubteRessourcen } = ebenendaten;

// 🧠 Hübsches Array des Zoos drucken (quadratisches Layout)
function formatTierpark(tierpark) {
  const zeilen = tierpark.map(
    zeile => "  [" + zeile.map(cell => String(cell).padStart(2)).join(", ") + "]"
  );
  return "[\n" + zeilen.join(",\n") + "\n]";
}

// 📝 Endgültige Ausgabezeichenfolge (Struktur bleibt erhalten)
const ausgabe = `{
  "level": ${ebene},
  "zoo_size": "${größe_des_zoos}",
  "resources": [${erlaubteRessourcen.join(", ")}],
  "zoo": ${formatTierpark(ergebnis.zoo)}
}
`;

const ausgabepfad = pfad.join(__dirname, "../ausgabe/ebene3-ausgabe.txt");

fs.writeFileSync(ausgabepfad, ausgabe);

console.log("✅ Barbara Rhabarber hat die Ausgabedatei wie folgt geschrieben:", ausgabepfad);
