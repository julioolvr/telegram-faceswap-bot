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

class Command {
  /**
   * Checks if the given message is a valid command.
   * A message is a command if its text starts with '/', or if it's a picture whose caption starts with '/'.
   * @param  {object} message Message from Telegram.
   * @return {boolean}        Whether the message is a valid command.
   */
  static messageIsCommand(message) {
    return (message.text && message.text.startsWith('/'))
      || (message.photo && message.caption && message.caption.startsWith('/'));
  }

  static build(message) {
    if (message.photo) {
      return new PhotoCommand(message);
    } else {
      return new TextCommand(message);
    }
  }

  constructor(message) {
    this.message = message;
  }
}

class TextCommand extends Command {
  isValid() {
    return TEXT_COMMANDS.includes(extractCommand(this.message.text)[0]);
  }

  getParameters() {
    return extractCommand(this.message.text)[1].split(' ');
  }

  getType() {
    switch (extractCommand(this.message.text)[0]) {
    case 'start': return COMMANDS.START;
    case 'faceWithUrl': return COMMANDS.FACE_WITH_URL;
    }
  }
}

class PhotoCommand extends Command {
  isValid() {
    return this.message.caption && PHOTO_COMMANDS.includes(extractCommand(this.message.caption)[0]);
  }

  getParameters() {
    return extractCommand(this.message.caption)[1].split(' ');
  }

  getType() {
    switch (extractCommand(this.message.caption)[0]) {
    case 'add': return COMMANDS.ADD_FACE;
    }
  }
}

export default Command;
