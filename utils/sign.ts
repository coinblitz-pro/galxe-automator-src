import * as fs from 'fs'
import { sign } from '../src/system/license'

const PRIVATE_KEY = fs.readFileSync('./keys/private.pem', 'utf8')

console.log(sign(process.argv[2], PRIVATE_KEY))
