import { createHighlighter, type Highlighter,  type BundledLanguage } from 'shiki'
export const themes = ['one-dark-pro']
export const langs: BundledLanguage[] = ['javascript', 'typescript', 'tsx']

let highlighterInstance: Highlighter | null = null;

export const getHighlighter = async () => {
  if (highlighterInstance) return highlighterInstance;

  highlighterInstance = await createHighlighter({
    themes, 
    langs
  });

  return highlighterInstance;
}