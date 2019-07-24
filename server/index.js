const express = require("express");
const graphqlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");
const _ = require("underscore");
// The data below is mocked.
const data = require("./data");

// The schema should model the full data object available.
const schema = buildSchema(`
  type Pokemon {
    id: String
    name: String!
    classification: String
    types: [String]
    resistant: [String]
    weaknesses: [String]
    weight: Range
    height: Range
    fleeRate: Float
    evolutionRequirements: EvolutionReqs
    evolutions: [Pokemon]
    maxCP: Int
    maxHP: Int
    attacks: AttackCategory
  }

  input PokemonInput {
    id: String
    name: String
    classification: String
    types: [String]
    resistant: [String]
    weaknesses: [String]
    weight: RangeInput
    height: RangeInput
    fleeRate: Float
    evolutionRequirements: EvolutionReqsInput
    evolutions: [PokemonInput]
    maxCP: Int
    maxHP: Int
    attacks: AttackCategoryInput
  }
  
  type AttackCategory{
    fast: [Attack]
    special: [Attack]
  }

  input AttackCategoryInput{
    fast: [AttackInput]
    special: [AttackInput]
  }

  type Attack {
    name: String
    type: String
    damage: Int
  }

  input AttackInput {
    name: String
    type: String
    damage: Int
  }

  type EvolutionReqs {
    amount: Int
    name: String
  }

  input EvolutionReqsInput {
    amount: Int
    name: String
  }

  type Range {
    minimum: String
    maximum: String
  }

  input RangeInput {
    minimum: String
    maximum: String
  }

  type Query {
    Pokemons: [Pokemon]
    Pokemon(name: String, id: Int): Pokemon
    Attacks: AttackCategory
    FindAttackBy(type: String): [Attack]
    Types: [String]
    FindPokemonByType(type: String): [Pokemon]
    FindPokemonByAttack(attackName: String): [Pokemon]
  }
  
  type Mutation {
    CreatePokemon(newPokemon: PokemonInput): Pokemon
    ChangePokemon(name: String!, newData: PokemonInput!): Pokemon
    DeletePokemon(name: String!): Pokemon

    CreateType(newType: String): String
    ChangeType(name: String!, newType: String!): String
    DeleteType(name: String!): String

    CreateAttack(attack: AttackInput!, category: String!): Attack
    ChangeAttack(name: String!, category: String!, atkData: AttackInput!): Attack
  }
`);
const findPokemon = ({ name, id }) => {
  return data.pokemon.find((pokemon) => {
    return pokemon.name === name || Number(pokemon.id) === Number(id);
  });
};

const FindAttack = (name, category) => {
  return data.attacks[category].find((attack) => {
    return attack.name === name;
  });
};

// The root provides the resolver functions for each type of query or mutation.
const root = {
  Pokemons: () => {
    return data.pokemon;
  },
  Pokemon: findPokemon,
  Attacks: () => {
    return data.attacks;
  },
  FindAttackBy: (request) => {
    return data.attacks[request.type];
  },
  FindPokemonByType: (request) => {
    //find all pokemon of request.type
    const allPokemon = data.pokemon;
    // return an array of pokemon objects
    return allPokemon.filter((pokemon) => {
      return pokemon.types.includes(request.type);
    });
  },
  FindPokemonByAttack: (request) => {
    return data.pokemon.filter((pokemon) => {
      const fast = pokemon.attacks.fast;
      const special = pokemon.attacks.special;
      return (
        fast.map((attack) => attack.name).includes(request.attackName) ||
        special.map((attack) => attack.name).includes(request.attackName)
      );
    });
  },
  DeletePokemon: (request) => {
    let result;
    data.pokemon = _.reject(data.pokemon, (pokemon) => {
      if (request.name === pokemon.name) {
        result = pokemon;
        return true;
      }
      return false;
    });
    return result;
  },
  CreatePokemon: ({ newPokemon }) => {
    const pokemon = {};
    _.extend(pokemon, newPokemon);
    data.pokemon.push(pokemon);
    return pokemon;
  },
  ChangePokemon: (request) => {
    const pokemon = findPokemon({ name: request.name });
    _.extend(pokemon, request.newData);
    return pokemon;
  },
  Types: () => {
    return data.types;
  },
  CreateType: ({ newType }) => {
    data.types.push(newType);
    return newType;
  },
  ChangeType: ({ name, newType }) => {
    const index = data.types.indexOf(name);
    console.log("This is new type", newType);
    data.types[index] = newType;
    console.log("Index", data.types[index]);
    return newType;
  },
  DeleteType: ({ name }) => {
    const index = data.types.indexOf(name);
    let deletedType;
    if (index > -1) {
      deletedType = data.types.splice(index, 1)[0];
    }
    return deletedType ? deletedType : null;
  },
  CreateAttack: ({ attack, category }) => {
    data.attacks[category].push(attack);
    return attack;
  },
  ChangeAttack: ({ name, category, atkData }) => {
    const attack = FindAttack(name, category);
    _.extend(attack, atkData);
    return attack;
  },
};

// Start your express server!
const app = express();

/*
  The only endpoint for your server is `/graphql`- if you are fetching a resource, 
  you will need to POST your query to that endpoint. Suggestion: check out Apollo-Fetch
  or Apollo-Client. Note below where the schema and resolvers are connected. Setting graphiql
  to 'true' gives you an in-browser explorer to test your queries.
*/
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Running a GraphQL API server at localhost:${PORT}/graphql`);
});
