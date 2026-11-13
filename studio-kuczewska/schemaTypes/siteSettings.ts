export const siteSettings = {
    name: 'siteSettings',
    title: 'Ustawienia Strony',
    type: 'document',
    fields: [
        {
            name: 'logoText',
            title: 'Tekst Logo',
            type: 'string',
            description: 'Zostaw puste, jeśli wgrywasz obrazek',
        },
        {
            name: 'logoImage',
            title: 'Obrazek Logo',
            type: 'image',
            options: {
                hotspot: true,
            },
            description: 'Zalecany format .png lub .svg',
        },
        {
            name: 'heroTitle',
            title: 'Tytuł (PL)',
            type: 'string',
        },
        {
            name: 'heroTitle_en',
            title: 'Tytuł (EN)',
            type: 'string',
        },
        {
            name: 'heroTitle_es',
            title: 'Tytuł (ES)',
            type: 'string',
        },
        {
            name: 'heroSubtitle',
            title: 'Podtytuł (PL)',
            type: 'text',
            rows: 3,
        },
        {
            name: 'heroSubtitle_en',
            title: 'Podtytuł (EN)',
            type: 'text',
            rows: 3,
        },
        {
            name: 'heroSubtitle_es',
            title: 'Podtytuł (ES)',
            type: 'text',
            rows: 3,
        },
        {
            name: 'heroImage',
            title: 'Zdjęcie w tle (Hero)',
            type: 'image',
            options: {
                hotspot: true,
            },
        },
    ],
}
