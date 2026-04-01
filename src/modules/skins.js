
export const SKINS = [
  { id: 'cow', name: '奶牛猫', image: './assets/奶牛猫.png', happyImage: './assets/奶牛猫成功.png', sadImage: './assets/奶牛猫失败.png', unlockCost: 0},
  { id: 'orange', name: '橘猫', image: './assets/橘猫.png', happyImage: './assets/橘猫成功.png', sadImage: './assets/橘猫失败.png' , unlockCost: 2000},
  { id: 'tabby', name: '狸花猫', image: './assets/狸花猫.png', happyImage: './assets/狸花猫成功.png', sadImage: './assets/狸花猫失败.png' , unlockCost: 2000},
  { id: 'white', name: '白猫', image: './assets/白猫.png', happyImage: './assets/白猫成功.png', sadImage: './assets/白猫失败.png' , unlockCost: 2000},
  { id: 'black', name: '黑猫', image: './assets/黑猫.png', happyImage: './assets/黑猫成功.png', sadImage: './assets/黑猫失败.png' , unlockCost: 2000}
];

export function getAllSkins() {
  return SKINS;
}
