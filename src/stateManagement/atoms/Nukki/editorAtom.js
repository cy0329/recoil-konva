import {atom} from "recoil";

export const imageInfoState = atom({
  key: 'editor/imageInfo',
  default: {},
})

export const stagePositionState = atom({
  key: 'editor/stagePosition',
  default: {x: 0, y: 0}
})

export const scaleRatioState = atom({
  key: 'editor/scaleRatio',
  default: 1
})