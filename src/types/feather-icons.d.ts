// types/feather-icons.d.ts
declare module 'feather-icons' {
  const feather: {
    icons: {
      [key: string]: {
        toSvg: (options?: { [key: string]: any }) => string;
      };
    };
  };
  export default feather;
}
