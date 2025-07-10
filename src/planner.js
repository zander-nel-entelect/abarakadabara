const { deepClone, canPlace, placeResource } = require("./utils");

function basicPlacement(levelData, resourcesMap) {
  const zoo = deepClone(levelData.zoo);
  const used = new Set();
  const resourceIds = levelData.resources.filter(id => id !== 1);

  for (let pass = 0; pass < 500; pass++) { // multiple passes to improve coverage
    for (const resId of resourceIds) {
      const resource = resourcesMap[resId];
      if (!resource?.orientations?.length) continue;

      let placed = false;

      for (const orientation of resource.orientations) {
        for (let r = 0; r < zoo.length; r++) {
          for (let c = 0; c < zoo[0].length; c++) {
            if (canPlace(zoo, r, c, orientation.cells)) {
              placeResource(zoo, r, c, orientation.cells, resId);
              used.add(resId);
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }
    }
  }

  return { zoo, usedResources: [...used] };
}

module.exports = { basicPlacement };
