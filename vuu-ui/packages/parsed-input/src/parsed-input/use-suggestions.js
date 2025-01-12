import { useCallback, useRef } from 'react';
import { getCompletion } from './input-utils';

const LIST_COMPLETE = {
  id: 'end-of-list',
  value: ']',
  completion: ']',
  displayValue: 'My list is complete',
  isListItem: true
};

// search predicate
const findComplete = (s) => s.value === 'EOF' || s.value === ']';

const mapidsToValues = (items, ids) => ids.map((id) => items.find((s) => s.id === id)?.value);

const sortSelectedSuggestions = (selectedIds, suggestions) => {
  const sortedSuggestions = suggestions
    .slice()
    .sort(({ value: v1, id: i1 }, { value: v2, id: i2 }) => {
      const s1 = selectedIds.includes(i1) ? 1 : 0;
      const s2 = selectedIds.includes(i2) ? 1 : 0;

      if (s1 === s2) {
        if (v1 === ']') {
          return -1;
        } else if (v2 === ']') {
          return 0;
        } else if (v1 > v2) {
          return 0;
        } else {
          return -1;
        }
      } else {
        return s2 - s1;
      }
    });

  return sortedSuggestions;
};

// TODO when we backspace into a set of selections, how do we build the selected state from the existing entries ?
export const useSuggestions = ({
  onCommit,
  setCurrentText,
  setHighlighted,
  setText,
  setVisibleData,
  textRef,
  indexPositions
}) => {
  const suggestionProposed = useRef('');
  const selectedValues = useRef([]);
  const isMultiSelect =
    indexPositions.length > 0 && indexPositions.every((suggestion) => suggestion.isListItem);

  const isCompleteSelected = useCallback(
    (selectedId) => selectedId === indexPositions.find(findComplete)?.id,
    [indexPositions]
  );

  const handleSuggestionSelection = useCallback(
    (evt, selectedIds) => {
      const textRoot = textRef.current;
      const [lastSelectedId] = selectedIds.slice(-1);
      if (isCompleteSelected(lastSelectedId)) {
        if (isMultiSelect) {
          // we've completed our selection from this list
          setCurrentText(textRoot + '] ');
          setText(textRoot + '] ');
          selectedValues.current = [];
          // setSelected([]);
          // same hack as below
          return [];
        } else {
          // we've completed our whole input
          onCommit && onCommit();
        }
      } else {
        const cursorAtEndOfText = false;
        const [suggestedText, parserText = suggestedText] = getCompletion(
          indexPositions,
          lastSelectedId,
          cursorAtEndOfText,
          selectedIds.length
        );

        if (isMultiSelect) {
          selectedValues.current = mapidsToValues(indexPositions, selectedIds);
          const containsCloseList = indexPositions.find((s) => s.value === ']');

          let updatedSuggestions = indexPositions;

          if (selectedIds.length > 0 && !containsCloseList) {
            // TODO have to be careful with new values - existing selection must be preserved
            updatedSuggestions = indexPositions.concat(LIST_COMPLETE);
          } else if (selectedIds.length < 1 && containsCloseList) {
            updatedSuggestions = indexPositions.filter((s) => s !== LIST_COMPLETE);
          }

          // If we sort, we're going to have to change the selection
          updatedSuggestions = sortSelectedSuggestions(selectedIds, updatedSuggestions);
          // The order of these statements is important
          setVisibleData(updatedSuggestions);
          setCurrentText(textRoot + suggestedText);
          setText(textRoot + suggestedText);
          // setSelected(updatedSelected);
          const indexOfCommit = updatedSuggestions.findIndex(findComplete);
          setHighlighted(indexOfCommit);
          // bit of a hack here, see if we can't find a better way
          return selectedIds;
        } else {
          setCurrentText(textRoot + suggestedText);
          setText(textRoot + suggestedText + ' ', textRoot + parserText + ' ');
          suggestionProposed.current = '';
        }
      }
    },
    [
      isCompleteSelected,
      isMultiSelect,
      onCommit,
      setCurrentText,
      setHighlighted,
      setText,
      setVisibleData,
      indexPositions,
      textRef
    ]
  );

  // const handleSuggestionNavigation = (evt, idx) => {
  //   if (isMultiSelect) {
  //     const selectedSuggestions = selected.map((idx) => sourceWithIds[idx].completion);
  //     selectedSuggestions.push(sourceWithIds[idx].completion);
  //   } else {
  //     const { completion } = sourceWithIds[idx];
  //     // TODO need to strip off previous suggestion
  //     suggestionProposed.current = completion;
  //     const textRoot = textRef.current;
  //     setCurrentText(textRoot + completion);
  //   }
  // };

  return {
    acceptSuggestion: handleSuggestionSelection,
    isMultiSelect,
    // navigationHandlers: {
    //   onKeyboardNavigation: handleSuggestionNavigation
    // },
    suggestionProposed
  };
};
