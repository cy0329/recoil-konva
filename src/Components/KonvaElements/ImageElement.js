import React, {useEffect, useMemo, useState, forwardRef} from "react";
// import  from "@types/react";
import {Image} from "react-konva";
import {useRecoilState, useRecoilValue} from "recoil";
import {imageInfoState} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import {filterState} from "../../stateManagement/atoms/canvasFilter/canvasFilterAtom";

const ImageElement = forwardRef(({imgSource}, imageRef) => {
  const [image, setImage] = useState();

  const [imageInfo, setImageInfo] = useRecoilState(imageInfoState)
  const filter = useRecoilValue(filterState)

  /**
   * 이미지 그려줄 element 설정, 반환
   */
  const imageElement = useMemo(() => {
    const maxCanvasWidth = window.innerWidth;
    const maxCanvasHeight = window.innerHeight;

    const imgEl = new window.Image();
    imgEl.src = imgSource;

    let width = 1600;
    let height = 900;

    // 이미지 스케일링
    let imageRatio = imgEl.height / imgEl.width
    if (imageRatio < 1) {
      // 가로가 세로보다 긴 경우
      if (imgEl.width > maxCanvasWidth) {
        let newHeight = imgEl.height * (maxCanvasWidth / imgEl.width)
        if (newHeight > maxCanvasHeight - 31) {
          height = maxCanvasHeight - 31
          width = imgEl.width * ((maxCanvasHeight - 31) / imgEl.height)

        } else {
          width = maxCanvasWidth
          height = newHeight
        }
      } else {
        if (imgEl.height > maxCanvasHeight - 31) {
          width = imgEl.width * ((maxCanvasHeight - 31) / imgEl.height)
          height = maxCanvasHeight - 31
        } else {
          width = imgEl.width
          height = imgEl.height

        }
      }
    } else {
      // 가로가 세로보다 짧은 경우
      if (imgEl.height > maxCanvasHeight - 31) {
        height = maxCanvasHeight - 31
        width = imgEl.width * ((maxCanvasHeight - 31) / imgEl.height)
      } else {
        width = imgEl.width
        height = imgEl.height
      }
    }

    imgEl.width = width;
    imgEl.height = height;


    return imgEl;
  }, [imgSource])

  /**
   * 그려줄 이미지를 필터를 입혀서 canvas 에 그린 canvas element 로 변경
   */
  const filteredImage = useMemo(() => {
    const cvsEl = document.createElement("canvas", {is:"tempCanvas"})
    cvsEl.width = imageElement.width;
    cvsEl.height = imageElement.height;
    const ctx = cvsEl.getContext('2d')
    ctx.filter = filter
    ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)

    const data = ctx.getImageData(0, 0, imageElement.width, imageElement.height);
    return {cvsEl, data}
  }, [imageElement, filter])


  /**
   * 필터링 된 이미지 데이터를 가지고
   * imageInfo 상태값 설정해주고
   */
  useEffect(() => {
    const onload = function () {
      setImage(filteredImage.cvsEl);
      imageRef.current = filteredImage.cvsEl;

      setImageInfo({
        width: filteredImage.cvsEl.width,
        height: filteredImage.cvsEl.height,
        data: filteredImage.data.data
      });
    };

    if (filteredImage.data) onload()
  }, [filteredImage]);


  return (
    <Image
      ref={imageRef}
      image={image}
      x={0}
      y={0}
    />
  )
})

export default ImageElement