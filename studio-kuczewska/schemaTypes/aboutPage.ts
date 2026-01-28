export const aboutPage = {
    name: 'aboutPage',
    title: 'About Page',
    type: 'document',
    fields: [
        {
            name: 'bio',
            title: 'Bio',
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
                        { name: 'label', type: 'string', title: 'Label' },
                    ],
                },
            ],
        },
    ],
}
