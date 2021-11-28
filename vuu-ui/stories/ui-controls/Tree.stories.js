import React from 'react';
import { ComponentAnatomy } from '@heswell/component-anatomy';

import { Tree } from '@vuu-ui/ui-controls';
import { usa_states_cities, groupByInitialLetter } from './usa_states';

export default {
  title: 'UI Controls/Tree',
  component: Tree
};

export const SimpleTree = () => {
  const handleChange = (e, selected) => {
    console.log(`selected ${selected.join(',')}`);
  };
  return (
    <div style={{ width: 900, height: 900, display: 'flex', gap: 50, alignItems: 'flex-start' }}>
      <input type="text" />
      <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}>
        <Tree
          onSelectionChange={handleChange}
          source={groupByInitialLetter(usa_states_cities, 'groups-only')}
        />
      </div>
      {/* <div
        style={{
          fontFamily: 'Roboto',
          width: 150,
          height: 400,
          maxHeight: 400,
          position: 'relative',
          border: 'solid 1px #ccc'
        }}
      >
        <Tree
          groupSelection="single"
          source={groupByInitialLetter(usa_states_cities, 'groups-only')}
        />
      </div> */}
      <input type="text" />
    </div>
  );
};

export const SimpleTreeWithAnatomy = () => {
  const source = [
    {
      label: 'Fruits',
      childNodes: [
        { label: 'Oranges' },
        { label: 'Pineapple' },
        {
          label: 'Apples',
          childNodes: [{ label: 'Macintosh' }, { label: 'Granny Smith' }, { label: 'Fuji' }]
        },
        { label: 'Bananas' },
        { label: 'Pears' }
      ]
    },
    { label: 'Vegatables' },
    { label: 'Grain' }
  ];

  return (
    <>
      <input type="text" />
      <ComponentAnatomy style={{ width: 1100 }}>
        <Tree source={source} />
      </ComponentAnatomy>
    </>
  );
};
