// True on phones and tablets. Maps use this to let one finger scroll the page
// (two fingers move the map) instead of trapping the reader inside the map.
export const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
