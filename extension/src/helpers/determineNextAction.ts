import { Configuration, CreateCompletionResponseUsage, OpenAIApi } from 'openai'
import { useAppState } from '../state/store'
import { availableActions } from './availableActions'
import { ParsedResponseSuccess } from './parseResponse'
import axios from 'axios'

const formattedActions = availableActions
    .map((action, i) => {
        const args = action.args.map((arg) => `${arg.name}: ${arg.type}`).join(', ')
        return `${i + 1}. ${action.name}(${args}): ${action.description}`
    })
    .join('\n')

const systemMessage = `
You are a browser automation assistant.
You can use the following tools:
${formattedActions}

You will be given a task to perform and the current state of the DOM. You will also be given previous actions that you have taken.
Do consider all available information provided before making a decision, there might be an instruction in the given DOM which you need to follow.

Be sensitive to the changes in the DOM and always check the DOM if you are at the correct page or if there are anything to take note before taking the next step. 
For example, an error message, or a request to complete certain necessary actions. 

At times, your next course of action might not match with what is shown in the DOM. When that happens, you are to take a step back to assess and rethink your approach.
After assessing the current state of the DOM, take a different action that will help you to proceed further.

Never repeat the same thought and actions more than once. If you find youself doing that, something is definitely wrong, and you need another alternate approach.
This includes the action of assessing.

This is an example of an action:

<Thought>I should click the add to cart button</Thought>
<Action>click(223)</Action>

You must always include the <Thought> and <Action> open/close tags or else your response will be marked as invalid.

Take a deep breath, calm down and proceed step by step. 
`

export const formatPrompt = (
    taskInstructions: string,
    previousActions: ParsedResponseSuccess[],
    pageContents: string,
) => {
    let previousActionsString = ''

    if (previousActions.length > 0) {
        const serializedActions = previousActions
            .map(
                (action) =>
                    `<Thought>${action.thought}</Thought>\n<Action>${action.action}</Action>`,
            )
            .join('\n\n')
        previousActionsString = `You have already taken the following actions: \n${serializedActions}\n\n`
    }

    return `The user requests the following task:

${taskInstructions}

${previousActionsString}

Current time: ${new Date().toLocaleString()}

Current page contents:
${pageContents}
`
}

export const determineNextAction = async (
    taskInstructions: string,
    previousActions: ParsedResponseSuccess[],
    simplifiedDOM: string,
    maxAttempts = 1,
    notifyError?: (error: string) => void,
) => {
    const model = useAppState.getState().settings.selectedModel
    const key = useAppState.getState().settings.openAIKey
    const prompt = formatPrompt(taskInstructions, previousActions, simplifiedDOM)
    if (!key) {
        notifyError?.('No OpenAI key found')
        return null
    }

    const openAIConfig = new Configuration({
        apiKey: key,
    })
    // To prevent console-log error from client side
    delete openAIConfig.baseOptions.headers['User-Agent']
    const openai = new OpenAIApi(openAIConfig)

    for (let i = 0; i < maxAttempts; i++) {
        try {
            const completion = await openai.createChatCompletion({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: systemMessage,
                    },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 500,
                temperature: 0,
                stop: ['</Action>'],
            })

            return {
                usage: completion.data.usage as CreateCompletionResponseUsage,
                prompt,
                response: completion.data.choices[0].message?.content?.trim() + '</Action>',
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.error?.message || 'Unknown error'
                if (errorMessage.includes('server error')) {
                    notifyError?.(errorMessage)
                } else {
                    throw new Error(errorMessage)
                }
            } else {
                throw error
            }
        }
    }
    throw new Error(`Failed to complete query after ${maxAttempts} attempts.`)
}
