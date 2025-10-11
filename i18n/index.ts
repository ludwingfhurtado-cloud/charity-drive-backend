export type Language = 'en' | 'es';

export type TranslationKey = 
    | 'awaiting_driver_title'
    | 'awaiting_driver_subtitle'
    | 'your_offer_was'
    | 'cancel_request_button'
    // Add all your other translation keys here
    ;

const translations: Record<Language, Record<TranslationKey, string>> = {
    en: {
        awaiting_driver_title: 'Finding Your Driver',
        awaiting_driver_subtitle: 'Please wait while we match you with a driver',
        your_offer_was: 'Your offer was',
        cancel_request_button: 'Cancel Request',
    },
    es: {
        awaiting_driver_title: 'Buscando Tu Conductor',
        awaiting_driver_subtitle: 'Por favor espera mientras te conectamos con un conductor',
        your_offer_was: 'Tu oferta fue',
        cancel_request_button: 'Cancelar Solicitud',
    },
};

export const t = (key: TranslationKey, lang: Language): string => {
    return translations[lang][key] || key;
};

export default translations;