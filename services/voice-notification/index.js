const { chromeCast } = require('./util/chrome-cast')

module.exports = {
  name: 'Voice Notification',
  slug: 'voice_notification',
  action: async query => {
    const { text, language } = query.actionFields

    if (!text) {
      throw new Error('no text given')
    }

    try {
      const res = await chromeCast(text, language || 'en')
      console.log('res', res)
    } catch (err) {
      throw new Error('failed to cast the message on Google Home')
    }

    return { text, language }
  },
}
