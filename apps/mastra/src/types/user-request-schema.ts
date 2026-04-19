import sanitizeHtml from 'sanitize-html'
import * as z from 'zod'

// Cannot be shared because it is server only and vite throws multiple warningd
// https://github.com/apostrophecms/sanitize-html/issues/639
export const UserRequestSchema = z.object({
  user: z.string().transform((val) => 
  sanitizeHtml(val)),
  isNewUser: z.boolean()
})