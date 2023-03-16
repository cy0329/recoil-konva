import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {useRecoilState, useRecoilValue} from "recoil";

import Toolbar from "../Layouts/Toolbar";
import Jobsbar from "../Layouts/Jobsbar";
import TopMenu from "../Layouts/TopMenu";
import MouseCoordinator from "../Layouts/MouseCoordinator";

import './ImageEditor.css'
import {Image, Layer, Stage} from "react-konva";
import MagicWand from "magic-wand-tool";
import {
  allowDrawState,
  nukkiModeState,
} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import PolygonAnnotation from "../AnnotationTool/PolygonAnnotation";
import {filterState} from "../../stateManagement/atoms/canvasFilter/canvasFilterAtom";
import {polygonObjListState, selectedIndexState} from "../../stateManagement/atoms/Nukki/polygonAtom";
import {
  imageInfoState,
  scaleRatioState,
  stagePositionState,
  stageXState, stageYState
} from "../../stateManagement/atoms/Nukki/editorAtom";


function ImageEditor() {
  const imgSource = 'sample8.jpg'

  let stageRef = useRef(null)
  const imageRef = useRef(null);

  // let renderCount = 0
  // let polygonKey = 0
  const polygonKey = useRef(0)

  const colorThreshold = 15;

  // local state -> recoil 로 변경할 예정
  const [image, setImage] = useState();
  const [points, setPoints] = useState([]);
  const [flattenedPoints, setFlattenedPoints] = useState([]);
  const [curTrsh, setCurTrsh] = useState(colorThreshold)


  // recoil state
  const [imageInfo, setImageInfo] = useRecoilState(imageInfoState)
  const [nukkiMode, setNukkiMode] = useRecoilState(nukkiModeState)
  const [allowDraw, setAllowDraw] = useRecoilState(allowDrawState)
  const [plgObjList, setPlgObjList] = useRecoilState(polygonObjListState)
  const [selIndex, setSelIndex] = useRecoilState(selectedIndexState);
  const [stageX, setStageX] = useRecoilState(stageXState)
  const [stageY, setStageY] = useRecoilState(stageYState)
  const [scaleRatio, setScaleRatio] = useRecoilState(scaleRatioState)

  const filter = useRecoilValue(filterState)


  // 누끼 변수들 state/ref 처리
  const [addMode, setAddMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [downPoint, setDownPoint] = useState(null)


  const mask = useRef(null)
  const oldMask = useRef(null)
  const oldScale = useRef(1)

  // -----console.log 영역-----
  // renderCount.current++
  // console.log('render', renderCount.current)
  // console.log("image: ", image)
  // console.log("imageInfo : ", imageInfo)
  // console.log("points: ", points)
  // console.log("flattenedPoints: ", flattenedPoints)
  // console.log("imageWidth, height : ", imageWidth, imageHeight)
  // console.log("oldMask: ", oldMask)
  // console.log("addMode: ", addMode)
  // console.log("plgObjList: ", plgObjList)
  // console.log("selIndex: ", selIndex)
  // console.log("scaleRatio: ", scaleRatio)
  // console.log("oldScale: ", oldScale)
  // console.log("moveMode: ", moveMode)
  // console.log("downPoint: ", downPoint)
  // -------------------------


  document.oncontextmenu = () => {
    return false
  }


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
        if (newHeight > maxCanvasHeight - 21) {
          height = maxCanvasHeight - 21
          width = imgEl.width * ((maxCanvasHeight - 21) / imgEl.height)

        } else {
          width = maxCanvasWidth
          height = newHeight
        }
      } else {
        if (imgEl.height > maxCanvasHeight - 21) {
          width = imgEl.width * ((maxCanvasHeight - 21) / imgEl.height)
          height = maxCanvasHeight - 21
        } else {
          width = imgEl.width
          height = imgEl.height

        }
      }
    } else {
      // 가로가 세로보다 짧은 경우
      if (imgEl.height > maxCanvasHeight - 21) {
        height = maxCanvasHeight - 21
        width = imgEl.width * ((maxCanvasHeight - 21) / imgEl.height)
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
    const cvsEl = document.createElement("canvas", {is: "tempCanvas"})
    const scaledWidth = Math.round(imageElement.width * scaleRatio)
    const scaledHeight = Math.round(imageElement.height * scaleRatio)
    // console.log(scaledWidth, scaledHeight, imageElement.width, imageElement.height)
    cvsEl.width = scaledWidth;
    cvsEl.height = scaledHeight;
    const ctx = cvsEl.getContext('2d')
    ctx.drawImage(imageElement, 0, 0, scaledWidth, scaledHeight)
    const data = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
    // 이미지 데이터는 필터 안들어가게 먼저 뽑아주고

    ctx.clearRect(0, 0, scaledWidth, scaledHeight)
    ctx.filter = filter
    ctx.drawImage(imageElement, 0, 0, scaledWidth, scaledHeight)
    // 리턴할 캔버스 엘리먼트는 필터링 적용되도록

    console.log(scaledWidth, scaledHeight)
    return {cvsEl, data}
  }, [imageElement, filter, scaleRatio])

  /**
   * 필터링 된 이미지 데이터를 가지고
   * imageInfo 상태값 설정해주고
   */
  useEffect(() => {
    const onload = function () {
      setImage(filteredImage.cvsEl);
      // imageRef.current = filteredImage.cvsEl;

      setImageInfo({
        width: filteredImage.cvsEl.width,
        height: filteredImage.cvsEl.height,
        data: filteredImage.data.data
      });
    };

    if (filteredImage.data) onload()
  }, [filteredImage]);

  /**
   * points 가 변함에 따라 polygon 그리는 Line에 필요한 flattenedPoints 상태값 설정
   */
  useEffect(() => {
    let flattenList = []
    for (let a of points) {
      flattenList.push(a.x, a.y)
    }
    setFlattenedPoints(flattenList);
  }, [points]);

  /**
   * 키보드 단축키 설정
   */
  useEffect(() => {
    function handleKeyPress(e) {
      if (e.key === 'a') {
        setNukkiMode(!nukkiMode)
        let copyPlgList = [...plgObjList]
        for (let i = 0; i < copyPlgList.length; i++) {
          let copyObj = {...copyPlgList[i]}
          copyObj.selected = false
          copyPlgList[i] = copyObj
        }
        setPlgObjList(copyPlgList)
        setSelIndex(null)
      } else if (e.key === 'c') {
        setPoints([])
      } else if (e.key === 'd') {
        let copyPlgList = [...plgObjList]

        for (let i = 0; i < copyPlgList.length; i++) {
          if (copyPlgList[i].selected) {
            let copyObj = {...copyPlgList[i]}
            let copyPoints = [...copyObj.points]
            if (selIndex !== null) {
              copyPoints.splice(selIndex, 1)
            }
            copyObj.points = copyPoints
            copyPlgList[i] = copyObj
          }
        }

        setPlgObjList(copyPlgList)
        setSelIndex(null)
      } else if (e.key === 'r') {
        setSelIndex(null)
      } else if (e.key === ' ' && e.code === 'Space') {
        polygonKey.current++
        if (points.length === 0) return;
        let scaledPoints = points.map(point => {
          return {x: Math.round(point.x / scaleRatio), y: Math.round(point.y / scaleRatio)}
        })
        let plgObj = {key: polygonKey.current, points: scaledPoints, selected: false}
        let copyPlgObjList = [...plgObjList, plgObj]
        setPlgObjList(copyPlgObjList)
        setPoints([])
      } else {
        console.log(e)
      }
    }

    function handleKeyUp(e) {
      if (e.key === "Delete") {
        let copyPlgList = [...plgObjList]
        let deletedResult = copyPlgList.filter(item => !item.selected)

        setPlgObjList(deletedResult)
      } else if (e.key === "Escape") {
        setSelIndex(null)
        let copyPlgList = [...plgObjList]
        for (let i = 0; i < copyPlgList.length; i++) {
          let copyObj = {...copyPlgList[i]}
          copyObj.selected = false
          copyPlgList[i] = copyObj
        }
        setPlgObjList(copyPlgList)
      } else {
        // console.log("onKeyUp : ", e)
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [nukkiMode, points, plgObjList, selIndex])

  /**
   * 휠 줌인/아웃 이벤트 관련
   * scaleRatio 변경 시마다 points 에도 scaling 적용
   * issue#1) downPoint 가 addmode로 그릴 때에도 바뀜 -> 새로 마스킹 해줄 때 기준이 달라짐 -> oldDownPoint 로 새로운 상태값 해줄 수는 있으나 다음 이슈가 또 문제
   * issue#2) Math.round, Math.ceil, Math.floor 등등 메서드 사용 시마다 정확한 기준점이 달라지는데 이걸로 마스킹을 하면 어차피 원본이 안남음
   */
  useEffect(() => {
    setPoints([])
    mask.current = null
  }, [scaleRatio, stageX, stageY])

  const wheelHandler = useCallback((e) => {
    e.evt.preventDefault();

    oldScale.current = scaleRatio

    let pointer = e.target.getStage().getPointerPosition();
    let mousePointTo = {
      x: (pointer.x - stageX) / oldScale.current,
      y: (pointer.y - stageY) / oldScale.current,
    }

    let newScale = parseFloat((scaleRatio + e.evt.wheelDelta / 1200).toFixed(1))
    let newPos = {
      x: Math.round(pointer.x - mousePointTo.x * newScale),
      y: Math.round(pointer.y - mousePointTo.y * newScale),
    };

    if (newScale > 1 && newScale <= 5) {
      if (newScale === 2) {
        setScaleRatio(newScale)
        setStageX(0)
        setStageY(0)
      } else {
        setScaleRatio(newScale)
        setStageX(newPos.x)
        setStageY(newPos.y)
      }
    } else if (newScale === 1) {
      setScaleRatio(newScale)
      setStageX(0)
      setStageY(0)
    }
  }, [oldScale, scaleRatio, stageX, stageY, stageRef])


  /**
   * 마우스 좌표 얻기
   */
  const getMousePosition = useCallback((e) => {
    // let stage = stageRef.getStage()
    let stage = e.target.getStage()
    let position = stage.getPointerPosition()
    return {x: Math.round(position.x - stageX), y: Math.round(position.y - stageY)}
  }, [stageRef, stageX, stageY])


  /**
   * 마우스 클릭 키다운시 필요한 상태값 변경
   */
  function onMouseDown(e) {
    if (e.evt.button === 0 && !allowDraw && nukkiMode) {
      setAllowDraw(true)
      setAddMode(e.evt.ctrlKey)
      setDownPoint(getMousePosition(e))
    } else if (e.evt.button === 0 && allowDraw) {
      setDownPoint(null)
    } else if (e.evt.button === 2 && !nukkiMode) {
      let scaledDownPoint = getMousePosition(e)
      setDownPoint(scaledDownPoint)
      setMoveMode(true)
    } else {
      // console.log(e)
    }
  }

  /**
   * 클릭 키다운 후 움직일때
   */
  const onMouseMove = (e) => {
    if (e.evt.button === 0 && allowDraw) {

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
        if (thres !== curTrsh) {
          // currentThreshold = thres;
          setCurTrsh(thres)
          drawMask(downPoint.x, downPoint.y);
        }
      }
    } else if (e.evt.buttons === 2 && !nukkiMode && moveMode) {
      // 작업 공간 이동
      let mPos = getMousePosition(e)
      mPos.x = Math.round(mPos.x)
      mPos.y = Math.round(mPos.y)
      let newStagePos = {
        x: -Math.round((downPoint.x - stageX - mPos.x)),
        y: -Math.round((downPoint.y - stageY - mPos.y))
      }

      let scaledImage = imageRef.current.children[0].attrs.image
      let scaledImageSize = {w: scaledImage.width, h: scaledImage.height}

      if (scaleRatio >= 2) {
        console.log(imageElement.width, imageElement.height)
        if (newStagePos.x <= 0 && imageElement.width - newStagePos.x <= scaledImageSize.w) {
          setStageX(newStagePos.x)
        }
        if (newStagePos.y <= 0 && imageElement.height - newStagePos.y <= scaledImageSize.h) {
          setStageY(newStagePos.y)
        }
      } else {
        let centerPoint = {
          x: Math.round(newStagePos.x + scaledImageSize.w / 2),
          y: Math.round(newStagePos.y + scaledImageSize.h / 2)
        }
        let boundary = {x: [0, imageElement.width], y: [0, imageElement.height]}
        if (centerPoint.x >= boundary.x[0] && centerPoint.x <= boundary.x[1]) {
          setStageX(newStagePos.x)
        }
        if (centerPoint.y >= boundary.y[0] && centerPoint.y <= boundary.y[1]) {
          setStageY(newStagePos.y)
        }
      }
    }
  }

  /**
   * 클릭 키다운 종료시, 상태값, 변수들 초기상태로
   */
  function onMouseUp(e) {
    setAllowDraw(false)
    setAddMode(false)
    setMoveMode(false)
    oldMask.current = null
  }


  /**
   * 마스킹 해주는 함수
   */
  function drawMask(x, y) {
    if (!imageInfo) return;

    const blurRadius = 5;
    // showThreshold();

    let maskingImg = {
      data: imageInfo.data,
      width: imageInfo.width,
      height: imageInfo.height,
      bytes: 4
    };

    // console.log("maskingImg: ", maskingImg)
    if (addMode && !oldMask.current) {
      oldMask.current = mask.current;
    }

    let old = oldMask.current ? oldMask.current.data : null;

    mask.current = MagicWand.floodFill(maskingImg, x, y, curTrsh, old, true);
    if (mask.current) mask.current = MagicWand.gaussBlurOnlyBorder(mask.current, blurRadius, old);

    if (addMode && oldMask) {
      mask.current = mask.current ? concatMasks(mask.current, oldMask.current) : oldMask.current;
    }

    trace()
  }

  /**
   * 원본 : 마스킹 된 곳에 테두리 그리기
   * 현재 : 필요한 points 상태값 설정
   */
  function trace() {
    if (!mask.current) return;
    const simplifyTolerant = 3;
    const simplifyCount = 30;
    let cs = MagicWand.traceContours(mask.current);
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
    cs = cs.filter(x => !x.inner);

    // setTempCs(cs[0].points)
    setPoints(cs[0].points.slice(0, -1))
  }

  /**
   * 마스킹 작업시 addMode 로 이어붙이기
   */
  function concatMasks(mask, old) {
    // console.log("old: ", old)
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

  /**
   * 폴리곤 꼭짓점 이동
   */
  const handlePointDragMove = useCallback((e, key) => {
    const stage = e.currentTarget.getStage();
    const index = e.currentTarget.index - 1;
    setSelIndex(index)
    const pos = [e.currentTarget._lastPos.x / scaleRatio, e.currentTarget._lastPos.y / scaleRatio];
    if (pos[0] < 0) pos[0] = 0;
    if (pos[1] < 0) pos[1] = 0;
    if (pos[0] > stage.width()) pos[0] = stage.width();
    if (pos[1] > stage.height()) pos[1] = stage.height();
    const newPos = {x: pos[0] - stageX / scaleRatio, y: pos[1] - stageY / scaleRatio}
    // console.log(newPos)
    let copyPlgObjList = [...plgObjList]
    let changingPlgObj = {...copyPlgObjList.filter(a => a.key === key)[0]}
    changingPlgObj.points = [...changingPlgObj.points.slice(0, index), newPos, ...changingPlgObj.points.slice(index + 1)]

    for (let i = 0; i < copyPlgObjList.length; i++) {
      let copyObj = {...copyPlgObjList[i]}
      if (copyObj.key === key) {
        copyObj = changingPlgObj
        copyPlgObjList[i] = copyObj
      }
    }

    setPlgObjList(copyPlgObjList)
  }, [plgObjList, scaleRatio]);

  const handlePolygonClick = ({e, key}) => {
    setNukkiMode(false)
    setSelIndex(null)
    let copyPlgObjList = [...plgObjList]
    for (let i = 0; i < copyPlgObjList.length; i++) {
      let copyPlgObj = {...copyPlgObjList[i]}
      copyPlgObj.selected = copyPlgObj.key === key;
      copyPlgObjList[i] = copyPlgObj
    }
    // console.log(copyPlgObjList)
    setPlgObjList(copyPlgObjList)


    // 꼭짓점 추가
    if (e.evt.altKey) {
      let position = e.target.getStage().getPointerPosition()
      let mousePos = {
        x: (position.x - stageX) / scaleRatio,
        y: (position.y - stageY) / scaleRatio
      }
      let mx = mousePos.x
      let my = mousePos.y

      // 1) 폴리곤 특성 상, 제일 가까운 점, 기울기가 같은 직선 이런거 따져서 할 수가 없음
      let selectedPolygon = plgObjList.filter(poly => poly.selected)[0]
      let points = selectedPolygon.points
      let addPointIndex;
      let addingPoint;

      console.log(plgObjList)
      console.log("mx, my: ", mx, my)
      for (let i = 0; i < points.length; i++) {
        const startX = points[i].x
        const startY = points[i].y
        const endX = points[(i + 1) % points.length].x
        const endY = points[(i + 1) % points.length].y

        // 여기서 기울기 한번 따져줘야함

        // 1. 일반적인 상황
        const incl = (endY - startY) / (endX - startX)
        console.log("기울기: ", incl)
        const newIncl = -(1 / incl)
        // y =  뉴기울기 * x + 새직선상수
        // startY = 뉴기울기 * startX + 새직선상수
        const newConstStart = startY - newIncl * startX
        const newConstEnd = endY - newIncl * endX

        // 여기서 기울기 1 이상, 이하로 나눠야 함
        if (incl >= 1 || incl <= -1) {
          // 좌상 -> 우하
          let nsx1 = startX + 4
          let nsy1 = newIncl * nsx1 + newConstStart
          let nsx2 = startX - 4
          let nsy2 = newIncl * nsx2 + newConstStart

          let rectPoint1 = {x: nsx1, y: nsy1}
          let rectPoint2 = {x: nsx2, y: nsy2}

          let nex1 = endX + 4
          let ney1 = newIncl * nex1 + newConstEnd
          let nex2 = endX - 4
          let ney2 = newIncl * nex2 + newConstEnd

          let rectPoint3 = {x: nex1, y: ney1}
          let rectPoint4 = {x: nex2, y: ney2}

          // 1 -> 3 -> 4 -> 2 rect
          // let rectPoints = [rectPoint1, rectPoint3, rectPoint4, rectPoint2]
          // console.log("rectPoints: ", rectPoints)
          let tempRectCanvas = document.createElement("canvas", {is: "tempRectCanvas"})
          let tempRect = new Path2D()
          tempRect.moveTo(rectPoint1.x, rectPoint1.y)
          tempRect.lineTo(rectPoint3.x, rectPoint3.y)
          tempRect.lineTo(rectPoint4.x, rectPoint4.y)
          tempRect.lineTo(rectPoint2.x, rectPoint2.y)
          tempRect.closePath()

          // console.log(" ? ", tempRectCanvas.getContext('2d').isPointInPath(tempRect, mx, my))
          if (tempRectCanvas.getContext('2d').isPointInPath(tempRect, mx, my)) {
            addPointIndex = i + 1
            addingPoint = mousePos
          }
        } else if ((incl < 1 && incl > 0) || (incl < 0 && incl > -1)) {
          // 좌상 -> 우하
          let nsy1 = startY + 4
          let nsx1 = (nsy1 - newConstStart) / newIncl
          let nsy2 = startY - 4
          let nsx2 = (nsy2 - newConstStart) / newIncl

          let rectPoint1 = {x: nsx1, y: nsy1}
          let rectPoint2 = {x: nsx2, y: nsy2}

          let ney1 = endY + 4
          let nex1 = (ney1 - newConstEnd) / newIncl
          let ney2 = endY - 4
          let nex2 = (ney2 - newConstEnd) / newIncl

          let rectPoint3 = {x: nex1, y: ney1}
          let rectPoint4 = {x: nex2, y: ney2}

          let tempRectCanvas = document.createElement("canvas", {is: "tempRectCanvas"})
          let tempRect = new Path2D()
          tempRect.moveTo(rectPoint1.x, rectPoint1.y)
          tempRect.lineTo(rectPoint3.x, rectPoint3.y)
          tempRect.lineTo(rectPoint4.x, rectPoint4.y)
          tempRect.lineTo(rectPoint2.x, rectPoint2.y)
          tempRect.closePath()

          if (tempRectCanvas.getContext('2d').isPointInPath(tempRect, mx, my)) {
            addPointIndex = i + 1
            addingPoint = mousePos
          }
        } else if (incl === 0) {
          // 수평
          let nsy1 = startY + 4
          let nsx1 = startX
          let nsy2 = startY - 4
          let nsx2 = startX

          let rectPoint1 = {x: nsx1, y: nsy1}
          let rectPoint2 = {x: nsx2, y: nsy2}

          let ney1 = endY + 4
          let nex1 = endX
          let ney2 = endY - 4
          let nex2 = endX

          let rectPoint3 = {x: nex1, y: ney1}
          let rectPoint4 = {x: nex2, y: ney2}

          let tempRectCanvas = document.createElement("canvas", {is: "tempRectCanvas"})
          let tempRect = new Path2D()
          tempRect.moveTo(rectPoint1.x, rectPoint1.y)
          tempRect.lineTo(rectPoint3.x, rectPoint3.y)
          tempRect.lineTo(rectPoint4.x, rectPoint4.y)
          tempRect.lineTo(rectPoint2.x, rectPoint2.y)
          tempRect.closePath()

          if (tempRectCanvas.getContext('2d').isPointInPath(tempRect, mx, my)) {
            addPointIndex = i + 1
            addingPoint = mousePos
          }

        } else if (incl === Infinity) {
          // 수직
          let nsx1 = startX + 4
          let nsy1 = startY
          let nsx2 = startX - 4
          let nsy2 = startY

          let rectPoint1 = {x: nsx1, y: nsy1}
          let rectPoint2 = {x: nsx2, y: nsy2}

          let nex1 = endX + 4
          let ney1 = endY
          let nex2 = endX - 4
          let ney2 = endY

          let rectPoint3 = {x: nex1, y: ney1}
          let rectPoint4 = {x: nex2, y: ney2}

          // 1 -> 3 -> 4 -> 2 rect
          // let rectPoints = [rectPoint1, rectPoint3, rectPoint4, rectPoint2]
          // console.log("rectPoints: ", rectPoints)
          let tempRectCanvas = document.createElement("canvas", {is: "tempRectCanvas"})
          let tempRect = new Path2D()
          tempRect.moveTo(rectPoint1.x, rectPoint1.y)
          tempRect.lineTo(rectPoint3.x, rectPoint3.y)
          tempRect.lineTo(rectPoint4.x, rectPoint4.y)
          tempRect.lineTo(rectPoint2.x, rectPoint2.y)
          tempRect.closePath()

          // console.log(" ? ", tempRectCanvas.getContext('2d').isPointInPath(tempRect, mx, my))
          if (tempRectCanvas.getContext('2d').isPointInPath(tempRect, mx, my)) {
            addPointIndex = i + 1
            addingPoint = mousePos
          }
        }
      }

      console.log(addPointIndex, addingPoint)

      if (addPointIndex && addingPoint) {
        let copiedList = [...plgObjList]
        for (let j = 0; j < copiedList.length; j++) {
          if (copiedList[j].selected) {
            let copiedSelectedObj = {...copiedList[j]}
            let copiedPoints = [...copiedSelectedObj.points]
            // if (addPointIndex)
            copiedPoints.splice(addPointIndex, 0, addingPoint)
            copiedSelectedObj.points = copiedPoints
            copiedList[j] = copiedSelectedObj
          }
        }

        setPlgObjList(copiedList)
      }
    }
  }

  return (
    <div className="section">
      <TopMenu/>
      <Toolbar/>
      <Jobsbar/>
      <div id="mouse-coordinator">
        <MouseCoordinator imgRef={imageRef} scaleRatio={scaleRatio}/>
        <Stage
          width={imageElement.width}
          height={imageElement.height}
          ref={ref => {
            stageRef = ref
          }}
          // ref={stageRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onWheel={wheelHandler}
          x={stageX}
          y={stageY}
        >
          <Layer ref={imageRef}>
            <Image
              id="image"
              ref={imageRef}
              image={image}
            />
            {/* 작업 하나를 위한 어노테이션 컴포넌트 */}
            <PolygonAnnotation
              points={points}
              flattenedPoints={flattenedPoints}
              handlePointDragMove={handlePointDragMove}
            />

            {/* 작업 된 폴리곤들에 대한 매핑 컴포넌트 */}
            {plgObjList.map(plgObj =>
              <PolygonAnnotation
                plgObj={plgObj}
                points={plgObj.points}
                handlePointDragMove={handlePointDragMove}
                handlePolygonClick={handlePolygonClick}
                scaleRatio={scaleRatio}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default ImageEditor;
