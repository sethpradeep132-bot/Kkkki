const assert = require('assert');

let riderData = {
  avatar: "",
  riderName: ""
};

// Simulate user upload
const setRiderData = (updater) => {
  if (typeof updater === 'function') {
    riderData = updater(riderData);
  } else {
    riderData = updater;
  }
};

// AvatarUpload sets URL
setRiderData(prev => ({ ...prev, avatar: 'http://test' }));

// Simulate typing
setRiderData({ ...riderData, riderName: 'Rider1' });

console.log(riderData);
