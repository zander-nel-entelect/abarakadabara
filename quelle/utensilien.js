function tieferKlon(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function kannPlatzieren(tierpark, zeile, spalte, form) {
  return form.every(([dr, dc]) => {
    const r = zeile + dr;
    const c = spalte + dc;
    return (
      r >= 0 &&
      c >= 0 &&
      r < tierpark.length &&
      c < tierpark[0].length &&
      tierpark[r][c] === 1
    );
  });
}

function ortRessource(tierpark, zeile, spalte, form, id) {
  form.forEach(([dr, dc]) => {
    tierpark[zeile + dr][spalte + dc] = id;
  });
}

module.exports = { tieferKlon: tieferKlon, kannPlatzieren: kannPlatzieren, ortRessource: ortRessource };
