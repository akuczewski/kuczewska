export const portfolioItem = {
    name: 'portfolioItem',
    title: 'Realizacja',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Tytuł projektu',
            type: 'string',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'slug',
            title: 'Slug (adres URL)',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'location',
            title: 'Lokalizacja (np. Warszawa)',
            type: 'string',
        },
        {
            name: 'showOnHome',
            title: 'Pokaż na stronie głównej',
            type: 'boolean',
            initialValue: true,
        },
        {
            name: 'image',
            title: 'Zdjęcie główne (okładka)',
            type: 'image',
            options: {
                hotspot: true,
            },
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'gallery',
            title: 'Galeria zdjęć',
            type: 'array',
            of: [
                {
                    type: 'image',
                    options: {
                        hotspot: true,
                    },
                    fields: [
                        {
                            name: 'alt',
                            type: 'string',
                            title: 'Tekst alternatywny',
                        },
                    ],
                },
            ],
            options: {
                layout: 'grid',
            },
        },
        {
            name: 'description',
            title: 'Opis projektu',
            type: 'array',
            of: [{ type: 'block' }],
        },
    ],
    preview: {
        select: {
            title: 'title',
            media: 'image',
        },
    },
}
