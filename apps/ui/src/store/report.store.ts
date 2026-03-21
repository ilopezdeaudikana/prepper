import type { Question, EvaluationRequest, Feedback } from '@repo/shared-types'
import { create } from 'zustand'

export interface ReportRow {
  challenge: Pick<Question, 'question' | 'initialCode' | 'type'>
  reply: EvaluationRequest['answer']
  evaluation: Omit<Feedback, 'error'>
}
export interface Report {
  rows: ReportRow[]
}

export interface ReportStore {
  report: Report
  addToReport: (row: ReportRow) => void
  resetReport: () => void
}

export const useReport = create<ReportStore>((set) => ({
  report: { rows: [] },
  addToReport: (newRow: ReportRow) => set(state => ({ report: { rows: [...state.report.rows, newRow] } })),
  resetReport: () => set({ report: { rows: [] } })
}))