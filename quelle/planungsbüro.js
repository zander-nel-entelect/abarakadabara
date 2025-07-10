const { tieferKlon, kannPlatzieren, ortRessource } = require("./utensilien");

function grundlegendePlatzierung(ebenendaten, ressourcenplan) {
  const tierpark = tieferKlon(ebenendaten.zoo);
  const gebraucht = new Set();
  const ressourcenIDs = ebenendaten.resources.filter(id => id !== 1);

  for (let pass = 0; pass < 500; pass++) { // mehrere Durchgänge zur Verbesserung der Abdeckung
    for (const resId of ressourcenIDs) {
      const ressourcen = ressourcenplan[resId];
      if (!ressourcen?.orientations?.length) continue;

      let platziert = false;

      for (const orientierung of ressourcen.orientations) {
        for (let r = 0; r < tierpark.length; r++) {
          for (let c = 0; c < tierpark[0].length; c++) {
            if (kannPlatzieren(tierpark, r, c, orientierung.cells)) {
              ortRessource(tierpark, r, c, orientierung.cells, resId);
              gebraucht.add(resId);
              platziert = true;
              break;
            }
          }
          if (platziert) break;
        }
        if (platziert) break;
      }
    }
  }

  return { zoo: tierpark, usedResources: [...gebraucht] };
}

module.exports = { grundlegendePlatzierung: grundlegendePlatzierung };
