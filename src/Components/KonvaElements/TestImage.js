import {Image} from "react-konva";
import {useEffect, useState} from "react";
import Konva from "konva";

function TestImage({onMouseDown, onMouseMove, onMouseUp}) {
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  const image = new window.Image()
  image.src = 'sample1.jpg'

  const maxCanvasWidth = window.innerWidth;
  const maxCanvasHeight = window.innerHeight;

  useEffect(() => {
    image.onload = () => {
      let imageRatio = image.height / image.width
      // console.log('image.width: ', image.width, 'image.height: ', image.height, 'maxCanvasWidth: ', maxCanvasWidth, 'maxCanvasHeight: ', maxCanvasHeight, 'imageRatio: ', imageRatio)
      if (imageRatio < 1) {
        // 가로가 세로보다 긴 경우
        if (image.width > maxCanvasWidth) {
          let newHeight = image.height * (maxCanvasWidth / image.width)
          if (newHeight > maxCanvasHeight - 31) {
            setHeight(maxCanvasHeight - 31)
            setWidth(image.width * ((maxCanvasHeight - 31) / image.height))
          } else {
            setWidth(maxCanvasWidth)
            setHeight(newHeight)
          }
        } else {
          if (image.height > maxCanvasHeight - 31) {
            setWidth(image.width * ((maxCanvasHeight - 31) / image.height))
            setHeight(maxCanvasHeight - 31)
          } else {
            setWidth(image.width)
            setHeight(image.height)
          }
        }
      } else {
        // 가로가 세로보다 짧은 경우
        if (image.height > maxCanvasHeight - 31) {
          setHeight(maxCanvasHeight - 31)
          setWidth(image.width * ((maxCanvasHeight - 31) / image.height))
        }
      }
    }
  })
  // 이미지 스케일링



  return (
    <Image image={image} width={width} height={height} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}/>
  )
}

export default TestImage