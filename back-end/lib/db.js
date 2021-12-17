
const { v4: uuid } = require('uuid')
const { clone, merge } = require('mixme')
const microtime = require('microtime')
const level = require('level')
const db = level(__dirname + '/../db')

const api = {
  channels: {
    create: async (channel) => {
      if (!channel.name) throw Error('Invalid channel')
      const id = uuid()
      await db.put(`channels:${id}`, JSON.stringify(channel))
      return merge(channel, { id: id })
    },
    get: async (id) => {
      if (!id) throw Error('Invalid id')
      const data = await db.get(`channels:${id}`)
      const channel = JSON.parse(data)
      return merge(channel, { id: id })
    },
    list: async (user) => {
      return new Promise((resolve, reject) => {
        const channels = []
        db.createReadStream({
          gt: "channels:",
          lte: "channels" + String.fromCharCode(":".charCodeAt(0) + 1),
        }).on('data', ({ key, value }) => {
          channel = JSON.parse(value)
          channel.id = key.split(':')[1]

          const listOfUsers = channel.listOfUsers.split(',')
          listOfUsers.forEach(element => {
            if (element === user) {
              channels.push(channel)
            }
          });
        }).on('error', (err) => {
          reject(err)
        }).on('end', () => {
          resolve(channels)
        })
      })
    },
    update: async (channel) => {
      if (!channel.id) throw Error("Invalid channel");
      await db.put(`channels:${channel.id}`, JSON.stringify(channel));
      return merge(channel, { id: channel.id });
    },
    delete: async (id, creator) => {
      if (!id) throw Error("Invalid channel");
      const channel = await api.channels.get(id)
      if (channel.creator !== creator) throw Error("Not the creator of the channel you want to delete")
      await db.del(`channels:${id}`, (err) => {
        if (err) console.log(err);
      });
    }
  },
  messages: {
    create: async (channelId, message) => {
      if (!channelId) throw Error('Invalid channel')
      if (!message.author) throw Error('Invalid message')
      if (!message.content) throw Error('Invalid message')
      creation = microtime.now()
      await db.put(`messages:${channelId}:${creation}`, JSON.stringify({
        author: message.author,
        content: message.content
      }))
      return merge(message, { channelId: channelId, creation: creation })
    },

    list: async (channelId) => {
      return new Promise((resolve, reject) => {
        const messages = []
        db.createReadStream({
          gt: `messages:${channelId}:`,
          lte: `messages:${channelId}` + String.fromCharCode(":".charCodeAt(0) + 1),
        }).on('data', ({ key, value }) => {
          message = JSON.parse(value)
          const [, channelId, creation] = key.split(':')
          message.channelId = channelId
          message.creation = creation
          messages.push(message)
        }).on('error', (err) => {
          reject(err)
        }).on('end', () => {
          resolve(messages)
        })
      })
    },
    update: async (newMessage, channelId, creation) => {
      if (!channelId) throw Error("Invalid channel");
      await db.put(`messages:${channelId}:${creation}`, JSON.stringify(newMessage));
      const messages = await api.messages.list(channelId)
      const message = messages.find(message => message.creation === creation)
      if (message.author != newMessage.author) throw Error('Invalid user')
      return merge(newMessage, { channelId: channelId, creation: creation });
    },
    delete: async (author, channelId, creation) => {
      if (!channelId) throw Error('Invalid channel')
      const messages = await api.messages.list(channelId)
      const message = messages.find(message => message.creation === creation)
      if (message.author !== author) throw Error('Invalid user')
      await db.del(`messages:${channelId}:${creation}`)
    },
  },
  users: {
    create: async (user) => {
      if (!user.username) throw Error('Invalid user')
      const id = uuid()
      await db.put(`users:${id}`, JSON.stringify(user))
      return merge(user, { id: id })
    },
    get: async (id) => {
      if (!id) throw Error('Invalid id')
      const data = await db.get(`users:${id}`)
      const user = JSON.parse(data)
      return merge(user, { id: id })
    },
    list: async () => {
      return new Promise((resolve, reject) => {
        const users = []
        db.createReadStream({
          gt: "users:",
          lte: "users" + String.fromCharCode(":".charCodeAt(0) + 1),
        }).on('data', ({ key, value }) => {
          user = JSON.parse(value)
          user.id = key.split(':')[1]
          users.push(user)
        }).on('error', (err) => {
          reject(err)
        }).on('end', () => {
          resolve(users)
        })
      })
    },
    update: (id, user) => {
      const original = store.users[id]
      if (!original) throw Error('Unregistered user id')
      store.users[id] = merge(original, user)
    },
    delete: (id, user) => {
      const original = store.users[id]
      if (!original) throw Error('Unregistered user id')
      delete store.users[id]
    }
  },
  admin: {
    clear: async () => {
      await db.clear()
    }
  }
}

module.exports = api