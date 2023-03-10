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
  imageInfoState,
  nukkiModeState,
} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import PolygonAnnotation from "../AnnotationTool/PolygonAnnotation";
import {filterState} from "../../stateManagement/atoms/canvasFilter/canvasFilterAtom";
import {polygonObjListState, selectedIndexState} from "../../stateManagement/atoms/Nukki/polygonAtom";


function ImageEditor() {
  const imgSource = 'sample2.jpg'

  let stageRef = useRef(null)
  const imageRef = useRef(null);

  // let renderCount = 0
  // let polygonKey = 0
  const polygonKey = useRef(0)

  const colorThreshold = 15;

  // local state -> recoil 로 변경할 예정
  const [image, setImage] = useState();
  const [points, setPoints] = useState([]);
  const [scaledPoints, setScaledPoints] = useState([])
  const [flattenedPoints, setFlattenedPoints] = useState([]);
  const [curTrsh, setCurTrsh] = useState(colorThreshold)
  const [scaleRatio, setScaleRatio] = useState(1)
  // const [oldScale, setOldScale] = useState(1)
  const [stagePos, setStagePos] = useState({x: 0, y: 0})

  const [firstPoints, setFirstPoints] = useState([])
  const [firstScale, setFirstScale] = useState(1)

  // recoil state
  const [imageInfo, setImageInfo] = useRecoilState(imageInfoState)
  const [nukkiMode, setNukkiMode] = useRecoilState(nukkiModeState)
  const [allowDraw, setAllowDraw] = useRecoilState(allowDrawState)
  const [plgObjList, setPlgObjList] = useRecoilState(polygonObjListState)
  const [selIndex, setSelIndex] = useRecoilState(selectedIndexState);
  const filter = useRecoilValue(filterState)


  // 누끼 변수들 state/ref 처리
  const [addMode, setAddMode] = useState(false)
  const [downPoint, setDownPoint] = useState(null)

  const mask = useRef(null)
  const oldMask = useRef(null)
  const oldScale = useRef(1)

  // 누끼에서 필요한 변수들 (상태값이면 안됨)
  // let colorThreshold = 15;
  let blurRadius = 5;
  let simplifyTolerant = 5;
  let simplifyCount = 30;
  // let currentThreshold = colorThreshold;


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
  console.log(mask)
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
    const scaledWidth = imageElement.width * scaleRatio
    const scaledHeight = imageElement.height * scaleRatio
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
    return {cvsEl, data}
  }, [imageElement, filter, scaleRatio])


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
      } else if (e.key === ' ' && e.code === 'Space') {
        polygonKey.current++
        if (points.length === 0) return;
        let scaledPoints = points.map(point => {return {x: Math.round(point.x / scaleRatio), y: Math.round(point.y / scaleRatio)}})
        let plgObj = {key: polygonKey.current, points: scaledPoints, selected: false}
        let copyPlgObjList = [...plgObjList, plgObj]
        setPlgObjList(copyPlgObjList)
        setPoints([])
      } else if (e.key === 'c') {
        setPoints([])
        setFirstPoints([])
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
      } else {
        console.log("onKeyUp : ", e)
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
   */
  useEffect(() => {
    let newPoints = firstPoints.map(point => {return {x: Math.round((point.x)/ firstScale * scaleRatio), y: Math.round((point.y)/ firstScale * scaleRatio )}})
    setPoints(newPoints)

  }, [imageInfo, firstPoints, scaleRatio, stagePos])

  const wheelHandler = useCallback((e) => {
    e.evt.preventDefault();

    oldScale.current = scaleRatio

    let pointer = e.target.getStage().getPointerPosition();
    let mousePointTo = {
      x: (pointer.x - e.target.getStage().x()) / oldScale.current,
      y: (pointer.y - e.target.getStage().y()) / oldScale.current,
    }

    let newScale = parseFloat((scaleRatio + e.evt.wheelDelta / 1200).toFixed(1))
    let newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    if (newScale > 1 && newScale <= 3) {
      setScaleRatio(newScale)
      setStagePos(newPos)
    } else if (newScale === 1) {
      setScaleRatio(newScale)
      setStagePos({x: 0, y: 0})
    }
  }, [oldScale, scaleRatio, stagePos])



  /**
   * 마우스 좌표 얻기
   */
  const getMousePosition = useCallback((e) => {
    // let stage = stageRef.getStage()
    let stage = e.target.getStage()
    let position = stage.getPointerPosition()
    return {x: Math.round(position.x - stagePos.x), y: Math.round(position.y - stagePos.y)}
  }, [stageRef, scaleRatio])


  /**
   * 마우스 클릭 키다운시 필요한 상태값 변경
   */
  function onMouseDown(e) {
    if (e.evt.button === 0 && !allowDraw) {
      if (nukkiMode) {
        setAllowDraw(true)
        setAddMode(e.evt.ctrlKey)
        setDownPoint(getMousePosition(e))
        console.log("mouseDown pos: ", getMousePosition(e))
      }
    } else if (e.evt.button === 0 && allowDraw) {
      setAllowDraw(false)
      setDownPoint(null)
    } else if (e.evt.button === 2) {
      console.log(e)
    } else {
      console.log(e)
    }
  }

  /**
   * 클릭 키다운 후 움직일때
   */
  function onMouseMove(e) {
    if (allowDraw) {

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
    }
  }

  /**
   * 클릭 키다운 종료시, 상태값, 변수들 초기상태로
   */
  function onMouseUp(e) {
    // currentThreshold = colorThreshold;
    setCurTrsh(colorThreshold)
    setAllowDraw(false)
    setAddMode(false)
    oldMask.current = null
  }


  /**
   * 마스킹 해주는 함수
   */
  function drawMask(x, y) {
    if (!imageInfo) return;

    // showThreshold();

    let maskingImg = {
      data: imageInfo.data,
      width: imageInfo.width,
      height: imageInfo.height,
      bytes: 4
    };

    console.log("maskingImg: ", maskingImg)
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
    let cs = MagicWand.traceContours(mask.current);
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
    cs = cs.filter(x => !x.inner);

    // setTempCs(cs[0].points)
    setPoints(cs[0].points.slice(0, -1))

    setFirstPoints(cs[0].points.slice(0, -1))
    setFirstScale(scaleRatio)
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
   * TODO: 이 드래그 이벤트에도 스케일링 먹여야함
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
    const newPos = {x: pos[0], y: pos[1]}
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
    // setPoints([...points.slice(0, index), newPos, ...points.slice(index + 1)]);
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
    setPlgObjList(copyPlgObjList)


    // 꼭짓점 추가
    if (e.evt.altKey) {
      let position = e.target.getStage().getPointerPosition()
      let mousePos = {x: Math.round(position.x), y: Math.round(position.y)}
      let x = mousePos.x
      let y = mousePos.y

      // 1) 폴리곤 특성 상, 제일 가까운 점, 기울기가 같은 직선 이런거 따져서 할 수가 없음
      let selectedPolygon = plgObjList.filter(poly => poly.selected)[0]
      let points = selectedPolygon.points
      let addPointIndex = 0
      let addingPoint = {}
      for (let i = 0; i < points.length; i++) {
        const startX = points[i].x
        const startY = points[i].y
        const endX = points[(i+1) % points.length].x
        const endY = points[(i+1) % points.length].y

        if (((startX <= x && x <= endX) || (endX <= x && x <= startX)) && ((startY <= y && y <= endY) || (endY <= y && y <= startY))) {
          addPointIndex = i + 1
          addingPoint = mousePos
        }
      }

      console.log(addPointIndex, addingPoint)

      let copiedList = [...plgObjList]
      for (let j = 0; j < copiedList.length; j++) {
        if (copiedList[j].selected) {
          let copiedSelectedObj = {...copiedList[j]}
          console.log("copiedSelectedObj : ", copiedSelectedObj)
          let copiedPoints = [...copiedSelectedObj.points]
          copiedPoints.splice(addPointIndex, 0, addingPoint)
          console.log("copiedPoints : ", copiedPoints)
          copiedSelectedObj.points = copiedPoints
          copiedList[j] = copiedSelectedObj
        }
      }

      setPlgObjList(copiedList)

    }
  }

  // // 폴리곤 전체에 대한 dragEnd
  // const handleGroupDragEnd = (e, key) => {
  //   if (e.target.parent.attrs.name === "polygon") {
  //     console.log("name = polygon")
  //     let result = [];
  //     let copyPlgObjList = [...plgObjList]
  //     let changingPlgObj = {...copyPlgObjList.filter(a => a.key === key)[0]}
  //
  //     let copyPoints = [...changingPlgObj.points];
  //     copyPoints.map((point) =>
  //       result.push({x: point.x + e.target.x(), y: point.y + e.target.y()})
  //     );
  //
  //     changingPlgObj.points = result
  //     copyPlgObjList.filter(a => a.key === key)[0] = changingPlgObj
  //     setPlgObjList(copyPlgObjList)
  //
  //     // e.target.position({x: 0, y: 0}); //needs for mouse position otherwise when click undo you will see that mouse click position is not normal:)
  //     // setPoints(result);
  //   }
  // };

  return (
    <div className="section">
      <TopMenu/>
      <Toolbar/>
      <Jobsbar/>
      <div id="mouse-coordinator">
        <MouseCoordinator imgRef={imageRef}/>
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
          x={stagePos.x}
          y={stagePos.y}
        >
          <Layer>
            <Image
              ref={imageRef}
              image={image}
              x={0}
              y={0}
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
