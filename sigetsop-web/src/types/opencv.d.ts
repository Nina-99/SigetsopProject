declare module "opencv.js" {
  const cv: any;
  export default cv;
}

declare global {
  interface Window {
    cv: any;
  }
}
