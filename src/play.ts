
import fs from 'fs/promises';   
import { generateInterfaceCode } from './utils/generate.ts';
import { getDocument } from './tools/json-to-ts/remote.ts';
const a =await getDocument('http://localhost:13012/api-docs.json')

generateInterfaceCode(a, "Users")
fs.writeFile('./output.ts', generateInterfaceCode(a, "Users"), 'utf-8')

