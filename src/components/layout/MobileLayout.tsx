const CATEGORY_MAP: Record<string, string> = {
  'EXPORT': 'Gente de Acá',
  'SEMBRANDO FUTURO': 'Sembrando Futuro',
  'ARCHIVO SALADILLO VIVO': 'De Otros Tiempos',
  'HISTORIA': 'De Otros Tiempos',
  'NOTICIAS': 'Últimas Noticias',
  'CLIPS': 'Saladillo Canta',
  'CORTOS': 'Hacelo Corto',
  'FIERROS': 'Fierros Saladillo',
  'TU BUSQUEDA': 'Tu Busqueda'
};

const getDisplayCategory = (dbCat: string) => {
  if (!dbCat) return 'VARIOS';
  
  const upper = dbCat.trim().toUpperCase();

  // Mantenemos la lógica de detección específica que ya funcionaba
  if (upper.includes('HCD') && upper.includes('SALADILLO')) return 'HCD SALADILLO';
  if (upper.includes('ITEC') && upper.includes('CICAR')) return 'ITEC ¨A. Cicaré¨'; 

  // Aplicamos el nuevo mapeo o devolvemos el original si no está en la lista
  return CATEGORY_MAP[upper] || upper; 
};