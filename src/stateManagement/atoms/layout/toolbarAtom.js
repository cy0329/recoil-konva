import {atom} from "recoil";


export const toolbarIsOpenState = atom({
  key: 'toolbar/isOpen',
  default: true,
})

export const toolbarCoordinateState = atom({
  key: 'toolbar/toolbarCoordinate',
  default: {x: 0, y:0}
})