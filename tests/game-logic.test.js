import { testables } from '../public/game-logic.js'
import {GAMESTATE, INPUT, PLAYER, INITIAL_STATE} from '../public/game-constants.js'

//This is a lil wonky, new with jest and not sure how to test unexported functions
const {
	//Const
	newGame,//

	//(sometimes partial) State->State functions
	hotItemAccounting,//
	placeBomb,//
	hitAccounting,//
	passTurn,//
	markOverlappingShip,//
	gameStep,

	//Board range enforcement
	clampShipPosition,//
	clampBombPosition,//

	//Input handling
	handleInputPlacing,
	handleInputBombing,

	//calc
	opponentOf,//
	isOverlapping,
	getShipBoundingBox//
} = testables


/*
	Helpers
*/
describe('New game', () => {
	it('Returns a copy of the initial state', () => {
		expect(newGame()).toEqual(INITIAL_STATE)
		expect(newGame()).not.toBe(INITIAL_STATE)
	})
})
describe('Opponent of getter', () => {
	it('Returns AI for Human', () => {
		expect(opponentOf(PLAYER.HUMAN)).toEqual(PLAYER.AI)
	})
	it('Returns Human for AI', () => {
		expect(opponentOf(PLAYER.HUMAN)).toEqual(PLAYER.AI)
	})
})
describe('Ship BBOX helper', () => {
	it('Handles a 1x1 ship correctly', () => {
		expect(getShipBoundingBox({ x: 1, y: 1, size: 1 })).toEqual({ x1: 1, x2: 1, y1: 1, y2: 1})
	})
	it('Handles a 1x1 ship correctly, independent of position with respect to the board bounds', () => {
		expect(getShipBoundingBox({ x: -1, y: 70, size: 1 })).toEqual({ x1: -1, x2: -1, y1: 70, y2: 70})
	})
	it('Handles a 1x5 ship correctly (y2 is y1+4 though size is 5)', () => {
		expect(getShipBoundingBox({ x: 10, y: 10, size: 5, horizontal: true })).toEqual({ x1: 10, x2: 14, y1: 10, y2: 10})
	})
	it('Handles a 1x4 ship correctly in the vertical orientation', () => {
		expect(getShipBoundingBox({ x: 10, y: 10, size: 4, horizontal: false })).toEqual({ x1: 10, x2: 10, y1: 10, y2: 13})
	})
	it('Handles a 1x3 ship correctly spanning negative and positive positions', () => {
		expect(getShipBoundingBox({ x: -1, y: -1, size: 3, horizontal: true })).toEqual({ x1: -1, x2: 1, y1: -1, y2: -1})
	})
})

/*
	State updating functions
*/
describe('Bomb clamping function', () => {
	it('Moves a bomb at (-1,-1) to (1,1)', () => {
		expect(clampBombPosition({ x:-1, y:-1 })).toEqual({ x:1, y:1 })
	})
	it('Leaves a bomb at (5,5) unchanged', () => {
		expect(clampBombPosition({ x:5, y:5 })).toEqual({ x:5, y:5 })
	})
	it('Moves a bomb at (50,50) to (10,10)', () => {
		expect(clampBombPosition({ x:50, y:50 })).toEqual({ x:10, y:10 })
	})
	it('Doesn\'t return the same object that was passed', () => {
		const bomb = { x:5, y:5 }
		const bombTouched = { x:50, y:50 }
		expect(clampBombPosition(bomb)).not.toBe(bomb)
		expect(clampBombPosition(bombTouched)).not.toBe(bombTouched)
	})
})

describe('Ship clamping function', () => {
	//left and above, horizontal
	it('Moves a ship horizontal ship at -1,-1 to 1,1 (d=+xy)', () => {
		expect(clampShipPosition({ x: -1, y: -1, size: 2, horizontal: true })).toEqual({ x: 1, y: 1, size: 2, horizontal: true })
	})
	it('Moves a ship horizontal ship at 1,-1 to 1,1 (d=+y)', () => {
		expect(clampShipPosition({ x: 1, y: -1, size: 3, horizontal: true })).toEqual({ x: 1, y: 1, size: 3, horizontal: true })
	})
	it('Moves a ship horizontal ship at -1,5 to 1,5 (d=+x)', () => {
		expect(clampShipPosition({ x: -1, y: 5, size: 3, horizontal: true })).toEqual({ x: 1, y: 5, size: 3, horizontal: true })
	})
	//right and below, horizontal
	it('Moves a ship horizontal ship at 11,11 with size 3 to 8,10 (d=-xy)', () => {
		expect(clampShipPosition({ x: 11, y: 11, size: 3, horizontal: true })).toEqual({ x: 8, y: 10, size: 3, horizontal: true })
	})
	it('Moves a ship horizontal ship at 1,15 to 1,10 (d=-y)', () => {
		expect(clampShipPosition({ x: 1, y: 15, size: 3, horizontal: true })).toEqual({ x: 1, y: 10, size: 3, horizontal: true })
	})
	it('Moves a ship horizontal ship with size 5 at 11,1 to 6,1 (d=-x)', () => {
		expect(clampShipPosition({ x: 11, y: 1, size: 5, horizontal: true })).toEqual({ x: 6, y: 1, size: 5, horizontal: true })
	})
	//partially outside, vertical and horizontal, +x+y-x-y
	it('Moves a horizontal ship partially outside on the right side back inside', () => {
		expect(clampShipPosition({ x: 9, y: 1, size: 5, horizontal: true })).toEqual({ x: 6, y: 1, size: 5, horizontal: true })
	})
	it('Moves a vertical ship partially outside on the bottom side back inside', () => {
		expect(clampShipPosition({ x: 3, y: 8, size: 5, horizontal: false })).toEqual({ x: 3, y: 6, size: 5, horizontal: false })
	})
	it('Moves a horizontal ship partially outside on the left side back inside', () => {
		expect(clampShipPosition({ x: -3, y: 3, size: 5, horizontal: true })).toEqual({ x: 1, y: 3, size: 5, horizontal: true })
	})
	it('Moves a vertical ship partially outside on the top side back inside', () => {
		expect(clampShipPosition({ x: 6, y: -2, size: 5, horizontal: false })).toEqual({ x: 6, y: 1, size: 5, horizontal: false })
	})
})

describe('Turn passing state update', () => {
	it('Passes the turn from Human to AI', () => {
		expect(passTurn(newGame())).toMatchObject({ turn: PLAYER.AI })
	})
	it('Passes the turn from AI to Human', () => {
		const state = newGame()
		state.turn = PLAYER.AI
		expect(passTurn(state)).toMatchObject({ turn: PLAYER.HUMAN })
	})
})

describe('Hot item (ship or bomb to be placed) state updates - overlaps', ()=> {
	it('Marks overlap when two ships at 1,1', () => {
		const state = {
			gameState : GAMESTATE.PLACING_SHIPS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {
					ships: [{x: 3, y: 3, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"}],
					unplacedShips: [
						{x: 3, y: 3, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"}
					]
				},
			}
		}
		expect(hotItemAccounting(state, PLAYER.HUMAN)).toMatchObject({ boards: { [PLAYER.HUMAN] : { unplacedShips: [{ overlapping: true }] } } })
	})
	it('Marks overlap when two ships cross each other in the middle', () => {
		const state = {
			gameState : GAMESTATE.PLACING_SHIPS,
			turn : PLAYER.AI,
			boards : {
				[PLAYER.AI] : {
					ships: [{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, id: "Ship2"}, {x: 3, y: 3, size: 3, horizontal: true, overlapping:false, id: "Ship3"}],
					unplacedShips: [
						{x: 4, y: 2, size: 4, horizontal: false, overlapping:false, id: "Ship4"},
						{x: 1, y: 1, size: 5, horizontal: true, overlapping:false, id: "Ship5"}
					]
				},
			}
		}
		expect(hotItemAccounting(state, PLAYER.AI)).toMatchObject({ boards: { [PLAYER.AI] : { unplacedShips: [{ overlapping: true }, { overlapping: false }] } } })
	})
	it('Marks overlap when two bombs are on top of eachother', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [{x:4, y:4, hit: false, overlapping: false}],
					unplacedBomb: {x:4, y:4, hit: false, overlapping: false}
				},
			}
		}
		expect(hotItemAccounting(state, PLAYER.HUMAN)).toMatchObject({ boards: { [PLAYER.HUMAN] : { unplacedBomb: { overlapping: true } } } })
	})
})

describe('Bomb placing', () => {
	it('Places the hot bomb in the placed bombs array', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [],
					unplacedBomb: {x:5, y:5, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: []
				}
			}
		}
		expect(placeBomb(state, PLAYER.HUMAN, {x:5, y:5, hit: false, overlapping: false})).toMatchObject({ boards : {[PLAYER.HUMAN] : { bombs : [{x:5, y:5, hit: false, overlapping: false}] } } })
	})
	it('Marks a hit on the bomb if it should', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: [{x: 1, y: 1, size: 2, hits: 0, horizontal: false, id: "Ship2"}]
				}
			}
		}

		expect(placeBomb(state, PLAYER.HUMAN, {x:1, y:1, hit: false, overlapping: false})).toMatchObject({ boards : {[PLAYER.HUMAN] : { bombs : [{ hit: true }] } } })
	})
	it('Does not mark a hit on the bomb if it shouldn\'t', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [],
					unplacedBomb: {x:5, y:5, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: [{x: 1, y: 1, size: 2, hits: 0, horizontal: false, id: "Ship2"}]
				}
			}
		}

		expect(placeBomb(state, PLAYER.HUMAN, {x:5, y:5, hit: false, overlapping: false})).toMatchObject({ boards : {[PLAYER.HUMAN] : { bombs : [{ hit: false }] } } })
	})
	it('Marks a hit on the ship if it should', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: [{x: 1, y: 1, size: 2, hits: 0, horizontal: false, id: "Ship2"}]
				}
			}
		}

		expect(placeBomb(state, PLAYER.HUMAN, {x:1, y:1, hit: false, overlapping: false})).toMatchObject({ boards : {[PLAYER.AI] : { ships : [{ hits: 1 }] } } })
	})
	it('Does not mark a hit on the ship if it shouldn\'t', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [],
					unplacedBomb: {x:2, y:2, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: [{x: 1, y: 1, size: 2, hits: 0, horizontal: false, id: "Ship2"}]
				}
			}
		}

		expect(placeBomb(state, PLAYER.HUMAN, {x:2, y:2, hit: false, overlapping: false})).toMatchObject({ boards : {[PLAYER.AI] : { ships : [{ hits: 0 }] } } })
	})
	it('Sinks a ship correctly', () => {
		const state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			boards : {
				[PLAYER.HUMAN] : {	
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: [{x: 1, y: 1, size: 2, hits: 0, horizontal: true, id: "Ship2"}]
				}
			}
		}
		const state1 = placeBomb(state, PLAYER.HUMAN, {x:1, y:1, hit: false, overlapping: false})
		expect(state1).toMatchObject({ boards : {[PLAYER.AI] : { ships : [{ hits: 1 }] } } })
		const state2 = placeBomb(state1, PLAYER.HUMAN, {x:2, y:1, hit: false, overlapping: false})
		expect(state2).toMatchObject({ boards : {[PLAYER.AI] : { ships : [{ hits: 2, sunken: true }] } } })
	})
})

describe('Hit accounting', () => {
	it('Will count a ship hit', () => {
		expect(hitAccounting({x:1, y:1}, {x: 1, y: 1, hits: 0, sunken: false, horizontal: true, size: 2, id: "Ship2"})).toMatchObject({hits: 1, sunken: false})
	})
	it('Will not count a miss', () => {
		expect(hitAccounting({x:1, y:1}, {x: 1, y: 5, hits: 0, sunken: false, horizontal: true, size: 2, id: "Ship2"})).toMatchObject({hits: 0, sunken: false})
	})
	it('Will sink a ship when hits = size', () => {
		expect(hitAccounting({x:1, y:2}, {x: 1, y: 1, hits: 1, sunken: false, horizontal: false, size: 2, id: "Ship2"})).toMatchObject({hits: 2, sunken: true})
	})
})

describe('Ship overlap function', () => {
	it('Will count a simple overlap', () => {
		expect(isOverlapping({x:1, y:1, size: 3, horizontal: true}, {x:1, y:1, size: 2, horizontal: true})).toEqual(true)
	})
	it('Will count a horzontal/vertial middle overlap', () => {
		expect(isOverlapping({x:1, y:3, size: 4, horizontal: true}, {x:3, y:1, size: 5, horizontal: false})).toEqual(true)
	})
	it('Will not count a horzontal/vertial non-overlap', () => {
		expect(isOverlapping({x:3, y:1, size: 4, horizontal: true}, {x:1, y:3, size: 5, horizontal: false})).toEqual(false)
	})
})

describe('Input testing. Bombing and placing phases tested through gameStep', () => {
	it('Moves the ship right from initial position', () => {
		const state = newGame()
		expect(gameStep(state, PLAYER.HUMAN, INPUT.RIGHT)).toMatchObject({boards: {[PLAYER.HUMAN]: {unplacedShips: [{x: 4}, {x:3}, {x:3}, {x:3}]} } })
	})
	it('Moves the ship to the edge but no further', () => {
		let state = newGame()
		state = gameStep(state, PLAYER.HUMAN, INPUT.LEFT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.LEFT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.LEFT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.LEFT)
		expect(state).toMatchObject({boards: {[PLAYER.HUMAN]: {unplacedShips: [{x: 1}, {x:3}, {x:3}, {x:3}]} } })
	})
	it('Rotates a ship', () => {
		let state = newGame()
		expect(state).toMatchObject({boards: {[PLAYER.HUMAN]: {unplacedShips: [{horizontal:false}, {}, {}, {}]} } })
	})
	it('moves the ship to initial position if right, down, left, up is the input', () => {
		let state = newGame()
		state = gameStep(state, PLAYER.HUMAN, INPUT.RIGHT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.DOWN)
		state = gameStep(state, PLAYER.HUMAN, INPUT.LEFT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.UP)
		expect(state).toMatchObject({boards: {[PLAYER.HUMAN]: {unplacedShips: [{x: 3}, {x:3}, {x:3}, {x:3}]} } })
	})
	it('passes the turn when input is confirm and move is allowed', () => {
		let state = newGame()
		state = gameStep(state, PLAYER.HUMAN, INPUT.CONFIRM)
		expect(state).toMatchObject({ turn : PLAYER.AI })
	})
	it('NOOPs when confirming on a disallowed placement', () => {
		let state = newGame()
		state = gameStep(state, PLAYER.HUMAN, INPUT.CONFIRM) //place
		state = gameStep(state, PLAYER.AI, INPUT.CONFIRM) //place
		state = gameStep(state, PLAYER.HUMAN, INPUT.CONFIRM) //place, will noop since there is already a ship here
		expect(gameStep(state, PLAYER.HUMAN, INPUT.CONFIRM)).toMatchObject({ turn : PLAYER.HUMAN })
	})
	it('Allows placement of a bomb when there is no overlapping bomb', () => {
		let state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			winner : null,
			boards : {
				[PLAYER.HUMAN] : {
					ships: [
						{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
						{x: 1, y: 2, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
						{x: 1, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
						{x: 1, y: 4, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
					],
					unplacedShips: [],
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: false}
				},
				[PLAYER.AI] : {
					ships: [],
					unplacedShips: [
						{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
						{x: 1, y: 2, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
						{x: 1, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
						{x: 1, y: 4, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
					],
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: false}
				},
			}
		}

		state = gameStep(state, PLAYER.HUMAN, INPUT.CONFIRM)
		expect(state).toMatchObject({ turn : PLAYER.AI })
	})
	it('Disallows placement of a bomb when there is an overlapping bomb', () => {
		let state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			winner : null,
			boards : {
				[PLAYER.HUMAN] : {
					ships: [
						{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
						{x: 1, y: 2, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
						{x: 1, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
						{x: 1, y: 4, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
					],
					unplacedShips: [],
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: true}
				},
				[PLAYER.AI] : {
					ships: [],
					unplacedShips: [
						{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
						{x: 1, y: 2, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
						{x: 1, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
						{x: 1, y: 4, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
					],
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: true}
				},
			}
		}

		state = gameStep(state, PLAYER.HUMAN, INPUT.CONFIRM)
		expect(state).toMatchObject({ turn : PLAYER.HUMAN })
	})
	it('Can move a bomb in a cirlce', () => {
		let state = {
			gameState : GAMESTATE.PLACING_BOMBS,
			turn : PLAYER.HUMAN,
			winner : null,
			boards : {
				[PLAYER.HUMAN] : {
					ships: [
						{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
						{x: 1, y: 2, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
						{x: 1, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
						{x: 1, y: 4, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
					],
					unplacedShips: [],
					bombs: [],
					unplacedBomb: {x:2, y:2, hit: false, overlapping: true}
				},
				[PLAYER.AI] : {
					ships: [],
					unplacedShips: [
						{x: 1, y: 1, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
						{x: 1, y: 2, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
						{x: 1, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
						{x: 1, y: 4, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
					],
					bombs: [],
					unplacedBomb: {x:1, y:1, hit: false, overlapping: true}
				},
			}
		}

		state = gameStep(state, PLAYER.HUMAN, INPUT.LEFT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.DOWN)
		state = gameStep(state, PLAYER.HUMAN, INPUT.RIGHT)
		state = gameStep(state, PLAYER.HUMAN, INPUT.UP)
		expect(state).toMatchObject({ boards : { [PLAYER.HUMAN] : { unplacedBomb : {x: 2, y : 2} } } })
	})
})