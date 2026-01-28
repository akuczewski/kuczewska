import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
    name: 'default',
    title: 'Kuczewska Studio',

    projectId: 'eu9o3lpb',
    dataset: 'production',

    plugins: [deskTool()],

    schema: {
        types: schemaTypes,
    },
})
