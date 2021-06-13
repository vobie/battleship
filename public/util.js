import _ from './underscore.js'
import {PLAYER} from './game-constants.js'

/*
    Function to clone the state. This is to avoid unintentional side effects propagation which could result in side effects.
*/
export function stateClone (item) {
  if (_.isArray(item)){
    return _.map(item, o => stateClone(o))
  }
  if(_.isObject(item)){
  	const mapped = _.mapObject(item, (val, key) => {return stateClone(val)})

  	//State makes use of mapping [PLAYER] => value
  	//Symbol keys are not recognized when using [Iterable], manually copy these
  	if(item[PLAYER.HUMAN])
  		mapped[PLAYER.HUMAN] = stateClone(item[PLAYER.HUMAN])
  	if(item[PLAYER.AI])
  		mapped[PLAYER.AI] = stateClone(item[PLAYER.AI])
  	return mapped
  }
  return item
}

export const max = Math.max
export const min = Math.min

export default {}