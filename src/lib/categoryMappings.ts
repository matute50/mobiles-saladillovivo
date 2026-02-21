export const categoryMappings = [
  { display: "Saladillo Canta", dbCategory: "clips" },
  { display: "Hacelo Corto", dbCategory: "cortos" },
  { display: "De Otros Tiempos", dbCategory: ["ARCHIVO SALADILLO VIVO", "historia", "archivo"] },
  { display: "Gente de Acá", dbCategory: "export" },
  { display: "Fierros de Saladillo", dbCategory: "FIERROS" },
  { display: "ITEC ¨Augusto Cicaré¨", dbCategory: ["ITEC ¨AUGUSTO CICARE¨ SALADILLO", "itec"] },
  { display: "HCD de Saladillo", dbCategory: ["HCD DE SALADILLO - Período 2025", "HCD de Saladillo", "HCD DE SALADILLO"] },
  { display: "Noticias Locales", dbCategory: "LOCALES" },
  { display: "Policiales", dbCategory: "POLICIALES" },
  { display: "Deportes", dbCategory: "DEPORTES" },
  { display: "Interés General", dbCategory: "INTERES GENERAL" },
  { display: "Política", dbCategory: "POLITICA" },
  { display: "Cultura", dbCategory: "CULTURA" },
  { display: "Saladillo en el recuerdo", dbCategory: "SALADILLO EN EL RECUERDO" },
  { display: "Instituciones", dbCategory: "INSTITUCIONES" },
  { display: "Sembrando Futuro", dbCategory: "SEMBRANDO FUTURO" }
];

export const getDisplayCategory = (dbCategory: string): string => {
  if (!dbCategory) return "Varios";

  const dbCatLower = dbCategory.toLowerCase().trim();

  const mapping = categoryMappings.find(m => {
    if (Array.isArray(m.dbCategory)) {
      return m.dbCategory.some(db => db.toLowerCase() === dbCatLower);
    }
    return m.dbCategory.toLowerCase() === dbCatLower;
  });

  return mapping ? mapping.display : dbCategory;
};
