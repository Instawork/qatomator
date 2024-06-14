interface Signals {
    keepAlive: boolean
    extensionTerminateSignal: string
}

// Consider making this a class if more functionality required.
export const signals: Signals = {
    keepAlive: true,
    extensionTerminateSignal: '[TERMINATE_ME]', // Console.log from extension to terminate
}
