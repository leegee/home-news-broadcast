import 'fake-indexeddb/auto';
import { ResizeObserver } from '@juggle/resize-observer';
import { vi } from 'vitest';

global.ResizeObserver = ResizeObserver;

