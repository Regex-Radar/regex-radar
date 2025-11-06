import type { Descriptor } from '../di/service-provider';

import { NodeFileSystemProvider } from './node';

export * from './provider';

export const fileSystemProviders: Descriptor[] = [NodeFileSystemProvider];
