const React = require('react');

const children = [
  React.createElement('option', { value: '1' }, 'One'),
  [
    React.createElement('option', { value: '2' }, 'Two'),
    React.createElement('option', { value: '3' }, 'Three')
  ],
  React.createElement(React.Fragment, null, [
    React.createElement('option', { value: '4' }, 'Four')
  ])
];

const arr = React.Children.toArray(children);
console.log(arr.map(c => typeof c.type === 'symbol' ? 'Fragment' : c.type));
