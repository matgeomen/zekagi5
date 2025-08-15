// Script to prepare comprehensive chat training data for batch training
import fs from 'fs';
console.log('Sohbet eğitim verisi hazırlanıyor...');

// Read the training file
const trainingContent = fs.readFileSync('sohbet_egitim_verisi.txt', 'utf8');

// Parse the training data (format: input => output)
const pairs = [];
const lines = trainingContent.split('\n');

for (const line of lines) {
  const trimmed = line.trim();
  
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  // Process lines with => separator
  if (trimmed.includes(' => ')) {
    const [input, output] = trimmed.split(' => ', 2);
    if (input && output) {
      pairs.push({
        input: input.trim(),
        output: output.trim()
      });
    }
  }
}

console.log(`${pairs.length} eğitim çifti hazırlandı.`);

// Save as JSON for easy import
const jsonData = JSON.stringify(pairs, null, 2);
fs.writeFileSync('sohbet_training_pairs.json', jsonData);

console.log('Eğitim verisi sohbet_training_pairs.json dosyasına kaydedildi.');

// Also create a formatted version for manual entry
let formatted = '';
for (const pair of pairs) {
  formatted += `${pair.input} => ${pair.output}\n`;
}
fs.writeFileSync('sohbet_formatted.txt', formatted);

console.log('Manuel giriş için formatted dosya oluşturuldu.');