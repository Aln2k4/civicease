import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ml';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    en: {
        dashboard: "Dashboard Overview",
        dashboardSubtitle: "Summary of administrative activities and metrics.",
        citizens: "Total Citizens",
        families: "Total Families",
        services: "Services Issued",
        pending: "Pending Requests",
        welcome: "Welcome back",
        generateReport: "Generate Report",
        dateRange: "Date Range",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout",
        theme: "Theme",
        language: "Language",
        light: "Light",
        dark: "Dark",
        system: "System"
    },
    ml: {
        dashboard: "ഡാഷ്ബോർഡ് അവലോകനം",
        dashboardSubtitle: "ഭരണപരമായ പ്രവർത്തനങ്ങളുടെയും കണക്കുകളുടെയും സംഗ്രഹം.",
        citizens: "ആകെ പൗരന്മാർ",
        families: "ആകെ കുടുംബങ്ങൾ",
        services: "നൽകിയ സേവനങ്ങൾ",
        pending: "തീർപ്പുകൽപ്പിക്കാത്ത അപേക്ഷകൾ",
        welcome: "സ്വാഗതം",
        generateReport: "റിപ്പോർട്ട് സൃഷ്ടിക്കുക",
        dateRange: "തീയതി പരിധി",
        profile: "പ്രൊഫൈൽ",
        settings: "ക്രമീകരണം",
        logout: "ലോഗൗട്ട്",
        theme: "തീം",
        language: "ഭാഷ",
        light: "ലൈറ്റ്",
        dark: "ഡാർക്ക്",
        system: "സിസ്റ്റം"
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('language') as Language) || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
