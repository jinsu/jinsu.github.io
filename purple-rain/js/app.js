
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
    var initialCanvasWidth = canvas.width = 320;
    var initialCanvasHeight = canvas.height = 480;
    mainContainer.appendChild(canvas);
    GameInput.initTouch(canvas);

    infoContainer.addEventListener('click', function(ev) {
        infoContainer.classList.add('hidden');
    });
    setTimeout(function() {
      infoContainer.classList.add('hidden');
    }, 5000);

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', function() {
        unpause();
    });

    window.addEventListener('blur', function() {
        pause();
    });

    window.addEventListener('resize', resize);

    // Initialize board variables
    var rainDrops = undefined;
    var numRainDrops = 200;
    var radiusStart = 4;
    var dropSpeed = canvas.height / 10;

    //Initially resize the game canvas.
    resize();
    // Let's play this game!
    reset();
    var then = Date.now();
    var running = true;
    main();

    // Components
    function Drop(x, y, z, r) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.radius = r;
    }

    // Functions ---
    function randomNumberFromInterval(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Reset game to original state
    function reset() {
      rainDrops = [];
      var i;
      for (i = 0; i < numRainDrops; i++) {
        var randomX = randomNumberFromInterval(0, canvas.width);
        var randomY = randomNumberFromInterval(0, canvas.height - 5);
        var randomZ = Math.random();
        var drop = new Drop(randomX, randomY, randomZ, radiusStart);
        rainDrops.push(drop);
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
        // Speed in pixels per second
        if(GameInput.isDown('DOWN')) {
            // dt is the number of seconds passed, so multiplying by
            // the speed gives you the number of pixels to move
        }

        if(GameInput.isDown('UP') && player.yspeed !== 1) {
        }

        if(GameInput.isDown('LEFT') && player.xspeed !== 1) {
        }

        if(GameInput.isDown('RIGHT') && player.xspeed !== -1) {
        }

        // You can pass any letter to `isDown`, in addition to DOWN,
        // UP, LEFT, RIGHT, and SPACE:
        // if(GameInput.isDown('a')) { ... }

        var i;
        for (i = 0; i < numRainDrops; i++) {
          var drop = rainDrops[i];
          var yMultiplier = 1 + Math.log(1 + (drop.y / (canvas.height / 8)));
          drop.y += dropSpeed * yMultiplier * dt;
          if (drop.y + drop.radius >= canvas.height) {
            drop.x = randomNumberFromInterval(0, canvas.width);
            drop.y = 0;
            drop.z = Math.random();
          }
        }
        rainDrops.sort(function(a, b) {
          return b.z - a.z;
        });
    }

    // Draw everything
    function render() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var i;
        for (i = 0; i < numRainDrops; i++) {
          var drop = rainDrops[i];

          // draw rain droplet tail
          var lineargradient = ctx.createLinearGradient(drop.x, drop.y - drop.radius * 2,
              drop.x, drop.y);
          lineargradient.addColorStop(0, 'rgba(128,0,128,0)');
          lineargradient.addColorStop(0.2, 'rgba(128,0,128,0.4)');
          lineargradient.addColorStop(1, 'rgba(128,0,128,1)');
          var yMultiplier = Math.log(1 + (drop.y / (canvas.height / 2 )));
          // TODO: how to make this elongate as the rain drops
          var tailStart = drop.y - (10 * drop.radius * yMultiplier);
          ctx.beginPath();
          ctx.moveTo(drop.x, tailStart);
          ctx.lineWidth = 2 * drop.radius * (1 - drop.z);
          ctx.strokeStyle = lineargradient;
          ctx.lineTo(drop.x, drop.y);
          ctx.stroke();

          // draw rain droplet
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius * (1 - drop.z), 0, 2 * Math.PI);
          ctx.fillStyle = 'purple';
          ctx.fill();
        }
    }

    var frameRatePerSec = 5;
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
