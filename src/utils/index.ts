/** 
 判断一个字符串是否是远程资源链接（以 http:// 或 https:// 开头）
*/
export function isRemoteSource(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}