import { COMMANDS } from './command'

const start = 'Hello! This is a face swapper bot. Add a couple of faces ' +
  'and then combine them into other images. Use /help for details.'

const help = 'To use the bot you\'ll first need to add some faces to it. Faces ' +
  'are private to each chat, meaning that the set of faces you have when chatting directly with ' +
  'the bot will be different that on each group you add it to.\n\n' +
  'To add a face, use the /add command. The bot will guide you during the process. Take into account ' +
  'that you must provide a PNG file with a transparent background for best results, and that you have ' +
  'to send the image AS A FILE and not as a photo.\n\n' +
  'Once you have some faces, you can use the /face and /combine commands to put them in other pictures.\n\n' +
  '/face is used with a search query. Use the name first and the query later, separated by a `+`. For instance, ' +
  '/face someone+power rangers, will use the face you uploaded as "someone" and search for a "power rangers" image ' +
  'to put it on.\n\n' +
  '/combine is used when you want to use a specific image. Instead of providing a query, you\'ll give the bot a URL ' +
  'for the image. Other than that, it\'s the same as /face\n\n' +
  'You can use /faces to see the faces available to a specific chat.'

export default {
  [COMMANDS.START]: start,
  [COMMANDS.HELP]: help
}
