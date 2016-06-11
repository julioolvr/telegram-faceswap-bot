const TEXT_COMMANDS = ['start', 'faceWithUrl', 'combine', 'face', 'add'];

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
  let match = message.match(/\/(\w+)(?:@\w+)?(?:\s+(.+))?/);
  return match && match.slice(1);
}

export const COMMANDS = {
  START: 'START',
  FACE_WITH_URL: 'FACE_WITH_URL',
  ADD_FACE: 'ADD_FACE',
  FACE_SEARCH: 'FACE_SEARCH'
};

class Command {
  constructor(message) {
    this.message = message;
  }

  isValid() {
    if (this.message.reply_to_message) {
      return false;
    }

    return TEXT_COMMANDS.includes(extractCommand(this.message.text)[0]);
  }

  getParameters() {
    return extractCommand(this.message.text)[1].split('+');
  }

  getType() {
    switch (extractCommand(this.message.text)[0]) {
    case 'start': return COMMANDS.START;
    case 'faceWithUrl': return COMMANDS.FACE_WITH_URL;
    case 'combine': return COMMANDS.FACE_WITH_URL;
    case 'face': return COMMANDS.FACE_SEARCH;
    case 'add': return COMMANDS.ADD_FACE;
    }
  }
}

export default Command;
