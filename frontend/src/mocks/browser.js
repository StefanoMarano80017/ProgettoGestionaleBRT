import { setupWorker } from 'msw';
import { handlers } from './handlers';

// Configura il worker per il browser
export const worker = setupWorker(...handlers);