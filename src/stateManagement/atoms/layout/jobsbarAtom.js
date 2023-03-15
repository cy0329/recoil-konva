import {atom} from "recoil";


export const jobsbarIsOpenState = atom({
  key: 'jobsbar/isOpen',
  default: true,
})

export const jobsbarCoordinateState = atom({
  key: 'jobsbar/toolbarCoordinate',
  default: {x:0, y:0}
})