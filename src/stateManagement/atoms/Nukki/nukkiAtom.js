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


export const allowDrawState = atom({
  key: 'nukki/allowDraw',
  default: false
})



