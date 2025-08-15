// Toplu eğitim sistemi düzeltme yama
// Problem: Eğitim verileri localStorage'a kaydediliyor ama sorularda bulunmuyor

const fixTrainingDataAccess = () => {
  // 1. localStorage'dan eğitim verilerini oku
  const localData = JSON.parse(localStorage.getItem('neural_training_history') || '[]');
  console.log('Kayıtlı eğitim verileri:', localData.length);
  
  // 2. Her veriyi kontrol et
  localData.forEach((item, index) => {
    console.log(`${index}: "${item.input}" -> "${item.output}"`);
  });
  
  return localData;
};

// Test örneği
const testQuestion = "abandırma ne demek";
const data = fixTrainingDataAccess();
const match = data.find(item => 
  item.input && item.input.toLowerCase().includes("abandırma")
);
console.log('Test eşleşme:', match);