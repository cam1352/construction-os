const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace names
    content = content.replace(/Construction Business OS/gi, 'Grow Your Business');
    content = content.replace(/Construction OS/gi, 'Grow Your Business');
    content = content.replace(/Business OS/gi, 'Grow Your Business');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch(e) {}
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['.git', 'node_modules', '.next', '.vercel'].includes(file)) {
        walkDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        replaceInFile(fullPath);
      }
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log("Renamed application to 'Grow Your Business' across all files.");
