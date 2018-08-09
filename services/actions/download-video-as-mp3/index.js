const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

module.exports = {
  name: 'Download Video as MP3',
  slug: 'download_video_as_mp3',
  perform: async query => {
    const { url } = query.actionFields
    console.log(url)

    try {
      const { stdout, stderr } = await exec(`youtube-dl "${url}"`)
      console.log(stdout, stderr)
    } catch (err) {
      throw new Error('failed to download video from the url')
    }

    return { url }
  },
}
