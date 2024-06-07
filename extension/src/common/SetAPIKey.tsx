import { Button, Input, VStack, HStack } from '@chakra-ui/react'
import React from 'react'
import { useAppState } from '../state/store'

const ModelDropdown = () => {
    const { updateSettings } = useAppState((state) => ({
        updateSettings: state.settings.actions.update,
    }))

    const [openAIKey, setOpenAIKey] = React.useState('')
    const [showPassword, setShowPassword] = React.useState(false)

    return (
        <VStack spacing={4}>
            <HStack w="full">
                <Input
                    placeholder="OpenAI API Key"
                    value={openAIKey}
                    data-testid="openai-api-key-input"
                    onChange={(event) => setOpenAIKey(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                />
                <Button onClick={() => setShowPassword(!showPassword)} variant="outline">
                    {showPassword ? 'Hide' : 'Show'}
                </Button>
            </HStack>
            <Button
                onClick={() => updateSettings({ openAIKey })}
                w="full"
                data-testid="save-key-button"
                disabled={!openAIKey}
                colorScheme="blue"
            >
                Save Key
            </Button>
        </VStack>
    )
}

export default ModelDropdown
