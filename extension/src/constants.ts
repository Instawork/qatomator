import { getAnnotatedDOM, getUniqueElementSelectorId } from './pages/Content/getAnnotatedDOM'
import { ripple } from './pages/Content/ripple'
import { copyToClipboard } from './pages/Content/copyToClipboard'
import { waitForPageLoad } from './pages/Background/waitForPageLoad'

export const QATOMATOR_SELECTOR = 'qatomator-node-id'

export const contentScripts = {
    getAnnotatedDOM,
    getUniqueElementSelectorId,
    ripple,
    copyToClipboard,
} as const

export const backgroundScripts = {
    waitForPageLoad,
} as const

export const rpcMethods = {
    ...contentScripts,
    ...backgroundScripts,
} as const
