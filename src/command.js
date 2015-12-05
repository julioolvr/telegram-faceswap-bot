const TEXT_COMMANDS = ['start', 'faceWithUrl'];
const PHOTO_COMMANDS = ['add'];
// const TEXT_TYPE = 'TEXT';
// const PHOTO_TYPE = 'PHOTO';

/**
 * Extracts the command from the message and returns its composing parts.
 * A text command has the format:
 * /<command>[@<botName>] <param1> <param2> ... <paramN>
 *
 * A photo command
 *
 * The @<botName> is optionally sent by Telegram to identify a Bot in a group. It's discarded.
 * @param  {object}   message Message from Telegram.
 * @return {string[]}         An array that has the command without the / as it first element, and any parameters following.
 */
function extractCommand(message) {
  // TODO: Return parameters as elements in the array instead of a single string
  return message.match(/\/(\w+)(?:@\w+)?(?:\s+(.+))?/).slice(1);
}

export const COMMANDS = {
  START: 'START',
  FACE_WITH_URL: 'FACE_WITH_URL',
  ADD_FACE: 'ADD_FACE'
};

export default class {
  /**
   * Checks if the given message is a valid command.
   * A message is a command if its text starts with '/', or if it's a picture whose caption starts with '/'.
   * @param  {object} message Message from Telegram.
   * @return {boolean}        Whether the message is a valid command.
   */
  static messageIsCommand(message) {
    return (message.text && message.text.startsWith('/'))
      || (message.photo && message.caption & message.caption.startsWith('/'));
  }

  constructor(message) {
    this.message = message;
  }

  isPhotoCommand() {
    return this.message.photo;
  }

  isTextCommand() {
    return this.message.text;
  }

  isValid() {
    if (this.isPhotoCommand()) {
      return this.isValidPhotoCommand();
    } else if (this.isTextCommand()) {
      return this.isValidTextCommand();
    } else {
      return false;
    }
  }

  isValidPhotoCommand() {
    this.message.caption && PHOTO_COMMANDS.includes(extractCommand(this.message.caption)[0]);
  }

  isValidTextCommand() {
    return TEXT_COMMANDS.includes(extractCommand(this.message.text)[0]);
  }

  getParameters() {
    if (this.isTextCommand()) {
      return this.getTextParameters();
    } else {
      return this.getPhotoParameters();
    }
  }

  getTextParameters() {
    return extractCommand(this.message.text)[1].split(' ');
  }

  getPhotoParameters() {
    return extractCommand(this.message.caption)[1].split(' ');
  }

  getType() {
    if (this.isTextCommand()) {
      return this.getTextCommandType();
    } else {
      return this.getPhotoCommandType();
    }
  }

  getTextCommandType() {
    switch (extractCommand(this.message.text)[0]) {
    case 'start': return COMMANDS.START;
    case 'faceWithUrl': return COMMANDS.FACE_WITH_URL;
    }
  }

  getPhotoCommandType() {
    switch (extractCommand(this.message.caption)[0]) {
    case 'add': return COMMANDS.ADD_FACE;
    }
  }
}
