'use strict';

(function() {

	var socket = io();
	var canvas = document.getElementsByClassName('whiteboard')[0];
	var colors = document.getElementsByClassName('color');
//	var allclear = document.getElementById('allclear');
	
	var context = canvas.getContext('2d');

  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  
 
	var supportTouch = 'ontouchend' in document;  // タッチイベントが利用可能かの判別
	var dbMsg = "supportTouch="+supportTouch;
	// イベント名
	var EVENTNAME_TOUCHSTART = supportTouch ? 'touchstart' : 'mousedown';
	var EVENTNAME_TOUCHMOVE = supportTouch ? 'touchmove' : 'mousemove';
	var EVENTNAME_TOUCHEND = supportTouch ? 'touchend' : 'mouseup';
	var handleStart = function(event) {
	  updateEventname(EVENTNAME_TOUCHSTART);
	  updateXY(event);
	  $hitarea.css('background-color', 'red');
	  bindMoveAndEnd();
	};
	var handleMove = function(event) {
	  event.preventDefault(); // タッチによる画面スクロールを止める
	  updateEventname(EVENTNAME_TOUCHMOVE);
	  updateXY(event);
	};
	var handleEnd = function(event) {
	  updateEventname(EVENTNAME_TOUCHEND);
	  updateXY(event);
	  $hitarea.css('background-color', 'blue');
	  unbindMoveAndEnd();
	};
	var bindMoveAndEnd = function() {
	  $document.on(EVENTNAME_TOUCHMOVE, handleMove);
	  $document.on(EVENTNAME_TOUCHEND, handleEnd);
	};
	var unbindMoveAndEnd = function() {
	  $document.off(EVENTNAME_TOUCHMOVE, handleMove);
	  $document.off(EVENTNAME_TOUCHEND, handleEnd);
	};
	 
//	canvas.on(EVENTNAME_TOUCHSTART, handleStart);	//	https://app.codegrid.net/entry/touch-mouse#toc-2
  
  canvas.addEventListener('touchstart', onMouseDown, false);
  canvas.addEventListener('touchend', onMouseUp, false);
  canvas.addEventListener('touchcancel', onMouseUp, false);
   canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);						//org;描画
  socket.on('allclear', function (data) {
	console.log("recive:all clear");
	allClear();
//	  socket.disconnect();	 								 // 通信を切断し、
//	  process.exit(0);										// プロセスを終了する
	});

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

	function onMouseDown(e){
		drawing = true;
		current.x = e.clientX;
		current.y = e.clientY;
	}

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
//    var original = event.originalEvent;
//	if(original.changedTouches) {
//		current.x = original.changedTouches[0].pageX;
//		current.y = original.changedTouches[0].pageY;
//	} else {
//		current.x = e.clientX;
//		current.y = e.clientY;
//	}
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
	function allClear() {
		context.clearRect(0, 0,canvas.width,canvas.height);
	}
	

	document.getElementById("allclear").onclick = function() {
		allClear();
		socket.emit('allclear',{});
	};

})();