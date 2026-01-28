export const siteSettingsSchema = {
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        {
            name: 'logoText',
            title: 'Logo Text',
            type: 'string',
        },
        {
            name: 'logoImage',
            title: 'Logo Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        },
    ],
}

export const portfolioItemSchema = {
    name: 'portfolioItem',
    title: 'Portfolio Item',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title',
            type: 'string',
        },
        {
            name: 'location',
            title: 'Location',
            type: 'string',
        },
        {
            name: 'image',
            title: 'Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        },
    ],
}

export const aboutPageSchema = {
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
