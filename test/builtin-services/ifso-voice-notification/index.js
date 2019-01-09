const { chromeCast } = require('./util/chrome-cast')

module.exports = {
  slug: 'voice-notification',
  meta: {
    name: 'Voice Notification',
    params: [
      {
        name: 'text',
        description: 'Text to translate',
      },
      {
        name: 'language',
        description: 'Target language',
      },
    ],
  },
  action: async ({ actionFields }) => {
    const { text, language } = actionFields

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
