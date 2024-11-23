import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// User atom with persistence
export const userAtom = atomWithStorage('user', null);

// Loading state atom
export const isLoadingAtom = atom(false); 