import { fetchUrl } from '../../utils/fetch.ts';
import { toMap } from '../../utils/json.ts';
export const getDocument = async (url: string): Promise<InterfaceInfo> => {
    const swaggerDocument = await fetchUrl(url);
    const map = toMap(swaggerDocument);
    return map;
}
