const { Engine, 
        Render, 
        Runner, 
        World, 
        Bodies,
        Body,
        Events
     } 
    = Matter;

const cellsHorizontal = 10;
const cellsVertical = 5;   
const width = window.innerWidth;
const height = window.innerHeight;
const wallSize = 10;
const innerWallSize = 5;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
    Bodies.rectangle(width/2, 0, width, wallSize, { isStatic: true, render: {fillStyle: 'red'} }),
    Bodies.rectangle(width/2, height, width, wallSize, { isStatic: true, render: {fillStyle: 'red'} }),
    Bodies.rectangle(0, height/2, wallSize, height, { isStatic: true, render: {fillStyle: 'red'} }),
    Bodies.rectangle(width, height/2, wallSize, height, { isStatic: true, render: {fillStyle: 'red'} }), 
]

World.add(world, walls);

//Maze generation
const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};

const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));    

const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));    

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // If I have visited the cell at [row, column] then return
    if (grid[row][column]) {
        return;
    }

    // Mark this cell as being visited
    grid[row][column] = true;

    // Assemble randomly ordered list of neighbours
    const neighbours = shuffle([
        [row -1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]); 

    // For each neighbour...
    for (let neighbour of neighbours){
        const [nextRow, nextColumn, direction] = neighbour;
        // Check if the neighbour is out of bounds
        if (
            nextRow < 0 || 
            nextRow >= cellsVertical || 
            nextColumn < 0 || 
            nextColumn >= cellsHorizontal
        ){
            continue;
        } 
        // If we have visited that neighbour, continue to next neighbour
        if (grid[nextRow][nextColumn]){
            continue;
        }
        // Remove appropriate wall
        if (direction === 'left'){
            verticals[row][column -1] = true;
        } else if (direction === 'right'){
            verticals[row][column] = true;
        } else if (direction === 'up'){
            horizontals[row -1][column] = true;
        } else {
            horizontals[row][column] = true;
        }

        // Visit the next cell
        stepThroughCell(nextRow, nextColumn);
    }
}

stepThroughCell(startRow, startColumn);

// Draw horizontal inner walls
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const innerWall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            innerWallSize,
            {
                isStatic: true,
                label: 'innerWall',
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, innerWall);
    })
});

//Draw vertical inner walls
verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const innerWall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            innerWallSize,
            unitLengthY,
            {
                isStatic: true,
                label: 'innerWall',
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, innerWall);
    })
});

// Draw Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .6,
    unitLengthY * .6,
    {
        isStatic: true,
        label: 'goal',
        render: {
            fillStyle: 'green'
        }
    } 
);

World.add(world, goal);

// Draw Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: 'ball'
    }
);

World.add(world, ball);

// Control ball with keyboard
document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;

    if (event.keyCode === 38){
        Body.setVelocity(ball, { x, y: y -5 });
    } else if (event.keyCode === 39){
        Body.setVelocity(ball, { x: x +5, y });
    } else if (event.keyCode === 40){
        Body.setVelocity(ball, { x, y: y +5 });
    } else if (event.keyCode === 37){
        Body.setVelocity(ball, { x: x -5, y });
    }
});

// Win condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];
        if (
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label) 
        ){
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'innerWall'){
                    Body.setStatic(body, false);
                }
            })
        }
    })
});