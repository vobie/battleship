import { testables } from '../public/game-logic.js'
import {GAMESTATE, INPUT, PLAYER, INITIAL_STATE} from '../public/game-constants.js'

//This is a lil wonky, new with jest and not sure how to test unexported functions
const {
	//Const
	newGame,

	//(sometimes partial) State->State functions
	hotItemAccounting,
	placeBomb,
	hitAccounting,
	passTurn,
	markOverlappingShip,
	gameStep,

	//Board range enforcement
	clampShipPosition,
	clampBombPosition,

	//Input handling
	handleInputPlacing,
	handleInputBombing,

	//calc
	opponentOf,
	isOverlapping,
	getShipBoundingBox
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
//Clamping functions
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