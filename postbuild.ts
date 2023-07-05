import archiver from 'archiver'
import * as fs from 'fs'
import { readdirSync, unlinkSync } from 'fs'

const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'))

async function postbuild() {
  const bins = readdirSync('bin')

  for (const bin of bins) {
    const name = bin.replace('.exe', '')
    console.log(`bin/${name}-v${version}.zip`)

    const output = fs.createWriteStream(`bin/${name}-v${version}.zip`)
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(output)
    archive.append(fs.createReadStream(`bin/${bin}`), { name: bin })
    archive.finalize()

    await new Promise(resolve => output.on('close', resolve))

    unlinkSync(`bin/${bin}`)
  }
}

postbuild().then(() => console.log(`Build prepared!`))
