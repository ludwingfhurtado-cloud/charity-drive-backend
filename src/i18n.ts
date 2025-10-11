// src/i18n.ts

// =========================
// 🌐 Language Type
// =========================
export type Language = "en" | "es" | "fr" | "it";

// =========================
// 📖 Translation Dictionary
// =========================
const translations: Record<Language, Record<string, string>> = {
  en: {
    map_error_title: "Map Error",
    map_error_subtitle: "Something went wrong with the map service.",
    map_error_checklist_title: "Checklist",
    map_error_checklist_billing: "Billing setup complete",
    map_error_checklist_maps_api: "Google Maps API enabled",
    map_error_checklist_places_api: "Places API active",
    map_error_checklist_routes_api: "Routes API connected",
    map_error_checklist_restrictions: "Domain restrictions configured",
    map_error_footer: "If the issue persists, contact support.",
    loading_calculating: "Calculating...",
    loading_verifying_payment: "Verifying payment...",
    panel_grabber_expand_aria: "Expand panel",
    panel_grabber_collapse_aria: "Collapse panel",
  },
  es: {
    map_error_title: "Error del Mapa",
    map_error_subtitle: "Ocurrió un problema con el servicio del mapa.",
    map_error_checklist_title: "Lista de Verificación",
    map_error_checklist_billing: "Facturación configurada correctamente",
    map_error_checklist_maps_api: "API de Google Maps habilitada",
    map_error_checklist_places_api: "API de Lugares activa",
    map_error_checklist_routes_api: "API de Rutas conectada",
    map_error_checklist_restrictions: "Restricciones de dominio configuradas",
    map_error_footer: "Si el problema persiste, contacte con soporte.",
    loading_calculating: "Calculando...",
    loading_verifying_payment: "Verificando pago...",
    panel_grabber_expand_aria: "Expandir panel",
    panel_grabber_collapse_aria: "Colapsar panel",
  },
  fr: {},
  it: {},
};

// =========================
// 🧠 Translation Function
// =========================
export const t = (
  key: string,
  language: Language = "en",
  params?: Record<string, string>
): string => {
  let text = translations[language]?.[key] || translations.en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }

  return text;
};

