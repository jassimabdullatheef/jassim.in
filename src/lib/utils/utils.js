// Returns the mouse position
const getMousePos = (e) => {
  return {
    x: e.clientX,
    y: e.clientY,
  };
};

// Returns the window width and height
const getWinSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const isFirefox = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
};

export { getMousePos, getWinSize, isFirefox };
