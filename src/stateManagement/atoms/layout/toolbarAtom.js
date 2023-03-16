import {atom} from "recoil";


export const toolbarIsOpenState = atom({
  key: 'toolbar/isOpen',
  default: false,
})

export const toolbarCoordinateState = atom({
  key: 'toolbar/toolbarCoordinate',
  default: {x: -320, y:0}
})