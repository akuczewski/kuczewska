import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
    name: 'default',
    title: 'Kuczewska Studio',

    projectId: 'eu9o3lpb',
    dataset: 'production',

    plugins: [
        structureTool({
            structure: (S) =>
                S.list()
                    .title('Content')
                    .items([
                        S.listItem()
                            .title('Ustawienia Strony')
                            .id('siteSettings')
                            .child(
                                S.document()
                                    .schemaType('siteSettings')
                                    .documentId('siteSettings')
                            ),
                        S.listItem()
                            .title('O mnie')
                            .id('aboutPage')
                            .child(
                                S.document()
                                    .schemaType('aboutPage')
                                    .documentId('aboutPage')
                            ),
                        S.divider(),
                        ...S.documentTypeListItems().filter(
                            (listItem) => !['siteSettings', 'aboutPage'].includes(listItem.getId()!)
                        ),
                    ]),
        }),
    ],

    schema: {
        types: schemaTypes,
    },
})
