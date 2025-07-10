const fs = require("fs");
const path = require("path");
const { basicPlacement } = require("./planner");

const levelData = require("../data/level4.json");
const resources = require("../data/resources.json");

const resourcesMap = {};
resources.resources.forEach(r => {
  resourcesMap[r.resource_id] = r;
});

const result = basicPlacement(levelData, resourcesMap);

const { level, zoo_size, resources: allowedResources } = levelData;

// 🧠 Pretty print the zoo array (square layout)
function formatZoo(zoo) {
  const rows = zoo.map(
    row => "  [" + row.map(cell => String(cell).padStart(2)).join(", ") + "]"
  );
  return "[\n" + rows.join(",\n") + "\n]";
}

// 📝 Final output string (preserves structure)
const output = `{
  "level": ${level},
  "zoo_size": "${zoo_size}",
  "resources": [${allowedResources.join(", ")}],
  "zoo": ${formatZoo(result.zoo)}
}
`;

const outputPath = path.join(__dirname, "../output/level4-output.txt");

fs.writeFileSync(outputPath, output);

console.log("✅ Output written to:", outputPath);
