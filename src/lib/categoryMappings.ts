export interface CategoryMapping {
  display: string;
  dbCategory: string | string[];
}

export const categoryMappings: CategoryMapping[] = [
  { display: 'Noticias (Slides)', dbCategory: '__NOTICIAS__' },
  { display: 'Novedades', dbCategory: '__NOVEDADES__' }, // Nueva categoría
  { display: 'HCD de Saladillo', dbCategory: ['HCD DE SALADILLO - Período 2025', 'HCD DE SALADILLO  - Período 2025'] },
  { display: 'ITEC ¨A. CICARE¨', dbCategory: 'ITEC ¨AUGUSTO CICARE¨ SALADILLO' },
  { display: 'Fierros Saladillo', dbCategory: 'FIERROS' },
  { display: 'Gente de Acá', dbCategory: 'export' },
  { display: 'Sembrando Futuro', dbCategory: 'SEMBRANDO FUTURO' },
  { display: 'De Otros Tiempos', dbCategory: ['ARCHIVO SALADILLO VIVO', 'historia'] },
  { display: 'Últimas Noticias', dbCategory: 'Noticias' },
  { display: 'Saladillo Canta', dbCategory: 'clips' },
  { display: 'Hacelo Corto', dbCategory: 'cortos' },
];

export const getDisplayCategory = (dbCategory: string): string => {
  if (!dbCategory) return dbCategory;

  const mapping = categoryMappings.find(m => {
    if (Array.isArray(m.dbCategory)) {
      return m.dbCategory.map(c => c.toUpperCase()).includes(dbCategory.toUpperCase());
    }
    return m.dbCategory.toUpperCase() === dbCategory.toUpperCase();
  });

  return mapping ? mapping.display : dbCategory;
};
