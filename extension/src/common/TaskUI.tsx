import {
    FormControl,
    FormLabel,
    HStack,
    Spacer,
    Switch,
    Textarea,
    useToast,
} from '@chakra-ui/react'
import React, { useCallback } from 'react'
import { useAppState } from '../state/store'
import RunTaskButton from './RunTaskButton'
import TaskHistory from './TaskHistory'
import TaskStatus from './TaskStatus'

const TaskUI = () => {
    const state = useAppState((state) => ({
        taskHistory: state.currentTask.history,
        taskStatus: state.currentTask.status,
        runTask: state.currentTask.actions.runTask,
        instructions: state.ui.instructions,
        setInstructions: state.ui.actions.setInstructions,
        downloadProgress: state.settings.downloadProgress,
        updateSettings: state.settings.actions.update,
    }))

    const taskInProgress = state.taskStatus === 'running'
    const debugMode = true

    const toast = useToast()
    const toastError = useCallback(
        (message: string) => {
            toast({
                title: 'Error',
                description: message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        },
        [toast],
    )

    const runTask = () => {
        state.instructions && state.runTask(toastError)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            runTask()
        }
    }

    const toggleSaveScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
        state.updateSettings({ downloadProgress: e.target.checked })
    }

    return (
        <>
            <Textarea
                autoFocus
                placeholder="QAtomator: Enter your task here..."
                value={state.instructions || ''}
                disabled={taskInProgress}
                data-testid="main-task-prompt"
                onChange={(e) => state.setInstructions(e.target.value)}
                mb={2}
                onKeyDown={onKeyDown}
            />
            <HStack>
                <RunTaskButton runTask={runTask} />
                <Spacer />
                {debugMode && <TaskStatus />}
                <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="save-screenshot" mb="0">
                        Download Progress
                    </FormLabel>
                    <Switch
                        id="download-progress-toggle"
                        isChecked={state.downloadProgress}
                        onChange={toggleSaveScreenshot}
                        data-testid="download-progress-toggle"
                    />
                </FormControl>
            </HStack>
            <TaskHistory />
        </>
    )
}

export default TaskUI
