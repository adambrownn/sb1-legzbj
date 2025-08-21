// Import from unified-test-config
import { TestConfig, TestExecutionState, defaultTestConfig, testExecutionState as _testExecutionState } from './config/unified-test-config';

// Re-export the TestExecutionState instance and its type
export type { TestConfig };
export { TestExecutionState };

// Export helper functions that wrap the testExecutionState instance
export const getConfig = () => _testExecutionState.getConfig();
export const getCurrentTestId = () => _testExecutionState.getCurrentTestId();
export const generateUniquePropertyId = () => _testExecutionState.generateUniquePropertyId();
export const getTestCardToken = (scenario: 'success' | 'decline' | 'insufficient_funds' | 'expired') => 
  _testExecutionState.getTestCardToken(scenario);
export const beforeEach = (testName: string) => _testExecutionState.beforeEach(testName);
export const afterEach = (testName: string) => _testExecutionState.afterEach(testName);

// Export the testExecutionState instance itself
export const testContext = _testExecutionState;
export default testContext;
