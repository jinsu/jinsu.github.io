
window.onload = function() {

    // A cross-browser requestAnimationFrame
    // See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
    var requestAnimFrame = (function() {
        return window.requestAnimationFrame    ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback){
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    // Install logic
    // If the app has already been installed, we don't do anything.
    // Otherwise we'll show the button, and hide it when/if the user installs the app.
    var installButton = document.getElementById('install');
    var manifestPath = AppInstall.guessManifestPath();

    if(AppInstall.isInstallable()) {

      // checking for app installed is an asynchronous process
      AppInstall.isInstalled(manifestPath, function isInstalledCb(err, result) {

        if(!err && !result) {

          // No errors, and the app is not installed, so we can show the install button,
          // and set up the click handler as well.
          installButton.classList.remove('hidden');

          installButton.addEventListener('click', function() {

            AppInstall.install(manifestPath, function(err) {
              if(!err) {
                installButton.classList.add('hidden');
              } else {
                alert('The app cannot be installed: ' + err);
              }
            });

          }, false);

        }

      });

    }


    // Create the canvas
    var mainContainer = document.querySelector('main');
    var canvas = document.createElement("canvas");
    var infoContainer = document.querySelector('div.info');
    var ctx = canvas.getContext("2d");
    var initialCanvasWidth = canvas.width = 400;
    var initialCanvasHeight = canvas.height = 400;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    mainContainer.appendChild(canvas);

    infoContainer.addEventListener('click', function(ev) {
        infoContainer.classList.add('hidden');
    });

    var constants = {
      root2: Math.sqrt(2),
      minColorInt: 128, // navy color #000080 in decimal!
      maxColorInt: 16777215 // white color #FFFFFF in decimal!
    };

    // The player's state
    var camera = {
        x: 0,
        y: 0,
        sizeX: 30,
        sizeY: 30
    };

    var env = {
      stars: [],
      numStars: 400,
      starSize: 1,
      xMax: 0.5 * canvas.width,
      yMax: 0.5 * canvas.height,
      colorBand: ['white', 'lightpink', 'lightsalmon', 'crimson', 'coral', 'goldenrod', 'lightgreen', 'lightblue', 'darkgray'],
      starColor: 0
    };


    function Star(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.dz = 0;
    }

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', function() {
        unpause();
    });

    window.addEventListener('blur', function() {
        pause();
    });

    window.addEventListener('resize', resize);

    canvas.addEventListener('mousemove', function(event) {
      var mPos = getMousePos(canvas, event);
      camera.x = mPos.x;
      camera.y = mPos.y;
    }, false);

    document.addEventListener('keydown', function(e) {
      if (e.keyCode == 40) {
        env.starColor += 1;
        env.starColor = env.starColor % env.colorBand.length;
      } else if (e.keyCode = 38) {
        env.starColor -= 1; 
        if (env.starColor < 0) {
          env.starColor += env.colorBand.length;
        }
      }
    });

    //Initially resize the game canvas.
    resize();
    // Let's play this game!
    reset();
    var then = Date.now();
    var running = true;
    main();


    // Functions ---
    function getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    function getRandomArbitrary(min, max) {
      return Math.random() * (max - min) + min;
    }

    function getRandomPos(env) {
      // env.xMax, env.yMax
      return {
        x: (2 * Math.random() - 1) * env.xMax,
        y: (2 * Math.random() - 1) * env.yMax,
        z: 0
      };
    }

    function decToHex(decimal) {
      return decimal.toString(16);
    }

    function hexToDec(hex) {
      return parseInt(hex, 16);
    }


    // Reset game to original state
    function reset() {
        camera.x = 0;
        camera.y = 0;
        for(var i = 0; i < env.numStars; i++) {
          var pos = getRandomPos(env);
          env.stars.push(new Star(pos.x, pos.y, pos.z));
        }
    }

    // Pause and unpause
    function pause() {
        running = false;
    }

    function unpause() {
        running = true;
        then = Date.now();
        main();
    }

    // Update game objects.
    // We'll use GameInput to detect which keys are down.
    // If you look at the bottom of index.html, we load GameInput
    // from js/input.js right before app.js
    function update(dt) {
        // Speed in % of screen pixel per second
        var maxSpeed = 300;
        var scale = maxSpeed / 100 / canvas.width;
        var starSpeedPct = camera.x * scale;

        if(GameInput.isDown('DOWN')) {
            // dt is the number of seconds passed, so multiplying by
            // the speed gives you the number of pixels to move
        }

        if(GameInput.isDown('UP')) {
        }

        if(GameInput.isDown('LEFT')) {
        }

        if(GameInput.isDown('RIGHT')) {
        }

        var xMax, yMax;
        xMax = yMax = canvas.width * 0.5;
        var dz = starSpeedPct * dt;
        var dy, dx;
        dy = dx = dz / constants.root2 + 1;
        for(var i = 0; i < env.numStars; i++) {
          var star = env.stars[i];
          if (Math.abs(star.x) > xMax || Math.abs(star.y) > yMax) {
            var pos = getRandomPos(env);
            star.x = pos.x;
            star.y = pos.y;
            star.z = pos.z;
          }
          star.x *= dx;
          star.y *= dy;
          star.z += dz;
          star.dx = dx;
          star.dy = dy;
          star.dz = dz;
        }

        // You can pass any letter to `isDown`, in addition to DOWN,
        // UP, LEFT, RIGHT, and SPACE:
        // if(GameInput.isDown('a')) { ... }
    }

    // Draw everything
    function render() {
        var backgroundColor = 'black';
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(-0.5 * canvas.width, -0.5 * canvas.height, canvas.width, canvas.height);
        
        var starColorHex = env.colorBand[env.starColor];
        for(var i = 0; i < env.numStars; i++) {
          var star = env.stars[i];

          if (star.z * env.starSize > 1) {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineWidth = star.z * env.starSize * 2;
            ctx.lineTo(star.x / star.dx, star.y / star.dy);
            var grad = ctx.createLinearGradient(star.x, star.y, star.x / star.dx, star.y / star.dy);
            grad.addColorStop(0, starColorHex);
            grad.addColorStop(1, backgroundColor);
            ctx.strokeStyle = grad;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.z * env.starSize, 0, 2 * Math.PI, false);
          ctx.fillStyle = starColorHex;
          ctx.fill();
        }
    }

    // The main game loop
    function main() {
        if(!running) {
            return;
        }

        var now = Date.now();
        var dt = (now - then) / 1000.0;

        update(dt);
        render();

        then = now;
        requestAnimFrame(main);
    }

    // based on: https://hacks.mozilla.org/2013/05/optimizing-your-javascript-game-for-firefox-os/
    function resize() {
        var browser = [
            window.innerWidth,
            window.innerHeight
        ];
        // Minimum scale
        var scale = Math.min(
            browser[0] / initialCanvasWidth,
            browser[1] / initialCanvasHeight);
        // Scaled content size
        var size = [
            initialCanvasWidth * scale,
            initialCanvasHeight * scale
        ];
        // Offset from top/left
        var offset = [
            (browser[0] - size[0]) / 2,
            (browser[1] - size[1]) / 2
        ];

        // Apply CSS transform
        var rule = "translate(" + offset[0] + "px, " + offset[1] + "px) scale(" + scale + ")";
        mainContainer.style.transform = rule;
        mainContainer.style.webkitTransform = rule;
    }

};
