import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const screenHeight = width < height ? height : width;
const screenWidth = width < height ? width : height;
const screenWidthAssume = 360;

export const AppSizes = {
  screen: {
    height: screenHeight,
    width: screenWidth,
    widthAssume: screenWidthAssume,
  },
};

export const widthRatio = (() => {
  const cache: Record<number, number> = {};

  return (inputWidth: number): number => {
    if (!cache[inputWidth]) {
      cache[inputWidth] = (inputWidth / screenWidthAssume) * AppSizes.screen.width;
    }
    return cache[inputWidth];
  };
})();
