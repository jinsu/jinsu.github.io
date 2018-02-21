
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

    function Cell(x, y) {
      this.top = true;
      this.bottom = true;
      this.left = true;
      this.right = true;
      this.backtrack = null;
      this.prev = null;

      this.x = x;
      this.y = y;
      this.crd = [x, y];
      this.crdKey = posString(x, y);

      this.getCrd = function() {
        return this.crd;
      }

      this.getCrdKey = function() {
        return this.crdKey;
      }

      this.connectedCells = function(mz) {
        var cells = [];
        if (!this.bottom) {
          cells.push(mz.cells[this.x][this.y + 1]);
        }
        if (!this.top) {
          cells.push(mz.cells[this.x][this.y - 1]);
        }
        if (!this.left) {
          cells.push(mz.cells[this.x - 1][this.y]);
        }
        if (!this.right) {
          cells.push(mz.cells[this.x + 1][this.y]);
        }
        return cells;
      }
    }

    // The maze's state
    var config = {
      rows: 9,
      cols: 9,
      cellSize: 10
    };

    var maze = {
      generated: false,
      cells: [],
      start: [1, 1],
      end: [1, 1],
      adjacentEdges: [],
      visitedNodes: {},
    };

    var player = {
        x: 1,
        y: 1,
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

    function posString(i, j) {
      return i + "," + j;
    }

    function strToPos(posStr) {
      return posStr.split(',').map(function(e) { return parseInt(e); });
    }

    function findStartEnd() {
      var i, j;
      var deadEnds = [];
      for(i = 1; i < config.rows; i += 2) {
        for(j = 1; j < config.cols; j += 2) {
          var cell = maze.cells[i][j];
          var wallCount = 0;
          if (!cell.left) {
            wallCount++;
          }
          if (!cell.right) {
            wallCount++;
          }
          if (!cell.top) {
            wallCount++;
          }
          if (!cell.bottom) {
            wallCount++;
          }
          if (wallCount === 1) {
            var n = [cell, []]
            deadEnds.push(n);
          }
        }
      }

      var visited = {};
      while(deadEnds.length > 1) {
        // TODO: account for an unidentified maze bug...
        var nodePair = deadEnds.shift();
        var node = nodePair[0];
        var path = nodePair[1];
        var connected = node.connectedCells(maze);;
        var unvisited = connected.filter(function(e) {
          return !(e.getCrdKey() in visited);
        });

        visited[node.getCrdKey()] = true;
        path.push(node);
        if (unvisited.length > 1 && deadEnds.length + 1 > 2) {
          continue;
        }

        if (deadEnds.length + 1 === 2 && unvisited.length === 0) {
          otherPath = deadEnds[0][1];
          for (var i = otherPath.length - 1; i >= 0; i--) {
            path.push(otherPath[i]);
          }
          return path;
        }
        deadEnds.push([unvisited[0], path]);
      }
    }

    function removeWall(fromCell, toCell) {
      if (fromCell[0] + 2 == toCell[0] && fromCell[1] == toCell[1]) {
        // right
        var wall = maze.cells[fromCell[0] + 1][fromCell[1]];
        wall.left = false;
        wall.right = false;
        maze.cells[fromCell[0]][fromCell[1]].right = false;
        maze.cells[toCell[0]][toCell[1]].left = false;
      } else if (fromCell[0] - 2 == toCell[0] && fromCell[1] == toCell[1]) {
        // left
        var wall = maze.cells[fromCell[0] - 1][fromCell[1]];
        wall.left = false;
        wall.right = false;
        maze.cells[fromCell[0]][fromCell[1]].left = false;
        maze.cells[toCell[0]][toCell[1]].right = false;
      } else if (fromCell[0] == toCell[0] && fromCell[1] + 2 == toCell[1]) {
        // bottom
        var wall = maze.cells[fromCell[0]][fromCell[1] + 1];
        wall.top = false;
        wall.bottom = false;
        maze.cells[fromCell[0]][fromCell[1]].bottom = false;
        maze.cells[toCell[0]][toCell[1]].top = false;
      } else if (fromCell[0] == toCell[0] && fromCell[1] - 2 == toCell[1]) {
        // top
        var wall = maze.cells[fromCell[0]][fromCell[1] - 1];
        wall.top = false;
        wall.bottom = false;
        maze.cells[fromCell[0]][fromCell[1]].top = false;
        maze.cells[toCell[0]][toCell[1]].bottom = false;
      } else {
        console.log('Error: ', fromCell, toCell, 'are not next to each other');
      }
    }

    function stepGenerate() {
      var cells = maze.cells;
      var curr = maze.generation.current;
      var neighbors = maze.adjacentEdges[curr[0]][curr[1]];
      // get current neighbor
      var unvisitedNodes = neighbors.filter(function(e) {
        return !(e in maze.visitedNodes);
      });
      var len = unvisitedNodes.length
      if (len < 1) {
        // backtrack until back to beginning
        if (curr[0] == maze.start[0] && curr[1] == maze.start[1]
            && maze.generation.totalCells === Object.keys(maze.visitedNodes).length) {
          console.log('END:', maze);
          maze.generated = true;
          var node = cells[curr[0]][curr[1]];
          maze.solution = [curr];
          while(node.prev !== null) {
            maze.solution.push(node.prev);
            node = cells[node.prev[0]][node.prev[1]];
          }
          // mark start and end
          var path = findStartEnd();
          maze.start = path[0].getCrd();;
          maze.end = path[path.length - 1].getCrd();
          player.x = maze.start[0];
          player.y = maze.start[1];
          return
        }
        maze.generation.current = cells[curr[0]][curr[1]].backtrack;
        cells[maze.generation.current[0]][maze.generation.current[1]].prev = curr;
      } else {
        // pick random current neighbor not visited
        var nextIx = len > 1 ? randomNumberFromInterval(0, len - 1) : 0;
        var next = strToPos(unvisitedNodes[nextIx]);
        // breakdown wall between curr and random neighbor
        removeWall(curr, next);
        // node as visited
        if (cells[next[0]][next[1]].backtrack === null) {
          cells[next[0]][next[1]].backtrack = curr;
        }
        maze.visitedNodes[unvisitedNodes[nextIx]] = true;
        maze.generation.current = next;
      }
      maze.history.push(maze.generation.current);
    }

    // Reset game to original state
    function reset() {
        var i, j;
        // generate random start position
        var r = randomNumberFromInterval(0, config.rows - 1);
        if (r % 2 == 0) {
          var diff = (r == config.rows - 1) ? -1 : 1;
          r += diff;
        }
        var c = randomNumberFromInterval(0, config.cols - 1);
        if (c % 2 == 0) {
          var diff = (c == config.cols - 1) ? -1 : 1;
          c += diff;
        }
        var start = [r, c];
        var startPosStr = posString(r, c);
        maze = {
          generated: false,
          cells: [],
          start: start,
          end: start,
          adjacentEdges: [],
          visitedNodes: {},
          generation: {
            current: start,
            totalCells: (config.rows - 1) * (config.cols - 1) / 4,
          },
          history: [],
        };
        maze.visitedNodes[startPosStr] = true;

        var debug = true;
        if (debug) {
          window.maze = maze;
          window.config = config;
          window.player = player;
        }

        for(i = 0; i < config.rows; i++) {
          col = [];
          adjacentCol = [];
          var rowEven = i % 2 == 0;
          for(j = 0; j < config.cols; j++) {
            var colEven = j % 2 == 0;
            col.push(new Cell(i, j));

            var adjacents = [];
            adjacentCol.push(adjacents);

            if (rowEven || colEven) {
              continue;
            }

            if (i > 1) {
              adjacents.push(posString(i - 2, j));
            }
            if (i + 2 < config.rows) {
              adjacents.push(posString(i + 2, j));
            }
            if (j > 1) {
              adjacents.push(posString(i, j - 2));
            }
            if (j + 2 < config.cols) {
              adjacents.push(posString(i, j + 2));
            }
          }
          maze.cells.push(col);
          maze.adjacentEdges.push(adjacentCol);
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
          stepGenerate();
          return
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

            if (!maze.generated) {
              if (maze.generation.current[0] == i && maze.generation.current[1] == j) {
                ctx.fillStyle = 'orange';
                ctx.fillRect(config.cellSize * (i + 0.25), config.cellSize * (j + 0.25), player.sizeX, player.sizeY);
              }
            }
          }
        }

        ctx.fillStyle = 'orange';
        var ends = [maze.start, maze.end];
        var i = 0;
        for (i; i < ends.length; i++) {
          var end = maze.cells[ends[i][0]][ends[i][1]];
          if (!end.top) {
            ctx.fillRect(config.cellSize * (end.x + 0.2), config.cellSize * (end.y + 0.8), 0.6 * config.cellSize, 0.2 * config.cellSize);
          } else if (!end.bottom) {
            ctx.fillRect(config.cellSize * (end.x + 0.2), config.cellSize * (end.y + 0.1), 0.6 * config.cellSize, 0.2 * config.cellSize);
          } else if (!end.left) {
            ctx.fillRect(config.cellSize * (end.x + 0.8), config.cellSize * (end.y + 0.2), 0.2 * config.cellSize, 0.6 * config.cellSize);
          } else if (!end.right) {
            ctx.fillRect(config.cellSize * (end.x + 0.1), config.cellSize * (end.y + 0.2), 0.2 * config.cellSize, 0.6 * config.cellSize);
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
