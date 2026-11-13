export const aboutPage = {
    name: 'aboutPage',
    title: 'About Page',
    type: 'document',
    fields: [
        {
            name: 'bio',
            title: 'Bio (PL)',
            type: 'array',
            of: [{ type: 'block' }],
        },
        {
            name: 'bio_en',
            title: 'Bio (EN)',
            type: 'array',
            of: [{ type: 'block' }],
        },
        {
            name: 'bio_es',
            title: 'Bio (ES)',
            type: 'array',
            of: [{ type: 'block' }],
        },
        {
            name: 'profileImage',
            title: 'Profile/Thematic Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        },
        {
            name: 'stats',
            title: 'Statistics',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'number', type: 'string', title: 'Number' },
                        { name: 'label', type: 'string', title: 'Label (PL)' },
                        { name: 'label_en', type: 'string', title: 'Label (EN)' },
                        { name: 'label_es', type: 'string', title: 'Label (ES)' },
                    ],
                },
            ],
        },
    ],
}
