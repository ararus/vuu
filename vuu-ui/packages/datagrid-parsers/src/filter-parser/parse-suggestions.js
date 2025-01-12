/* eslint-disable no-throw-literal */
import * as c3 from 'antlr4-c3';
import { FilterParser } from '../../generated/parsers/filter/FilterParser';
import { computeTokenIndexAndText } from './parse-utils';

const getOperatorToken = (parsedTokens) => {
  if (parsedTokens.length > 1) {
    const [nextLastToken, lastToken] = parsedTokens.slice(-2);
    if (lastToken.type === 'operator') {
      return lastToken;
    } else if (nextLastToken.type === 'operator') {
      return nextLastToken;
    }
  }
};

const textValue = (text) => (text.startsWith("'") ? text.slice(1, -1).toLowerCase() : text);

const maybeSuggest = (suggestion, text, lastToken, suggestions) => {
  // ID_ tokens are typed substitutions
  if (!suggestion.startsWith('ID_') && tokenMatches(suggestion, text)) {
    suggestions.push({
      value: suggestion,
      completion: getCompletion(suggestion, lastToken)
    });
  }
};

const fullMatchOnOnlyCandidate = (suggestions, text) =>
  suggestions.length === 1 && suggestions[0].value.toLowerCase() === text.toLowerCase();

function tokenMatches(completion, text) {
  const lcCompletion = completion.toLowerCase();
  const lcText = text === '' ? text : text.toLowerCase();
  return lcText.trim().length === 0 || (lcCompletion.startsWith(lcText) && lcCompletion !== lcText);
}

const getCompletion = (suggestion, lastTokenText) => {
  if (suggestion.startsWith(lastTokenText)) {
    return suggestion.slice(lastTokenText.length);
  } else {
    return suggestion;
  }
};

const identity = (val) => val;

export const getSuggestions = (
  parser,
  parseTree,
  caretPosition,
  suggestionProvider,
  parseResult,
  parsedTokens,
  isList = false
) => {
  const core = new c3.CodeCompletionCore(parser);
  core.preferredRules = new Set([
    FilterParser.RULE_column,
    FilterParser.RULE_filtername,
    FilterParser.RULE_named_filter,
    FilterParser.RULE_atom
  ]);
  core.ignoredTokens = new Set([FilterParser.LPAREN]);

  let { text, index, alternative } = computeTokenIndexAndText(parser, parseTree, caretPosition);
  // onsole.log(
  //   `[parseSuggestions] %ccollect candidates, token text='${text}', caret at ${caretPosition}, token at ${index} isList ${isList}
  //   %calternative ${JSON.stringify(alternative)}
  // `,
  //   'color:red;font-weight: bold;',
  //   'color:black;font-weight: bold;s'
  // );

  let rules, tokens;
  let alternativeText, alternativeRules, alternativeTokens;
  let currentMatchIsListItem = isList;

  ({ rules, tokens } = core.collectCandidates(index));
  // The rules, tokens maps returned by collectCandidates are stateful and mutable
  tokens = new Map(tokens);
  rules = new Map(rules);

  if (alternative) {
    ({ text: alternativeText } = alternative);
    ({ rules: alternativeRules, tokens: alternativeTokens } = core.collectCandidates(
      alternative.index
    ));
  }

  const ruleCount = rules.size + (alternativeRules?.size ?? 0);
  const tokenCount = tokens.size + (alternativeTokens?.size ?? 0);

  // onsole.log(
  //   `
  //     rules ${rules.size} tokens ${tokens.size}
  //     alternativeRules ${alternativeRules?.size ?? 0} alternativeTokens ${
  //     alternativeTokens?.size ?? 0
  //   } alternativeText = '${alternativeText}'
  //   `,
  //   alternativeTokens
  // );

  if (ruleCount === 0 && tokenCount === 0) {
    return [];
  } else if (tokens.size === 1 && tokensIsListOpener(tokens)) {
    // auto inject the '[' and re-parse
    throw { type: 'open-list', text: '[' };
  } else if (tokens.size === 2 && tokensAreListSignifiers(tokens)) {
    // do nothing;
  } else if (alternativeTokens?.size === 1 && tokensIsListOpener(alternativeTokens)) {
    currentMatchIsListItem = true;
  } else if (alternativeTokens?.size === 2 && tokensAreListSignifiers(alternativeTokens)) {
    currentMatchIsListItem = true;
  }

  let suggestions = new AsyncList();
  let ignoreTokens = false;
  const [lastToken = { text: '' }] = parser.inputStream.tokens.slice(-2);

  if (rules.has(FilterParser.RULE_filtername)) {
    suggestions.push(suggestionProvider(parseResult, { token: 'FILTER-NAME', text }));
  } else if (rules.has(FilterParser.RULE_named_filter)) {
    suggestions.push(suggestionProvider(parseResult, { token: 'NAMED-FILTER', text }));
  }

  if (rules.has(FilterParser.RULE_column)) {
    suggestions.push(suggestionProvider(parseResult, { token: 'COLUMN-NAME', text }));
  } else if (alternativeRules?.has(FilterParser.RULE_column)) {
    const expandedSuggestions = suggestionProvider(parseResult, {
      token: 'COLUMN-NAME',
      text: alternativeText
    });
    if (
      expandedSuggestions.length &&
      !fullMatchOnOnlyCandidate(expandedSuggestions, alternativeText)
    ) {
      suggestions.push(expandedSuggestions);
      ignoreTokens = true;
    }
  }
  if (rules.has(FilterParser.RULE_atom)) {
    const operatorToken = getOperatorToken(parsedTokens);
    console.log(`operator token `, operatorToken);
    suggestions.push(
      suggestionProvider(parseResult, {
        token: 'COLUMN-VALUE',
        operator: operatorToken?.text ?? '',
        text,
        isListItem: currentMatchIsListItem
      })
    );
  }

  if (!ignoreTokens) {
    tokens.forEach((_, key) => {
      let candidate;
      if (key === FilterParser.RULE_column) {
        // ignore
      } else {
        candidate = textValue(parser.vocabulary.getDisplayName(key));
      }

      if (candidate) {
        maybeSuggest(candidate, text, lastToken.text, suggestions);
      }
    });
  }

  if (suggestions.size === 0 && alternativeTokens?.size > 0 && alternativeText) {
    alternativeTokens.forEach((_, key) => {
      const candidate = textValue(parser.vocabulary.getDisplayName(key));
      if (candidate) {
        maybeSuggest(candidate, alternativeText, lastToken.text, suggestions);
      }
    });
  }

  return suggestions.toArray();
};

class AsyncList {
  #list = [];
  push(item) {
    this.#list.push(item);
    return this;
  }
  get size() {
    return this.#list.length;
  }
  async toArray() {
    const values = await Promise.all(this.#list);
    return values.flatMap(identity);
  }
}

function tokensAreListSignifiers(tokens) {
  const [t1, t2] = tokens.keys();
  if (t1 === FilterParser.COMMA && t2 === FilterParser.RBRACK) {
    return true;
  }
}

function tokensIsListOpener(tokens) {
  const [token] = tokens.keys();
  return token === FilterParser.LBRACK;
}
