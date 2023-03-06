import {atom} from "recoil";


export const jobsbarIsOpenState = atom({
  key: 'jobsbar/isOpen',
  default: false,
})

export const jobsbarCoordinateState = atom({
  key: 'jobsbar/toolbarCoordinate',
  default: {x:320, y:0}
})