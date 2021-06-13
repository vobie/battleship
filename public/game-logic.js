import {GAMESTATE, INPUT, PLAYER, INITIAL_STATE} from './game-constants.js'
import {stateClone, min, max} from './util.js'
import _ from './underscore.js'

export default {}

//do the initial hot item accounting
export function newGame(){ return stateClone(INITIAL_STATE) }
export function opponentOf(player) { return player === PLAYER.HUMAN ? PLAYER.AI : PLAYER.HUMAN }
export function gameStep(_state, player, action) {
	let state = stateClone(_state)

	//if(state.turn !== player)
	//	throw new Error('Called step function with the wrong player')

	switch(state.gameState) {
		case GAMESTATE.PLACING_SHIPS:
			state = handleInputPlacing(state, player, action)
		break;
		case GAMESTATE.PLACING_BOMBS:
			state = handleInputBombing(state, player, action)
		break;
		case GAMESTATE.IDLE:
			throw new Error('Game is not active')
		default:
			throw new Error('Unknown gamestate')
	}
	
	//Done placing ships, update the state to indicate we are now in the bombing phase
	if(state.boards[PLAYER.HUMAN].ships.length === 4 && state.boards[PLAYER.AI].ships.length === 4){
		state.gameState = GAMESTATE.PLACING_BOMBS
	}

	console.log('all sunk?', state.boards[PLAYER.HUMAN].ships.every((ship) => ship.sunken))

	if(state.boards[PLAYER.HUMAN].ships.every((ship) => ship.sunken) && state.boards[PLAYER.HUMAN].ships.length === 4)
		state.winner = PLAYER.AI

	if(state.boards[PLAYER.AI].ships.every((ship) => ship.sunken) && state.boards[PLAYER.AI].ships.length === 4)
		state.winner = PLAYER.HUMAN
	return state
}
function handleInputPlacing(_state, player, action) {
	let state = stateClone(_state)
	const playerState = state.boards[player]

	if(action === INPUT.CONFIRM) {
		//confirm placement of the hot ship (first in unplaced array)
		const shipToConfirm = _.first(playerState.unplacedShips)
		if(shipToConfirm.overlapping === true)
			return state

		playerState.ships = [...playerState.ships, shipToConfirm]
		playerState.unplacedShips = [..._.rest(playerState.unplacedShips)]

		//turn done, pass it
		state = passTurn(state)
	}else{
		const ship = _.first(playerState.unplacedShips)
		switch(action) {
			case INPUT.UP:
				ship.y = ship.y-1
			break;
			case INPUT.DOWN:
				ship.y = ship.y+1
			break;
			case INPUT.LEFT:
				ship.x = ship.x-1
			break;
			case INPUT.RIGHT:
				ship.x = ship.x+1
			break;
			case INPUT.ROTATE:
				ship.horizontal = !ship.horizontal
			break;
			default:
				throw new Error('Unknown action')
		}
		//state = hotItemAccounting(state, player)
	}
	state = hotItemAccounting(state, player)
	return state
}


function handleInputBombing(_state, player, action){
	let state = stateClone(_state)
	const playerState = state.boards[player]

	if(action === INPUT.CONFIRM) {
		//confirm placement of the hot bomb
		const hotBomb = playerState.unplacedBomb
		//overlap means you cannot place
		if(hotBomb.overlapping)
			return state

		state = placeBomb(state, player, hotBomb)

		//turn done, pass it
		state = passTurn(state)
		return state
	}else{
		const hotBomb = playerState.unplacedBomb
		switch(action) {
			case INPUT.UP:
				hotBomb.y = hotBomb.y-1
			break;
			case INPUT.DOWN:
				hotBomb.y = hotBomb.y+1
			break;
			case INPUT.LEFT:
				hotBomb.x = hotBomb.x-1
			break;
			case INPUT.RIGHT:
				hotBomb.x = hotBomb.x+1
			break;
			case INPUT.ROTATE:
			break;
			default:
				throw new Error('Unknown action') //NOTE - Need to know to ignore the rotation action action
		}
		playerState.unplacedBomb = clampBombPosition(hotBomb)
	}
	state = hotItemAccounting(state, player)
	return state
}

function hotItemAccounting(_state, player){
	const state = stateClone(_state)
	const playerState = state.boards[player]
	if(state.gameState === GAMESTATE.PLACING_SHIPS) {
		const hotShip = _.first(playerState.unplacedShips)

		playerState.unplacedShips = playerState.unplacedShips.map(s => {
			if(s.id === hotShip.id){
				return markOverlappingShip(clampShipPosition(hotShip), playerState.ships)
			}
			return s
		})
	}else if(state.gameState === GAMESTATE.PLACING_BOMBS){
		//simply check if there's already a bomb in this position
		const hotBomb = playerState.unplacedBomb
		if(playerState.bombs.filter(bomb => bomb.x === hotBomb.x && bomb.y === hotBomb.y).length > 0){
			hotBomb.overlapping = true
		}else{
			hotBomb.overlapping = false
		}
	}
	return state
}

function placeBomb(_state, player, _bomb) {
	let state = stateClone(_state)
	let bomb = stateClone(_bomb)
	const ships = state.boards[opponentOf(player)].ships

	console.log(`Placing bomb at ${bomb.x},${bomb.y}`)

	//not the prettiest implementation with map and side effects but it's contained
	//check for hits
	//update the ship (hits + sunken)
	//update the bomb (hit)
	state.boards[opponentOf(player)].ships = ships.map(ship => {
		let prevHits = ship.hits
		ship = hitAccounting(bomb, ship)
		if(ship.hits > prevHits)
			bomb.hit = true
		return ship
	})

	//bomb goes in the array
	state.boards[player].bombs = [...state.boards[player].bombs, bomb]

	//reset the unplaced bomb
	state.boards[player].unplacedBomb = INITIAL_STATE.boards[PLAYER.HUMAN].unplacedBomb
	return state
}

function hitAccounting(bomb, _ship){
	const ship = stateClone(_ship)
	const bbox = getShipBoundingBox(ship)
	if(bomb.x <= bbox.x2 && bbox.x1 <= bomb.x && bomb.y <= bbox.y2 && bbox.y1 <= bomb.y){
		ship.hits++
		console.log(`Ship "${ship.id}" was hit. It has been hit ${ship.hits} times`)
	}
	if(ship.hits === ship.size){
		ship.sunken = true
		console.log(`Ship "${ship.id}" was sunk.`)
	}

	return ship
}
function passTurn(_state){
	const state = stateClone(_state)
	if(state.turn === PLAYER.HUMAN)
		state.turn = PLAYER.AI
	else
		state.turn = PLAYER.HUMAN
	return state
}
/**
*	Clamping function to ensure ships remain inside the bounds of the board
*/
function clampShipPosition(ship) {
	const dirtyShip = stateClone(ship)
	if(ship.horizontal)
		return _.assign(ship, { 
			x : min(max(ship.x, 1), 10-ship.size+1),
			y : min(max(ship.y, 1), 10)
		})
	else
		return _.assign(ship, {
			x : min(max(ship.x, 1), 10),
			y : min(max(ship.y, 1), 10-ship.size+1)
		})
}
/**
*	Clamping function to ensure bombs remain inside the bounds of the board
*/
function clampBombPosition(bomb) {
	const dirtyBomb = stateClone(bomb)
	dirtyBomb.x = max(min(dirtyBomb.x, 10), 1)
	dirtyBomb.y = max(min(dirtyBomb.y, 10), 1)
	return dirtyBomb
}
function markOverlappingShip(_ship, placedShips) {
	const ship = stateClone(_ship)
	return _.assign(ship, { overlapping: placedShips.reduce( (acc, s) => acc || isOverlapping(s, ship), false) })
}
function isOverlapping(ship1, ship2) {
	//https://stackoverflow.com/questions/20925818/algorithm-to-check-if-two-boxes-overlap
	const [ship1BBox, ship2BBox] = [getShipBoundingBox(ship1), getShipBoundingBox(ship2)]
	return (ship1BBox.x2 >= ship2BBox.x1 && ship2BBox.x2 >= ship1BBox.x1) && (ship1BBox.y2 >= ship2BBox.y1 && ship2BBox.y2 >= ship1BBox.y1)
}
function getShipBoundingBox(ship) {
	return ({
		x1: ship.x,
		x2: ship.x + (ship.horizontal ? ship.size-1 : 0), //-1 because if a ship is at x:1 horizontal and is size 2, it covers x: [1,2] range
		y1: ship.y,
		y2: ship.y + (ship.horizontal ? 0 : ship.size-1)
	})
}


export const testables = {
	newGame,
	opponentOf,
	gameStep,
	handleInputPlacing,
	handleInputBombing,
	hotItemAccounting,
	placeBomb,
	hitAccounting,
	passTurn,
	clampShipPosition,
	clampBombPosition,
	markOverlappingShip,
	isOverlapping,
	getShipBoundingBox
}