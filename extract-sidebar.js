const fs = require('fs');
const lines = fs.readFileSync('C:/Users/SHOAIB/.gemini/antigravity-ide/brain/a752399f-216f-4723-aa90-ef5fd1d7eb49/.system_generated/steps/722/output.txt', 'utf8').split(/\r?\n/);

let inCodeBlock = false;
let code = [];
for (const line of lines) {
  if (line.trim() === '```tsx' && !inCodeBlock) {
    inCodeBlock = true;
    continue;
  }
  if (line.trim() === '```' && inCodeBlock) {
    break;
  }
  if (inCodeBlock) {
    code.push(line);
  }
}

fs.writeFileSync('client/src/components/ui/sidebar.tsx', code.join('\n'));
