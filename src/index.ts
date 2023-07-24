import { cli } from './cli'
import { bootstrap } from './system/bootstrap'

bootstrap().then(() => cli())
