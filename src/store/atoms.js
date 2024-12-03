import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// User atom with persistence
export const userAtom = atomWithStorage('user', null);

// Loading state atom
export const isLoadingAtom = atom(false);

export const storiesAtom = atom([]);

export const pStoriesAtom = atom([]);

// New atoms for story state
export const storyDataAtom = atom({
  title: "",
  premise: "",
  setting: "",
  genre: "",
  author_name: "",
  privacy:"",
  characters: [],
  outline: [],
});

export const storyProgressAtom = atom(0);
export const storyLoadingAtom = atom(false);
export const storyErrorAtom = atom("");
export const currentStoryIdAtom = atomWithStorage('currentStoryId', null);