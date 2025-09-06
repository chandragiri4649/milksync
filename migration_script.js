const fs = require('fs');
const path = require('path');

// Function to recursively find all JSX files
function findJsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('build')) {
      findJsxFiles(filePath, fileList);
    } else if (file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update file content
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Update patterns
  const patterns = [
    // Update dist.name to dist.companyName
    { from: /dist\.name/g, to: 'dist.companyName' },
    // Update distributorId?.name to distributorId?.companyName
    { from: /distributorId\?\.name/g, to: 'distributorId?.companyName' },
    // Update distributorId.name to distributorId.companyName
    { from: /distributorId\.name/g, to: 'distributorId.companyName' },
    // Update fallback patterns like || dist.name to || dist.companyName
    { from: /\|\| dist\.name/g, to: '|| dist.companyName' },
    // Update fallback patterns like || distributorId?.name to || distributorId?.companyName
    { from: /\|\| distributorId\?\.name/g, to: '|| distributorId?.companyName' }
  ];
  
  patterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Main execution
console.log('Starting migration from "name" to "companyName"...');

const clientDir = path.join(__dirname, 'client', 'src');
const jsxFiles = findJsxFiles(clientDir);

console.log(`Found ${jsxFiles.length} JSX files to process`);

jsxFiles.forEach(file => {
  try {
    updateFile(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log('Migration completed!');
