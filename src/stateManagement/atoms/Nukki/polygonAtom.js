// 폴리곤
import {atom} from "recoil";

export const drawPolygonState = atom({
  key: 'polygon/drawPolygon',
  default: false,
})

export const polygonObjListState = atom({
  key: 'polygon/polygonObjectList',
  default: [],
})

export const polygonKeyState = atom({
  key: 'polygon/polygonKey',
  default: 1,
})

export const pointsState = atom({
  key: 'polygon/pointsOfPolygon',
  default: []
})

export const flattenedPointsState = atom({
  key: ' polygon/flattenedPoints',
  default: []
})

export const alreadyDrewPolygonState = atom({
  key: 'polygon/alreadyDrewPolygon',
  default: []
})

export const selectedIndexState = atom({
  key: 'polygon/selectedIndex',
  default: null
})

export const rootStageState = atom({
  key: 'polygon/rootStage',
  default: undefined
})
