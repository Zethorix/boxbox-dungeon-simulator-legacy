import * as data from './data.js';
import * as utils from './utils.js';

const ABILITY_FOR_ITEM = {
  'Avalanche': avalanche,
  'Big Club': bigClub,
  'Boosting Bugle': boostingBugle,
  'Celine\'s Chumby Chicken': celinesChumbyChicken,
  'Challenger Arrow': challengerArrow,
  'Chicken Dinner': chickenDinner,
  'Cleansing Flames': cleansingFlames,
  'Draining Dagger': drainingDagger,
  'Energetic Ally': energeticAlly,
  'Explosion Powder': explosionPowder,
  'Fire Sword': fireSword,
  'Freezeman': freezeman,
  'Halberd': halberd,
  'Healing Pendant': healingPendant,
  'Imp Whistle': impWhistle,
  'Knight\'s Lance': knightsLance,
  'Love Letter': loveLetter,
  'Machete': machete,
  'Magic Parasol': magicParasol,
  'Martyr Armor': martyrArmor,
  'Pet Imp': petImp,
  'Poison Dagger': poisonDagger,
  'Rock Companion': rockCompanion,
  'Rough Skin': roughSkin,
  'Seeking Missiles': seekingMissiles,
  'Survival Kit': survivalKit,
  'Thorns': thorns,
  'Whirlwind Axe': whirlwindAxe
}

export function useItemAbility(params) {
  if (params.item.name in data.getItems().energy && !_checkEnergy(params)) {
    return;
  }
  return ABILITY_FOR_ITEM[params.item.name](params);
}

function _checkEnergy(params) {
  const originalEnergy = params.character.energy;
  const cost = data.getItems().energy[params.item.name].cost;
  if (originalEnergy < cost) {
    return false;
  }
  utils.log('Activating {0}', params.item.name);
  params.character.changeEnergy({amount: -cost});
  return true;
}

function _throwInvalidPhaseError(params) {
  throw Error(utils.format('InternalError: Item {0} does not have phase {1}',
                           params.item.name, params.phase));
}

function avalanche(params) {
  switch (params.phase) {
    case 'TurnStart': {
      const enemyTeam = params.enemyTeam;
      const tier = params.item.tier;
      for (var i = 0; i < 2; i++) {
        const target = utils.pickRandom(enemyTeam);
        target.takeDamage({
          source: params.character,
          amount: utils.pickRandomWithinRange(3 * tier, 5 * tier),
          battle: params.battle
        });
        target.changeSpeed({
          amount: -utils.pickRandomWithinRange(0, tier)
        });
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function bigClub(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PreDamage': {
      if (!utils.withProbability(0.11 * tier)) {
        break;
      }
      utils.log('Activated {0}', params.item.name);
      params.damageFinal += Math.round(1.5 * params.damageBase);
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function boostingBugle(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      const allyTeam = params.allyTeam;
      if (allyTeam.length === 1) {
        break;
      }
      for (var i = 0; i < 2; i++) {
        const target = utils.pickRandom(
            allyTeam,
            (c) => {
              if (c.summoned) {
                return 0;
              }
              if (c.character === params.character.character) {
                return 0;
              }
              return 1;
            }
        );
        target.changeHp({amount: tier + tier});
        target.changeAttack({amount: tier});
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function celinesChumbyChicken(params) {
  switch (params.phase) {
    case 'TurnStart': {
      const allyTeamIndex = params.allyTeamIndex;
      if (params.character.character in params.battle.summonedChicken) {
        break;
      }
      params.battle.summonedChicken[params.character.character] = 0;
      params.battle.addSummonToTeam(params.item, allyTeamIndex);
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function challengerArrow(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      const enemyTeam = params.enemyTeam;
      const target = utils.pickRandom(enemyTeam);
      target.takeDamage({
          source: params.character,
          amount: 10 * tier,
          battle: params.battle
      });
      params.character.changeAttack({amount: tier});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function chickenDinner(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'Death': {
      if (params.battle.activeTeamIndex === params.allyTeamIndex) {
        break;
      }
      for (const ally of params.allyTeam) {
        if (ally.character === params.character.character) {
          continue;
        }
        ally.changeHp({amount: tier});
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function cleansingFlames(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PostDamage': {
      const allyTeam = params.allyTeam;
      if (!utils.withProbability(0.5)) {
        break;
      }
      utils.log('Activating {0}', params.item.name);
      for (const ally of allyTeam) {
        ally.changeHp({amount: tier});
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function drainingDagger(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PostTarget': {
      utils.log('Activating {0}', params.item.name);
      params.currentTarget.changeAttack({amount: -tier});
      if (utils.withProbability(0.05 * tier)) {
        params.currentTarget.changeEnergy({amount: -1});
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function energeticAlly(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      const allyTeam = params.allyTeam;
      var target = {hp: Infinity};
      for (const ally of allyTeam) {
        if (ally.hp < target.hp) {
          target = ally;
        }
      }
      if (target.hp === Infinity) {
        throw Error('InternalError: Ally team has no members');
      }
      target.changeHp({amount: 5 * tier});
      target.changeEnergy({amount: 20});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function explosionPowder(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      const enemyTeam = params.enemyTeam;
      if (enemyTeam.length === 1) {
        const target = enemyTeam[Object.keys(enemyTeam)[0]];
        target.takeDamage({
            source: params.charcter,
            amount: utils.pickRandomWithinRange(10 * tier, 20 * tier),
            battle: params.battle
        });
        break;
      }
      for (const enemy of enemyTeam) {
        enemy.takeDamage({
            source: params.character,
            amount: utils.pickRandomWithinRange(5 * tier, 10 * tier),
            battle: params.battle
        });
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function fireSword(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PostDamage': {
      utils.log('Activating {0}', params.item.name);
      var attackIncrease = 0;
      for (var i = 0; i < tier; i++) {
        if (!utils.withProbability(0.3)) {
          continue;
        }
        attackIncrease++;
      }
      params.character.changeAttack({amount: attackIncrease});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function freezeman(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'InitCharacter': {
      utils.log('Activating {0}', params.item.name);
      params.character.changeSpeed({amount: tier});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function halberd(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'InitCharacter': {
      utils.log('Activating {0}', params.item.name);
      params.character.changeAttack({amount: tier});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function healingPendant(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      if (!utils.withProbability(0.5)) {
        break;
      }
      utils.log('Activating {0}', params.item.name);
      params.character.changeHp({amount: 5 * tier});
      break;
    }
    case 'Block': {
      if (!utils.withProbability(0.07 + 0.03 * tier)) {
        break;
      }
      if (params.currentTarget.hp < params.character.hp) {
        utils.log(
            '{0} blocks for {1}',
            params.character.character,
            params.currentTarget.character
        );
        params.currentTarget = params.character;
        break;
      }
      utils.log(
          '{0} is a coward',
          params.character.character,
      );
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function impWhistle(params) {
  switch (params.phase) {
    case 'TurnStart': {
      params.battle.addSummonToTeam(params.item, params.allyTeamIndex);
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function knightsLance(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      const enemyTeam = params.enemyTeam;
      const target = utils.pickRandom(enemyTeam);
      if (params.character.hp === params.character.hpMax) {
        target.takeDamage({
            source: params.character,
            amount: utils.pickRandomWithinRange(10 * tier, 14 * tier),
            battle: params.battle
        });
        break;
      }
      const amount = utils.pickRandomWithinRange(5 * tier, 7 * tier);
      target.takeDamage({
          source: params.character,
          amount: amount,
          battle: params.battle
      });
      params.character.changeHp({amount: amount});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function loveLetter(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PostDamage': {
      utils.log('Activating {0}', params.item.name);
      const allyTeam = params.allyTeam;
      const target = utils.pickRandom(
          allyTeam,
          (c) => {
            if (c.character === params.character.character) {
              return 0;
            }
            if (c.summoned) {
              return 0;
            }
            return 1;
          }
      );
      if (target === null) {
        break;
      }
      target.changeHp({amount: tier + tier});
      target.changeEnergy({amount: tier});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function machete(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PostTarget': {
      utils.log('Activating {0}', params.item.name);
      const enemyTeam = params.enemyTeam;
      if (enemyTeam.length === 1) {
        break;
      }
      const target = utils.pickRandom(
          enemyTeam,
          (c) => {
            if (c.character === params.currentTarget.character) {
              return 0;
            }
            return 1;
          }
      );
      target.takeDamage({
          source: params.character,
          amount: utils.pickRandomWithinRange(3 * tier, 4 * tier),
          battle: params.battle
      });
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function magicParasol(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'Block': {
      if (!utils.withProbability(0.07 + 0.03 * tier)) {
        break;
      }
      if (params.currentTarget.hp < params.character.hp) {
        utils.log(
            '{0} blocks for {1}',
            params.character.character,
            params.currentTarget.character
        );
        params.currentTarget = params.character;
        break;
      }
      utils.log(
          '{0} is a coward',
          params.character.character,
      );
      break;
    }
    case 'EnemyDamage': {
      if (!utils.withProbability(0.05 + 0.05 * tier)) {
        break;
      }
      utils.log('Activating {0}', params.item.name);
      params.damage = 0;
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function martyrArmor(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'EnemyDamage': {
      if (!utils.withProbability(0.66)) {
        break;
      }
      utils.log('Activating {0}', params.item.name);
      const target = utils.pickRandom(
          params.battle.teams[
              params.battle.getTeamOf[params.character.character]
          ],
          (c) => {
            if (c.character === params.character.character) {
              return 0;
            }
            if (c.summoned) {
              return 0;
            }
            return 1;
          }
      );
      if (target === null) {
        break;
      }
      target.changeHp({amount: tier + tier});
      target.changeEnergy({amount: tier});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function petImp(params) {
  switch (params.phase) {
    case 'InitCharacter': {
      utils.log('Activating {0}', params.item.name);
      params.battle.addSummonToTeam(params.item, params.allyTeamIndex);
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function poisonDagger(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PostTarget': {
      utils.log('Activating {0}', params.item.name);
      params.currentTarget.poison += tier;
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function rockCompanion(params) {
  switch (params.phase) {
    case 'InitCharacter': {
      utils.log('Activating {0}', params.item.name);
      params.battle.addSummonToTeam(params.item, params.allyTeamIndex);
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function roughSkin(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'EnemyDamage': {
      if (!utils.withProbability(0.5)) {
        break;
      }
      utils.log('Activating {0}', params.item.name);
      params.damage = Math.max(0, params.damage - tier - tier);
      params.source.changeHp({amount: -tier - tier});
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function seekingMissiles(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'Target': {
      var target = {hp: Infinity};
      for (const enemy of params.enemyTeam) {
        if (enemy.hp < target.hp) {
          target = enemy;
        }
      }
      if (target.hp === Infinity) {
        throw Error('InternalError: No target in enemy team');
      }
      utils.log('{0} selected target {1}', params.item.name, target.character);
      params.currentTarget = target;
      break;
    }
    case 'PreDamage': {
      const missingHpProportion =
          1 - params.currentTarget.hp / params.currentTarget.hpMax;
      utils.log('Activating {0}', params.item.name);
      params.damageFinal += Math.floor(5 * missingHpProportion * tier);
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function survivalKit(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'InitCharacter': {
      utils.log('Activating {0}', params.item.name);
      const amount = 20 * tier;
      params.character.hpMax += amount;
      params.character.changeHp({amount: amount});
      break;
    }
    case 'Block': {
      if (!utils.withProbability(0.07 + 0.03 * tier)) {
        break;
      }
      if (params.currentTarget.hp < params.character.hp) {
        utils.log(
            '{0} blocks for {1}',
            params.character.character,
            params.currentTarget.character
        );
        params.currentTarget = params.character;
        break;
      }
      utils.log(
          '{0} is a coward',
          params.character.character,
      );
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function thorns(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'TurnStart': {
      utils.log('Activating {0}', params.item.name);
      var addedEnergy = false;
      for (const enemy of params.enemyTeam) {
        enemy.takeDamage({
            source: params.character,
            amount: tier,
            battle: params.battle
        });
        if (addedEnergy) {
          continue;
        }
        if (!utils.withProbability(0.25)) {
          continue;
        }
        params.character.changeEnergy({amount: tier});
        addedEnergy = true;
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}

function whirlwindAxe(params) {
  const tier = params.item.tier;
  switch (params.phase) {
    case 'PreDamage': {
      if (!utils.withProbability(0.11 * tier)) {
        break;
      }
      utils.log('Activating {0}', params.item.name);
      for (const enemy of params.enemyTeam) {
        if (enemy.character === params.currentTarget.character) {
          continue;
        }
        enemy.takeDamage({
            source: params.character,
            amount: params.damageBase,
            battle: params.battle
        });
      }
      break;
    }
    default: {
      _throwInvalidPhaseError(params);
    }
  }
}
