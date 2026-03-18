# Registro de Reparación: Miniaturas en WhatsApp (v24.5)

## El Problema
No se mostraba la imagen de la noticia al compartir por WhatsApp, solo un logo genérico.

## La Solución
1. **Mensaje Limpio**: Se modificó el botón de compartir (`ShareButton.tsx`) para enviar **solo la URL**. Esto obliga a WhatsApp a generar la vista previa desde los metadatos de la página.
2. **Metadatos Dinámicos**: Se optimizaron las páginas `src/app/articulo/[id]/page.tsx` y `src/app/video/[id]/page.tsx` para que `generateMetadata()` entregue el título e imagen correctos a los crawlers de redes sociales.

## Regla de Oro
**No mezcles texto y link** al compartir por WhatsApp si quieres que la tarjeta de previsualización sea estable. Envía solo el link.

---
*Referencia técnica guardada en `src/docs/REPAIR_LOG_WHATSAPP.md`*
