import React, {useEffect, useRef, useState} from 'react';
import Draggable from 'react-draggable';
import $ from '../../../node_modules/jquery/dist/jquery.min.js';

import './Toolbar.css'
import appear1 from '../../assets/appear1.png'
import appear2 from '../../assets/appear2.png'
import {useRecoilState} from "recoil";
import {toolbarCoordinateState, toolbarIsOpenState} from "../../stateManagement/atoms/layout/toolbarAtom";
import ImageFilters from "../ImageFilters/imageFilters";
import {nukkiModeState} from "../../stateManagement/atoms/Nukki/nukkiAtom";


function Toolbar() {
  const [tbIsOpen, setTbIsOpen] = useRecoilState(toolbarIsOpenState)
  const [tbCoord, setTbCoord] = useRecoilState(toolbarCoordinateState)


  const [isDrgable, setIsDragable] = useState(false)

  const toolbarRef = useRef(null)

  function onTBClose() {
    $('#toolbar').css({
      'transition': 'all ease-out .2s'
    })
    setTbIsOpen(false)
    setTbCoord({x: -320, y: 0})
  }

  function onTBOpen() {
    $('#toolbar').css({
      'transition': 'all ease-in .2s'
    })
    setTbIsOpen(true)
    setTbCoord({x: 0, y: 0})
  }

  function handleDragPosition(e) {
    if (e.x < 0 || e.x > window.innerWidth || e.y < 0 || e.y > window.innerHeight) {
      onTBClose()
    } else {
        setTbCoord({x: e.layerX - e.offsetX, y: e.layerY - e.offsetY})
    }
  }


  return (
    <Draggable disabled={!tbIsOpen || !isDrgable} position={tbCoord} onStop={(e) => handleDragPosition(e)} defaultClassName={'tbtop'} nodeRef={toolbarRef}>
      <div
        id="toolbar"
        onTransitionEnd={() => {
          $('#toolbar').css({
            'transition': 'none'
          })
        }}
        ref={toolbarRef}
      >
        <div className="tbtop" onMouseEnter={() => setIsDragable(true)}>
          <p>옵션</p>
          <img id="toggle-toolbar" src={!tbIsOpen ? appear1 : appear2} alt=""
               onClick={tbIsOpen ? onTBClose : onTBOpen}/>
        </div>
        <div className="tbbody" onMouseEnter={() => setIsDragable(false)}>
          <div className="datasetname"><p>[VQA] BBOX 데이터셋</p></div>
          <div>
            <ImageFilters />
          </div>
          <div>
            &lt;단축키 설명&gt;
            <br/>
            A: 모드 변경 (마스킹모드 / 컨트롤모드)
            <br/>
            C: 등록 안 된 마스킹 삭제
            <br/>
            D: 선택한 꼭짓점 삭제
            <br/>
            R: 꼭짓점 선택 해제
            <br/>
            SpaceBar: 마스킹을 폴리곤으로 등록
            <br/>
            Del: 선택된 폴리곤 삭제
            <br/>
            Esc: 폴리곤 선택 해제
          </div>
        </div>
      </div>
    </Draggable>
  )
}

export default Toolbar;
