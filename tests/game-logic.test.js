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
	clampShipPosition,
	clampBombPosition,
	markOverlappingShip,
	gameStep,

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
