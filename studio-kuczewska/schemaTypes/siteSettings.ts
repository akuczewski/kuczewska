export const siteSettings = {
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
