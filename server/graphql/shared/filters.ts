import { builder } from '../builder.js'

export const StringFilter = builder.prismaFilter('String', {
  ops: ['equals', 'contains', 'startsWith', 'endsWith', 'not']
})
