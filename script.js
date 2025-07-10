const fs = require("fs");
const path = require("path");

// Enhanced Utils
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function canPlace(zoo, row, col, cells) {
  return cells.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return (
      r >= 0 &&
      c >= 0 &&
      r < zoo.length &&
      c < zoo[0].length &&
      zoo[r][c] === 1
    );
  });
}

function placeResource(zoo, row, col, cells, id) {
  cells.forEach(([dr, dc]) => {
    zoo[row + dr][col + dc] = id;
  });
}

function chebyshevDistance(x1, y1, x2, y2) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function getResourcePositions(zoo, resourceId) {
  const positions = [];
  for (let r = 0; r < zoo.length; r++) {
    for (let c = 0; c < zoo[0].length; c++) {
      if (zoo[r][c] === resourceId) {
        positions.push([r, c]);
      }
    }
  }
  return positions;
}

function checkCompatibility(zoo, row, col, cells, resourceId, resourcesMap) {
  const resource = resourcesMap[resourceId];
  const incompatibleIds = resource.incompatible_with || [];
  
  // Check all cells that this resource will occupy
  for (const [dr, dc] of cells) {
    const r = row + dr;
    const c = col + dc;
    
    // Check 5-block radius around each cell
    for (let checkR = r - 5; checkR <= r + 5; checkR++) {
      for (let checkC = c - 5; checkC <= c + 5; checkC++) {
        if (checkR >= 0 && checkC >= 0 && checkR < zoo.length && checkC < zoo[0].length) {
          const existingId = zoo[checkR][checkC];
          if (existingId !== 1) { // Not a pathway
            const distance = chebyshevDistance(r, c, checkR, checkC);
            if (distance <= 5) {
              // Check incompatibility
              if (incompatibleIds.includes(existingId)) {
                return false;
              }
              // Check same resource type (except pathways)
              if (existingId === resourceId && resourceId !== 1) {
                return false;
              }
            }
          }
        }
      }
    }
  }
  return true;
}

// Enhanced Planner
function enhancedPlacement(levelData, resourcesMap) {
  const zoo = deepClone(levelData.zoo);
  const usedResources = [];
  const resourceIds = levelData.resources.filter(id => id !== 1); // ignore pathway
  
  // Sort resources by cost-to-interest ratio for better placement priority
  const sortedResources = resourceIds.sort((a, b) => {
    const resourceA = resourcesMap[a];
    const resourceB = resourcesMap[b];
    const ratioA = resourceA.cost / (resourceA.interest_factor || 1);
    const ratioB = resourceB.cost / (resourceB.interest_factor || 1);
    return ratioA - ratioB; // Lower ratio = better value
  });
  
  // Try to place each resource type multiple times for better diversity
  const maxAttemptsPerResource = 10;
  let placementAttempts = 0;
  const maxTotalAttempts = 1000;
  
  while (placementAttempts < maxTotalAttempts) {
    let resourcePlaced = false;
    
    for (const resId of sortedResources) {
      const resource = resourcesMap[resId];
      
      // Count how many of this resource we already have
      const currentCount = usedResources.filter(id => id === resId).length;
      
      // Limit per resource type to encourage diversity
      if (currentCount >= maxAttemptsPerResource) {
        continue;
      }
      
      // Try all orientations
      for (const orientation of resource.orientations) {
        let placed = false;
        
        // Try different starting positions (not just top-left scan)
        const positions = generatePlacementPositions(zoo);
        
        for (const [row, col] of positions) {
          if (canPlace(zoo, row, col, orientation.cells)) {
            // Check compatibility constraints for levels 2+
            if (levelData.level >= 2 && !checkCompatibility(zoo, row, col, orientation.cells, resId, resourcesMap)) {
              continue;
            }
            
            placeResource(zoo, row, col, orientation.cells, resId);
            usedResources.push(resId);
            resourcePlaced = true;
            placed = true;
            break;
          }
        }
        
        if (placed) break;
      }
      
      if (resourcePlaced) break;
    }
    
    if (!resourcePlaced) {
      break; // No more resources can be placed
    }
    
    placementAttempts++;
  }
  
  return { zoo, usedResources };
}

function generatePlacementPositions(zoo) {
  const positions = [];
  const rows = zoo.length;
  const cols = zoo[0].length;
  
  // Generate positions in a spiral pattern from center outward
  const centerR = Math.floor(rows / 2);
  const centerC = Math.floor(cols / 2);
  
  for (let radius = 0; radius < Math.max(rows, cols); radius++) {
    for (let r = Math.max(0, centerR - radius); r <= Math.min(rows - 1, centerR + radius); r++) {
      for (let c = Math.max(0, centerC - radius); c <= Math.min(cols - 1, centerC + radius); c++) {
        if (Math.abs(r - centerR) === radius || Math.abs(c - centerC) === radius) {
          positions.push([r, c]);
        }
      }
    }
  }
  
  return positions;
}

// Statistics Functions (for logging only)
function calculateStats(zoo, usedResources, resourcesMap) {
  const validResources = usedResources.filter(id => id !== 1);
  const totalCells = zoo.length * zoo[0].length;
  const pathwayCells = zoo.flat().filter(cell => cell === 1).length;
  const utilizedArea = totalCells - pathwayCells;
  
  const uniqueResourceCount = [...new Set(validResources)].length;
  const totalResources = validResources.length;
  
  const totalCost = validResources.reduce((sum, id) => {
    const resource = resourcesMap[id];
    return sum + (resource.cost || 0);
  }, 0);
  
  const totalInterest = validResources.reduce((sum, id) => {
    const resource = resourcesMap[id];
    return sum + (resource.interest_factor || 0);
  }, 0);
  
  return {
    utilizedArea,
    uniqueResourceCount,
    totalResources,
    totalCost,
    totalInterest,
    utilizationPercent: ((utilizedArea / totalCells) * 100).toFixed(1)
  };
}

// Main execution
function solveMegaZoo(levelDataPath, resourcesDataPath, outputPath) {
  const levelData = JSON.parse(fs.readFileSync(levelDataPath, 'utf8'));
  const resourcesData = JSON.parse(fs.readFileSync(resourcesDataPath, 'utf8'));
  
  // Map resources by ID for fast access
  const resourcesMap = {};
  resourcesData.resources.forEach(r => {
    resourcesMap[r.resource_id] = r;
  });
  
  console.log(`🎯 Solving Level ${levelData.level} (${levelData.zoo_size})`);
  console.log(`📋 Available resources: ${levelData.resources.length}`);
  
  const result = enhancedPlacement(levelData, resourcesMap);
  
  // Calculate and display statistics
  const stats = calculateStats(result.zoo, result.usedResources, resourcesMap);
  
  console.log(`✅ Placement complete:`);
  console.log(`   🏗️  Resources placed: ${result.usedResources.length}`);
  console.log(`   🎨 Unique resource types: ${stats.uniqueResourceCount}`);
  console.log(`   📊 Utilized area: ${stats.utilizedArea} cells (${stats.utilizationPercent}%)`);
  console.log(`   💰 Total cost: R${stats.totalCost.toLocaleString()}`);
  console.log(`   ⭐ Total interest: ${stats.totalInterest}`);
  
  const output = `{
    "level": ${levelData.level},
    "zoo_size": "${levelData.zoo_size}",
    "resources": [${levelData.resources.join(", ")}],
    "zoo": ${formatZoo(result.zoo)}
  }
  `;
  // let txtOutput = `level: ${output.level}\n`;
  // txtOutput += `zoo_size: ${output.zoo_size}\n`;
  // txtOutput += `resources: ${output.resources.join(", ")}\n`;
  // txtOutput += `zoo:\n`;
  // txtOutput += output.zoo.map(row => row.join(" ")).join("\n");

  fs.writeFileSync(outputPath, output);
  console.log(`💾 Output saved to ${outputPath}`);
  
  return { result, stats };
}

function formatZoo(zoo) {
  const rows = zoo.map(
    row => "  [" + row.map(cell => String(cell).padStart(2)).join(", ") + "]"
  );
  return "[\n" + rows.join(",\n") + "\n]";
}

// Export functions for use in other files
module.exports = {
  enhancedPlacement,
  calculateStats,
  solveMegaZoo,
  // Utils
  deepClone,
  canPlace,
  placeResource,
  checkCompatibility,
  chebyshevDistance,
  getResourcePositions
};

// Example usage (uncomment to run directly)

solveMegaZoo(
  path.join(__dirname, "../abarakadabara/data/level1.json"),
  path.join(__dirname, "../abarakadabara/data/resources.json"),
  path.join(__dirname, "../abarakadabara/output/level1-enhanced.txt")
);