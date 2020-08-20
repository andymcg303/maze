const { Engine, 
        Render, 
        Runner, 
        World, 
        Bodies,
        Body,
        Events
     } 
    = Matter;

const cells = 3;    
const width = 600;
const height = 600;
const wallSize = 10;
const innerWallSize = 5;


const unitLength = width / cells;

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
    Bodies.rectangle(width/2, 0, width, wallSize, { isStatic: true }),
    Bodies.rectangle(width/2, height, width, wallSize, { isStatic: true }),
    Bodies.rectangle(0, height/2, wallSize, height, { isStatic: true }),
    Bodies.rectangle(width, height/2, wallSize, height, { isStatic: true }), 
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

const grid = Array(cells)
    .fill(null)
    .map(() => Array(cells).fill(false));

const verticals = Array(cells)
    .fill(null)
    .map(() => Array(cells-1).fill(false));    

const horizontals = Array(cells-1)
    .fill(null)
    .map(() => Array(cells).fill(false));    

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

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
        if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells){
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
        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength / 2,
            rowIndex * unitLength + unitLength,
            unitLength,
            innerWallSize,
            {
                isStatic: true
            }
        );
        World.add(world, wall);
    })
});

//Draw vertical inner walls
verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength,
            rowIndex * unitLength + unitLength / 2,
            innerWallSize,
            unitLength,
            {
                isStatic: true
            }
        );
        World.add(world, wall);
    })
});

// Draw Goal
const goal = Bodies.rectangle(
    width - unitLength / 2,
    height - unitLength / 2,
    unitLength * .6,
    unitLength * .6,
    {
        isStatic: true,
        label: 'goal'
    } 
);

World.add(world, goal);

// Draw Ball
const ball = Bodies.circle(
    unitLength / 2,
    unitLength / 2,
    unitLength / 4,
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
            console.log('Yes, Ya Dancer!');
        }
    })
});