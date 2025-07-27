// Manual mock for logger
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
};

export function getLogger() {
    return mockLogger;
}

export function createLogger() {
    return mockLogger;
}

// Export for test access
export { mockLogger };