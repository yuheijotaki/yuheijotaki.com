// types/feather-icons.d.ts
declare module 'feather-icons' {
  const feather: {
    icons: {
      [key: string]: {
        toSvg: () => string;
      };
    };
  };
  export default feather;
}
