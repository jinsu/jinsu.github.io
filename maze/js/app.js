
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

    infoContainer.addEventListener('click', function(ev) {
        infoContainer.classList.add('hidden');
    });

    function Cell() {
      this.top = true;
      this.bottom = true;
      this.left = true;
      this.right = true;
    }

    // The maze's state
    var config = {
      rows: 30,
      cols: 30,
      cellSize: 10
    };

    var maze = {
      generated: false,
      cells: [],
      start: [0, 0]
    };

    var player = {
        x: 0,
        y: 0,
        sizeX: config.cellSize / 2,
        sizeY: config.cellSize / 2
    };

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', function() {
        unpause();
    });

    window.addEventListener('blur', function() {
        pause();
    });

    window.addEventListener('resize', resize);

    //Initially resize the game canvas.
    resize();
    // Let's play this game!
    reset();
    var then = Date.now();
    var running = true;
    main();


    // Functions ---
    function randomNumberFromInterval(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function stepGenerate() {
      var cells = maze.cells;
    }

    // Reset game to original state
    function reset() {
        var i, j;
        // generate random start position

        maze = {
          generated: false,
          cells: [],
          start: [randomNumberFromInterval(0, config.rows - 1), randomNumberFromInterval(0, config.cols - 1)]
        };
        for(i = 0; i < config.rows; i++) {
          col = [];
          for(j = 0; j < config.cols; j++) {
            col.push(new Cell());
          }
          maze.cells.push(col);
        }
        player.x = maze.start[0];
        player.y = maze.start[1];
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
        if (!maze.generated) {
          stepGenerate()
        }
        // Speed in pixels per second
        var playerSpeed = 10;

        if(GameInput.isDown('DOWN')) {
            // dt is the number of seconds passed, so multiplying by
            // the speed gives you the number of pixels to move
            player.y += playerSpeed * dt;
        }

        if(GameInput.isDown('UP')) {
            player.y -= playerSpeed * dt;
        }

        if(GameInput.isDown('LEFT')) {
            player.x -= playerSpeed * dt;
        }

        if(GameInput.isDown('RIGHT')) {
            player.x += playerSpeed * dt;
        }

        // You can pass any letter to `isDown`, in addition to DOWN,
        // UP, LEFT, RIGHT, and SPACE:
        // if(GameInput.isDown('a')) { ... }
    }

    // Draw everything
    function render() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var i, j;
        for(i = 0; i < config.rows; i++) {
          for(j = 0; j < config.cols; j++) {
            cell = maze.cells[i][j];
            ctx.beginPath();
            ctx.strokeStyle = "white";
            var topLeft = [i * config.cellSize, j * config.cellSize];
            var topRight = [i * config.cellSize + config.cellSize, j * config.cellSize];
            var bottomRight = [i * config.cellSize + config.cellSize, j * config.cellSize + config.cellSize];
            var bottomLeft = [i * config.cellSize, j * config.cellSize + config.cellSize];
            ctx.moveTo(topLeft[0], topLeft[1]);
            cell.top ? ctx.lineTo(topRight[0], topRight[1]) : ctx.moveTo(topRight[0], topRight[1]);
            cell.right ? ctx.lineTo(bottomRight[0], bottomRight[1]) : ctx.moveTo(bottomRight[0], bottomRight[1]);
            cell.bottom ? ctx.lineTo(bottomLeft[0], bottomLeft[1]) : ctx.moveTo(bottomLeft[0], bottomLeft[1]);
            cell.left ? ctx.lineTo(topLeft[0], topLeft[1]) : ctx.moveTo(topLeft[0], topLeft[1]);
            ctx.stroke();
          }
        }

        ctx.fillStyle = 'green';
        ctx.fillRect(config.cellSize * (player.x + 0.25), config.cellSize * (player.y + 0.25), player.sizeX, player.sizeY);
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
