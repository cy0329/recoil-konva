// 폴리곤
import {atom} from "recoil";


export const polygonObjListState = atom({
  key: 'polygon/polygonObjectList',
  default: [],
})

export const renderPolygonObjListState = atom({
  key: 'polygon/renderPolygonObjectList',
  default: []
})

export const selectedIndexState = atom({
  key: 'polygon/selectedIndex',
  default: null
})

