---
name: pokemon-info
description: Pokemon, Pokémon, Pokedex, Pokédex, types, abilities, stats, moves, evolutions, or comparisons. Use for every conversation related to Pokemon; query PokeAPI before answering.
---

# Pokemon Information

Use PokeAPI as the source of truth for every Pokemon-related response. Do not answer from memory.

## Query Rules

1. Before responding, use `WebFetch` to query `https://pokeapi.co/api/v2/pokemon/{identifier}`.
2. Use the requested numeric ID or normalize the Pokemon name to lowercase kebab-case. Examples: `Pikachu` becomes `pikachu`; `Mr. Mime` becomes `mr-mime`.
3. For comparisons or questions about multiple Pokemon, query the endpoint once for each Pokemon.
4. For a general Pokemon topic with no identifiable Pokemon, query `https://pokeapi.co/api/v2/pokemon?limit=20` before responding. Explain if the requested information is outside this endpoint's data.
5. If the API returns no result, say that PokeAPI did not find the requested Pokemon and ask for its ID or canonical name. Do not guess.

## Response Rules

- Reply in the user's language.
- Extract only the fields needed for the question. Available fields include `id`, `name`, `types`, `height`, `weight`, `abilities`, `stats`, `moves`, and `sprites`.
- State the PokeAPI endpoint used in the response.
- If PokeAPI is unavailable, say that the information cannot be verified and do not substitute unverified facts.
