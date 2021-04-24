import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { TabsCards } from './tabs-cards';

describe('TabsCards', () => {
  test('renders correctly when there are no values', () => {
    const { container } = render(<TabsCards values={[]} />);

    expect(container).toMatchSnapshot();
  });

  test('renders correctly with values', () => {
    const values = [
      {
        name: 'Some name 1',
        content: <div>Some content 1</div>,
      },
      {
        name: 'Some name 2',
        content: <div>Some content 2</div>,
      },
    ];

    const { container } = render(<TabsCards tabType="line" values={values} />);

    expect(container).toMatchSnapshot();
  });
});
