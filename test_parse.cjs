const React = require('react');

const child = React.createElement('option', { value: '1' }, 'Shop Name', ' (', '123', '...)');
const propsChildren = child.props.children;
const childrenText = Array.isArray(propsChildren) ? propsChildren.join('') : propsChildren;
console.log(childrenText);
