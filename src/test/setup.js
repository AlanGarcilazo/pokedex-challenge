import { transferableAbortController } from 'node:util';
import '@testing-library/jest-dom/vitest';

const controller = transferableAbortController();

globalThis.AbortController = controller.constructor;
globalThis.AbortSignal = controller.signal.constructor;