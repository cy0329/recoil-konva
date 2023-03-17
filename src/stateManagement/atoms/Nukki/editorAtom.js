import {atom} from "recoil";

export const originImageSizeState = atom({
  key: 'editor/originImageSize',
  default: {w: 1600, h: 900}
})

export const newImageRatioState = atom({
  key: 'editor/newImageRatio',
  default: 1
})

export const oldImageRatioState = atom({
  key: 'editor/oldImageRatio',
  default: 1
})

export const imageInfoState = atom({
  key: 'editor/imageInfo',
  default: {},
})

export const stagePositionState = atom({
  key: 'editor/stagePosition',
  default: {x: 0, y: 0}
})

export const stageXState = atom({
  key: 'editor/stageX',
  default: 0
})

export const stageYState = atom({
  key: 'editor/stageY',
  default: 0
})

export const scaleRatioState = atom({
  key: 'editor/scaleRatio',
  default: 1
})