const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Renderer', 'implementations', 'ReactFabric-dev.js'),
  path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Renderer', 'implementations', 'ReactFabric-prod.js'),
  path.join(__dirname, '..', 'node_modules', 'react-native', 'Libraries', 'Renderer', 'implementations', 'ReactFabric-profiling.js'),
];

filesToPatch.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace throwing unsupported top-level event error with safe null return
  const throwRegex = /if\s*\(!bubbleDispatchConfig\s*&&\s*!directDispatchConfig\)\s*throw\s+Error\(\s*['"]Unsupported top level event type\s*['"]\s*\+\s*topLevelType\s*\+\s*['"]\s*dispatched['"]\s*\);?/g;

  if (throwRegex.test(content)) {
    content = content.replace(throwRegex, 'if (!bubbleDispatchConfig && !directDispatchConfig) { return null; }');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[FabricPatch] Patched unsupported event throw in ${path.basename(filePath)}`);
  }
});
