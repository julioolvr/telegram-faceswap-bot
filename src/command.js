import { EVENTS } from './messagesFsm';

const TEXT_COMMANDS = ['start', 'faceWithUrl', 'combine', 'face', 'add', 'cancel'];

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
  let match = message && message.match(/\/(\w+)(?:@\w+)?(?:\s+(.+))?/);
  return match && match.slice(1);
}

export const COMMANDS = {
  START: 'START',
  ADD: 'ADD',
  CANCEL: 'CANCEL',
  FACE_WITH_URL: 'FACE_WITH_URL',
  FACE_SEARCH: 'FACE_SEARCH'
};

class Command {
  constructor(message) {
    this.message = message;
  }

  isValid() {
    const commandMatch = extractCommand(this.message.text);
    return commandMatch && TEXT_COMMANDS.includes(commandMatch[0].toLowerCase());
  }

  getParameters() {
    return extractCommand(this.message.text)[1].split('+');
  }

  getType() {
    if (!this.isValid()) {
      return false;
    }

    switch (extractCommand(this.message.text)[0]) {
    case 'start': return COMMANDS.START;
    case 'faceWithUrl': return COMMANDS.FACE_WITH_URL;
    case 'combine': return COMMANDS.FACE_WITH_URL;
    case 'face': return COMMANDS.FACE_SEARCH;
    case 'add': return COMMANDS.ADD;
    case 'cancel': return COMMANDS.CANCEL;
    }
  }
}

export default Command;
