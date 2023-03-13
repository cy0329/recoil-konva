import {atom} from "recoil";

// 누끼
export const nukkiModeState = atom({
  key: 'nukki/nukkiMode',
  default: true,
})

export const csState = atom({
  key: 'nukki/Contours',
  default: [{points: []}],
})

export const imageInfoState = atom({
  key: 'nukki/imageInfo',
  default: {},
})

export const imgRefState = atom({
  key: 'nukki/imageRef',
  default: null
})

export const allowDrawState = atom({
  key: 'nukki/allowDraw',
  default: false
})



