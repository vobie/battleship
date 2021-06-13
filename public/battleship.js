//TODO linting
import {setLogListener, newGame, gameStep, opponentOf} from './game-logic.js'
import {GAMESTATE, INPUT, PLAYER, INITIAL_STATE} from './game-constants.js'
import {stateClone} from './util.js'
 

/*
	Drawing constants
*/
const [boardWidth, boardHeight] = [200, 200]
const bombRadius = 0.25 //As a fraction of one square


/*
	Setup Element
	* Select the board elements used for drawing
	* Give the board shape, + 1 to include the final gridline
*/
const boardPlayer = d3.select('#battleship-board')
const boardAI = d3.select('#battleship-board-opponent')
boardPlayer .attr('width', boardWidth + 1).attr('height', boardHeight + 1)
boardAI		.attr('width', boardWidth + 1).attr('height', boardHeight + 1)

/*
	Setup of visual element 

	* Create D3 Scales. Simplifies mapping from logical position to actual position
	* Create D3 Axis functions (visual, not logical)
	* Draw the grids
	* Set up container groups for ships and bombs on both boards
*/
const x = d3.scaleLinear().domain([1,11]).range([0, boardHeight])
const y = d3.scaleLinear().domain([1,11]).range([0, boardWidth])
const xAxis = d3.axisBottom().scale(x).tickSize(boardHeight)
const yAxis = d3.axisLeft().scale(y).tickSize(-boardWidth)
boardPlayer .append('g').call(xAxis)
boardPlayer .append('g').call(yAxis)
boardAI		.append('g').call(xAxis)
boardAI		.append('g').call(yAxis)
boardPlayer.append('g').classed('ships', true)
boardPlayer.append('g').classed('bombs', true)
boardAI.append('g').classed('ships', true)
boardAI.append('g').classed('bombs', true)
/*
	Ship and bomb size calculation helpers

	* Use the scale function to calculate the width and height of the ship
	* If these scales were to be changed to something more exotic, this would still (approximately) work. In the simple case, this is calculating "how wide is a square * how large is the ship"
	* If it's horizontally oriented, the width is always 1, if it's vertically oriented, the height is always 1
	* It's less cluttery to stuff this calculation into functions and more robust to use the general case instead of having to change lots later if scales were to change
*/
function xShipSize(ship) {return !ship.horizontal ? x(ship.x + ship.size) - x(ship.x) : x(ship.x + 1) - x(ship.x)} 
function yShipSize(ship) {return ship.horizontal ? y(ship.y + ship.size) - y(ship.y) : y(ship.y + 1) - y(ship.y)}
function bombSize(bomb) {return x(bomb.x + bombRadius) - x(bomb.x)}

function wipeBoard(svg) {
	svg.selectAll('.ships *').remove()
	svg.selectAll('.bombs *').remove()
}

function drawBoard(svg, player, _state, debug) {
	const state = stateClone(_state)
	const {ships, unplacedShips} = stateClone(state.boards[player])
	const bombs = state.boards[opponentOf(player)].bombs
	const unplacedBomb = state.boards[opponentOf(player)].unplacedBomb

	//if player that is being drawn also has the turn, draw the hot ship
	//if there is a hot ship
	let shipsToDraw = [...ships]
	if(player === state.turn && unplacedShips.length > 0){
		shipsToDraw = [...shipsToDraw, _.assign(unplacedShips[0], {placing:true})]
	}

	//if player that is being drawn also has the turn
	//get the bombs from the OPPOSITE player, draw them
	//do not draw the hot bomb on this player's board (it belongs to the player that does not have the turn)
	let bombsToDraw = [...bombs]
	if(player !== state.turn && state.gameState === GAMESTATE.PLACING_BOMBS) {
		bombsToDraw = [...bombsToDraw, _.assign(unplacedBomb, {placing: true})]
	}	

	const shipGroup = svg.select('.ships')
	const bombGroup = svg.select('.bombs')
	const shipsRects = shipGroup.selectAll('.ship').data(shipsToDraw, ship => ship.id)
	const bombCircles = bombGroup.selectAll('.bomb').data(bombsToDraw)

	shipsRects
		.enter()
		.append('rect')
		.merge(shipsRects)
		.attr('class', '') //wipe classlist each time so no old state classes remain
		.classed('ship', true)
		.classed('placing-active', ship => ship.placing)
		.classed('placing-overlapping', ship => ship.overlapping)
		.classed('sunken', ship => ship.sunken)
		.classed('hidden', ship => player === PLAYER.AI && !debug && !ship.sunken ? true : false) //only show opponent ships if debugging, or it's sunken
		.attr('x', ship => x(ship.x))
		.attr('y', ship => y(ship.y))
		.attr('height', xShipSize)
		.attr('width', yShipSize)
	bombCircles
		.enter()
		.append('circle')
		.merge(bombCircles)
		.attr('class', '') //wipe classlist each time so no old state classes remain
		.classed('bomb', true)
		.classed('placing-active', bomb => bomb.placing)
		.classed('placing-overlapping', bomb => bomb.overlapping)
		.classed('hit', bomb => bomb.hit)
		.attr('cx', bomb => x(bomb.x+0.5))
		.attr('cy', bomb => y(bomb.y+0.5))
		.attr('r', bombSize)
		
}

const DEBUG = false
let stateInstance = newGame()

let onInput = restart
let gameScore = {
	[PLAYER.HUMAN]: 0,
	[PLAYER.AI]: 0
}

//Set up the in-dom log
function log(msg) { d3.select('#game-log').text(msg) }
setLogListener(log)

//Simple game tracking functions. Almost all logic is contained within the game-logic file
function restart() {
	wipeBoard(boardPlayer)
	wipeBoard(boardAI)
	stateInstance = newGame()
	onInput = (action) => advanceGame(action)
	draw(stateInstance)
}
function draw(state){
	drawBoard(boardPlayer, PLAYER.HUMAN, stateInstance, DEBUG)
	drawBoard(boardAI, PLAYER.AI, stateInstance, DEBUG)
}
/*
	Call the state update function and draw the results
*/
function advanceGame(action){
	stateInstance = gameStep(stateInstance, stateInstance.turn, action)
	draw(stateInstance)
	if(stateInstance.winner){
		gameScore[stateInstance.winner]++
		log(`Game ended. Score is ${gameScore[PLAYER.HUMAN]}-${gameScore[PLAYER.AI]}`)

		onInput = restart
	}else if(stateInstance.turn === PLAYER.AI) {
		doAIrandomAction()
	}
}

//Possibly the worst AI ever. It tried actions until something sticks. Not really a problem due to the small board and limited range of actions.
const aiRandomActions = [INPUT.LEFT, INPUT.RIGHT, INPUT.DOWN, INPUT.UP, INPUT.ROTATE, INPUT.CONFIRM]
let aiInterval
function doAIrandomAction(){
	const randAction = aiRandomActions[Math.floor(Math.random()*6)]
	advanceGame(randAction)
	if(stateInstance.turn === PLAYER.HUMAN)
		clearInterval(aiInterval)
}

//Unsure what's going on here, but simply feeding it another function causes odd errors
//D3 doing some weird overloading with events?
d3.select("body").on("keydown", e => { 
	if(INPUT.keyCodeMapping[e.key]){
		onInput(INPUT.keyCodeMapping[e.key])
	}
})


