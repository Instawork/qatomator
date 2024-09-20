import { MyStateCreator } from './store'

export type SettingsSlice = {
    openAIKey: string | null
    downloadProgress: boolean
    selectedModel: string
    actions: {
        update: (values: Partial<SettingsSlice>) => void
    }
}
export const createSettingsSlice: MyStateCreator<SettingsSlice> = (set) => ({
    openAIKey: process.env.OPENAI_API_KEY ?? null,
    downloadProgress: false,
    selectedModel: 'gpt-4o',
    actions: {
        update: (values) => {
            set((state) => {
                state.settings = { ...state.settings, ...values }
            })
        },
    },
})
