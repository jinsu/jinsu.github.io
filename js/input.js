var GameInput = (function() {

  var pressedKeys = {};
  var ongoingTouches = [];
  var canvasEl = document.getElementsByTagName("canvas")[0];;
  var pixelThreshold = 20;

  var debug = false;

  initListeners();
  return {
    isDown: isDown,
    initTouch: initTouch
  };

  function setKey(event, status) {
    var code = event.keyCode;
    var key;

    switch(code) {
      case 32:
        key = 'SPACE'; break;
      case 37:
        key = 'LEFT'; break;
      case 38:
        key = 'UP'; break;
      case 39:
        key = 'RIGHT'; break;
      case 40:
        key = 'DOWN'; break;
      case 72: // h
        key = 'LEFT'; break;
      case 74: // j
        key = 'DOWN'; break;
      case 75: // k
        key = 'UP'; break;
      case 76: // l
        key = 'RIGHT'; break;
      default:
        // Convert ASCII codes to letters
        key = String.fromCharCode(event.keyCode);
    }

    pressedKeys[key] = status;
  }

  function initListeners() {
    document.addEventListener('keydown', function(e) {
      setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
      setKey(e, false);
    });

    window.addEventListener('blur', function() {
      pressedKeys = {};
    });
  }


  function isDown(key) {
    return pressedKeys[key];
  }

  function initTouch(el) {
    canvasEl = el;
    el.addEventListener('touchstart', handleStart, false);
    el.addEventListener('touchend', handleEnd, false);
    el.addEventListener('touchcancel', handleCancel, false);
    el.addEventListener('touchmove', handleMove, false);
  }

  function handleStart(evt) {
    evt.preventDefault();
    log("touchstart.");
    var el = canvasEl;
    var touches = evt.changedTouches;

    for (var i = 0; i < 1; i++) {  // for now, take one finger touch
      log("touchstart:" + i + "...");
      ongoingTouches.push(copyTouch(touches[i]));
      log("touchstart:" + i + ".");
    }
  }

  function handleMove(evt) {
    evt.preventDefault();
    var el = canvasEl;
    var touches = evt.changedTouches;

    for (var i = 0; i < 1; i++) {  // for now, take one finger touch
      var idx = ongoingTouchIndexById(touches[i].identifier);

      if (idx >= 0) {
        log("continuing touch "+idx);
        log("moveFrom(" + ongoingTouches[idx].pageX + ", " + ongoingTouches[idx].pageY + ");");
        log("moveTo(" + touches[i].pageX + ", " + touches[i].pageY + ");");
        var xDiff = ongoingTouches[idx].pageX - touches[i].pageX;
        var yDiff = ongoingTouches[idx].pageY - touches[i].pageY;
        pressedKeys['LEFT'] = false;
        pressedKeys['RIGHT'] = false;
        pressedKeys['UP'] = false;
        pressedKeys['DOWN'] = false;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {  // most siginificant
          log('xDiff: ' + xDiff);
          if (Math.abs(xDiff) < pixelThreshold) {
            continue;
          } else if (xDiff > 0) { // left swipe
            pressedKeys['LEFT'] = true;
          } else { // right swipe
            pressedKeys['RIGHT'] = true;
          }
        } else {
          log('yDiff: ' + yDiff);
          if (Math.abs(yDiff) < pixelThreshold) {
            continue;
          } else if (yDiff > 0) { // up swipe
            pressedKeys['UP'] = true;
          } else { // down swipe
            pressedKeys['DOWN'] = true;
          }
        }
        log('pressedKeys' + ' up ' + pressedKeys['UP'] + ' down ' + pressedKeys['DOWN'] + ' left ' + pressedKeys['LEFT'] + ' right ' + pressedKeys['RIGHT']);

        ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        log(".");
      } else {
        log("can't figure out which touch to continue");
      }
    }
  }

  function handleEnd(evt) {
    evt.preventDefault();
    log("touchend");
    var touches = evt.changedTouches;

    for (var i = 0; i < 1; i++) {  // for now, take one finger touch
      var idx = ongoingTouchIndexById(touches[i].identifier);

      if (idx >= 0) {
        var xDiff = ongoingTouches[idx].pageX - touches[i].pagesX;
        var yDiff = ongoingTouches[idx].pageY - touches[i].pageY;
        log('xDiff ' + xDiff + ' yDiff ' + yDiff);
        ongoingTouches.splice(idx, 1);  // remove it; we're done
        keys = ['UP', 'DOWN', 'LEFT', 'RIGHT']
        for (var i = 0; i < keys.length; i++) {
          if (pressedKeys[keys[i]]) {
            pressedKeys[keys[i]] = false;
          }
        }
        log('pressedKeys' + ' up ' + pressedKeys['UP'] + ' down ' + pressedKeys['DOWN'] + ' left ' + pressedKeys['LEFT'] + ' right ' + pressedKeys['RIGHT']);
      } else {
        log("can't figure out which touch to end");
      }
    }
  }

  function handleCancel(evt) {
    evt.preventDefault();
    log("touchcancel.");
    var touches = evt.changedTouches;

    for (var i = 0; i < 1; i++) {  // for now, take one finger touch
      var idx = ongoingTouchIndexById(touches[i].identifier);
      ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }

  function colorForTouch(touch) {
    var r = touch.identifier % 16;
    var g = Math.floor(touch.identifier / 3) % 16;
    var b = Math.floor(touch.identifier / 7) % 16;
    r = r.toString(16); // make it a hex digit
    g = g.toString(16); // make it a hex digit
    b = b.toString(16); // make it a hex digit
    var color = "#" + r + g + b;
    log("color for touch with identifier " + touch.identifier + " = " + color);
    return color;
  }

  function copyTouch(touch) {
    return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
  }

  function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
      var id = ongoingTouches[i].identifier;

      if (id == idToFind) {
        return i;
      }
    }
    return -1;    // not found
  }

  function log(msg) {
    if (debug) {
      console.log(msg);
    }
  }
})();
