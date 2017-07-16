
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

    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    function Snake(scale) {
      this.xspeed = 1;
      this.yspeed = 0;
      this.scale = scale;
      this.body = [new Point(0, 0)];

      this.dir = function(xspeed, yspeed) {
        this.xspeed = xspeed;
        this.yspeed = yspeed;
      }

      this.addTail = function(food) {
        lastBox = this.body[this.body.length - 1];
        var tailX = lastBox.x + -1 * this.xspeed * this.scale;
        var tailY = lastBox.y + -1 * this.yspeed * this.scale;
        // TODO: maybe check for boundary?
        this.body.push(new Point(tailX, tailY))
      }

      this.getHead = function() {
        return this.body[0];
      }

      this.getTail = function() {
        return this.body[this.body.length - 1]
      }
    }

    function randomNumberFromInterval(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function SnakeFood(scale) {
      this.x = -200;
      this.y = -200;
      this.scale = scale;

      this.placeFood = function(player, canvas) {
        var randomX = randomNumberFromInterval(0, ((canvas.width - this.scale) / this.scale)) * this.scale;
        while (randomX == player.getHead().x) {
          randomX = randomNumberFromInterval(0, ((canvas.width - this.scale) / this.scale)) * this.scale;
        }
        var randomY = randomNumberFromInterval(0, ((canvas.height - this.scale) / this.scale)) * this.scale;
        while (randomY == player.getHead().y) {
          randomY = randomNumberFromInterval(0, ((canvas.height - this.scale) / this.scale)) * this.scale;
        }
        this.x = randomX;
        this.y = randomY;
      }
    }

    var scale = 20;

    // The player's state
    var player = new Snake(scale);
    var food = new SnakeFood(scale);
    food.placeFood(player, canvas);
    var boardState = {
      currentFood: food,
    }

    function checkEndCondition(player, boardState) {
      var head = player.body[0];
      if (head.x < 0
          || head.x > canvas.width - player.scale
          || head.y < 0
          || head.y > canvas.height - player.scale) {
        return true
      }

      var i = 1;
      var collision = {};
      for(i; i < player.body.length; i++) {
        var coordStr = player.body[i].x.toString() + ',' + player.body[i].y.toString()
        collision[coordStr] = true;
      }
      var coordStr = player.getHead().x.toString() + ',' + player.getHead().y.toString();
      if (coordStr in collision) {
        return true;
      }


      return false;
    }

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

    // Reset game to original state
    function reset() {
        player = new Snake(scale);
        var food = new SnakeFood(scale)
        food.placeFood(player, canvas);
        boardState.currentFood = food;
    }

    function endGame() {
      reset();
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
    function update(dt, dirOnly = false) {
        // Speed in pixels per second
        var playerSpeed = 5;

        if(GameInput.isDown('DOWN') && player.yspeed !== -1) {
            // dt is the number of seconds passed, so multiplying by
            // the speed gives you the number of pixels to move
            player.dir(0, 1);
        }

        if(GameInput.isDown('UP') && player.yspeed !== 1) {
            player.dir(0, -1);
        }

        if(GameInput.isDown('LEFT') && player.xspeed !== 1) {
            player.dir(-1, 0);
        }

        if(GameInput.isDown('RIGHT') && player.xspeed !== -1) {
            player.dir(1, 0);
        }

        if (dirOnly) {
          return;
        }

        if (checkEndCondition(player, boardState)) {
          endGame();
          return;
        }

        // You can pass any letter to `isDown`, in addition to DOWN,
        // UP, LEFT, RIGHT, and SPACE:
        // if(GameInput.isDown('a')) { ... }

        var i;
        for (i = player.body.length - 1; i > 0; i--) {
          box = player.body[i];
          prevBox = player.body[i-1];
          box.x = prevBox.x;
          box.y = prevBox.y;
        }

        headBox = player.body[0];
        headBox.x += player.scale * player.xspeed;
        headBox.y += player.scale * player.yspeed;
        // if (headBox.x < 0) {
        //   headBox.x = canvas.width - player.scale;
        // } else if (headBox.x > canvas.width - player.scale) {
        //   headBox.x = 0;
        // }

        // if (headBox.y < 0) {
        //   headBox.y = canvas.height - player.scale;
        // } else if (headBox.y > canvas.height - player.scale) {
        //   headBox.y = 0;
        // }

        if (boardState.currentFood.x == player.getHead().x && boardState.currentFood.y == player.getHead().y) {
          player.addTail(boardState.currentFood);
          boardState.currentFood = new SnakeFood(scale);
          boardState.currentFood.placeFood(player, canvas);
        }
    }

    // Draw everything
    function render() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var i;
        for (i = 0; i < player.body.length; i++) {
          ctx.fillStyle = 'green';
          ctx.fillRect(player.body[i].x, player.body[i].y, player.scale, player.scale);
        }

        ctx.fillStyle = 'yellow';
        ctx.fillRect(boardState.currentFood.x, boardState.currentFood.y, boardState.currentFood.scale, boardState.currentFood.scale);
    }

    var frameRatePerSec = 5;
    // The main game loop
    function main() {
        if(!running) {
            return;
        }

        var now = Date.now();
        var dt = (now - then) / 1000.0;
        var dirOnly = true;
        if (dt > (1.0 / frameRatePerSec)) {
          dirOnly = false;
          then = now;
        }
        update(dt, dirOnly);
        if (!dirOnly) {
          render();
        }
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
