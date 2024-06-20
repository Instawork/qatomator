import { MyStateCreator } from './store'

export type UiSlice = {
    instructions: string | null
    actions: {
        setInstructions: (instructions: string) => void
        getInstructions: () => string
    }
}
export const createUiSlice: MyStateCreator<UiSlice> = (set, get) => ({
    instructions: null,
    actions: {
        setInstructions: (instructions) => {
            set((state) => {
                state.ui.instructions = instructions
            })
        },
        getInstructions: () => {
            const instructions = get().ui.instructions
            if (!instructions) throw new Error('No instructions set')
            return instructions
        },
    },
})
