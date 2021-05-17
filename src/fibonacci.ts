const cache = {};
const fibonacci = (i: number): number => {
  return i <= 1 ? i : fibonacci(i - 1) + fibonacci(i - 2);
};

// try it next
// https://mdn.github.io/dom-examples/web-crypto/encrypt-decrypt/index.html
export default fibonacci;
