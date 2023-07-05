import * as fs from 'fs'
import { readdirSync, unlinkSync, renameSync } from 'fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { sleep } from './src/system/utils'

const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'))

async function postbuild() {
  const bins = readdirSync('bin')

  for (const filename of bins) {
    const name = filename.replace('.exe', '')
    renameSync(`bin/${filename}`, `bin/automator`)
    await sleep(1)
    await promisify(exec)(`cd bin && tar -cvzf ${name}-v${version}.tar.gz automator`)
    unlinkSync(`bin/automator`)
  }
}

postbuild().then(() => console.log(`Build prepared!`))
