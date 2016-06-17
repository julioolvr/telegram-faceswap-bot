import StateMachine from 'javascript-state-machine'
import fs from 'fs'
import Promise from 'bluebird'
import got from 'got'

import Command from './command'
import { COMMANDS } from './command'
import { findFaceDirectory, findFacePath, allFaceNames } from './functions/findFacePath'
import * as errors from './errors'
import helpMessages from './helpMessages'
import * as swapper from './swapper'

Promise.promisifyAll(fs)

const FINAL = 'final'
const SINGLE_COMMANDS = [COMMANDS.FACE_SEARCH, COMMANDS.FACE_WITH_URL, COMMANDS.START, COMMANDS.LIST_FACES, COMMANDS.HELP]

export const EVENTS = {
  START: 'start',
  ADD: 'add',
  CANCEL: 'cancel',
  GOT_INVALID_FILE: 'invalidfile',
  GOT_FILE: 'receivefile',
  INVALID_NAME: 'invalidname',
  EXISTING_NAME: 'existingname',
  CANCEL_OVERRIDE: 'canceloverride',
  GOT_NAME: 'gotname',
  SINGLE_COMMAND: 'singlecommand'
}

function decorateFsm(target) {
  return StateMachine.create({
    initial: 'waitingmessage',
    target,
    final: FINAL,
    events: [
      { name: EVENTS.SINGLE_COMMAND, from: 'waitingmessage', to: FINAL },
      { name: EVENTS.ADD, from: 'waitingmessage', to: 'waitingpic' },
      { name: EVENTS.CANCEL, from: ['waitingpic', 'waitingname', 'overridename'], to: 'waitingmessage' },
      { name: EVENTS.GOT_INVALID_FILE, from: 'waitingpic', to: 'waitingpic' },
      { name: EVENTS.GOT_FILE, from: 'waitingpic', to: 'waitingname' },
      { name: EVENTS.INVALID_NAME, from: 'waitingname', to: 'waitingname' },
      { name: EVENTS.EXISTING_NAME, from: 'waitingname', to: 'overridename' },
      { name: EVENTS.CANCEL_OVERRIDE, from: 'overridename', to: 'waitingname' },
      { name: EVENTS.GOT_NAME, from: ['waitingname', 'overridename'], to: FINAL }
    ]
  })
}

function extractSwapParameters(command) {
  let parameters = command.getParameters()
  let faces
  let queryOrUrl

  if (parameters.length === 1) {
    queryOrUrl = parameters[0]
  } else if (parameters.length > 1) {
    faces = parameters[0].split(' ')
    queryOrUrl = parameters[1]
  }

  if (!queryOrUrl) {
    throw new errors.MissingParameterError()
  }

  return [faces, queryOrUrl]
}

export default class MessagesFsm {
  constructor(client) {
    this.client = client
    decorateFsm(this)
  }

  getEventForMessage(message) {
    const command = new Command(message)

    if (this.is('waitingmessage')) {
      if (command.getType() === COMMANDS.ADD) {
        return EVENTS.ADD
      } else if (SINGLE_COMMANDS.includes(command.getType())) {
        return EVENTS.SINGLE_COMMAND
      } else {
        return
      }
    }

    if (this.is('waitingpic')) {
      if (command.getType() !== COMMANDS.CANCEL) {
        return message.document ? EVENTS.GOT_FILE : EVENTS.GOT_INVALID_FILE
      }
    }

    if (this.is('waitingname')) {
      const name = message.text && message.text.toLowerCase()
      const validName = name && /^\w+$/.test(name)
      let existingName

      try {
        if (validName) {
          fs.accessSync(findFacePath(name, message.chat.id))
          existingName = true
        } else {
          existingName = false
        }
      } catch (e) {
        existingName = false
      }

      if (existingName) {
        return EVENTS.EXISTING_NAME
      }

      if (!validName) {
        return EVENTS.INVALID_NAME
      }

      return EVENTS.GOT_NAME
    }

    if (this.is('overridename')) {
      if (message.text && message.text.toLowerCase() === 'yes') {
        return EVENTS.GOT_NAME
      }

      if (message.text && message.text.toLowerCase() === 'no') {
        return EVENTS.CANCEL_OVERRIDE
      }
    }

    if (command.getType() === COMMANDS.CANCEL) {
      return EVENTS.CANCEL
    }
  }

  addMessage(message) {
    const event = this.getEventForMessage(message)

    if (!event || this.cannot(event)) {
      if (!this.is('waitingmessage')) {
        this.replyTo(message, 'I didn\'t expect that')
      }

      this.current = FINAL
      return false
    }

    this[event](message)
  }

  onSentMessage() {
    return this.lastMessageSent
  }

  onReplyReceived() {
    return new Promise((resolve, reject) => {
      this.onSentMessage().then(sent => {
        this.client.onReplyToMessage(sent.chat.id, sent.message_id, resolve)
      }).catch(reject)
    })
  }

  isWaitingForReply() {
    return !this.isFinished()
  }

  replyTo(message, reply, forceReply) {
    let options = {
      reply_to_message_id: message.message_id
    }

    if (forceReply) {
      options.reply_markup = JSON.stringify({ force_reply: true, selective: true })
      options.reply_to_message_id = message.message_id
    }

    this.lastMessageSent = this.client.sendMessage(message.chat.id, reply, options)
  }

  respondToSingleCommand(message) {
    const command = new Command(message)
    let messageSent

    switch(command.getType()) {
    case COMMANDS.START:
    case COMMANDS.HELP:
      messageSent = this.respondToHelpMessage(message, command)
      break
    case COMMANDS.FACE_WITH_URL:
      messageSent = this.respondToFaceWithUrl(message, command)
      break
    case COMMANDS.FACE_SEARCH:
      messageSent = this.respondToFaceSearch(message, command)
      break
    case COMMANDS.LIST_FACES:
      messageSent = this.respondToFaceList(message)
      break
    }

    messageSent.catch(err => {
      this.replyTo(message, err.message)
    })
  }

  respondToHelpMessage(message, command) {
    return this.replyTo(message, helpMessages[command.getType()])
  }

  async respondToFaceWithUrl(message, command) {
    try {
      let [faces, url] = extractSwapParameters(command)
      let buffer = await swapper.fetchAndSwap(url, faces, message.chat.id)

      this.client.sendPhoto(message.chat.id, buffer)
    } catch (err) {
      if (err instanceof errors.MissingParameterError) {
        return this.replyTo(message, 'Usage: /combine face+some url or /combine url')
      } else {
        throw err
      }
    }
  }

  async respondToFaceSearch(message, command) {
    try {
      let [faces, query] = extractSwapParameters(command)
      let buffer = await swapper.searchAndSwap(query, faces, message.chat.id)

      this.client.sendPhoto(message.chat.id, buffer)
    } catch (err) {
      if (err instanceof errors.MissingParameterError) {
        return this.replyTo(message, 'Usage: /face face+some query or /face query')
      } else {
        throw err
      }
    }
  }

  async respondToFaceList(message) {
    const faceNames = await allFaceNames(message.chat.id)
    this.replyTo(message, faceNames.length > 0 ? `The available faces are ${faceNames.join(', ')}` : 'No faces available, add some with /add')
  }

  saveNewPicture(chatId, name, pictureId) {
    return fs.mkdirAsync(findFaceDirectory(chatId))
      .catch(() => {})
      .then(() => this.client.getFileLink(pictureId))
      .then(fileLink => {
        got
          .stream(fileLink, { encoding: null })
          .pipe(fs.createWriteStream(findFacePath(name, chatId)))
      })
  }

  onbeforeevent(event, from, to, message) {
    switch (event) {
    case EVENTS.CANCEL:
      this.replyTo(message, 'Ok, cancelled')
      break
    case EVENTS.ADD:
      this.replyTo(message, 'Alright, send the me the new face image AS A FILE', true)
      break
    case EVENTS.GOT_FILE:
      this.pictureId = message.document.file_id
      this.replyTo(message, 'What\'s the name of the new face?', true)
      break
    case EVENTS.GOT_NAME:
      let newName = this.newName || message.text
      this.saveNewPicture(message.chat.id, newName.toLowerCase(), this.pictureId).then(() => {
        this.replyTo(message, 'Got it! The new face is saved.')
      })
      break
    case EVENTS.INVALID_NAME:
      this.replyTo(message, 'Invalid name, it has to be made of alphanumeric characters only, no spaces', true)
      break
    case EVENTS.GOT_INVALID_FILE:
      this.replyTo(message, 'You have to send the new face AS A FILE', true)
      break
    case EVENTS.EXISTING_NAME:
      this.newName = message.text
      this.replyTo(message, 'That face already exists, do you want to override it? (yes/no)', true)
      break
    case EVENTS.CANCEL_OVERRIDE:
      this.newName = undefined
      this.replyTo(message, 'Ok, I won\'t override it, give me a new name', true)
      break
    case EVENTS.SINGLE_COMMAND:
      this.respondToSingleCommand(message)
      break
    }
  }
}
