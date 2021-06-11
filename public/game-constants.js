//Game state constants
export const GAMESTATE = {}
GAMESTATE.PLACING_SHIPS = Symbol('GameState: Place Ship')
GAMESTATE.PLACING_BOMBS = Symbol('GameState: Place Bomb')
GAMESTATE.IDLE = Symbol('GameState: Idle') //Game has not started or has finished. TODO

//Game input symbols
export const INPUT = {}
INPUT.LEFT = Symbol('Input: Move Left')
INPUT.RIGHT = Symbol('Input: Move Right')
INPUT.DOWN = Symbol('Input: Move Down')
INPUT.UP = Symbol('Input: Move Up')
INPUT.ROTATE = Symbol('Input: Rotate Ship')
INPUT.CONFIRM = Symbol('Input: Confirm Placement')

//KeyCode to input symbol mapping
INPUT.keyCodeMapping = {
	"ArrowUp"	: INPUT.UP,
	"ArrowDown" : INPUT.DOWN,
	"ArrowLeft" : INPUT.LEFT,
	"ArrowRight": INPUT.RIGHT,
	"R"			: INPUT.ROTATE,
	"r"			: INPUT.ROTATE, //odd quirk that the e.key cares about the shift but the readability outweighs using the numbered keyCode
	"Enter"		: INPUT.CONFIRM
}

export const PLAYER = {}
PLAYER.HUMAN = Symbol('Player (Human)')
PLAYER.AI = Symbol('Player (AI)')

export const INITIAL_STATE = {
	gameState : GAMESTATE.PLACING_SHIPS,
	turn : PLAYER.HUMAN,
	winner : null,
	boards : {
		[PLAYER.HUMAN] : {
			ships: [],
			unplacedShips: [
				{x: 3, y: 3, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
				{x: 3, y: 3, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
				{x: 3, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
				{x: 3, y: 3, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
			],
			bombs: [],
			unplacedBomb: {x:4, y:4, hit: false, overlapping: false}
		},
		[PLAYER.AI] : {
			ships: [],
			unplacedShips: [
				{x: 3, y: 3, size: 2, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship2"},
				{x: 3, y: 3, size: 3, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship3"},
				{x: 3, y: 3, size: 4, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship4"},
				{x: 3, y: 3, size: 5, horizontal: true, overlapping:false, hits: 0, sunken: false, id: "Ship5"}
			],
			bombs: [],
			unplacedBomb: {x:4, y:4, hit: false, overlapping: false}
		},
	}
}
