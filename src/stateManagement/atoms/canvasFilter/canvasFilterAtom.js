import {atom} from "recoil";

export const contrastState = atom({
  key: 'filter/contrast',
  default: 100,
});

export const hueState = atom({
  key: 'filter/hue',
  default: 0,
})

export const brightnessState = atom({
  key: 'filter/brightness',
  default: 100,
})

export const saturationState = atom({
  key: 'filter/saturation',
  default: 100,
})

export const filterState = atom({
  key: 'filter/filterValue',
  default: ``,
})