fx_version 'cerulean'
game 'gta5'

author 'bencso'
description 'codeword'

version '1.0.0'

dependency 'codeword_asset'

shared_script 'consts.js'

client_scripts {
    'client/nuiCallbacks.js',
    'client/helpers/registCommand.js',
    'client/helpers/cameraHelper.js',
    'client/helpers/headshotHelper.js',
    'client/helpers/interactHelper.js',
    'client/functions/rooms.js',
    'client/functions/teams.js',
    'client/functions/game.js',
    'client/client.js',
}

server_scripts {
    'server/functions/nextRound.js',
    'server/functions/skipRound.js',
    'server/functions/pickWord.js',
    'server/functions/resetRoom.js',
    'server/functions/endGame.js',
    'server/functions/startGame.js',
    'server/functions/pickSpymaster.js',
    'server/functions/addClue.js',
    'server/functions/hideColors.js',
    'server/functions/leaveRoom.js',
    'server/functions/shuffle.js',
    'server/functions/testBot.js',
    'server/functions/switchSpSelector.js',
    'server/server.js'
}

ui_page 'ui/index.html'


files {
  'consts.js',
  'locale.js',
  'assets/kartya/*.png',
  'ui/**/*',
}