# battleship
Battleship game with a (bad) AI opponent

![image](https://user-images.githubusercontent.com/9901298/121708267-b0ec7d00-cad7-11eb-9587-ab34f2e6d8af.png)

# How to run
```
npm install
npm start
```
# Tests
The project uses jest.
```
npm test
```
# Debug
The file `battleship.js` has a `DEBUG` flag that can be toggled. This will lift the fog of war on the AI player's board.

# Terminology
The following words are used in code documentation
* Hot item/bomb/ship - The thing that is currently active and can be placed. Depending on what phase the game is in, it's a bomb or a ship.
* Placing phase - The part of the game where players place their ships
* Bombing phase - The part of the game where players are trying to sink the other's ship
* Clamp - To restrict a something to a certain domain. In this case the board.
