const NatureRemo = require('nature-remo')

module.exports = {
  name: 'Brighten Up',
  slug: 'brighten_up',
  perform: async query => {
    const { threshold } = query.triggerFields
    const client = new NatureRemo.Cloud(process.env.NATURE_REMO_CLOUD_API_TOKEN)
    const devices = await client.getDevices()
    const { val, created_at } = devices[0].newest_events.il
    console.log('brightness', val)
    if (val > threshold) {
      return { brightness: val, created_at }
    }
    return {}
  },
}
