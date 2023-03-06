import React, {useState, useRef} from 'react';
import Draggable from 'react-draggable';
import $ from '../../../node_modules/jquery/dist/jquery.min.js';

import './Jobsbar.css'
import appear2 from "../../assets/appear2.png";
import appear1 from "../../assets/appear1.png";
import {useRecoilState} from "recoil";
import {jobsbarCoordinateState, jobsbarIsOpenState} from "../../stateManagement/atoms/layout/jobsbarAtom";


function Jobsbar() {
  const [jbIsOpen, setJbIsOpen] = useRecoilState(jobsbarIsOpenState)
  const [jbCoord, setJbCoord] = useRecoilState(jobsbarCoordinateState)

  const [isDrgable, setIsDragable] = useState(false)

  const jobsbarRef = useRef(null)

  function onJBClose() {
    $('#jobsbar').css({
      'transition': 'all ease-out .2s'
    })
    setJbIsOpen(false)
    setJbCoord({x: 320, y: 0})
  }

  function onJBOpen() {
    $('#jobsbar').css({
      'transition': 'all ease-in .2s'
    })
    setJbIsOpen(true)
    setJbCoord({x: 0, y: 0})
  }

  function handleDragPosition(e) {
    if (e.x < 0 || e.x > window.innerWidth || e.y < 0 || e.y > window.innerHeight) {
      onJBClose()
    } else {
      setJbCoord({x: e.layerX - e.offsetX, y: e.layerY - e.offsetY})
    }
  }

  return (
    <Draggable disabled={!jbIsOpen || !isDrgable} position={jbCoord} onStop={(e) => handleDragPosition(e)} nodeRef={jobsbarRef}>
      <div
        id="jobsbar"
        onTransitionEnd={() => {
          $('#jobsbar').css({
            'transition': 'none'
          })
        }}
        ref={jobsbarRef}
      >
        <div className="jbtop" onMouseEnter={() => setIsDragable(true)}>
          <p>작업 현황</p>
          <img id="toggle-toolbar" src={!jbIsOpen ? appear2 : appear1} alt=""
               onClick={jbIsOpen ? onJBClose : onJBOpen}/>
        </div>
        <div className="jbbody" onMouseEnter={() => setIsDragable(false)}>
          <h2>들어갈 내용</h2>
          <p>라벨 작업 현황</p>
        </div>
      </div>
    </Draggable>
  );
}

export default Jobsbar;
