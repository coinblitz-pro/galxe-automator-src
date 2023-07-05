import * as fs from 'fs'
import { readdirSync, readFileSync, renameSync, unlinkSync } from 'fs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { sleep } from '../src/system/utils'

const md5 = require('md5')

const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'))

async function postbuild() {
  const bins = readdirSync('bin')

  for (const filename of bins) {
    const name = filename.replace('.exe', '')
    const archive = `${name}-v${version}.tar.gz`
    renameSync(`bin/${filename}`, `bin/automator`)
    await sleep(1)
    await promisify(exec)(`cd bin && tar -cvzf ${archive} automator`)
    unlinkSync(`bin/automator`)
    console.log(`${archive}: ${md5(readFileSync(`bin/${archive}`))}`)
  }
}

postbuild().then(() => console.log(`Build prepared!`))
