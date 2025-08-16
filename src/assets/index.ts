// Assets 资源文件导出

// 背景图片
export { default as mainBackground } from './images/backgrounds/bg.webp';

// 如果有其他背景图片，可以在这里添加
// export { default as secondaryBackground } from './images/backgrounds/secondary-bg.jpg';

// 图标资源
// export { default as appIcon } from './images/icons/app-icon.svg';

// Logo资源
// export { default as appLogo } from './images/logos/app-logo.svg';

// 字体资源
// export { default as customFont } from './fonts/custom-font.woff2';

// 数据资源
// export { default as configData } from './data/config.json';

// 资源路径常量
export const ASSET_PATHS = {
  images: {
    backgrounds: '/src/assets/images/backgrounds/',
    icons: '/src/assets/images/icons/',
    logos: '/src/assets/images/logos/',
  },
  fonts: '/src/assets/fonts/',
  data: '/src/assets/data/',
} as const;

// 资源类型定义
export interface AssetPaths {
  images: {
    backgrounds: string;
    icons: string;
    logos: string;
  };
  fonts: string;
  data: string;
}