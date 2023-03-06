import React, {useEffect, useMemo, useRef, useState} from 'react';
import $ from '../../../node_modules/jquery/dist/jquery.min.js';

import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";

import Toolbar from "../Layouts/Toolbar";
import Jobsbar from "../Layouts/Jobsbar";
import TopMenu from "../Layouts/TopMenu";
import MouseCoordinator from "../Layouts/MouseCoordinator";

import {filterState} from "../../stateManagement/atoms/canvasFilter/canvasFilterAtom";

import './ImageEditor.css'
import {Image, Layer, Stage} from "react-konva";
import TestRect from "../KonvaElements/TestRect";
import TestImage from "../KonvaElements/TestImage";
import Nukki from "../Nukki/Nukki";
import MagicWand from "magic-wand-tool";
import Konva from "konva";
import {allowDrawState, csState, imageInfoState, nukkiModeState} from "../../stateManagement/atoms/Nukki/nukkiAtom";
import PolygonAnnotation from "../AnnotationTool/PolygonAnnotation";


const imgSource = 'sample2.jpg'

let renderCount = 0
function ImageEditor() {
  let stageRef = useRef(null)

  const imageRef = useRef(null);


  const [tempCs, setTempCs] = useRecoilState(csState)

  const [image, setImage] = useState();
  const [size, setSize] = useState({});
  // const [isPolyComplete, setPolyComplete] = useState(false);
  const [points, setPoints] = useState([]);
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [imageData, setImageData] = useState({})
  const [flattenedPoints, setFlattenedPoints] = useState([]);
  const [position, setPosition] = useState([0, 0])
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)

  // recoil state
  const [imageInfo, setImageInfo] = useRecoilState(imageInfoState)
  const [nukkiMode, setNukkiMode] = useRecoilState(nukkiModeState)
  const [allowDraw, setAllowDraw] = useRecoilState(allowDrawState)

  // 누끼 변수들 상태값 화 ( 드래그 없이 첫 클릭과 다음 클릭으로 설정하도록 )
  // const [allowDraw, setAllowDraw] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [downPoint, setDownPoint] = useState(null)
  // const [mask, setMask] = useState(null)
  // const [oldMask, setOldMask] = useState(null)

  // 누끼에서 필요한 변수들 (상태값이면 안됨)
  let colorThreshold = 15;
  let blurRadius = 5;
  let simplifyTolerant = 4;
  let simplifyCount = 30;
  let mask = null;
  let oldMask = null;
  let currentThreshold = colorThreshold;
  // let imageInfo = null
  // let downPoint = null;
  // let allowDraw = false;
  // let addMode = false;

  // -----console.log 영역-----
  renderCount++
  console.log('render', renderCount)
  // console.log("image: ", image)
  // console.log("imageInfo : ", imageInfo)
  // console.log("imageData: ", imageData)
  // console.log("points: ", points)
  // console.log("flattenedPoints: ", flattenedPoints)
  // console.log("imageWidth, height : ", imageWidth, imageHeight)
  // console.log("oldMask: ", oldMask)
  console.log("addMode: ", addMode)
  // -------------------------

  /**
   * 이미지 그려줄 element 설정, 반환
   */
  const imageElement = useMemo(() => {
    const maxCanvasWidth = window.innerWidth;
    const maxCanvasHeight = window.innerHeight;

    const element = new window.Image();
    element.src = imgSource;

    let width = 1600;
    let height = 900;

    // 이미지 스케일링
    let imageRatio = element.height / element.width
    if (imageRatio < 1) {
      // 가로가 세로보다 긴 경우
      if (element.width > maxCanvasWidth) {
        let newHeight = element.height * (maxCanvasWidth / element.width)
        if (newHeight > maxCanvasHeight - 31) {
          height = maxCanvasHeight - 31
          width = element.width * ((maxCanvasHeight - 31) / element.height)

        } else {
          width = maxCanvasWidth
          height = newHeight
        }
      } else {
        if (element.height > maxCanvasHeight - 31) {
          width = element.width * ((maxCanvasHeight - 31) / element.height)
          height = maxCanvasHeight - 31
        } else {
          width = element.width
          height = element.height

        }
      }
    } else {
      // 가로가 세로보다 짧은 경우
      if (element.height > maxCanvasHeight - 31) {
        height = maxCanvasHeight - 31
        width = element.width * ((maxCanvasHeight - 31) / element.height)
      } else {
        width = element.width
        height = element.height
      }
    }

    element.width = width;
    element.height = height;

    return element;
  }, [imgSource]); //it may come from redux so it may be dependency that's why I left it as dependecny...



  useEffect(() => {
    // 이미지 데이터 세팅, 이미지 w, h 세팅
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageElement.width
    tempCanvas.height = imageElement.height
    // setImageWidth(imageElement.width)
    // setImageHeight(imageElement.height)
    let tempContext = tempCanvas.getContext('2d');

    tempContext.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
    const imageData = tempContext.getImageData(0, 0, imageElement.width, imageElement.height);
    // console.log("imageData: ", imageData)
    setImageData(imageData)
  }, [imageElement])

  /**
   * 이미지 onload로 설정
   */
  useEffect(() => {
    const onload = function () {
      setSize({
        width: imageElement.width,
        height: imageElement.height,
      });
      setImage(imageElement);
      imageRef.current = imageElement;

      setImageInfo({
        width: imageElement.width,
        height: imageElement.height,
        data: imageData.data
      });
    };

    if (imageData.data) onload()
  }, [imageElement, imageData]);



  function getMousePosition() {
    let stage = stageRef.getStage()
    // let stage = e.target.getStage()
    let position = stage.getPointerPosition()
    return {x: Math.round(position.x), y: Math.round(position.y)}
  }


  function onMouseDown(e) {
    // let ctrlPressed = e.evt.ctrlKey
    if (e.evt.button === 0 && !allowDraw) {
      if (nukkiMode) {
        setAllowDraw(true)
        setAddMode(e.evt.ctrlKey)
        setDownPoint(getMousePosition())
      }
    } else if (e.evt.button === 0 && allowDraw) {
      setAllowDraw(false)
      setAddMode(e.evt.ctrlKey)
      setDownPoint(null)
      // setNukkiMode(false)
      // oldMask = null
    }
  }



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
        if (thres !== currentThreshold) {
          currentThreshold = thres;
          drawMask(downPoint.x, downPoint.y);
        }
      }
    }
  }

  function onMouseUp(e) {
    // setPoints(cs[0].points)
    // allowDraw = false;
    // addMode = false;
    // oldMask = null;
    currentThreshold = colorThreshold;
    setAllowDraw(false)
    setAddMode(false)
    setDownPoint(null)
  }

  function drawMask(x, y) {
    if (!imageInfo) return;

    // showThreshold();

    let image = {
      data: imageInfo.data,
      width: imageInfo.width,
      height: imageInfo.height,
      bytes: 4
    };
    // console.log(image)
    // console.log("mask: ", mask)

    if (addMode && !oldMask) {
      oldMask = mask;
    }

    let old = oldMask ? oldMask.data : null;
    // console.log("old: ", old, "addMode: ", addMode)
    mask = MagicWand.floodFill(image, x, y, currentThreshold, old, true);
    if (mask) mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius, old);

    if (addMode && oldMask) {
      mask = mask ? concatMasks(mask, oldMask) : oldMask;
    }
    // setOldMask(mask)

    trace()
  }

  function trace() {
    if (!mask) return;
    let cs = MagicWand.traceContours(mask);
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);
    cs = cs.filter(x => !x.inner);

    // setTempCs(cs[0].points)
    setPoints(cs[0].points)
  }

  // console.log("tempCs : ", tempCs)

  useEffect(() => {
    let flattenList = []
    for (let a of points) {
      flattenList.push(a.x, a.y)
    }
    setFlattenedPoints(flattenList);
  }, [points]);

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


  /**
   * 폴리곤 이동, 변형 관련
   */
  const handlePointDragMove = (e) => {
    const stage = e.currentTarget.getStage();
    const index = e.currentTarget.index - 1;
    const pos = [e.currentTarget._lastPos.x, e.currentTarget._lastPos.y];
    if (pos[0] < 0) pos[0] = 0;
    if (pos[1] < 0) pos[1] = 0;
    if (pos[0] > stage.width()) pos[0] = stage.width();
    if (pos[1] > stage.height()) pos[1] = stage.height();
    const newPos = {x: pos[0], y: pos[1]}
    setPoints([...points.slice(0, index), newPos, ...points.slice(index + 1)]);
  };

  const handleGroupDragEnd = (e) => {
    //drag end listens other children circles' drag end event
    //...that's, why 'name' attr is added, see in polygon annotation part
    // console.log("name: ", e)
    if (e.target.name() === "polygon") {
      let result = [];
      let copyPoints = [...points];
      copyPoints.map((point) =>
        result.push([point[0] + e.target.x(), point[1] + e.target.y()])
      );
      e.target.position({x: 0, y: 0}); //needs for mouse position otherwise when click undo you will see that mouse click position is not normal:)
      setPoints(result);
    }
  };


  return (
    <div className="section">
      <TopMenu/>
      <Toolbar/>
      <Jobsbar/>
      <div id="mouse-coordinator">
        <Stage
          width={size.width || window.innerWidth}
          height={size.height || window.innerHeight}
          ref={ref => {
            stageRef = ref
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          <Layer>
            <Image
              ref={imageRef}
              image={image}
              x={0}
              y={0}
              width={size.width}
              height={size.height}
            />
            <PolygonAnnotation
              points={points}
              flattenedPoints={flattenedPoints}
              handlePointDragMove={handlePointDragMove}
              handleGroupDragEnd={handleGroupDragEnd}
              // handleMouseOverStartPoint={handleMouseOverStartPoint}
              // handleMouseOutStartPoint={handleMouseOutStartPoint}
              isFinished={true}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

export default ImageEditor;
