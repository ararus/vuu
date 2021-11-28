import React, { useRef, useState } from 'react';
import { ComponentAnatomy as RenderVisualiser } from '@heswell/component-anatomy';
import {
  ContextMenu,
  ContextMenuProvider,
  MenuItem,
  MenuItemGroup,
  Separator,
  useContextMenu
} from '@vuu-ui/ui-controls';

import { Flexbox } from '@vuu-ui/layout';

const story = {
  title: 'UI Controls/ContextMenu',
  component: ContextMenu
};

export default story;

const SampleContextMenu = (props) => (
  <ContextMenu {...props}>
    <MenuItemGroup label="Item 1">
      <MenuItem action="ACT 1.1">Item 1.1</MenuItem>
      <MenuItem>Item 1.2</MenuItem>
      <MenuItem>Item 1.3</MenuItem>
      <Separator />
      <MenuItem>Item 1.4</MenuItem>
      <MenuItem>Item 1.5</MenuItem>
    </MenuItemGroup>
    <MenuItem action="ACT 2" options={{ name: 'petie' }}>
      Item 2
    </MenuItem>
    <MenuItemGroup label="Item 3">
      <MenuItemGroup label="Item 3.1">
        <MenuItem>Item 3.1.1</MenuItem>
        <MenuItem>Item 3.1.2</MenuItem>
        <MenuItem>Item 3.1.3</MenuItem>
        <MenuItem action="ACT 3.1.4">Item 3.1.4</MenuItem>
      </MenuItemGroup>
      <MenuItem>Item 3.2</MenuItem>
      <MenuItem>Item 3.3</MenuItem>
      <MenuItem>Item 3.3</MenuItem>
    </MenuItemGroup>
  </ContextMenu>
);

export const DefaultContextMenu = () => {
  const handleClose = (action, options) => {
    console.log(`clicked menu action ${action}`, options);
  };

  return (
    <div
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        gap: 100,
        position: 'absolute',
        top: 100,
        left: 100
      }}>
      <SampleContextMenu onClose={handleClose} />
      <SampleContextMenu onClose={handleClose} position={{ x: 300, y: 100 }} withPortal />
    </div>
  );
};

export const WithVisualiser = () => (
  <RenderVisualiser>
    <SampleContextMenu withPortal />
  </RenderVisualiser>
);

const Id = ({ children }) => <span style={{ color: 'grey' }}>({children})</span>;

export const AdditionalNesting = () => (
  <div style={{ position: 'absolute', top: 100, left: 100, display: 'flex' }}>
    <ContextMenu>
      <MenuItemGroup label="Item 1 #0">
        <MenuItem>
          Item 1.1 <Id>#0.0</Id>
        </MenuItem>
        <MenuItem>
          Item 1.2 <Id>#0.1</Id>
        </MenuItem>
        <MenuItem>
          Item 1.3 <Id>#0.2</Id>
        </MenuItem>
        <Separator />
        <MenuItem>
          Item 1.4 <Id>#0.3</Id>
        </MenuItem>
        <MenuItem>
          Item 1.5 <Id>#0.4</Id>
        </MenuItem>
      </MenuItemGroup>
      <MenuItemGroup label="Item 2 #1">
        <MenuItemGroup label="Item 2.1 #1.0">
          <MenuItem>Item 2.1.0</MenuItem>
          <MenuItem>Item 2.1.1</MenuItem>
          <MenuItem>Item 2.1.2</MenuItem>
          <Separator />
          <MenuItem>Item 2.1.4</MenuItem>
          <MenuItem>Item 2.1.5</MenuItem>
        </MenuItemGroup>
        <MenuItem>Item 2.2 #1.1</MenuItem>
        <MenuItem>Item 2.3 #1.2</MenuItem>
        <MenuItem>Item 2.4 #1.0</MenuItem>
        <MenuItem>Item 2.5 #1.0</MenuItem>
      </MenuItemGroup>
      <MenuItemGroup label="Item 3 #2">
        <MenuItem>Item 3.1</MenuItem>
        <MenuItem>Item 3.2</MenuItem>
        <MenuItem>Item 3.3</MenuItem>
        <Separator />
        <MenuItem>Item 3.4</MenuItem>
        <MenuItem>Item 3.5</MenuItem>
      </MenuItemGroup>
      <MenuItemGroup label="Item 4 #3">
        <MenuItem>Item 4.1</MenuItem>
        <MenuItem>Item 4.2</MenuItem>
        <MenuItem>Item 4.3</MenuItem>
        <Separator />
        <MenuItem>Item 4.4</MenuItem>
        <MenuItem>Item 4.5</MenuItem>
      </MenuItemGroup>
      <MenuItemGroup label="Item 5 #4">
        <MenuItemGroup label="Item 5.1 #4.0">
          <MenuItem>Item 5.1.1</MenuItem>
          <MenuItem>Item 5.1.2</MenuItem>
          <MenuItem>Item 5.1.3</MenuItem>
          <MenuItem>Item 5.1.4</MenuItem>
        </MenuItemGroup>
        <MenuItem>Item 5.2</MenuItem>
        <MenuItem>Item 5.3</MenuItem>
        <MenuItem>Item 5.4</MenuItem>
      </MenuItemGroup>
    </ContextMenu>
  </div>
);

export const ContextMenuPopup = () => {
  const [position, setPosition] = useState(null);
  const ref = useRef(null);
  const keyboardNav = useRef(false);

  const handleClick = (evt) => {
    if (evt.pageX && evt.pageY) {
      setPosition({ x: evt.pageX, y: evt.pageY });
    } else {
      const { bottom, left, width } = ref.current.getBoundingClientRect();
      keyboardNav.current = true;
      setPosition({ x: left + width / 2, y: bottom });
    }
  };

  const handleClose = (menuId) => {
    console.log(`closed with menuId ${menuId}`);
    setPosition(null);
  };

  const getContextMenu = () => {
    return position ? (
      <ContextMenu
        position={position}
        activatedWithKeyboard={keyboardNav.current}
        onClose={handleClose}>
        <MenuItemGroup label="Item 1">
          <MenuItem>Item 1.1</MenuItem>
          <MenuItem>Item 1.2</MenuItem>
          <MenuItem>Item 1.3</MenuItem>
          <Separator />
          <MenuItem>Item 1.4</MenuItem>
          <MenuItem>Item 1.5</MenuItem>
        </MenuItemGroup>
        <MenuItem>Item 2</MenuItem>
        <MenuItemGroup label="Item 3">
          <MenuItemGroup label="Item 3.1">
            <MenuItem>Item 3.1.1</MenuItem>
            <MenuItem>Item 3.1.2</MenuItem>
            <MenuItem>Item 3.1.3</MenuItem>
            <MenuItem>Item 3.1.4</MenuItem>
          </MenuItemGroup>
          <MenuItem>Item 3.2</MenuItem>
          <MenuItem>Item 3.3</MenuItem>
          <MenuItem>Item 3.3</MenuItem>
        </MenuItemGroup>
      </ContextMenu>
    ) : null;
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <button onClick={handleClick} ref={ref}>
        Show Context Menu
      </button>
      {getContextMenu()}
    </div>
  );
};

const ComponentWithMenu = ({ location, ...props }) => {
  const showContextMenu = useContextMenu();
  const handleContextMenu = (e) => {
    console.log('handleContextMenu');
    showContextMenu(e, location, { type: 'outer' });
  };
  return <div {...props} onContextMenu={handleContextMenu} />;
};

export const SimpleContextMenuProvider = () => {
  const menuDescriptors = [
    { label: 'Sort', action: 'sort' },
    { label: 'Filter', action: 'sort' },
    { label: 'Group', action: 'group' }
  ];

  const handleMenuAction = (type, options) => {
    console.log(`handleContextMenu ${type}`, options);
  };

  const menuBuilder = () => menuDescriptors;

  return (
    <ContextMenuProvider menuBuilder={menuBuilder} menuActionHandler={handleMenuAction}>
      <ComponentWithMenu
        style={{ height: 200, width: 200, backgroundColor: 'yellow' }}
        location="right"
      />
    </ContextMenuProvider>
  );
};

export const ContextMenuProviderWithLocationAwareMenuBuilder = () => {
  const menuDescriptors = [
    { label: 'Sort', action: 'sort', icon: 'sort' },
    { label: 'Filter', action: 'filter', icon: 'filter' },
    { label: 'Group', action: 'group' },
    { label: 'Left 1', action: 'left1', location: 'left' },
    { label: 'Left 2', action: 'left2', location: 'left' },
    {
      label: 'Right1',
      action: 'right1',
      location: 'right',
      children: [
        { label: 'Right 1.1', action: 'right1.1', location: 'right' },
        { label: 'Right 1.2', action: 'right1.2', location: 'right' }
      ]
    }
  ];

  const handleMenuAction = (type, options) => {
    console.log(`handleContextMenu ${type}`, options);
  };

  const menuBuilder = (location, options) =>
    menuDescriptors.filter(
      (descriptor) => descriptor.location === undefined || descriptor.location === location
    );

  const localMenuBuilder = (location, options) => {
    return [
      { label: 'Red 1', action: 'left1', location: 'left' },
      { label: 'Red 2', action: 'left2', location: 'left' }
    ];
  };

  return (
    <ContextMenuProvider menuBuilder={menuBuilder} menuActionHandler={handleMenuAction}>
      <Flexbox style={{ width: 400, height: 200 }}>
        <ComponentWithMenu style={{ flex: 1, backgroundColor: 'red' }} location="left" />
        <ContextMenuProvider menuBuilder={localMenuBuilder}>
          <ComponentWithMenu style={{ flex: 1, backgroundColor: 'yellow' }} location="right" />
        </ContextMenuProvider>
      </Flexbox>
    </ContextMenuProvider>
  );
};
