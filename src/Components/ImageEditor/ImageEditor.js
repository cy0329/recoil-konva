import React, {useEffect, useMemo, useRef, useState} from 'react';

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
  const renderCount = useRef(0)
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
  const filter = useRecoilValue(filterState)


  // 누끼 변수들 state/ref 처리
  const [addMode, setAddMode] = useState(false)
  const [downPoint, setDownPoint] = useState(null)

  const mask = useRef(null)
  const oldMask = useRef(null)

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
    cvsEl.width = imageElement.width;
    cvsEl.height = imageElement.height;
    const ctx = cvsEl.getContext('2d')
    ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)
    const data = ctx.getImageData(0, 0, imageElement.width, imageElement.height);
    // 이미지 데이터는 필터 안들어가게 먼저 뽑아주고

    ctx.clearRect(0, 0, imageElement.width, imageElement.height)
    ctx.filter = filter
    ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height)
    // 리턴할 캔버스 엘리먼트는 필터링 적용되도록
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
        let plgObj = {key: polygonKey.current, points: points, selected: false}
        console.log("plgObj: ", plgObj)
        let copyPlgObjList = [...plgObjList, plgObj]
        setPlgObjList(copyPlgObjList)
        setPoints([])
      } else if (e.key === 'c') {
        setPoints([])
      } else if (e.key === 's') {
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
      } else if (e.key === 'd') {
        let copyPlgList = [...plgObjList]
        let deletedResult = copyPlgList.filter(item => !item.selected)

        setPlgObjList(deletedResult)
      } else if (e.key === 'r') {
        setSelIndex(null)
      } else {
        console.log(e)
      }
    }

    document.addEventListener('keypress', handleKeyPress)
    return () => {
      document.removeEventListener('keypress', handleKeyPress)
    }
  }, [nukkiMode, points, plgObjList, selIndex])


  /**
   * 마우스 좌표
   */
  function getMousePosition() {
    let stage = stageRef.getStage()
    // let stage = e.target.getStage()
    let position = stage.getPointerPosition()
    return {x: Math.round(position.x), y: Math.round(position.y)}
  }


  /**
   * 마우스 클릭 키다운시 필요한 상태값 변경
   */
  function onMouseDown(e) {
    if (e.evt.button === 0 && !allowDraw) {
      if (nukkiMode) {
        setAllowDraw(true)
        setAddMode(e.evt.ctrlKey)
        setDownPoint(getMousePosition())
      }
    } else if (e.evt.button === 0 && allowDraw) {
      setAllowDraw(false)
      setDownPoint(null)
    }
  }

  /**
   * 클릭 키다운 후 움직일때
   */
  function onMouseMove(e) {
    if (allowDraw) {

      let p = getMousePosition();
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
  const handlePointDragMove = (e, key) => {
    console.log("key: ", key)
    const stage = e.currentTarget.getStage();
    const index = e.currentTarget.index - 1;
    setSelIndex(index)
    const pos = [e.currentTarget._lastPos.x, e.currentTarget._lastPos.y];
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
  };

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

  const wheelHandler = (e) => {
    console.log(e.evt.wheelDeltaY)
  }

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
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onWheel={wheelHandler}
          // scaleX={0.5}
          // scaleY={0.5}
          // x={200}
          // y={200}
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
              // handleGroupDragEnd={handleGroupDragEnd}
              // handlePolygonClick={handlePolygonClick}
              // handleMouseOverStartPoint={handleMouseOverStartPoint}
              // handleMouseOutStartPoint={handleMouseOutStartPoint}
            />

            {/* 작업 된 폴리곤들에 대한 매핑 컴포넌트 */}
            {plgObjList.map(plgObj =>
              <PolygonAnnotation
                plgObj={plgObj}
                points={plgObj.points}
                flattenedPoints={flattenedPoints}
                handlePointDragMove={handlePointDragMove}
                handlePolygonClick={handlePolygonClick}
                // handleGroupDragEnd={handleGroupDragEnd}
                // handleMouseOverStartPoint={handleMouseOverStartPoint}
                // handleMouseOutStartPoint={handleMouseOutStartPoint}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default ImageEditor;
