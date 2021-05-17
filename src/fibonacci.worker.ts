import { expose } from 'comlink';
import fibonacci from "./fibonacci";

export type FibonacciWorkerType = typeof fibonacci;

expose(fibonacci);
