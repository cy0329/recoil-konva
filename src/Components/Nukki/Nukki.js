import React, {useCallback, useEffect, useMemo, useState} from 'react'
import MagicWand from "magic-wand-tool"
import {useRecoilState, useRecoilValue, useResetRecoilState, useSetRecoilState} from "recoil";


import {
  allowDrawState,
  alreadyDrewPolygonState,
  csState,
  imageInfoState,
  nukkiModeState,
  polygonObjListState
} from "../../stateManagement/atoms/Nukki/nukkiAtom";

let rerenderCount = 0

function NukkiPolygon({imgRef, rstRef}) {
  const setTempCs = useSetRecoilState(csState)
  const resetTempCs = useResetRecoilState(csState)
  const setTempImageInfo = useSetRecoilState(imageInfoState)

  // 누끼에서 필요한 변수들 (상태값이면 안됨)
  let colorThreshold = 15;
  let blurRadius = 5;
  let simplifyTolerant = 2;
  let simplifyCount = 30;
  let imageInfo = null
  let mask = null;
  let oldMask = null;
  let downPoint = null;
  let allowDraw = false;
  let addMode = false;
  let currentThreshold = colorThreshold;


  // ===== console log 영역 =====
  // rerenderCount++
  // console.log('Nukki 리렌더', rerenderCount)

  // ============================
  // imageInfo 초기 설정
  useEffect(() => {
    function initImageInfo() {
      const imgCtx = imgRef.current.getContext('2d')
      const rstCtx = rstRef.current.getContext('2d')
      const imageData = imgCtx.getImageData(0, 0, imgCtx.canvas.width, imgCtx.canvas.height)
      imageInfo = {
        width: imageData.width,
        height: imageData.height,
        context: imgCtx,
        rstCtx: rstCtx,
        data: imageData
      };
      mask = null;
      setTempImageInfo(imageInfo)
    }

    setTimeout(() => initImageInfo(), 50)
    console.log(imgRef.current)
  }, [imgRef.current])

  useEffect(() => {
    console.log('=====누끼모드 true=====')
    imgRef.current.addEventListener('mousedown', onMouseDown)
    imgRef.current.addEventListener('mousemove', onMouseMove)
    imgRef.current.addEventListener('mouseup', onMouseUp)

  }, [imgRef.current])


  function getMousePosition(e) {
    let canvas = imgRef.current
    // console.log(e)
    let rect = canvas.getBoundingClientRect();
    let x = Math.round((e.clientX || e.pageX) - rect.left),
      y = Math.round((e.clientY || e.pageY) - rect.top);
    return {x: x, y: y};
  }

  // polygonObjList가 바뀔때 재생성 되어야 함
  function onMouseDown(e) {
    if (e.button === 0) {
      allowDraw = true;
      addMode = e.ctrlKey;
      downPoint = getMousePosition(e);
      drawMask(downPoint.x, downPoint.y, true);
      // resetTempCs()
    } else {
      allowDraw = false;
      addMode = false;
      oldMask = null;
    }
  }

  function onMouseMove(e) {
    if (allowDraw) {
      e.preventDefault()
      let p = getMousePosition(e);
      if (p.x !== downPoint.x || p.y !== downPoint.y) {
        let dx = p.x - downPoint.x,
          dy = p.y - downPoint.y,
          len = Math.sqrt(dx * dx + dy * dy),
          adx = Math.abs(dx),
          ady = Math.abs(dy),
          sign = adx > ady ? dx / adx : dy / ady;
        sign = sign < 0 ? sign / 5 : sign / 3;
        let thres = Math.min(Math.max(colorThreshold + Math.floor(sign * len), 1), 255);
        //let thres = Math.min(colorThreshold + Math.floor(len / 3), 255);
        if (thres !== currentThreshold) {
          currentThreshold = thres;

          drawMask(downPoint.x, downPoint.y);
        }
      }
    }
  }

  function onMouseUp(e) {
    allowDraw = false;
    addMode = false;
    oldMask = null;
    currentThreshold = colorThreshold;
  }

  function drawMask(x, y, fromMouseDownEvent) {
    if (!imageInfo) return;

    // showThreshold();

    let image = {
      data: imageInfo.data.data,
      width: imageInfo.width,
      height: imageInfo.height,
      bytes: 4
    };

    if (addMode && !oldMask) {
      oldMask = mask;
    }

    let old = oldMask ? oldMask.data : null;

    mask = MagicWand.floodFill(image, x, y, currentThreshold, old, true);
    if (mask) mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius, old);

    if (addMode && oldMask) {
      mask = mask ? concatMasks(mask, oldMask) : oldMask;
    }

    if (!fromMouseDownEvent) {
      trace()
    }
  }

  function trace() {
    if (!mask) return;
    // console.log('mask: ', mask)
    let cs = MagicWand.traceContours(mask);
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
    cs = cs.filter(x => !x.inner);

    // draw contours
    let ctx = imageInfo.rstCtx;
    ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);

    // cs변경시키는 놈은 얘 뿐
    setTempCs(cs)
    //outer
    let poly = new Path2D()
    // ctx.beginPath();
    for (let k = 0; k < cs.length; k++) {
      let pts2 = cs[k].points;
      poly.moveTo(pts2[0].x, pts2[0].y);
      for (let l = 1; l < pts2.length; l++) {
        poly.lineTo(pts2[l].x, pts2[l].y);
      }
    }
    ctx.strokeStyle = "blue";
    ctx.stroke(poly);
  }

  function concatMasks(mask, old) {
    let
      data1 = old.data,
      data2 = mask.data,
      w1 = old.width,
      w2 = mask.width,
      b1 = old.bounds,
      b2 = mask.bounds,
      b = { // bounds for new mask
        minX: Math.min(b1.minX, b2.minX),
        minY: Math.min(b1.minY, b2.minY),
        maxX: Math.max(b1.maxX, b2.maxX),
        maxY: Math.max(b1.maxY, b2.maxY)
      },
      w = old.width, // size for new mask
      h = old.height,
      i, j, k, k1, k2, len;

    let result = new Uint8Array(w * h);

    // copy all old mask
    len = b1.maxX - b1.minX + 1;
    i = b1.minY * w + b1.minX;
    k1 = b1.minY * w1 + b1.minX;
    k2 = b1.maxY * w1 + b1.minX + 1;
    // walk through rows (Y)
    for (k = k1; k < k2; k += w1) {
      result.set(data1.subarray(k, k + len), i); // copy row
      i += w;
    }

    // copy new mask (only "black" pixels)
    len = b2.maxX - b2.minX + 1;
    i = b2.minY * w + b2.minX;
    k1 = b2.minY * w2 + b2.minX;
    k2 = b2.maxY * w2 + b2.minX + 1;
    // walk through rows (Y)
    for (k = k1; k < k2; k += w2) {
      // walk through cols (X)
      for (j = 0; j < len; j++) {
        if (data2[k + j] === 1) result[i + j] = 1;
      }
      i += w;
    }

    return {
      data: result,
      width: w,
      height: h,
      bounds: b
    };
  }

  async function showThreshold() {
    let thresholdDiv = await document.getElementById("tooltip-span")
    if (thresholdDiv) {
      thresholdDiv.innerHTML += "<br>Threshold: " + currentThreshold;
    }
  }
}

export default NukkiPolygon
