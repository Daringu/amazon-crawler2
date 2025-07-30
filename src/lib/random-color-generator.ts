export const generateRandomColor = () => {
  const r = Math.floor(200 + Math.random() * 55); // 200–255
  const g = Math.floor(200 + Math.random() * 55);
  const b = Math.floor(200 + Math.random() * 55);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};
